import { useState } from 'react'
import { Icon } from '../components/Icon'
import { BookingChip, CategoryChip, Cover, PaymentChip } from '../components/ui'
import { useMoney } from '../lib/money'
import { useStore } from '../lib/store'
import { formatDate } from '../lib/util'

export default function History() {
  const { items, bookings, payments, location } = useStore()
  const money = useMoney()
  const [tab, setTab] = useState<'done' | 'bookings' | 'payments'>('done')
  const done = items.filter((i) => i.status === 'completed').sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const title = (itemId: string) => items.find((i) => i.id === itemId)?.title ?? 'Deleted item'

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1>History</h1>
          <p className="muted">Everything you’ve done, booked and paid for.</p>
        </div>
      </div>
      <div className="seg" style={{ alignSelf: 'flex-start' }}>
        <button className={tab === 'done' ? 'on' : ''} onClick={() => setTab('done')}>Completed ({done.length})</button>
        <button className={tab === 'bookings' ? 'on' : ''} onClick={() => setTab('bookings')}>Bookings ({bookings.length})</button>
        <button className={tab === 'payments' ? 'on' : ''} onClick={() => setTab('payments')}>Payments ({payments.length})</button>
      </div>

      {tab === 'done' && (done.length === 0 ? (
        <div className="empty">
          <Icon name="trophy" size={32} />
          <h3>Nothing ticked off yet</h3>
          <p className="muted">When you complete an experience it’ll live here for good.</p>
        </div>
      ) : (
        <div className="stack">
          {done.map((i) => {
            const loc = location(i.locationId)
            return (
              <a key={i.id} href={`#/item/${i.id}`} className="card row" style={{ textDecoration: 'none', padding: 14 }}>
                <Cover hue={loc?.hue ?? 260} height={72} className="thumb" />
                <div className="grow">
                  <div className="row wrap" style={{ gap: 8 }}>
                    <h3>{i.title}</h3>
                    <CategoryChip id={i.category} />
                  </div>
                  <div className="small muted mt-4">{loc ? `${loc.name} · ` : ''}Completed {formatDate(i.completedAt)}</div>
                  {i.reflection && <div className="small mt-4">“{i.reflection}”</div>}
                </div>
              </a>
            )
          })}
        </div>
      ))}

      {tab === 'bookings' && (bookings.length === 0 ? <p className="muted">No bookings yet.</p> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Reference</th><th>Experience</th><th>Date</th><th>People</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {[...bookings].reverse().map((b) => (
                <tr key={b.id}>
                  <td className="num strong">{b.ref}</td>
                  <td>{location(b.locationId)?.name}<div className="tiny muted">{title(b.itemId)}</div></td>
                  <td>{formatDate(b.date)} · {b.time}</td>
                  <td className="num">{b.participants}</td>
                  <td className="num">{money(b.total)}</td>
                  <td><BookingChip status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {tab === 'payments' && (payments.length === 0 ? <p className="muted">No payments yet.</p> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Transaction</th><th>Booking</th><th>Method</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {[...payments].reverse().map((p) => (
                <tr key={p.id}>
                  <td className="num strong">{p.txRef}</td>
                  <td className="num">{bookings.find((b) => b.id === p.bookingId)?.ref}</td>
                  <td>{p.method}</td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td className="num">{money(p.amount)}</td>
                  <td><PaymentChip status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
