import { useState } from 'react'
import { Icon } from '../components/Icon'
import { CategoryChip, Cover, Progress, StatusChip } from '../components/ui'
import { useMoney } from '../lib/money'
import { CATEGORIES, categoryById } from '../data/categories'
import { useStore } from '../lib/store'
import type { BucketItem, CategoryId } from '../lib/types'
import { daysUntil, formatDate, progressOf } from '../lib/util'

type Filter = 'active' | 'all' | 'completed'

export default function Dashboard() {
  const { user, items, bookings } = useStore()
  const money = useMoney()
  const [filter, setFilter] = useState<Filter>('active')
  const [cat, setCat] = useState<CategoryId | 'all'>('all')

  const active = items.filter((i) => i.status !== 'completed')
  const completed = items.filter((i) => i.status === 'completed')
  const planned = active.reduce((s, i) => s + (i.budget ?? 0), 0)
  const upcoming = active
    .flatMap((i) => i.milestones.filter((m) => !m.done).slice(0, 1).map((m) => ({ item: i, m })))
    .sort((a, b) => (a.m.due ?? '9999').localeCompare(b.m.due ?? '9999'))
    .slice(0, 4)

  const shown = items
    .filter((i) => (filter === 'all' ? true : filter === 'completed' ? i.status === 'completed' : i.status !== 'completed'))
    .filter((i) => cat === 'all' || i.category === cat)
  const usedCats = CATEGORIES.filter((c) => items.some((i) => i.category === c.id))
  const hour = new Date().getHours()

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <div className="eyebrow">{hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'}, {user?.name}</div>
          <h1 className="mt-8">Your bucket list</h1>
        </div>
        <a className="btn btn-primary btn-lg" href="#/new"><Icon name="plus" /> Add an idea</a>
      </div>

      <div className="stats">
        <div className="stat"><div className="small muted">In progress</div><div className="v num">{active.length}</div></div>
        <div className="stat"><div className="small muted">Completed</div><div className="v num">{completed.length}</div></div>
        <div className="stat"><div className="small muted">Confirmed bookings</div><div className="v num">{bookings.filter((b) => b.status === 'confirmed').length}</div></div>
        <div className="stat"><div className="small muted">Budgeted for dreams</div><div className="v num" style={{ fontSize: 24 }}>{money(planned)}</div></div>
      </div>

      {upcoming.length > 0 && (
        <section className="card">
          <div className="row between">
            <h3>Up next</h3>
            <span className="small muted">Your next step on each plan</span>
          </div>
          <div className="mt-8">
            {upcoming.map(({ item, m }) => {
              const d = daysUntil(m.due)
              return (
                <a key={m.id} href={`#/item/${item.id}`} className="milestone" style={{ textDecoration: 'none' }}>
                  <span className="dot" style={{ width: 10, height: 10, borderRadius: '50%', background: categoryById(item.category).color, marginTop: 7, flex: 'none' }} />
                  <div className="grow">
                    <div className="strong">{m.title}</div>
                    <div className="small muted">{item.title}</div>
                  </div>
                  {d != null && (
                    <span className={`chip ${d <= 3 ? 'chip-accent' : ''}`}>
                      {d <= 0 ? 'Due today' : d === 1 ? 'Tomorrow' : `In ${d} days`}
                    </span>
                  )}
                </a>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <div className="row between wrap" style={{ marginBottom: 16 }}>
          <div className="seg">
            {(['active', 'completed', 'all'] as Filter[]).map((f) => (
              <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                {f === 'active' ? 'In progress' : f === 'completed' ? 'Completed' : 'All'}
              </button>
            ))}
          </div>
          {usedCats.length > 1 && (
            <select className="select" style={{ width: 'auto' }} value={cat} onChange={(e) => setCat(e.target.value as CategoryId | 'all')} aria-label="Filter by category">
              <option value="all">All categories</option>
              {usedCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {items.length === 0 ? (
          <div className="empty">
            <Icon name="sparkle" size={32} />
            <h3>Your list is empty — for now</h3>
            <p className="muted">What have you always wanted to do? Start with one idea.</p>
            <a className="btn btn-primary mt-16" href="#/new">Add your first idea</a>
          </div>
        ) : shown.length === 0 ? (
          <p className="muted">Nothing here yet.</p>
        ) : (
          <div className="grid-auto">
            {shown.map((i) => <ItemCard key={i.id} item={i} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function ItemCard({ item }: { item: BucketItem }) {
  const { location } = useStore()
  const money = useMoney()
  const loc = location(item.locationId)
  const pct = progressOf(item.milestones)
  const d = daysUntil(item.targetDate)
  return (
    <a className="card item-card" href={`#/item/${item.id}`}>
      <Cover hue={loc?.hue ?? 260}>
        <div className="row between">
          <span className="small strong" style={{ textShadow: '0 1px 3px rgba(0,0,0,.4)' }}>
            {loc ? `${loc.city}, ${loc.country}` : 'No location yet'}
          </span>
          <StatusChip status={item.status} />
        </div>
      </Cover>
      <div className="body">
        <h3 style={{ fontSize: 19 }}>{item.title}</h3>
        <div className="row wrap" style={{ gap: 6 }}>
          <CategoryChip id={item.category} />
          {item.budget ? <span className="chip num">{money(item.budget)}</span> : null}
        </div>
        <div className="grow" />
        {item.status === 'completed' ? (
          <div className="small muted">Completed {formatDate(item.completedAt)}</div>
        ) : (
          <>
            <Progress value={pct} />
            <div className="row between small muted">
              <span>{item.milestones.filter((m) => m.done).length}/{item.milestones.length} steps</span>
              <span>{item.targetDate ? (d! < 0 ? `Target passed` : `${formatDate(item.targetDate, { day: 'numeric', month: 'short' })}`) : 'No date'}</span>
            </div>
          </>
        )}
      </div>
    </a>
  )
}
