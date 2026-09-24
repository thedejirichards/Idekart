import { useState } from 'react'
import { addDays, slotAvailability, today } from '../lib/rules'
import { useStore } from '../lib/store'
import type { Booking, BucketItem, Location, Payment } from '../lib/types'
import { formatDate } from '../lib/util'
import { Icon } from './Icon'
import { Modal, Notice, Stepper, toast } from './ui'
import { useMoney } from '../lib/money'

type Step = 'select' | 'review' | 'pay' | 'processing' | 'result'

export function BookingModal({ item, location, onClose }: { item: BucketItem; location: Location; onClose: () => void }) {
  const { createBooking, pay } = useStore()
  const money = useMoney()
  const minDate = addDays(today(), 1)
  const [step, setStep] = useState<Step>('select')
  const [date, setDate] = useState(item.targetDate && item.targetDate >= minDate ? item.targetDate : addDays(today(), 14))
  const [slot, setSlot] = useState<string | null>(null)
  const [people, setPeople] = useState(Math.max(1, item.travelers))
  const [deposit, setDeposit] = useState(false)
  const [card, setCard] = useState({ name: '', number: '', exp: '', cvc: '' })
  const [booking, setBooking] = useState<Booking | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)

  const slots = location.booking.slots ?? ['10:00']
  const left = slot ? slotAvailability(location, date, slot) : 0
  const unit = location.costs.entry + location.costs.activity
  const fee = Math.max(2, Math.round(unit * people * 0.025))
  const total = unit * people + fee
  const depositPct = location.booking.depositPct ?? 100
  const canDeposit = depositPct < 100
  const due = deposit && canDeposit ? Math.round((total * depositPct) / 100) : total

  const digits = card.number.replace(/\D/g, '')
  const cardOk = card.name.trim() && digits.length >= 15 && /^\d{2}\/\d{2}$/.test(card.exp) && /^\d{3,4}$/.test(card.cvc)

  async function submitPayment() {
    // Re-check availability right before charging, per the "confirm before final booking" mitigation.
    if (!slot || slotAvailability(location, date, slot) < people) {
      toast('That slot just filled up — pick another time.')
      setStep('select')
      return
    }
    const b =
      booking ??
      createBooking({
        itemId: item.id, locationId: location.id, date, time: slot, participants: people,
        total, amountDue: due, deposit: deposit && canDeposit,
      })
    setBooking(b)
    setStep('processing')
    const p = await pay(b, `Card •••• ${digits.slice(-4)}`, digits.endsWith('0002'))
    setPayment(p)
    setStep('result')
  }

  const title = (
    <div>
      <div className="eyebrow">Book · {location.name}</div>
      <h2 className="mt-4">
        {step === 'select' && 'Pick a date and time'}
        {step === 'review' && 'Review your booking'}
        {step === 'pay' && 'Payment'}
        {step === 'processing' && 'Confirming payment…'}
        {step === 'result' && (payment?.status === 'success' ? 'You’re booked' : 'Payment didn’t go through')}
      </h2>
    </div>
  )

  return (
    <Modal onClose={step === 'processing' ? () => {} : onClose} title={title}>
      {step === 'select' && (
        <div className="stack">
          <div className="grid-2">
            <label className="field">
              <span>Date</span>
              <input className="input" type="date" min={minDate} value={date} onChange={(e) => { setDate(e.target.value); setSlot(null) }} />
            </label>
            <div className="field">
              <span>Participants</span>
              <Stepper value={people} min={1} max={location.booking.capacity ?? 20} onChange={setPeople} />
            </div>
          </div>
          <div className="field">
            <span>Available times</span>
            <div className="grid-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {slots.map((s) => {
                const n = slotAvailability(location, date, s)
                return (
                  <button key={s} type="button" className={`slot ${slot === s ? 'on' : ''}`} disabled={n < people} onClick={() => setSlot(s)}>
                    <div className="strong">{s}</div>
                    <div className="tiny muted">{n === 0 ? 'Full' : `${n} left`}</div>
                  </button>
                )
              })}
            </div>
          </div>
          {canDeposit && (
            <div className="field">
              <span>Payment option</span>
              <div className="seg">
                <button type="button" className={!deposit ? 'on' : ''} onClick={() => setDeposit(false)}>Pay in full</button>
                <button type="button" className={deposit ? 'on' : ''} onClick={() => setDeposit(true)}>{depositPct}% deposit</button>
              </div>
            </div>
          )}
          <div className="row between mt-8">
            <div>
              <div className="tiny muted">Due now</div>
              <div className="display strong num" style={{ fontSize: 22 }}>{money(due)}</div>
            </div>
            <button className="btn btn-primary" disabled={!slot || left < people} onClick={() => setStep('review')}>
              Continue <Icon name="arrow" />
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="stack">
          <div className="receipt">
            <div className="r"><span className="muted">Experience</span><b>{location.name}</b></div>
            <div className="r"><span className="muted">When</span><b>{formatDate(date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {slot}</b></div>
            <div className="r"><span className="muted">Participants</span><b>{people}</b></div>
            <hr className="divider" style={{ margin: '8px 0' }} />
            <div className="r"><span className="muted">{people} × {money(unit)}</span><span className="num">{money(unit * people)}</span></div>
            <div className="r"><span className="muted">Booking fee</span><span className="num">{money(fee)}</span></div>
            <div className="r"><b>Total</b><b className="num">{money(total)}</b></div>
            {deposit && canDeposit && (
              <div className="r"><b>Due today ({depositPct}% deposit)</b><b className="num" style={{ color: 'var(--accent-ink)' }}>{money(due)}</b></div>
            )}
          </div>
          <Notice>
            Cancellations and refunds follow {location.name}’s policy. Your booking is only confirmed once the payment provider confirms payment.
          </Notice>
          <div className="row between">
            <button className="btn btn-quiet" onClick={() => setStep('select')}><Icon name="back" /> Back</button>
            <button className="btn btn-primary" onClick={() => setStep('pay')}>Continue to payment</button>
          </div>
        </div>
      )}

      {step === 'pay' && (
        <form className="stack" onSubmit={(e) => { e.preventDefault(); if (cardOk) submitPayment() }}>
          <Notice tone="teal">
            Test mode. Use <b>4242 4242 4242 4242</b> for success or a card ending <b>0002</b> to see a failure. No real payment is taken.
          </Notice>
          <label className="field">
            <span>Name on card</span>
            <input className="input" autoComplete="cc-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
          </label>
          <label className="field">
            <span>Card number</span>
            <input
              className="input num" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') })}
            />
          </label>
          <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="field">
              <span>Expiry</span>
              <input
                className="input num" placeholder="MM/YY" autoComplete="cc-exp" value={card.exp}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setCard({ ...card, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d })
                }}
              />
            </label>
            <label className="field">
              <span>CVC</span>
              <input className="input num" inputMode="numeric" autoComplete="cc-csc" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
            </label>
          </div>
          <div className="row between mt-8">
            <button type="button" className="btn btn-quiet" onClick={() => setStep('review')}><Icon name="back" /> Back</button>
            <button className="btn btn-primary" disabled={!cardOk}>
              <Icon name="card" /> Pay {money(due)}
            </button>
          </div>
        </form>
      )}

      {step === 'processing' && (
        <div className="stack" style={{ alignItems: 'center', padding: '24px 0', textAlign: 'center' }}>
          <div className="spinner" />
          <p className="muted small">Waiting for the payment provider. Please don’t close this window.</p>
        </div>
      )}

      {step === 'result' && booking && payment && (
        <div className="stack">
          {payment.status === 'success' ? (
            <Notice tone="teal">Payment confirmed and your booking is secured. You’ll find it any time under History → Bookings.</Notice>
          ) : (
            <Notice tone="danger">Your bank declined the payment, so the booking was not confirmed. You have not been charged.</Notice>
          )}
          <div className="receipt">
            <div className="r"><span className="muted">Booking reference</span><b className="num">{booking.ref}</b></div>
            <div className="r"><span className="muted">Booking status</span><b>{payment.status === 'success' ? 'Confirmed' : 'Not confirmed'}</b></div>
            <div className="r"><span className="muted">Transaction reference</span><b className="num">{payment.txRef}</b></div>
            <div className="r"><span className="muted">Amount</span><b className="num">{money(payment.amount)}</b></div>
            <div className="r"><span className="muted">When</span><b>{formatDate(booking.date)} · {booking.time}</b></div>
          </div>
          <div className="row between">
            {payment.status !== 'success' ? (
              <button className="btn btn-ghost" onClick={() => { setBooking(null); setPayment(null); setStep('pay') }}>Try another card</button>
            ) : <span />}
            <button className="btn btn-dark" onClick={onClose}>Done</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
