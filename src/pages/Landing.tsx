import { Icon } from '../components/Icon'
import { EXPERIENCE_IMAGES } from '../data/experienceImages'
import { useStore } from '../lib/store'

const STEPS = [
  ['Start with a feeling', '“Try sushi”, “get outside”, or that big trip you keep thinking about.'],
  ['Find your kind of place', 'Browse ideas on a map, close to home or somewhere new.'],
  ['Make a light plan', 'Add a note, a date or a budget when they’re useful. Skip them when they’re not.'],
  ['Go your own way', 'Book when it helps. Otherwise, take the directions and enjoy the day.'],
]

const PERSONAS = [
  ['The Dreamer', 'Lots of “someday”s, not many done yet. Idekart turns each one into a first step.'],
  ['The Planner', 'Already knows the list. Wants budgets, milestones and a place to track them.'],
  ['The Occasion-Driven', 'A birthday or anniversary is coming. Needs a good idea and a place that feels right.'],
]

export default function Landing() {
  const { user } = useStore()
  return (
    <div className="landing">
      <nav className="landing-nav">
        <a className="brand" href="#/"><img src="/IdekartLogo.svg" alt="Idekart" /></a>
        <div className="row">
          {user ? (
            <a className="btn btn-dark" href="#/new">Your ideas</a>
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
            Make room for <em>something fun.</em>
          </h1>
          <p className="lead">
            Find a new favourite, explore places on the map and make a plan that fits your life. Book if you need to—or just get directions and go.
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
      <div className="hero-photo" style={{ inset: '0 22% 26% 0' }}>
        <img src={EXPERIENCE_IMAGES.sushi} alt="" />
        <div className="label">
          <div className="eyebrow" style={{ color: '#fff4e8' }}>Dinner idea</div>
          <div className="display" style={{ fontSize: 26, fontWeight: 600 }}>Try sushi</div>
        </div>
      </div>
      <div className="hero-photo" style={{ inset: '46% 0 0 34%' }}>
        <img src={EXPERIENCE_IMAGES.beach} alt="" />
        <div className="label">
          <div className="eyebrow" style={{ color: '#e6fbff' }}>A day out</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 600 }}>Find a beach</div>
        </div>
      </div>
      <div className="card" style={{ position: 'absolute', right: 0, top: '6%', padding: 16, width: 230, zIndex: 2 }}>
        <div className="tiny muted">Your next little step</div>
        <div className="display strong" style={{ fontSize: 22 }}>Find a good spot</div>
        <div className="progress mt-8"><i style={{ width: '40%' }} /></div>
        <div className="tiny muted mt-4">Pick a date if you like</div>
      </div>
    </>
  )
}
