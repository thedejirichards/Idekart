import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { BudgetBreakdown, LocationFacts, MapCard } from '../components/LocationParts'
import { CategoryChip, Cover, StatusChip, Stepper, toast } from '../components/ui'
import { useMoney } from '../lib/money'
import { CATEGORIES } from '../data/categories'
import { cityById } from '../data/locations'
import { templateById } from '../data/templates'
import { navigate, query } from '../lib/router'
import { estimateBudget, formatDuration, generateMilestones, matchIdea, suggestLocations, today, titleFromIdea } from '../lib/rules'
import type { IdeaMatch } from '../lib/rules'
import { useStore } from '../lib/store'
import type { CategoryId } from '../lib/types'
import { formatDate } from '../lib/util'

const STEP_NAMES = ['Idea', 'Details', 'Place', 'Plan']

export default function NewIdea({ path }: { path: string }) {
  const { user, catalog, location, addItem, items } = useStore()
  const money = useMoney()
  const home = cityById(user?.homeCity ?? 'lagos')
  const preLoc = location(query(path).get('location'))

  const [creating, setCreating] = useState(Boolean(preLoc))
  const [step, setStep] = useState(0)
  const [idea, setIdea] = useState(preLoc ? `Visit ${preLoc.name}` : '')
  const [m, setM] = useState<IdeaMatch | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryId>('personal')
  const [templateId, setTemplateId] = useState('custom')
  const [targetDate, setTargetDate] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [nights, setNights] = useState(0)
  const [locationId, setLocationId] = useState<string | null>(preLoc?.id ?? null)
  const [budget, setBudget] = useState<string>('')
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const ideas = useMemo(
    () => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items],
  )

  const origin = useMemo(
    () => currentPosition ? { ...home, name: 'Current location', ...currentPosition } : home,
    [currentPosition, home],
  )
  const template = templateById(templateId)!
  const loc = location(locationId)
  const suggestions = useMemo(
    () => suggestLocations(templateId, catalog.locations, origin, { travelers, nights }, m?.matchedLocation ?? preLoc),
    [templateId, catalog.locations, origin, travelers, nights, m, preLoc],
  )
  const estimate = loc ? estimateBudget(loc, origin, { travelers, nights }) : null
  const milestones = useMemo(() => {
    const planLocation = catalog.locations.find((candidate) => candidate.id === locationId) ?? null
    return generateMilestones(template, targetDate || null, planLocation)
  }, [catalog.locations, locationId, targetDate, template])

  function analyse(text = idea) {
    if (!text.trim()) return
    const r = matchIdea(text, catalog.locations)
    setIdea(text)
    setM(r)
    setTitle(titleFromIdea(text) || text)
    setCategory(r.template.category)
    setTemplateId(r.template.id)
    setNights(r.template.defaultNights)
    setLocationId(r.matchedLocation?.id ?? preLoc?.id ?? null)
    setStep(1)
  }

  function updateTitle(text: string) {
    setTitle(text)
    if (!text.trim()) return
    const r = matchIdea(text, catalog.locations)
    setM(r)
    setCategory(r.template.category)
    setTemplateId(r.template.id)
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError('Current location is not available in this browser.')
      return
    }
    setLocating(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentPosition({ lat: coords.latitude, lng: coords.longitude })
        setLocating(false)
      },
      (error) => {
        setLocating(false)
        setLocationError(error.code === 1
          ? 'Location access was denied. Allow access in your browser and try again.'
          : 'Could not find your current location. Please try again.')
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 12_000 },
    )
  }

  function save() {
    const chosen = budgetUsd(budget, user?.currency, catalog.fxRate) ?? estimate?.total ?? null
    addItem({
      idea, title: title.trim() || idea, description: '', category, templateId,
      locationId, targetDate: targetDate || null, travelers, nights, budget: chosen ? Math.round(chosen) : null,
      milestones, checkIns: [], status: loc || targetDate ? 'planning' : 'idea',
    })
    toast('Idea added')
    setCreating(false)
    resetComposer()
    navigate('/new')
  }

  function resetComposer() {
    setStep(0)
    setIdea('')
    setM(null)
    setTitle('')
    setCategory('personal')
    setTemplateId('custom')
    setTargetDate('')
    setTravelers(1)
    setNights(0)
    setLocationId(null)
    setBudget('')
    setCurrentPosition(null)
    setLocating(false)
    setLocationError('')
  }

  function closeComposer() {
    resetComposer()
    setCreating(false)
    navigate('/new')
  }

  function openComposer() {
    resetComposer()
    setCreating(true)
    navigate('/new')
  }

  const canNext = step !== 1 || title.trim().length > 0

  if (!creating) {
    return (
      <section className={`idea-home ${ideas.length ? 'has-ideas' : 'empty-ideas'}`} aria-label="Your ideas">
        {ideas.length === 0 ? (
          <>
            <p className="idea-empty-hint">Click + to add your first idea.</p>
            <button className="idea-add-button idea-add-button-empty" type="button" onClick={openComposer} aria-label="Create your first idea" title="Create your first idea">
              <Icon name="plus" size={34} />
            </button>
          </>
        ) : (
          <>
            <h1>Your ideas</h1>
            <ul className="idea-history" aria-label="Idea history">
              {ideas.map((item) => (
                <li key={item.id}>
                  <a href={`#/item/${item.id}`}>
                    <span className="idea-history-title">{item.title}</span>
                    <span className="idea-history-meta">
                      <StatusChip status={item.status} />
                      <time className="idea-history-date" dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <button className="idea-add-button" type="button" onClick={openComposer} aria-label="Create a new idea" title="Create a new idea">
              <Icon name="plus" size={28} />
            </button>
          </>
        )}
      </section>
    )
  }

  return (
    <div className="new-idea-flow">
      <button className="btn btn-quiet" type="button" onClick={closeComposer} style={{ marginLeft: -10 }}><Icon name="back" /> All ideas</button>
      <div className="steps mt-16" aria-label="Progress">
        {STEP_NAMES.map((n, i) => (
          <div key={n} className={`s ${i === step ? 'on' : i < step ? 'done' : ''}`}>
            <b>{i < step ? '✓' : i + 1}</b> {n}
          </div>
        ))}
      </div>

      {step === 0 && (
        <section className="stack-lg" style={{ maxWidth: 760 }}>
          <div>
            <h1>What sounds fun?</h1>
            <p className="muted mt-8">Big dream or a small new thing—start wherever you are. We’ll help you find a place and shape a simple plan.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); analyse() }} className="stack">
            <input
              className="idea-input" autoFocus placeholder="Try sushi…" value={idea}
              onChange={(e) => setIdea(e.target.value)} aria-label="Your idea"
            />
            <div className="row mt-16">
              <button className="btn btn-primary btn-lg" disabled={!idea.trim()}>Find my experience <Icon name="arrow" /></button>
            </div>
          </form>
        </section>
      )}

      {step === 1 && m && (
        <section className="stack-lg" style={{ maxWidth: 760 }}>
          <div>
            <div className="eyebrow">Step 2 · Details</div>
            <h2 className="mt-4">Make it feel like yours</h2>
          </div>
          <div className="stack">
            <label className="field">
              <span>Title</span>
              <input className="input" value={title} onChange={(e) => updateTitle(e.target.value)} />
            </label>
            <label className="field">
              <span>Category</span>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value as CategoryId)}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div className="grid-3">
              <label className="field">
                <span>When? <span className="hint">— optional</span></span>
                <input className="input" type="date" min={today()} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              </label>
              <div className="field">
                <span>People</span>
                <Stepper value={travelers} min={1} max={20} onChange={setTravelers} />
              </div>
              <div className="field">
                <span>Nights</span>
                <Stepper value={nights} min={0} max={30} onChange={setNights} />
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="stack">
          <div>
            <div className="eyebrow">Step 3 · Place <span className="hint">— optional</span></div>
            <div className="row between wrap mt-4">
              <h2>Pick a place, or keep it open</h2>
              <div className="row wrap">
                <button className="btn btn-ghost btn-sm" type="button" onClick={useCurrentLocation} disabled={locating}>
                  <Icon name="pin" /> {locating ? 'Finding location…' : currentPosition ? 'Update current location' : 'Use current location'}
                </button>
                {currentPosition && <button className="btn btn-quiet btn-sm" type="button" onClick={() => setCurrentPosition(null)}>Use home city</button>}
              </div>
            </div>
            <p className="muted mt-4">Suggestions are ranked by estimated cost from {origin.name}. You can skip this and decide later.</p>
            {locationError && <p className="error" role="alert">{locationError}</p>}
          </div>
          {suggestions.length === 0 ? (
            <div className="empty">
              <h3>No specific places for this one</h3>
              <p className="muted">This idea can happen anywhere. Continue and keep your plan flexible.</p>
            </div>
          ) : (
            <div className="grid-auto">
              {suggestions.map(({ location: l, estimate: e, reason }) => (
                <button key={l.id} type="button" className={`option ${locationId === l.id ? 'on' : ''}`} onClick={() => setLocationId(locationId === l.id ? null : l.id)} aria-pressed={locationId === l.id}>
                  <Cover hue={l.hue}>
                    <span className="small strong">{l.city}, {l.country}</span>
                  </Cover>
                  <div className="body">
                    <div className="row between row-top">
                      <h3 style={{ fontSize: 17 }}>{l.name}</h3>
                      {locationId === l.id && <span className="chip chip-accent"><Icon name="check" size={12} /> Selected</span>}
                    </div>
                    <p className="small muted">{l.description}</p>
                    <div className="row wrap" style={{ gap: 6 }}>
                      <span className="chip">{reason}</span>
                      <span className="chip">{e.travel.label} · {formatDuration(e.travel.hours)}</span>
                      <span className={`chip ${l.booking.mode === 'direct' ? 'chip-teal' : ''}`}>
                        {l.booking.mode === 'direct' ? 'Book here if you like' : l.booking.mode === 'redirect' ? 'Book with provider' : 'No booking needed'}
                      </span>
                    </div>
                    <div className="row between mt-4">
                      <span className="tiny muted">Est. total</span>
                      <span className="strong num">{money(e.total)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {loc && (
            <div className="card grid-2 mt-16" style={{ alignItems: 'start' }}>
              <div className="stack">
                <h3>{loc.name}</h3>
                <p className="small muted">{loc.description}</p>
                <div className="row wrap" style={{ gap: 6 }}>
                  {loc.activities.map((a) => <span className="chip" key={a}>{a}</span>)}
                </div>
                <LocationFacts location={loc} />
              </div>
              <MapCard location={loc} />
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="split">
          <div className="card">
            <div className="eyebrow">Step 4 · Plan</div>
            <h2 className="mt-4">Your plan for “{title}”</h2>
            <p className="small muted mt-4">
              {targetDate ? `Milestones are scheduled back from ${formatDate(targetDate)}.` : 'No date yet? That’s fine. You can add one whenever you’re ready.'}
            </p>
            <div className="mt-8">
              {milestones.map((ms) => (
                <div className="milestone" key={ms.id}>
                  <span className="check" aria-hidden="true" />
                  <div className="grow">
                    <div className="m-title strong small">{ms.title}</div>
                    {ms.note && <div className="tiny muted">{ms.note}</div>}
                  </div>
                  <span className="tiny muted num">{ms.due ? formatDate(ms.due, { day: 'numeric', month: 'short' }) : ''}</span>
                </div>
              ))}
            </div>
          </div>
          <aside className="card stack">
            <h3>Summary</h3>
            <SummaryRow label="Category"><CategoryChip id={category} /></SummaryRow>
            <SummaryRow label="Where">{loc ? loc.name : <span className="muted">Not chosen</span>}</SummaryRow>
            <SummaryRow label="When">{targetDate ? formatDate(targetDate) : <span className="muted">Flexible</span>}</SummaryRow>
            <SummaryRow label="Who">{travelers} {travelers > 1 ? 'people' : 'person'}{nights ? ` · ${nights} night${nights > 1 ? 's' : ''}` : ''}</SummaryRow>
            <SummaryRow label="Budget">
              <span className="num strong">
                {budget ? money(budgetUsd(budget, user?.currency, catalog.fxRate) ?? 0) : estimate ? money(estimate.total) : '—'}
              </span>
            </SummaryRow>
            <label className="field mt-8">
              <span>Your budget <span className="hint">— optional</span></span>
              <input
                className="input num" inputMode="decimal"
                placeholder={estimate ? money(estimate.total).replace(/[^\d,]/g, '') : 'Set one later'}
                value={budget} onChange={(e) => setBudget(e.target.value)}
              />
            </label>
            {estimate && <details className="estimate-details">
              <summary>See cost estimate · {money(estimate.total)}</summary>
              <div className="mt-16"><BudgetBreakdown estimate={estimate} userBudget={budgetUsd(budget, user?.currency, catalog.fxRate)} /></div>
            </details>}
            {loc && (
              <SummaryRow label="Booking">
                {loc.booking.mode === 'direct' ? 'Book on Idekart' : loc.booking.mode === 'redirect' ? 'Via provider' : 'Not needed'}
              </SummaryRow>
            )}
            <button className="btn btn-primary btn-lg btn-block mt-8" onClick={save}>
              <Icon name="check" /> Add to my bucket list
            </button>
          </aside>
        </section>
      )}

      {step > 0 && (
        <div className="sticky-actions">
          <button className="btn btn-ghost" onClick={() => setStep(step - 1)}><Icon name="back" /> Back</button>
          {step < 3 && (
            <div className="row">
              {step === 2 && !locationId && suggestions.length > 0 && <span className="small muted">You can skip and choose later</span>}
              <button className="btn btn-dark" disabled={!canNext} onClick={() => setStep(step + 1)}>
                {step === 2 && !locationId ? 'Skip' : 'Continue'} <Icon name="arrow" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row between small" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
      <span className="muted">{label}</span>
      <span style={{ textAlign: 'right' }}>{children}</span>
    </div>
  )
}

function budgetUsd(input: string, currency: string | undefined, fx: number): number | null {
  const n = parseFloat(input.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return null
  return currency === 'NGN' ? n / fx : n
}
