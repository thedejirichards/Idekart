import { Icon, Logo } from '../components/Icon'
import { useStore } from '../lib/store'

const STEPS = [
  ['Say the dream', 'Type it the way you’d say it: “I want to go on a safari.”'],
  ['Get the where', 'We match it to real places you can do it — near home or far away.'],
  ['See the cost', 'An itemised estimate: transport, stay, fees, food and a buffer.'],
  ['Book, go, tick it off', 'Directions, bookings and payments, plus a plan with milestones to track.'],
]

const PERSONAS = [
  ['The Dreamer', 'Lots of “someday”s, not many done yet. Idekart turns each one into a first step.'],
  ['The Planner', 'Already knows the list. Wants budgets, milestones and a place to track them.'],
  ['The Occasion-Driven', 'A birthday or anniversary is coming. Needs ideas, prices and a booking — fast.'],
]

export default function Landing() {
  const { user } = useStore()
  return (
    <div className="landing">
      <nav className="landing-nav">
        <a className="brand" href="#/"><Logo /> Idekart</a>
        <div className="row">
          {user ? (
            <a className="btn btn-dark" href="#/app">Open dashboard</a>
          ) : (
            <>
              <a className="btn btn-quiet" href="#/login">Log in</a>
              <a className="btn btn-dark" href="#/signup">Get started</a>
            </>
          )}
        </div>
      </nav>

      <section className="hero">
        <div>
          <div className="eyebrow">Bucket lists, made real</div>
          <h1 className="mt-16">
            Turn <em>someday</em> into a plan.
          </h1>
          <p className="lead">
            Idekart takes the things you’ve always wanted to do and tells you where, when, how to get there and how much it’ll cost. Then it helps you book it.
          </p>
          <div className="row wrap">
            <a className="btn btn-primary btn-lg" href={user ? '#/new' : '#/signup'}>
              Start with an idea <Icon name="arrow" />
            </a>
            <a className="btn btn-ghost btn-lg" href="#/login">Try the demo account</a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <HeroCards />
        </div>
      </section>

      <section className="flow">
        <div className="flow-inner">
          <div className="eyebrow" style={{ color: 'var(--gold)' }}>How it works</div>
          <h2 className="mt-8" style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: '#fff', maxWidth: 640 }}>
            From “I want to” to “I did” in four steps.
          </h2>
          <div className="flow-steps">
            {STEPS.map(([t, d], i) => (
              <div key={t}>
                <b>0{i + 1}</b>
                <h3 style={{ color: '#fff' }}>{t}</h3>
                <p className="small mt-8" style={{ color: '#bdb8cf' }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="personas">
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)' }}>Built for however you dream</h2>
        <div className="grid-3 mt-24">
          {PERSONAS.map(([t, d]) => (
            <div className="card" key={t}>
              <h3>{t}</h3>
              <p className="muted mt-8">{d}</p>
            </div>
          ))}
        </div>
        <p className="tiny faint mt-32">Idekart MVP prototype · locations, prices and contacts are sample data.</p>
      </section>
    </div>
  )
}

function HeroCards() {
  return (
    <>
      <div className="cover" style={{ '--h': 32, inset: '0 22% 26% 0' } as React.CSSProperties}>
        <div className="sun" />
        <div className="label">
          <div className="eyebrow" style={{ color: '#fff4e8' }}>Adventure</div>
          <div className="display" style={{ fontSize: 26, fontWeight: 600 }}>Go on a safari</div>
        </div>
      </div>
      <div className="cover" style={{ '--h': 190, inset: '46% 0 0 34%' } as React.CSSProperties}>
        <div className="sun" />
        <div className="label">
          <div className="eyebrow" style={{ color: '#e6fbff' }}>Travel</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 600 }}>Visit Zanzibar</div>
        </div>
      </div>
      <div className="card" style={{ position: 'absolute', right: 0, top: '6%', padding: 16, width: 230, zIndex: 2 }}>
        <div className="tiny muted">Estimated total · 2 people</div>
        <div className="display strong" style={{ fontSize: 24 }}>₦3,720,000</div>
        <div className="progress mt-8"><i style={{ width: '40%' }} /></div>
        <div className="tiny muted mt-4">2 of 6 milestones done</div>
      </div>
    </>
  )
}
