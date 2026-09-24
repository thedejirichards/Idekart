import { useEffect, useState } from 'react'

function current() {
  return window.location.hash.replace(/^#/, '') || '/'
}

export function useRoute() {
  const [path, setPath] = useState(current)
  useEffect(() => {
    const on = () => {
      setPath(current())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return path
}

export function navigate(path: string) {
  window.location.hash = path
}

/** Matches "/item/:id" style patterns; returns params or null. */
export function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean)
  const a = path.split('?')[0].split('/').filter(Boolean)
  if (p.length !== a.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i])
    else if (p[i] !== a[i]) return null
  }
  return params
}

export function query(path: string) {
  return new URLSearchParams(path.split('?')[1] ?? '')
}
