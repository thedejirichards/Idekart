import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { SEED_LOCATIONS } from '../data/locations'
import { templateById } from '../data/templates'
import { addDays, generateMilestones, today } from './rules'
import type { Booking, BucketItem, Catalog, Location, Payment, User } from './types'
import { load, reference, save, uid } from './util'

const K = {
  users: 'idekart.users',
  session: 'idekart.session',
  items: 'idekart.items',
  bookings: 'idekart.bookings',
  payments: 'idekart.payments',
  catalog: 'idekart.catalog',
  seeded: 'idekart.seeded.v1',
}

export const DEFAULT_FX = 1550

function seedDemo() {
  if (load(K.seeded, false)) return
  const now = new Date().toISOString()
  const demo: User = {
    id: 'u-demo', name: 'Ada', email: 'demo@idekart.app', password: 'demo1234',
    homeCity: 'lagos', currency: 'NGN', role: 'user', createdAt: now,
  }
  const admin: User = {
    id: 'u-admin', name: 'Admin', email: 'admin@idekart.app', password: 'admin1234',
    homeCity: 'lagos', currency: 'NGN', role: 'admin', createdAt: now,
  }
  const loc = (id: string) => SEED_LOCATIONS.find((l) => l.id === id)!
  const t = today()
  const zanzibarDate = addDays(t, 75)
  const zanzibar: BucketItem = {
    id: uid(), userId: demo.id, idea: 'I want to visit Zanzibar', title: 'Visit Zanzibar',
    description: 'Stone Town, spice tour and a few slow beach days in Nungwi.', category: 'travel',
    templateId: 'beach', locationId: 'zanzibar', targetDate: zanzibarDate, travelers: 2, nights: 4, budget: 2400,
    milestones: generateMilestones(templateById('beach')!, zanzibarDate, loc('zanzibar')),
    checkIns: [{ date: now, note: 'Passport renewed.' }], status: 'planning', createdAt: now,
  }
  zanzibar.milestones.slice(0, 2).forEach((m) => (m.done = true))
  const dinnerDate = addDays(t, 20)
  const dinner: BucketItem = {
    id: uid(), userId: demo.id, idea: 'Anniversary dinner at a tasting-menu restaurant', title: 'Anniversary tasting-menu dinner',
    description: 'Five years — somewhere special.', category: 'food', templateId: 'dining', locationId: 'lagos-supper',
    targetDate: dinnerDate, travelers: 2, nights: 0, budget: 250,
    milestones: generateMilestones(templateById('dining')!, dinnerDate, loc('lagos-supper')),
    checkIns: [], status: 'idea', createdAt: now,
  }
  const doneDate = addDays(t, -40)
  const obudu: BucketItem = {
    id: uid(), userId: demo.id, idea: 'Ride the cable car at Obudu', title: 'Ride the Obudu cable car',
    description: 'Cool air and the canopy walk.', category: 'adventure', templateId: 'hiking', locationId: 'obudu',
    targetDate: doneDate, travelers: 3, nights: 2, budget: 900,
    milestones: generateMilestones(templateById('hiking')!, doneDate, loc('obudu')).map((m) => ({ ...m, done: true })),
    checkIns: [], status: 'completed', createdAt: addDays(t, -120) + 'T09:00:00.000Z', completedAt: doneDate + 'T18:00:00.000Z',
    reflection: 'Colder than expected. Worth every minute of the climb.',
  }
  save(K.users, [demo, admin])
  save(K.items, [zanzibar, dinner, obudu])
  save(K.seeded, true)
}

interface Store {
  user: User | null
  users: User[]
  items: BucketItem[]
  allItems: BucketItem[]
  bookings: Booking[]
  allBookings: Booking[]
  payments: Payment[]
  allPayments: Payment[]
  catalog: Catalog
  location: (id: string | null) => Location | undefined
  signUp: (u: Pick<User, 'name' | 'email' | 'password' | 'homeCity'>) => string | null
  logIn: (email: string, password: string) => string | null
  logOut: () => void
  updateProfile: (patch: Partial<User>) => void
  addItem: (item: Omit<BucketItem, 'id' | 'userId' | 'createdAt'>) => BucketItem
  updateItem: (id: string, patch: Partial<BucketItem>) => void
  deleteItem: (id: string) => void
  createBooking: (b: Omit<Booking, 'id' | 'ref' | 'userId' | 'status' | 'createdAt'>) => Booking
  cancelBooking: (id: string) => void
  pay: (booking: Booking, method: string, simulateFailure: boolean) => Promise<Payment>
  updateLocation: (id: string, patch: Partial<Location>) => void
  setFxRate: (r: number) => void
  resetCatalog: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    seedDemo()
    return load(K.users, [])
  })
  const [sessionId, setSessionId] = useState<string | null>(() => load(K.session, null))
  const [allItems, setItems] = useState<BucketItem[]>(() => load(K.items, []))
  const [allBookings, setBookings] = useState<Booking[]>(() => load(K.bookings, []))
  const [allPayments, setPayments] = useState<Payment[]>(() => load(K.payments, []))
  const [catalog, setCatalog] = useState<Catalog>(() => {
    const stored = load(K.catalog, { locations: SEED_LOCATIONS, fxRate: DEFAULT_FX })
    const additions = SEED_LOCATIONS.filter((seed) => !stored.locations.some((location) => location.id === seed.id))
    return additions.length ? { ...stored, locations: [...stored.locations, ...additions] } : stored
  })

  useEffect(() => save(K.users, users), [users])
  useEffect(() => save(K.session, sessionId), [sessionId])
  useEffect(() => save(K.items, allItems), [allItems])
  useEffect(() => save(K.bookings, allBookings), [allBookings])
  useEffect(() => save(K.payments, allPayments), [allPayments])
  useEffect(() => save(K.catalog, catalog), [catalog])

  const user = users.find((u) => u.id === sessionId) ?? null
  const uidOrNone = user?.id ?? '__none__'

  const location = useCallback(
    (id: string | null) => (id ? catalog.locations.find((l) => l.id === id) : undefined),
    [catalog.locations],
  )

  const signUp: Store['signUp'] = (u) => {
    const email = u.email.trim().toLowerCase()
    if (users.some((x) => x.email === email)) return 'An account with this email already exists.'
    const nu: User = { ...u, email, id: uid(), currency: 'NGN', role: 'user', createdAt: new Date().toISOString() }
    setUsers((prev) => [...prev, nu])
    setSessionId(nu.id)
    return null
  }

  const logIn: Store['logIn'] = (email, password) => {
    const u = users.find((x) => x.email === email.trim().toLowerCase())
    if (!u || u.password !== password) return 'Email or password is incorrect.'
    setSessionId(u.id)
    return null
  }

  const updateItem: Store['updateItem'] = (id, patch) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  const pay: Store['pay'] = (booking, method, simulateFailure) => {
    const bookingId = booking.id
    const payment: Payment = {
      id: uid(), txRef: reference('TXN'), userId: uidOrNone, bookingId,
      amount: booking.amountDue,
      method, status: 'processing', createdAt: new Date().toISOString(),
    }
    setPayments((prev) => [...prev, payment])
    // The booking only confirms once the (simulated) provider confirms payment.
    return new Promise((resolve) => {
      setTimeout(() => {
        const status = simulateFailure ? 'failed' : 'success'
        const done = { ...payment, status } as Payment
        setPayments((prev) => prev.map((p) => (p.id === payment.id ? done : p)))
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: status === 'success' ? 'confirmed' : 'failed' } : b)),
        )
        if (status === 'success') {
          setItems((prev) =>
            prev.map((i) => (i.id === booking.itemId && i.status !== 'completed' ? { ...i, status: 'booked' } : i)),
          )
        }
        resolve(done)
      }, 1800)
    })
  }

  const value: Store = {
    user,
    users,
    allItems,
    items: useMemo(() => allItems.filter((i) => i.userId === uidOrNone), [allItems, uidOrNone]),
    allBookings,
    bookings: useMemo(() => allBookings.filter((b) => b.userId === uidOrNone), [allBookings, uidOrNone]),
    allPayments,
    payments: useMemo(() => allPayments.filter((p) => p.userId === uidOrNone), [allPayments, uidOrNone]),
    catalog,
    location,
    signUp,
    logIn,
    logOut: () => setSessionId(null),
    updateProfile: (patch) => setUsers((prev) => prev.map((u) => (u.id === sessionId ? { ...u, ...patch } : u))),
    addItem: (item) => {
      const ni: BucketItem = { ...item, id: uid(), userId: uidOrNone, createdAt: new Date().toISOString() }
      setItems((prev) => [ni, ...prev])
      return ni
    },
    updateItem,
    deleteItem: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
    createBooking: (b) => {
      const nb: Booking = { ...b, id: uid(), ref: reference('IDK'), userId: uidOrNone, status: 'pending_payment', createdAt: new Date().toISOString() }
      setBookings((prev) => [...prev, nb])
      return nb
    },
    cancelBooking: (id) => {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)))
      setPayments((prev) => prev.map((p) => (p.bookingId === id && p.status === 'success' ? { ...p, status: 'refunded' } : p)))
    },
    pay,
    updateLocation: (id, patch) =>
      setCatalog((c) => ({ ...c, locations: c.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
    setFxRate: (r) => setCatalog((c) => ({ ...c, fxRate: r })),
    resetCatalog: () => setCatalog({ locations: SEED_LOCATIONS, fxRate: DEFAULT_FX }),
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
