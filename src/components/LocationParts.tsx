import { cityById } from '../data/locations'
import { formatDuration, travelEstimate } from '../lib/rules'
import type { BudgetEstimate } from '../lib/rules'
import { useStore } from '../lib/store'
import { directionsUrl, placeUrl } from '../lib/maps'
import type { City, Location } from '../lib/types'
import { Icon } from './Icon'
import { Notice } from './ui'
import { useMoney } from '../lib/money'

/** Google Maps embed; the keyless `output=embed` form is fine for a prototype. Swap for the Maps Embed API with a key in production. */
export function MapCard({ location, from }: { location: Location; from?: City }) {
  const { user } = useStore()
  const origin = from ?? cityById(user?.homeCity ?? 'lagos')
  const t = travelEstimate(origin, location)
  const src = `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=${t.mode === 'flight' ? 8 : 11}&output=embed`
  return (
    <div className="stack">
      <iframe className="map-frame" title={`Map of ${location.name}`} src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <div className="row wrap between">
        <div className="row small">
          <Icon name="route" size={18} />
          <span>
            From <b>{origin.name}</b>: ~{Math.round(t.km).toLocaleString()} km · {t.label.toLowerCase()} ~{formatDuration(t.hours)}
          </span>
        </div>
        <div className="row">
          <a className="btn btn-ghost btn-sm" href={placeUrl(location)} target="_blank" rel="noreferrer">
            <Icon name="external" /> Open in Maps
          </a>
          <a className="btn btn-dark btn-sm" href={directionsUrl(origin, location)} target="_blank" rel="noreferrer">
            <Icon name="route" /> Directions
          </a>
        </div>
      </div>
    </div>
  )
}

export function LocationFacts({ location }: { location: Location }) {
  const money = useMoney()
  const { contact, booking } = location
  return (
    <div className="stack small">
      <div className="row row-top"><Icon name="pin" size={18} /><span>{location.address}</span></div>
      <div className="row row-top"><Icon name="clock" size={18} /><span>{location.hours}</span></div>
      {contact.phone && <div className="row row-top"><Icon name="phone" size={18} /><span>{contact.phone}</span></div>}
      {contact.email && <div className="row row-top"><Icon name="mail" size={18} /><span>{contact.email}</span></div>}
      {contact.website && (
        <div className="row row-top"><Icon name="globe" size={18} /><a href={contact.website} target="_blank" rel="noreferrer">{contact.website.replace(/^https?:\/\//, '')}</a></div>
      )}
      <div className="row row-top">
        <Icon name="ticket" size={18} />
        <span>
          {booking.mode === 'direct' && 'Book and pay on Idekart'}
          {booking.mode === 'redirect' && 'Booked through the provider’s website'}
          {booking.mode === 'none' && 'No booking needed — just show up'}
        </span>
      </div>
      <div className="row row-top">
        <Icon name="wallet" size={18} />
        <span>
          From {money(location.costs.entry + location.costs.activity)} per person
          {location.costs.lodgingPerNight > 0 && <> · stays from {money(location.costs.lodgingPerNight)}/night</>}
        </span>
      </div>
    </div>
  )
}

const LINE_COLORS: Record<string, string> = {
  transport: '#1b1f3b',
  accommodation: '#1f7a6d',
  entry: '#e9b44c',
  activity: '#f26b3a',
  food: '#b45309',
  booking: '#7b4bb7',
}

export function BudgetBreakdown({ estimate, userBudget }: { estimate: BudgetEstimate; userBudget?: number | null }) {
  const money = useMoney()
  const over = userBudget != null && userBudget > 0 && estimate.total > userBudget
  return (
    <div className="stack">
      <div className="row between wrap">
        <div>
          <div className="eyebrow">Estimated total</div>
          <div className="display num" style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.1 }}>{money(estimate.total)}</div>
          <div className="small muted num">Likely range {money(estimate.low)} – {money(estimate.high)}</div>
        </div>
        {userBudget != null && userBudget > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow" style={{ color: 'var(--muted)' }}>Your budget</div>
            <div className="display num" style={{ fontSize: 22, fontWeight: 600 }}>{money(userBudget)}</div>
            <span className={`chip ${over ? 'chip-danger' : 'chip-teal'}`}>
              {Math.abs(estimate.total - userBudget) < estimate.total * 0.02
                ? 'On budget'
                : over
                  ? `${money(estimate.total - userBudget)} over`
                  : `${money(userBudget - estimate.total)} spare`}
            </span>
          </div>
        )}
      </div>
      <div className="budget-bar" aria-hidden="true">
        {estimate.lines.map((l) => (
          <i key={l.key} style={{ flex: l.amount, background: LINE_COLORS[l.key] }} />
        ))}
        <i style={{ flex: estimate.contingency, background: 'var(--line-strong)' }} />
      </div>
      <div>
        {estimate.lines.map((l) => (
          <div className="budget-line" key={l.key}>
            <div className="row">
              <span style={{ width: 10, height: 10, borderRadius: 3, background: LINE_COLORS[l.key], flex: 'none' }} />
              <div>
                <div className="strong small">{l.label}</div>
                <div className="tiny muted">{l.detail}</div>
              </div>
            </div>
            <div className="num strong small">{money(l.amount)}</div>
          </div>
        ))}
        <div className="budget-line">
          <div className="row">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--line-strong)', flex: 'none' }} />
            <div>
              <div className="strong small">Other expenses</div>
              <div className="tiny muted">10% buffer for tips, SIM, souvenirs</div>
            </div>
          </div>
          <div className="num strong small">{money(estimate.contingency)}</div>
        </div>
      </div>
      <Notice>
        These are estimates, not quotes. Real prices depend on the provider, dates, season and exchange rates.
      </Notice>
    </div>
  )
}
