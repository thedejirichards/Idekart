import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Cover } from '../components/ui'
import { PLACE_REVIEWS } from '../data/reviews'
import { cityById } from '../data/locations'
import { formatDuration, travelEstimate } from '../lib/rules'
import { useStore } from '../lib/store'

const EXPERIENCES = [
  { id: 'sushi', title: 'Try sushi', detail: 'A little dinner adventure', templateId: 'dining', hue: 342, icon: 'sparkle' },
  { id: 'beach', title: 'Find a beach day', detail: 'Salt air, boat rides and slow time', templateId: 'beach', hue: 198, icon: 'compass' },
  { id: 'live-show', title: 'Catch a live show', detail: 'Music, theatre or a night out', templateId: 'concert', hue: 275, icon: 'ticket' },
] as const

export default function Explore() {
  const { catalog, user } = useStore()
  const home = cityById(user?.homeCity ?? 'lagos')
  const [experienceId, setExperienceId] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const experience = EXPERIENCES.find((pick) => pick.id === experienceId)
  const needle = query.trim().toLowerCase()

  const places = useMemo(() => catalog.locations
    .filter((location) => location.active)
    .filter((location) => !experience || location.templates.includes(experience.templateId))
    .filter((location) => !searchMode || (needle.length > 0 && [location.name, location.city, location.country, location.description, ...location.activities].join(' ').toLowerCase().includes(needle)))
    .map((location) => ({ location, travel: travelEstimate(home, location) }))
    .sort((a, b) => a.travel.km - b.travel.km), [catalog.locations, experience, home, needle, searchMode])
  const selected = places.find(({ location }) => location.id === selectedId)?.location ?? places[0]?.location
  const selectedReviews = selected ? PLACE_REVIEWS[selected.id] : undefined

  function pickExperience(id: string) {
    setExperienceId(id)
    setSearchMode(false)
    setQuery('')
    setSelectedId(null)
  }

  function searchPlaces() {
    setExperienceId(null)
    setSearchMode(true)
    setSelectedId(null)
  }

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <div className="eyebrow">A good day starts somewhere</div>
          <h1 className="mt-8">What sounds fun?</h1>
          <p className="muted">Pick a small idea, find a place on the map, and make it your own.</p>
        </div>
      </div>

      {!experience && !searchMode && (
        <section className="stack">
          <div className="row between wrap">
            <h2>Try one of these</h2>
            <span className="small muted">A few ideas to get you going</span>
          </div>
          <div className="explore-picks">
            {EXPERIENCES.map((pick) => (
              <button className="explore-pick" type="button" key={pick.id} onClick={() => pickExperience(pick.id)}>
                <Cover hue={pick.hue} height={118} className="explore-pick-cover">
                  <span className="chip chip-ink"><Icon name={pick.icon} size={13} /> Pick this idea</span>
                </Cover>
                <span className="explore-pick-copy">
                  <b>{pick.title}</b>
                  <small>{pick.detail}</small>
                </span>
                <Icon name="arrow" className="explore-pick-arrow" />
              </button>
            ))}
          </div>
        </section>
      )}

      {!searchMode && !experience && (
        <button className="explore-search-callout" type="button" onClick={searchPlaces}>
          <span className="explore-search-icon"><Icon name="search" /></span>
          <span><b>Have a place in mind?</b><small>Search for a destination, city or country instead.</small></span>
          <Icon name="arrow" className="explore-pick-arrow" />
        </button>
      )}

      {(experience || searchMode) && (
        <section className="stack">
          <div className="explore-toolbar">
            <div className="grow">
              <button className="btn btn-quiet explore-back" type="button" onClick={() => { setExperienceId(null); setSearchMode(false); setQuery(''); setSelectedId(null) }}>
                <Icon name="back" /> All ideas
              </button>
              <h2 className="mt-8">{experience ? `Places for “${experience.title}”` : 'Search for a place'}</h2>
              <p className="small muted mt-4">{experience ? `Starting near ${home.name}. Pick a place to see it on the map.` : 'Try a place name, city, country or activity.'}</p>
            </div>
            {experience && (
              <button className="btn btn-ghost btn-sm" type="button" onClick={searchPlaces}><Icon name="search" /> Search a place instead</button>
            )}
          </div>

          {searchMode && (
            <label className="field explore-place-search">
              <span>Where are you thinking?</span>
              <div className="search">
                <Icon name="search" size={18} />
                <input className="input" autoFocus placeholder="e.g. Lagos, Zanzibar, beach…" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedId(null) }} />
              </div>
            </label>
          )}

          {places.length > 0 && selected ? (
            <div className="explore-map-layout">
              <div className="explore-results">
                <div className="explore-results-head">
                  <b>{places.length} {places.length === 1 ? 'place' : 'places'}</b>
                  <span className="tiny muted">Near {home.name}</span>
                </div>
                {places.map(({ location, travel }, index) => {
                  const rating = PLACE_REVIEWS[location.id]
                  return (
                    <button
                      type="button"
                      key={location.id}
                      className={`explore-result ${selected.id === location.id ? 'selected' : ''}`}
                      onClick={() => setSelectedId(location.id)}
                    >
                      <span className="explore-result-marker">{index + 1}</span>
                      <span className="grow">
                        <b>{location.name}</b>
                        <small>{location.city}, {location.country}</small>
                        <span className="explore-result-meta">
                          {rating && <span className="place-rating"><i>★</i> {rating.average.toFixed(1)} <span>({rating.count})</span></span>}
                          <span>{travel.label} · {formatDuration(travel.hours)}</span>
                        </span>
                        <span className={`chip ${location.booking.mode === 'none' ? '' : location.booking.mode === 'direct' ? 'chip-teal' : 'chip-gold'}`}>
                          {location.booking.mode === 'none' ? 'No booking needed' : location.booking.mode === 'direct' ? 'Book here if you like' : 'Booking with provider'}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="explore-map-panel">
                <iframe
                  className="map-frame explore-map"
                  title={`Map showing ${selected.name}`}
                  src={`https://maps.google.com/maps?q=${selected.lat},${selected.lng}&z=13&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="explore-map-details">
                  <div className="row between row-top">
                    <div className="grow">
                      <div className="eyebrow">{selected.city}, {selected.country}</div>
                      <h2 className="mt-4">{selected.name}</h2>
                    </div>
                    {selectedReviews && <span className="place-rating place-rating-large"><i>★</i> {selectedReviews.average.toFixed(1)} <small>({selectedReviews.count})</small></span>}
                  </div>
                  <p className="small muted mt-8">{selected.description}</p>
                  {selectedReviews?.reviews[0] && (
                    <blockquote className="explore-review-preview">
                      <span className="place-stars" aria-label={`${selectedReviews.reviews[0].rating} out of 5 stars`}>★★★★★</span>
                      <span>“{selectedReviews.reviews[0].text}”</span>
                      <small>— {selectedReviews.reviews[0].name}</small>
                    </blockquote>
                  )}
                  <div className="row wrap explore-map-actions">
                    <a className="btn btn-primary" href={`#/location/${selected.id}`}>See place & reviews <Icon name="arrow" /></a>
                    <a className="btn btn-ghost" href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`} target="_blank" rel="noreferrer"><Icon name="external" /> Open Maps</a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty explore-empty">
              <Icon name={searchMode && !needle ? 'search' : 'pin'} size={30} />
              <h3>{searchMode && !needle ? 'Where would you like to go?' : 'No places found yet'}</h3>
              <p className="muted">{searchMode && !needle ? 'Search a place above and we’ll show it on the map.' : 'Try another name, or browse one of the ideas instead.'}</p>
              {(needle || experience) && <button className="btn btn-ghost mt-16" type="button" onClick={() => { setExperienceId(null); setSearchMode(false); setQuery('') }}>Back to ideas</button>}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
