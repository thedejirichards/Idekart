import { TEMPLATES, templateById } from '../data/templates'
import type { City, Location, Milestone, Template } from './types'
import { uid } from './util'

export interface IdeaMatch {
  template: Template
  matchedLocation: Location | null
  matchedKeywords: string[]
  confidence: 'high' | 'medium' | 'low'
  title: string
}

const LEAD_INS = [
  /^i('d| would)? (really )?(like|love|want) to\s+/i,
  /^i (wanna|hope to|plan to|need to|dream of|have always wanted to)\s+/i,
  /^(my dream is to|someday i('ll| will)|one day i('ll| will))\s+/i,
  /^(to )\s*/i,
]

/** Turns "I want to go on a safari someday." into "Go on a safari". */
export function titleFromIdea(idea: string): string {
  let t = idea.trim().replace(/[.!?]+$/, '')
  for (const re of LEAD_INS) t = t.replace(re, '')
  t = t.replace(/\s+(someday|one day|before i die|this year|soon)$/i, '')
  return t ? t[0].toUpperCase() + t.slice(1) : ''
}

function normalise(s: string) {
  return ` ${s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')} `
}

/**
 * Rule-based idea parsing: a named destination wins outright, otherwise the
 * template with the most keyword hits is chosen (multi-word phrases score higher).
 */
export function matchIdea(idea: string, locations: Location[]): IdeaMatch {
  const text = normalise(idea)
  const title = titleFromIdea(idea)

  const matchedLocation =
    locations.find((l) => {
      if (!l.active) return false
      const names = [l.name.split(/[—,&]/)[0], l.city, ...(l.aliases ?? [])].map((n) => n.trim().toLowerCase())
      return names.some((n) => n.length > 3 && text.includes(` ${n} `))
    }) ?? null

  let best: { t: Template; score: number; hits: string[] } | null = null
  for (const t of TEMPLATES) {
    const hits = t.keywords.filter((k) => text.includes(` ${k} `) || text.includes(` ${k}s `))
    const score = hits.reduce((s, k) => s + (k.includes(' ') ? 2 : 1), 0)
    // Generic travel words ("visit", "trip") should lose to anything specific.
    const adjusted = t.id === 'city' ? score * 0.6 : score
    if (adjusted > 0 && (!best || adjusted > best.score)) best = { t, score: adjusted, hits }
  }

  if (matchedLocation) {
    const specific = best && matchedLocation.templates.includes(best.t.id) ? best.t : null
    const template = specific ?? templateById(matchedLocation.templates[0])!
    return { template, matchedLocation, matchedKeywords: best?.hits ?? [], confidence: 'high', title }
  }
  if (best) {
    return {
      template: best.t,
      matchedLocation: null,
      matchedKeywords: best.hits,
      confidence: best.score >= 2 ? 'high' : 'medium',
      title,
    }
  }
  return { template: templateById('custom')!, matchedLocation: null, matchedKeywords: [], confidence: 'low', title }
}

// ---------- Geography ----------

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export type TravelMode = 'local' | 'road' | 'flight'

export interface TravelEstimate {
  km: number
  mode: TravelMode
  hours: number
  label: string
}

/** Straight-line distance with rule-of-thumb modes and speeds. */
export function travelEstimate(from: City, to: Location): TravelEstimate {
  const straight = distanceKm(from, to)
  if (straight < 40) {
    const km = Math.max(1, straight * 1.3)
    return { km, mode: 'local', hours: km / 25, label: 'Local ride' }
  }
  if (straight < 650) {
    const km = straight * 1.3
    return { km, mode: 'road', hours: km / 60, label: 'By road' }
  }
  return { km: straight, mode: 'flight', hours: straight / 750 + 3, label: 'Flight' }
}

export function formatDuration(hours: number) {
  if (hours < 1) return `${Math.max(5, Math.round((hours * 60) / 5) * 5)} min`
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60 / 15) * 15
  if (m === 60) return `${h + 1} h`
  return m ? `${h} h ${m} min` : `${h} h`
}

// ---------- Budget ----------

export interface BudgetLine {
  key: string
  label: string
  amount: number
  detail: string
}

export interface BudgetEstimate {
  lines: BudgetLine[]
  subtotal: number
  contingency: number
  total: number
  low: number
  high: number
  travel: TravelEstimate
}

const round5 = (n: number) => Math.round(n / 5) * 5

export function estimateBudget(
  loc: Location,
  from: City,
  opts: { travelers: number; nights: number },
): BudgetEstimate {
  const travelers = Math.max(1, opts.travelers)
  const nights = Math.max(0, opts.nights)
  const days = Math.max(1, nights)
  const rooms = Math.ceil(travelers / 2)
  const travel = travelEstimate(from, loc)

  let transportPer: number
  if (travel.mode === 'local') transportPer = Math.max(8, travel.km * 0.6) * 2
  else if (travel.mode === 'road') transportPer = Math.max(15, travel.km * 0.09) * 2
  else transportPer = 140 + travel.km * 0.11

  const lines: BudgetLine[] = [
    {
      key: 'transport',
      label: 'Transportation',
      amount: round5(transportPer * travelers),
      detail: `${travel.label}, return · ${Math.round(travel.km).toLocaleString()} km each way`,
    },
    {
      key: 'accommodation',
      label: 'Accommodation',
      amount: round5(loc.costs.lodgingPerNight * nights * rooms),
      detail: nights ? `${nights} night${nights > 1 ? 's' : ''} × ${rooms} room${rooms > 1 ? 's' : ''}` : 'Day experience',
    },
    {
      key: 'entry',
      label: 'Entry fees',
      amount: round5(loc.costs.entry * travelers),
      detail: `${travelers} × entry`,
    },
    {
      key: 'activity',
      label: 'Activity fees',
      amount: round5(loc.costs.activity * travelers),
      detail: `${travelers} × main activity`,
    },
    {
      key: 'food',
      label: 'Food',
      amount: round5(loc.costs.foodPerDay * days * travelers),
      detail: `${days} day${days > 1 ? 's' : ''} × ${travelers} ${travelers > 1 ? 'people' : 'person'}`,
    },
  ]
  if (loc.booking.mode === 'direct') {
    const fee = Math.max(2, (loc.costs.entry + loc.costs.activity) * travelers * 0.025)
    lines.push({ key: 'booking', label: 'Booking charge', amount: Math.round(fee), detail: '2.5% service fee' })
  }

  const visible = lines.filter((l) => l.amount > 0)
  const subtotal = visible.reduce((s, l) => s + l.amount, 0)
  const contingency = round5(subtotal * 0.1)
  const total = subtotal + contingency
  return {
    lines: visible,
    subtotal,
    contingency,
    total,
    low: round5(total * 0.85),
    high: round5(total * 1.2),
    travel,
  }
}

// ---------- Recommendations ----------

export interface Suggestion {
  location: Location
  estimate: BudgetEstimate
  reason: string
}

export function suggestLocations(
  templateId: string,
  locations: Location[],
  from: City,
  opts: { travelers: number; nights: number },
  pinned?: Location | null,
): Suggestion[] {
  const activeLocations = locations.filter((location) => location.active)
  const matching = locations.filter((l) => l.active && l.templates.includes(templateId))
  const category = templateById(templateId)?.category
  const relatedTemplateIds = new Set(TEMPLATES.filter((template) => template.category === category).map((template) => template.id))
  const related = activeLocations.filter((location) => location.templates.some((id) => relatedTemplateIds.has(id)))
  const pool = matching.length ? matching : related
  if (pinned && !pool.includes(pinned)) pool.unshift(pinned)
  const out = pool.map((location) => {
    const estimate = estimateBudget(location, from, opts)
    const near = estimate.travel.mode !== 'flight'
    return {
      location,
      estimate,
      reason:
        location === pinned
          ? 'You mentioned this place'
          : near
            ? `Close to ${from.name}`
            : location.country === from.country
              ? `In ${location.country}`
              : `Popular in ${location.country}`,
    }
  })
  // Pinned first, then nearest-and-cheapest.
  return out.sort((a, b) => {
    if (a.location === pinned) return -1
    if (b.location === pinned) return 1
    return a.estimate.total - b.estimate.total
  })
}

// ---------- Plan generation ----------

export function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function today() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function generateMilestones(template: Template, targetDate: string | null, loc: Location | null): Milestone[] {
  const t = today()
  const ms: Milestone[] = template.milestones.map((m) => {
    let due: string | null = null
    if (targetDate) {
      due = addDays(targetDate, -m.daysBefore)
      if (due < t) due = t
    }
    return { id: uid(), title: m.title, due, done: false, note: m.note }
  })
  if (loc?.booking.mode === 'direct' && !ms.some((m) => /book|reserve/i.test(m.title))) {
    ms.push({ id: uid(), title: `Book with ${loc.name} on Idekart`, due: targetDate ? addDays(targetDate, -30) : null, done: false })
  }
  ms.push({ id: uid(), title: 'Do it — and mark it complete', due: targetDate, done: false })
  return ms.sort((a, b) => (a.due ?? '9999') .localeCompare(b.due ?? '9999'))
}

/** Deterministic pseudo-availability so the same date always shows the same slots. */
export function slotAvailability(loc: Location, date: string, slot: string) {
  const cap = loc.booking.capacity ?? 10
  let h = 0
  for (const ch of loc.id + date + slot) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const taken = h % (cap + 3)
  return Math.max(0, cap - taken)
}
