import { useState } from 'react'
import { BookingModal } from '../components/BookingModal'
import { Icon } from '../components/Icon'
import { LocationPicker } from '../components/LocationPicker'
import { BudgetBreakdown, LocationFacts, MapCard } from '../components/LocationParts'
import { BookingChip, CategoryChip, Cover, Modal, Notice, Ring, StatusChip, Stepper, toast } from '../components/ui'
import { useMoney } from '../lib/money'
import { CATEGORIES } from '../data/categories'
import { cityById } from '../data/locations'
import { templateById } from '../data/templates'
import { navigate } from '../lib/router'
import { estimateBudget, today } from '../lib/rules'
import { useStore } from '../lib/store'
import type { BucketItem, CategoryId } from '../lib/types'
import { daysUntil, formatDate, uid, progressOf } from '../lib/util'

export default function ItemDetail({ id }: { id: string }) {
  const { items, user, location, updateItem, deleteItem, bookings, cancelBooking, catalog } = useStore()
  const money = useMoney()
  const item = items.find((i) => i.id === id)
  const [modal, setModal] = useState<'edit' | 'complete' | 'book' | 'delete' | null>(null)
  const [newStep, setNewStep] = useState('')
  const [checkIn, setCheckIn] = useState('')

  if (!item) {
    return (
      <div className="empty">
        <h3>We couldn’t find that item</h3>
        <a className="btn btn-dark mt-16" href="#/app">Back to dashboard</a>
      </div>
    )
  }

  const loc = location(item.locationId)
  const home = cityById(user?.homeCity ?? 'lagos')
  const estimate = loc ? estimateBudget(loc, home, { travelers: item.travelers, nights: item.nights }) : null
  const pct = progressOf(item.milestones)
  const d = daysUntil(item.targetDate)
  const done = item.status === 'completed'
  const itemBookings = bookings.filter((b) => b.itemId === item.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const template = templateById(item.templateId)
  const alternatives = template && !loc ? catalog.locations.filter((l) => l.active && l.templates.includes(template.id)).slice(0, 3) : []

  const toggle = (mid: string) =>
    updateItem(item.id, {
      milestones: item.milestones.map((m) => (m.id === mid ? { ...m, done: !m.done } : m)),
      status: item.status === 'idea' ? 'planning' : item.status,
    })

  return (
    <div className="stack-lg">
      <a className="btn btn-quiet" href="#/app" style={{ marginLeft: -10, alignSelf: 'flex-start' }}><Icon name="back" /> Bucket list</a>

      <Cover hue={loc?.hue ?? 260} height={200}>
        <div className="row between wrap" style={{ alignItems: 'flex-end' }}>
          <div>
            <div className="row" style={{ gap: 6, marginBottom: 8 }}>
              <StatusChip status={item.status} />
              <CategoryChip id={item.category} />
            </div>
            <h1 style={{ color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,.3)' }}>{item.title}</h1>
            {loc && <div className="small strong" style={{ opacity: 0.9 }}>{loc.name} · {loc.city}, {loc.country}</div>}
          </div>
          <div className="row">
            <button className="btn btn-ghost btn-sm" style={{ background: 'rgba(255,255,255,.9)' }} onClick={() => setModal('edit')}><Icon name="edit" /> Edit</button>
            <button className="btn btn-ghost btn-sm" style={{ background: 'rgba(255,255,255,.9)', color: 'var(--danger)' }} onClick={() => setModal('delete')} aria-label="Delete"><Icon name="trash" /></button>
          </div>
        </div>
      </Cover>

      {done && (
        <div className="card row" style={{ background: 'var(--ink)', color: '#fff', border: 0 }}>
          <Icon name="trophy" size={32} />
          <div className="grow">
            <h3 style={{ color: '#fff' }}>Done on {formatDate(item.completedAt)}</h3>
            {item.reflection && <p className="small mt-4" style={{ color: '#c9c5d9' }}>“{item.reflection}”</p>}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }} onClick={() => updateItem(item.id, { status: 'planning', completedAt: undefined })}>Reopen</button>
        </div>
      )}

      <div className="split">
        <div className="stack-lg">
          {/* Plan */}
          <section className="card">
            <div className="row between">
              <div>
                <h2>Plan</h2>
                <p className="small muted">{item.milestones.filter((m) => m.done).length} of {item.milestones.length} milestones done</p>
              </div>
              <Ring value={pct} />
            </div>
            {item.description && <p className="mt-16">{item.description}</p>}
            <div className="mt-8">
              {item.milestones.map((m) => {
                const md = daysUntil(m.due)
                return (
                  <div key={m.id} className={`milestone ${m.done ? 'done' : ''}`}>
                    <button className={`check ${m.done ? 'on' : ''}`} onClick={() => toggle(m.id)} aria-label={m.done ? 'Mark not done' : 'Mark done'} aria-pressed={m.done}>
                      {m.done && <Icon name="check" />}
                    </button>
                    <div className="grow">
                      <div className="m-title strong small">{m.title}</div>
                      {m.note && <div className="tiny muted">{m.note}</div>}
                    </div>
                    {m.due && (
                      <span className={`tiny num ${!m.done && md != null && md < 0 ? 'chip chip-danger' : 'muted'}`}>
                        {formatDate(m.due, { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <button className="btn btn-quiet btn-sm" aria-label="Remove step" onClick={() => updateItem(item.id, { milestones: item.milestones.filter((x) => x.id !== m.id) })}>
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
            <form
              className="row mt-8"
              onSubmit={(e) => {
                e.preventDefault()
                if (!newStep.trim()) return
                updateItem(item.id, { milestones: [...item.milestones, { id: uid(), title: newStep.trim(), due: null, done: false }] })
                setNewStep('')
              }}
            >
              <input className="input" placeholder="Add your own step…" value={newStep} onChange={(e) => setNewStep(e.target.value)} />
              <button className="btn btn-ghost" disabled={!newStep.trim()}><Icon name="plus" /> Add</button>
            </form>
          </section>

          {/* Check-ins */}
          <section className="card">
            <h3>Check-ins</h3>
            <p className="small muted">A quick note on how it’s going. Useful when you adjust the plan.</p>
            <form
              className="row mt-16"
              onSubmit={(e) => {
                e.preventDefault()
                if (!checkIn.trim()) return
                updateItem(item.id, { checkIns: [{ date: new Date().toISOString(), note: checkIn.trim() }, ...item.checkIns] })
                setCheckIn('')
                toast('Check-in saved')
              }}
            >
              <input className="input" placeholder="e.g. Saved half the budget" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              <button className="btn btn-dark" disabled={!checkIn.trim()}>Save</button>
            </form>
            {item.checkIns.length > 0 && (
              <div className="mt-8">
                {item.checkIns.map((c, i) => (
                  <div key={i} className="milestone small">
                    <span className="muted num" style={{ minWidth: 64 }}>{formatDate(c.date, { day: 'numeric', month: 'short' })}</span>
                    <span>{c.note}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Location & map */}
          {loc ? (
            <section className="card stack">
              <div className="row between">
                <h2>Location</h2>
                <a className="btn btn-quiet btn-sm" href={`#/location/${loc.id}`}>Details <Icon name="arrow" /></a>
              </div>
              <MapCard location={loc} />
              <LocationFacts location={loc} />
            </section>
          ) : (
            <section className="card">
              <h2>Location</h2>
              <p className="muted small mt-4">No location chosen yet.</p>
              {alternatives.length > 0 && (
                <div className="stack mt-16">
                  {alternatives.map((l) => (
                    <div key={l.id} className="row between card-flat">
                      <div>
                        <div className="strong small">{l.name}</div>
                        <div className="tiny muted">{l.city}, {l.country}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => updateItem(item.id, { locationId: l.id, status: item.status === 'idea' ? 'planning' : item.status })}>Choose</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="stack-lg">
          <section className="card stack">
            <div className="row between small"><span className="muted">Target date</span><b>{item.targetDate ? formatDate(item.targetDate) : 'Flexible'}</b></div>
            {d != null && !done && (
              <div className="row between small"><span className="muted">Countdown</span><b>{d < 0 ? `${-d} days ago` : d === 0 ? 'Today!' : `${d} days to go`}</b></div>
            )}
            <div className="row between small"><span className="muted">Who</span><b>{item.travelers} {item.travelers > 1 ? 'people' : 'person'}{item.nights ? ` · ${item.nights} nights` : ''}</b></div>
            <div className="row between small"><span className="muted">Your budget</span><b className="num">{item.budget ? money(item.budget) : '—'}</b></div>
            {!done && (
              <button className="btn btn-primary btn-block mt-8" onClick={() => setModal('complete')}>
                <Icon name="flag" /> Mark as completed
              </button>
            )}
          </section>

          {/* Booking */}
          {loc && (
            <section className="card stack">
              <h3>Booking</h3>
              {loc.booking.mode === 'direct' && (
                <>
                  <p className="small muted">{loc.name} takes bookings on Idekart. Pick a slot and pay securely.</p>
                  {!done && <button className="btn btn-dark" onClick={() => setModal('book')}><Icon name="calendar" /> Book a slot</button>}
                </>
              )}
              {loc.booking.mode === 'redirect' && (
                <>
                  <p className="small muted">Bookings for {loc.name} are handled by the provider. You’ll leave Idekart to complete it.</p>
                  <a className="btn btn-ghost" href={loc.booking.url} target="_blank" rel="noreferrer"><Icon name="external" /> Book with provider</a>
                </>
              )}
              {loc.booking.mode === 'none' && <p className="small muted">No booking needed. Just turn up.</p>}

              {itemBookings.map((b) => (
                <div key={b.id} className="card-flat stack" style={{ gap: 6 }}>
                  <div className="row between">
                    <b className="num small">{b.ref}</b>
                    <BookingChip status={b.status} />
                  </div>
                  <div className="small muted">{formatDate(b.date)} · {b.time} · {b.participants} {b.participants > 1 ? 'people' : 'person'}</div>
                  <div className="small">{b.deposit ? 'Deposit' : 'Paid'} <b className="num">{money(b.amountDue)}</b> of {money(b.total)}</div>
                  {b.status === 'confirmed' && b.date >= today() && (
                    <button className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { cancelBooking(b.id); toast('Booking cancelled. Refunds follow the provider’s policy.') }}>
                      Cancel booking
                    </button>
                  )}
                </div>
              ))}
            </section>
          )}

          {estimate && (
            <section className="card">
              <h3 style={{ marginBottom: 16 }}>Budget estimate</h3>
              <BudgetBreakdown estimate={estimate} userBudget={item.budget} />
            </section>
          )}
        </aside>
      </div>

      {modal === 'edit' && <EditModal item={item} onClose={() => setModal(null)} />}
      {modal === 'book' && loc && <BookingModal item={item} location={loc} onClose={() => setModal(null)} />}
      {modal === 'complete' && <CompleteModal item={item} onClose={() => setModal(null)} />}
      {modal === 'delete' && (
        <Modal onClose={() => setModal(null)} title={<h2>Delete “{item.title}”?</h2>}>
          <p className="muted">This removes the item and its plan. Bookings already made stay in your history.</p>
          <div className="row between mt-24">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Keep it</button>
            <button className="btn btn-danger" onClick={() => { deleteItem(item.id); toast('Item deleted'); navigate('/app') }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function EditModal({ item, onClose }: { item: BucketItem; onClose: () => void }) {
  const { updateItem, catalog, user } = useStore()
  const ngn = user?.currency === 'NGN'
  const [f, setF] = useState({
    title: item.title,
    description: item.description,
    category: item.category,
    targetDate: item.targetDate ?? '',
    travelers: item.travelers,
    nights: item.nights,
    locationId: item.locationId ?? '',
    budget: item.budget ? String(Math.round(ngn ? item.budget * catalog.fxRate : item.budget)) : '',
  })
  const locs = catalog.locations.filter((l) => l.active)
  function save() {
    const b = parseFloat(f.budget.replace(/[^\d.]/g, ''))
    updateItem(item.id, {
      title: f.title.trim() || item.title,
      description: f.description,
      category: f.category,
      targetDate: f.targetDate || null,
      travelers: f.travelers,
      nights: f.nights,
      locationId: f.locationId || null,
      budget: Number.isFinite(b) && b > 0 ? Math.round(ngn ? b / catalog.fxRate : b) : null,
    })
    toast('Changes saved')
    onClose()
  }
  return (
    <Modal onClose={onClose} title={<h2>Edit item</h2>}>
      <div className="stack">
        <label className="field"><span>Title</span><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label className="field"><span>Description</span><textarea className="textarea" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
        <div className="grid-2">
          <label className="field">
            <span>Category</span>
            <select className="select" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as CategoryId })}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Target date</span><input className="input" type="date" value={f.targetDate} onChange={(e) => setF({ ...f, targetDate: e.target.value })} /></label>
        </div>
        <label className="field">
          <span>Location</span>
          <LocationPicker locations={locs} value={f.locationId} onChange={(locationId) => setF({ ...f, locationId })} />
        </label>
        <div className="grid-3">
          <div className="field"><span>People</span><Stepper value={f.travelers} min={1} max={20} onChange={(v) => setF({ ...f, travelers: v })} /></div>
          <div className="field"><span>Nights</span><Stepper value={f.nights} min={0} max={30} onChange={(v) => setF({ ...f, nights: v })} /></div>
          <label className="field"><span>Budget ({ngn ? '₦' : '$'})</span><input className="input num" inputMode="decimal" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} /></label>
        </div>
        {f.targetDate !== (item.targetDate ?? '') && (
          <Notice tone="teal">Milestone dates stay as they are. Adjust individual steps if the new date changes your timeline.</Notice>
        )}
        <div className="row between mt-8">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save changes</button>
        </div>
      </div>
    </Modal>
  )
}

function CompleteModal({ item, onClose }: { item: BucketItem; onClose: () => void }) {
  const { updateItem } = useStore()
  const [note, setNote] = useState('')
  return (
    <Modal onClose={onClose} title={<div><div className="eyebrow">Ticking it off</div><h2 className="mt-4">You did it?</h2></div>}>
      <div className="stack">
        <p className="muted">“{item.title}” moves to your history. Want to note how it went?</p>
        <textarea className="textarea" placeholder="The best part was…" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="row between">
          <button className="btn btn-ghost" onClick={onClose}>Not yet</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              updateItem(item.id, {
                status: 'completed',
                completedAt: new Date().toISOString(),
                reflection: note.trim() || undefined,
                milestones: item.milestones.map((m) => ({ ...m, done: true })),
              })
              toast('Completed — nicely done')
              onClose()
            }}
          >
            <Icon name="trophy" /> Mark completed
          </button>
        </div>
      </div>
    </Modal>
  )
}
