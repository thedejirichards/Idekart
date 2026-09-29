import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Location } from '../lib/types'
import { Icon } from './Icon'

export function LocationPicker({
  locations,
  value,
  onChange,
}: {
  locations: Location[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const selected = locations.find((location) => location.id === value)
  const needle = query.trim().toLowerCase()
  const matchingLocations = locations.filter((location) => !needle || [location.name, location.city, location.country].join(' ').toLowerCase().includes(needle))
  const options = [
    { id: '', name: 'No specific place', detail: 'Keep this experience flexible' },
    ...matchingLocations
      .map((location) => ({ id: location.id, name: location.name, detail: `${location.city}, ${location.country}` })),
  ]

  useEffect(() => {
    if (!open) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [open])

  function choose(id: string) {
    onChange(id)
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (options[activeIndex]) choose(options[activeIndex].id)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="location-picker" ref={root}>
      <button
        className="input location-picker-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="location-picker-value">
          <Icon name="pin" />
          <span>
            <b>{selected?.name ?? 'No specific place'}</b>
            <small>{selected ? `${selected.city}, ${selected.country}` : 'You can choose a place later'}</small>
          </span>
        </span>
        <Icon name="arrow" className={open ? 'location-picker-chevron open' : 'location-picker-chevron'} />
      </button>
      {open && (
        <div className="location-picker-menu">
          <div className="search location-picker-search">
            <Icon name="search" size={18} />
            <input
              className="input"
              role="combobox"
              aria-label="Search locations"
              aria-controls="location-picker-options"
              aria-expanded="true"
              aria-autocomplete="list"
              aria-activedescendant={`location-picker-option-${options[activeIndex]?.id || 'none'}`}
              autoFocus
              placeholder="Search a place or city"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setActiveIndex(0) }}
              onKeyDown={onSearchKeyDown}
            />
          </div>
          <div className="location-picker-options" id="location-picker-options" role="listbox" aria-label="Locations">
            {options.length > 0 ? options.map((option, index) => (
              <button
                className={`location-picker-option ${option.id === value ? 'selected' : ''} ${index === activeIndex ? 'focused' : ''}`}
                key={option.id || 'none'}
                id={`location-picker-option-${option.id || 'none'}`}
                type="button"
                role="option"
                aria-selected={option.id === value}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option.id)}
              >
                <span className="location-picker-option-icon"><Icon name={option.id ? 'pin' : 'compass'} size={16} /></span>
                <span className="grow"><b>{option.name}</b><small>{option.detail}</small></span>
                {option.id === value && <Icon name="check" className="location-picker-check" />}
              </button>
            )) : null}
            {needle && matchingLocations.length === 0 && <p className="small muted location-picker-empty">No places match that search. You can keep it flexible.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
