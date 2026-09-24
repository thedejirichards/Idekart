import type { Currency } from './types'

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function reference(prefix: string) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `${prefix}-${s}`
}

export function formatMoney(usd: number, currency: Currency, fxRate: number) {
  if (currency === 'NGN') {
    const v = usd * fxRate
    const rounded = v >= 100000 ? Math.round(v / 1000) * 1000 : Math.round(v / 100) * 100
    return '₦' + rounded.toLocaleString('en-NG')
  }
  return '$' + Math.round(usd).toLocaleString('en-US')
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso)
  return d.toLocaleDateString('en-GB', opts)
}

export function daysUntil(iso: string | null) {
  if (!iso) return null
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return Math.round((new Date(iso + 'T00:00:00').getTime() - t.getTime()) / 86400000)
}

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — state stays in memory */
  }
}

export function progressOf(ms: { done: boolean }[]) {
  return ms.length ? (ms.filter((m) => m.done).length / ms.length) * 100 : 0
}
