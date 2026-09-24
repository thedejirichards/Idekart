import { useState } from 'react'
import { toast } from '../components/ui'
import { useMoney } from '../lib/money'
import { CATEGORIES, categoryById } from '../data/categories'
import { TEMPLATES } from '../data/templates'
import { DEFAULT_FX, useStore } from '../lib/store'
import type { BookingMode, LocationCosts } from '../lib/types'

type Tab = 'overview' | 'locations' | 'templates' | 'settings'

export default function Admin() {
  const [tab, setTab] = useState<Tab>('overview')
  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 className="mt-8">Content & reporting</h1>
          <p className="muted">Manage the rule-based catalog and watch how the MVP is doing.</p>
        </div>
      </div>
      <div className="seg" style={{ alignSelf: 'flex-start' }}>
        {(['overview', 'locations', 'templates', 'settings'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      {tab === 'overview' && <Overview />}
      {tab === 'locations' && <Locations />}
      {tab === 'templates' && <Templates />}
      {tab === 'settings' && <Settings />}
    </div>
  )
}

function Overview() {
  const { users, allItems, allBookings, allPayments, location } = useStore()
  const money = useMoney()
  const customers = users.filter((u) => u.role === 'user')
  const activeUsers = new Set(allItems.map((i) => i.userId)).size
  const completed = allItems.filter((i) => i.status === 'completed').length
  const withPlan = allItems.filter((i) => i.milestones.length > 0).length
  const paid = allPayments.filter((p) => p.status === 'success')
  const confirmed = allBookings.filter((b) => b.status === 'confirmed').length

  const tally = <K extends string>(keys: K[]) =>
    Object.entries(keys.reduce<Record<string, number>>((acc, k) => ((acc[k] = (acc[k] ?? 0) + 1), acc), {}))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  const topCats = tally(allItems.map((i) => i.category))
  const topPlaces = tally(allItems.filter((i) => i.locationId).map((i) => i.locationId!))
  const max = (rows: [string, number][]) => Math.max(1, ...rows.map((r) => r[1]))

  const stats: [string, string | number][] = [
    ['Registered users', customers.length],
    ['Active users', activeUsers],
    ['Bucket-list items', allItems.length],
    ['Plans generated', withPlan],
    ['Completed experiences', completed],
    ['Goal completion rate', allItems.length ? `${Math.round((completed / allItems.length) * 100)}%` : '—'],
    ['Confirmed bookings', confirmed],
    ['Successful payments', `${paid.length} · ${money(paid.reduce((s, p) => s + p.amount, 0))}`],
  ]

  return (
    <div className="stack-lg">
      <div className="stats">
        {stats.map(([k, v]) => (
          <div className="stat" key={k}><div className="small muted">{k}</div><div className="v num" style={{ fontSize: 24 }}>{v}</div></div>
        ))}
      </div>
      <div className="grid-2">
        <BarList title="Most popular categories" rows={topCats.map(([k, n]) => [categoryById(k as never).name, n, categoryById(k as never).color])} max={max(topCats)} />
        <BarList title="Most popular destinations" rows={topPlaces.map(([k, n]) => [location(k)?.name ?? k, n, 'var(--accent)'])} max={max(topPlaces)} />
      </div>
      <p className="tiny faint">Metrics are computed from data in this browser. In production these come from the analytics pipeline.</p>
    </div>
  )
}

function BarList({ title, rows, max }: { title: string; rows: [string, number, string][]; max: number }) {
  return (
    <section className="card">
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      {rows.length === 0 && <p className="small muted">No data yet.</p>}
      <div className="stack" style={{ gap: 10 }}>
        {rows.map(([label, n, color]) => (
          <div key={label}>
            <div className="row between small"><span>{label}</span><b className="num">{n}</b></div>
            <div className="progress mt-4"><i style={{ width: `${(n / max) * 100}%`, background: color }} /></div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Locations() {
  const { catalog, updateLocation } = useStore()
  const costKeys: [keyof LocationCosts, string][] = [
    ['entry', 'Entry'], ['activity', 'Activity'], ['lodgingPerNight', 'Lodging/night'], ['foodPerDay', 'Food/day'],
  ]
  return (
    <div className="stack">
      <p className="small muted">Costs are stored in USD per person. Changes apply to all new estimates immediately.</p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Location</th>
              {costKeys.map(([, l]) => <th key={l}>{l} ($)</th>)}
              <th>Booking</th>
              <th>Live</th>
            </tr>
          </thead>
          <tbody>
            {catalog.locations.map((l) => (
              <tr key={l.id} style={{ opacity: l.active ? 1 : 0.5 }}>
                <td style={{ minWidth: 180 }}><b>{l.name}</b><div className="tiny muted">{l.city}, {l.country}</div></td>
                {costKeys.map(([k]) => (
                  <td key={k}>
                    <input
                      className="input num" type="number" min={0} value={l.costs[k]} aria-label={`${l.name} ${k}`}
                      onChange={(e) => updateLocation(l.id, { costs: { ...l.costs, [k]: Math.max(0, Number(e.target.value) || 0) } })}
                    />
                  </td>
                ))}
                <td>
                  <select className="select" style={{ padding: '6px 10px', width: 120 }} value={l.booking.mode}
                    onChange={(e) => updateLocation(l.id, { booking: { ...l.booking, mode: e.target.value as BookingMode } })}>
                    <option value="direct">Direct</option>
                    <option value="redirect">Redirect</option>
                    <option value="none">None</option>
                  </select>
                </td>
                <td>
                  <input type="checkbox" checked={l.active} onChange={(e) => updateLocation(l.id, { active: e.target.checked })} aria-label={`${l.name} live`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Templates() {
  const { catalog } = useStore()
  return (
    <div className="stack">
      <p className="small muted">{CATEGORIES.length} categories · {TEMPLATES.length} templates. Keywords decide which template an idea matches.</p>
      <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))' }}>
        {TEMPLATES.map((t) => {
          const c = categoryById(t.category)
          const n = catalog.locations.filter((l) => l.templates.includes(t.id)).length
          return (
            <section className="card-flat stack" key={t.id} style={{ gap: 8 }}>
              <div className="row between">
                <h3>{t.name}</h3>
                <span className="chip"><span className="dot" style={{ background: c.color }} />{c.name}</span>
              </div>
              <div className="tiny muted">{n} location{n === 1 ? '' : 's'} · {t.milestones.length} milestones · {t.requiresBooking ? 'booking usually needed' : 'no booking'}</div>
              {t.keywords.length > 0 && (
                <div className="row wrap" style={{ gap: 4 }}>{t.keywords.map((k) => <span key={k} className="chip" style={{ fontWeight: 500 }}>{k}</span>)}</div>
              )}
              <ol className="small muted" style={{ margin: 0, paddingLeft: 18 }}>
                {t.milestones.map((m) => <li key={m.title}>{m.title} <span className="faint">(−{m.daysBefore}d)</span></li>)}
              </ol>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function Settings() {
  const { catalog, setFxRate, resetCatalog } = useStore()
  const [rate, setRate] = useState(String(catalog.fxRate))
  return (
    <div className="stack-lg" style={{ maxWidth: 560 }}>
      <section className="card stack">
        <h3>Exchange rate</h3>
        <p className="small muted">Used to show estimates in Naira. Update it when the market moves.</p>
        <label className="field">
          <span>₦ per $1</span>
          <div className="row">
            <input className="input num" type="number" min={1} value={rate} onChange={(e) => setRate(e.target.value)} />
            <button className="btn btn-dark" disabled={!(Number(rate) > 0)} onClick={() => { setFxRate(Number(rate)); toast('Exchange rate updated') }}>Save</button>
          </div>
        </label>
      </section>
      <section className="card stack">
        <h3>Reset catalog</h3>
        <p className="small muted">Restore all locations, costs and booking settings to the seed data.</p>
        <button className="btn btn-danger" style={{ alignSelf: 'flex-start' }} onClick={() => { resetCatalog(); setRate(String(DEFAULT_FX)); toast('Catalog reset') }}>Reset to defaults</button>
      </section>
    </div>
  )
}
