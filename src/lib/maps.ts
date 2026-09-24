import type { City, Location } from './types'

export function directionsUrl(from: City, to: Location) {
  const p = new URLSearchParams({
    api: '1',
    origin: `${from.name}, ${from.country}`,
    destination: `${to.lat},${to.lng}`,
  })
  return `https://www.google.com/maps/dir/?${p}`
}

export function placeUrl(to: Location) {
  return `https://www.google.com/maps/search/?api=1&query=${to.lat},${to.lng}`
}
