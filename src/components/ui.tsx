import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { categoryById } from '../data/categories'
import type { BookingStatus, CategoryId, ItemStatus, PaymentStatus } from '../lib/types'
import { Icon } from './Icon'

/** Generated landscape art so every location has a distinctive cover without photos. */
export function Cover({ hue, height, children, className = '' }: { hue: number; height?: number; children?: ReactNode; className?: string }) {
  return (
    <div className={`cover ${className}`} style={{ '--h': hue, height } as CSSProperties}>
      <div className="sun" />
      <svg className="hills" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 70 C60 40 110 55 170 60 S290 30 400 55 V120 H0Z" fill={`hsl(${hue + 20} 45% 28% / .55)`} />
        <path d="M0 95 C80 70 150 88 230 82 S340 70 400 85 V120 H0Z" fill={`hsl(${hue + 35} 50% 18% / .75)`} />
      </svg>
      {children && <div className="label">{children}</div>}
    </div>
  )
}

export function CategoryChip({ id }: { id: CategoryId }) {
  const c = categoryById(id)
  return (
    <span className="chip">
      <span className="dot" style={{ background: c.color }} />
      {c.name}
    </span>
  )
}

const ITEM_STATUS: Record<ItemStatus, [string, string]> = {
  idea: ['Idea', ''],
  planning: ['Planning', 'chip-gold'],
  booked: ['Booked', 'chip-teal'],
  completed: ['Completed', 'chip-ink'],
}
export function StatusChip({ status }: { status: ItemStatus }) {
  const [label, cls] = ITEM_STATUS[status]
  return <span className={`chip ${cls}`}>{label}</span>
}

const BOOKING_STATUS: Record<BookingStatus, [string, string]> = {
  pending_payment: ['Awaiting payment', 'chip-gold'],
  confirmed: ['Confirmed', 'chip-teal'],
  cancelled: ['Cancelled', ''],
  failed: ['Payment failed', 'chip-danger'],
}
export function BookingChip({ status }: { status: BookingStatus }) {
  const [label, cls] = BOOKING_STATUS[status]
  return <span className={`chip ${cls}`}>{label}</span>
}

const PAYMENT_STATUS: Record<PaymentStatus, [string, string]> = {
  processing: ['Processing', 'chip-gold'],
  success: ['Successful', 'chip-teal'],
  failed: ['Failed', 'chip-danger'],
  refunded: ['Refunded', ''],
}
export function PaymentChip({ status }: { status: PaymentStatus }) {
  const [label, cls] = PAYMENT_STATUS[status]
  return <span className={`chip ${cls}`}>{label}</span>
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${value}%` }} />
    </div>
  )
}

export function Ring({ value }: { value: number }) {
  return (
    <div className="ring" style={{ '--p': value } as CSSProperties}>
      <span className="num">{Math.round(value)}%</span>
    </div>
  )
}

export function Stepper({ value, min = 0, max = 99, onChange }: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper">
      <button type="button" aria-label="Decrease" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <output>{value}</output>
      <button type="button" aria-label="Increase" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  )
}

export function Notice({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'teal' | 'danger' }) {
  return (
    <div className={`notice ${tone === 'gold' ? '' : 'notice-' + tone}`}>
      <Icon name="info" />
      <div>{children}</div>
    </div>
  )
}

export function Modal({ onClose, title, children }: { onClose: () => void; title: ReactNode; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>{title}</div>
          <button className="btn btn-quiet" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

let toastSetter: ((m: string | null) => void) | null = null
// eslint-disable-next-line react-refresh/only-export-components
export function toast(msg: string) {
  toastSetter?.(msg)
}
export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    toastSetter = setMsg
    return () => {
      toastSetter = null
    }
  }, [])
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 2600)
    return () => clearTimeout(t)
  }, [msg])
  return msg ? <div className="toast" role="status">{msg}</div> : null
}
