import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { BudgetBreakdown, LocationFacts, MapCard } from '../components/LocationParts'
import { CategoryChip, Cover, Notice, Stepper, toast } from '../components/ui'
import { useMoney } from '../lib/money'
import { CATEGORIES } from '../data/categories'
import { cityById } from '../data/locations'
import { TEMPLATES, templateById } from '../data/templates'
import { navigate, query } from '../lib/router'
import { estimateBudget, formatDuration, generateMilestones, matchIdea, suggestLocations, today } from '../lib/rules'
import type { IdeaMatch } from '../lib/rules'
import { useStore } from '../lib/store'
import type { CategoryId } from '../lib/types'
import { formatDate } from '../lib/util'

const EXAMPLES = [
  'I want to go on a safari',
  'I want to visit Zanzibar',
  'Go skydiving before I turn 30',
  'Learn to cook jollof properly',
  'Experience Calabar Carnival',
  'Anniversary dinner somewhere special',
]

const STEP_NAMES = ['Idea', 'Structure', 'Location', 'Budget', 'Plan']

export default function NewIdea({ path }: { path: string }) {
  const { user, catalog, location, addItem } = useStore()
  const money = useMoney()
  const home = cityById(user?.homeCity ?? 'lagos')
  const preLoc = location(query(path).get('location'))

  const [step, setStep] = useState(0)
  const [idea, setIdea] = useState(preLoc ? `Visit ${preLoc.name}` : '')
  const [m, setM] = useState<IdeaMatch | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<CategoryId>('personal')
  const [templateId, setTemplateId] = useState('custom')
  const [targetDate, setTargetDate] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [nights, setNights] = useState(0)
  const [locationId, setLocationId] = useState<string | null>(preLoc?.id ?? null)
  const [budget, setBudget] = useState<string>('')

  const template = templateById(templateId)!
  const loc = location(locationId)
  const suggestions = useMemo(
    () => suggestLocations(templateId, catalog.locations, home, { travelers, nights }, m?.matchedLocation ?? preLoc),
    [templateId, catalog.locations, home, travelers, nights, m, preLoc],
  )
  const estimate = loc ? estimateBudget(loc, home, { travelers, nights }) : null
  const milestones = useMemo(() => generateMilestones(template, targetDate || null, loc ?? null), [template, targetDate, loc])

  function analyse(text = idea) {
    if (!text.trim()) return
    const r = matchIdea(text, catalog.locations)
    setIdea(text)
    setM(r)
    setTitle(r.title || text)
    setCategory(r.template.category)
    setTemplateId(r.template.id)
    setNights(r.template.defaultNights)
    setLocationId(r.matchedLocation?.id ?? preLoc?.id ?? null)
    setStep(1)
  }

  function pickTemplate(id: string) {
    const t = templateById(id)!
    setTemplateId(id)
    setCategory(t.category)
    setNights(t.defaultNights)
    if (loc && !loc.templates.includes(id)) setLocationId(null)
  }

  function save() {
    const chosen = budgetUsd(budget, user?.currency, catalog.fxRate) ?? estimate?.total ?? null
    const item = addItem({
      idea, title: title.trim() || idea, description: description.trim(), category, templateId,
      locationId, targetDate: targetDate || null, travelers, nights, budget: chosen ? Math.round(chosen) : null,
      milestones, checkIns: [], status: loc || targetDate ? 'planning' : 'idea',
    })
    toast('Added to your bucket list')
    navigate(`/item/${item.id}`)
  }

  const canNext = step !== 1 || title.trim().length > 0

  return (
    <div>
      <a className="btn btn-quiet" href="#/app" style={{ marginLeft: -10 }}><Icon name="back" /> Dashboard</a>
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
            <h1>What have you always wanted to do?</h1>
            <p className="muted mt-8">Write it how you’d say it. We’ll work out the category, where you can do it and what it costs.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); analyse() }} className="stack">
            <input
              className="idea-input" autoFocus placeholder="I want to…" value={idea}
              onChange={(e) => setIdea(e.target.value)} aria-label="Your idea"
            />
            <div className="row wrap" style={{ gap: 8 }}>
              {EXAMPLES.map((ex) => (
                <button type="button" key={ex} className="suggest-chip" onClick={() => analyse(ex)}>{ex}</button>
              ))}
            </div>
            <div className="row mt-16">
              <button className="btn btn-primary btn-lg" disabled={!idea.trim()}>Structure my idea <Icon name="arrow" /></button>
            </div>
          </form>
        </section>
      )}

      {step === 1 && m && (
        <section className="split">
          <div className="card stack">
            <div>
              <div className="eyebrow">Step 2 · Structure</div>
              <h2 className="mt-4">Here’s how we read it</h2>
            </div>
            <label className="field">
              <span>Title</span>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <div className="grid-2">
              <label className="field">
                <span>Category</span>
                <select className="select" value={category} onChange={(e) => setCategory(e.target.value as CategoryId)}>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Template</span>
                <select className="select" value={templateId} onChange={(e) => pickTemplate(e.target.value)}>
                  {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
            </div>
            <label className="field">
              <span>Description <span className="hint">— optional</span></span>
              <textarea className="textarea" placeholder="Why this matters, who’s coming, anything you already know…" value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <div className="grid-3">
              <label className="field">
                <span>Target date</span>
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

          <aside className="stack">
            <div className="card-flat stack" style={{ background: 'var(--sand)', border: 0 }}>
              <div className="row between">
                <span className="small strong">Matched template</span>
                <span className={`chip ${m.confidence === 'high' ? 'chip-teal' : m.confidence === 'medium' ? 'chip-gold' : ''}`}>
                  {m.confidence === 'high' ? 'Strong match' : m.confidence === 'medium' ? 'Likely match' : 'Custom'}
                </span>
              </div>
              <h3>{template.name}</h3>
              <p className="small muted">{template.blurb}</p>
              <div className="row wrap" style={{ gap: 6 }}>
                <CategoryChip id={category} />
                {m.matchedLocation && <span className="chip chip-accent"><Icon name="pin" size={12} /> {m.matchedLocation.name}</span>}
                {m.matchedKeywords.slice(0, 3).map((k) => <span className="chip" key={k}>“{k}”</span>)}
              </div>
            </div>
            {template.prep.length > 0 && (
              <div className="card-flat">
                <div className="small strong">You’ll probably need</div>
                <ul className="small muted" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                  {template.prep.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            )}
            {template.requiresBooking && (
              <Notice tone="teal">This kind of experience usually needs a reservation. We’ll flag which places you can book on Idekart.</Notice>
            )}
          </aside>
        </section>
      )}

      {step === 2 && (
        <section className="stack">
          <div>
            <div className="eyebrow">Step 3 · Location</div>
            <h2 className="mt-4">Where you can do it</h2>
            <p className="muted mt-4">Ranked by estimated total cost from {home.name} for {travelers} {travelers > 1 ? 'people' : 'person'}.</p>
          </div>
          {suggestions.length === 0 ? (
            <div className="empty">
              <h3>No specific places for this one</h3>
              <p className="muted">Goals like this don’t need a location. Skip ahead to build your plan.</p>
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
                      {l.booking.mode === 'direct' && <span className="chip chip-teal">Bookable</span>}
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
        <section className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="eyebrow">Step 4 · Budget</div>
            <h2 className="mt-4" style={{ marginBottom: 16 }}>What it’s likely to cost</h2>
            {estimate ? (
              <BudgetBreakdown estimate={estimate} userBudget={budgetUsd(budget, user?.currency, catalog.fxRate)} />
            ) : (
              <p className="muted">Pick a location to get an itemised estimate, or set your own budget.</p>
            )}
          </div>
          <div className="card stack">
            <h3>Set your budget</h3>
            <p className="small muted">Leave blank to use the estimate. You can change it any time.</p>
            <label className="field">
              <span>Budget ({user?.currency === 'NGN' ? '₦' : '$'})</span>
              <input
                className="input num" inputMode="decimal"
                placeholder={estimate ? money(estimate.total).replace(/[^\d,]/g, '') : 'e.g. 500,000'}
                value={budget} onChange={(e) => setBudget(e.target.value)}
              />
            </label>
            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="field"><span>People</span><Stepper value={travelers} min={1} max={20} onChange={setTravelers} /></div>
              <div className="field"><span>Nights</span><Stepper value={nights} min={0} max={30} onChange={setNights} /></div>
            </div>
            {estimate && targetDate && (
              <Notice tone="teal">
                Saving for this? That’s about <b>{money(estimate.total / Math.max(1, monthsUntil(targetDate)))}</b> a month until {formatDate(targetDate, { month: 'long', year: 'numeric' })}.
              </Notice>
            )}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="split">
          <div className="card">
            <div className="eyebrow">Step 5 · Plan</div>
            <h2 className="mt-4">Your plan for “{title}”</h2>
            <p className="small muted mt-4">
              {targetDate ? `Milestones are scheduled back from ${formatDate(targetDate)}.` : 'Add a target date to schedule these milestones.'}
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
          {step < 4 && (
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

function monthsUntil(iso: string) {
  const now = new Date()
  const d = new Date(iso + 'T00:00:00')
  return (d.getFullYear() - now.getFullYear()) * 12 + d.getMonth() - now.getMonth()
}
