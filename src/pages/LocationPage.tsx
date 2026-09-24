import { useState } from 'react'
import { Icon } from '../components/Icon'
import { BudgetBreakdown, LocationFacts, MapCard } from '../components/LocationParts'
import { CategoryChip, Cover, Stepper } from '../components/ui'
import { cityById } from '../data/locations'
import { templateById } from '../data/templates'
import { estimateBudget } from '../lib/rules'
import { useStore } from '../lib/store'

export default function LocationPage({ id }: { id: string }) {
  const { location, user } = useStore()
  const loc = location(id)
  const t0 = templateById(loc?.templates[0])
  const [travelers, setTravelers] = useState(2)
  const [nights, setNights] = useState(t0?.defaultNights ?? 0)

  if (!loc) return <div className="empty"><h3>Location not found</h3><a className="btn btn-dark mt-16" href="#/explore">Back to explore</a></div>
  const estimate = estimateBudget(loc, cityById(user?.homeCity ?? 'lagos'), { travelers, nights })
  const cats = [...new Set(loc.templates.map((t) => templateById(t)?.category).filter(Boolean))]

  return (
    <div className="stack-lg">
      <a className="btn btn-quiet" href="#/explore" style={{ marginLeft: -10, alignSelf: 'flex-start' }}><Icon name="back" /> Explore</a>
      <Cover hue={loc.hue} height={220}>
        <div className="row between wrap" style={{ alignItems: 'flex-end' }}>
          <div>
            <div className="small strong">{loc.city}, {loc.country}</div>
            <h1 style={{ color: '#fff' }}>{loc.name}</h1>
          </div>
          <a className="btn btn-primary" href={`#/new?location=${loc.id}`}><Icon name="plus" /> Add to bucket list</a>
        </div>
      </Cover>
      <div className="split">
        <div className="stack-lg">
          <section className="card stack">
            <div className="row wrap" style={{ gap: 6 }}>{cats.map((c) => <CategoryChip key={c} id={c!} />)}</div>
            <p>{loc.description}</p>
            <div>
              <div className="small strong">Things to do</div>
              <div className="row wrap mt-8" style={{ gap: 6 }}>{loc.activities.map((a) => <span className="chip" key={a}>{a}</span>)}</div>
            </div>
            <hr className="divider" />
            <LocationFacts location={loc} />
          </section>
          <section className="card"><MapCard location={loc} /></section>
        </div>
        <section className="card stack">
          <h3>Estimate a trip</h3>
          <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="field"><span>People</span><Stepper value={travelers} min={1} max={20} onChange={setTravelers} /></div>
            <div className="field"><span>Nights</span><Stepper value={nights} min={0} max={30} onChange={setNights} /></div>
          </div>
          <BudgetBreakdown estimate={estimate} />
        </section>
      </div>
    </div>
  )
}
