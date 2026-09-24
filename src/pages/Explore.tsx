import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Cover } from '../components/ui'
import { useMoney } from '../lib/money'
import { CATEGORIES } from '../data/categories'
import { cityById } from '../data/locations'
import { templateById } from '../data/templates'
import { formatDuration, travelEstimate } from '../lib/rules'
import { useStore } from '../lib/store'
import type { CategoryId } from '../lib/types'

export default function Explore() {
  const { catalog, user } = useStore()
  const money = useMoney()
  const home = cityById(user?.homeCity ?? 'lagos')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<CategoryId | 'all'>('all')

  const catsWithPlaces = CATEGORIES.filter((c) =>
    catalog.locations.some((l) => l.active && l.templates.some((t) => templateById(t)?.category === c.id)),
  )
  const needle = q.trim().toLowerCase()
  const list = catalog.locations
    .filter((l) => l.active)
    .filter((l) => cat === 'all' || l.templates.some((t) => templateById(t)?.category === cat))
    .filter((l) => !needle || [l.name, l.city, l.country, l.description, ...l.activities].join(' ').toLowerCase().includes(needle))
    .map((l) => ({ l, t: travelEstimate(home, l) }))
    .sort((a, b) => a.t.km - b.t.km)

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1>Explore</h1>
          <p className="muted">Places and experiences to add to your list, nearest to {home.name} first.</p>
        </div>
      </div>
      <div className="row wrap">
        <div className="grow search">
          <Icon name="search" size={18} />
          <input className="input" placeholder="Search places, countries, activities…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        </div>
        <select className="select" style={{ width: 'auto' }} value={cat} onChange={(e) => setCat(e.target.value as CategoryId | 'all')} aria-label="Category">
          <option value="all">All categories</option>
          {catsWithPlaces.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {list.length === 0 ? (
        <p className="muted">No places match that search.</p>
      ) : (
        <div className="grid-auto">
          {list.map(({ l, t }) => (
            <a key={l.id} className="card item-card" href={`#/location/${l.id}`}>
              <Cover hue={l.hue}><span className="small strong">{l.city}, {l.country}</span></Cover>
              <div className="body">
                <h3 style={{ fontSize: 18 }}>{l.name}</h3>
                <p className="small muted">{l.description}</p>
                <div className="grow" />
                <div className="row between small">
                  <span className="muted">{t.label} · {formatDuration(t.hours)}</span>
                  <span className="strong num">from {money(l.costs.entry + l.costs.activity)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
