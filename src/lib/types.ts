export type CategoryId =
  | 'travel'
  | 'adventure'
  | 'entertainment'
  | 'food'
  | 'sports'
  | 'education'
  | 'skills'
  | 'wellness'
  | 'finance'
  | 'personal'
  | 'events'

export interface Category {
  id: CategoryId
  name: string
  color: string
  blurb: string
}

export interface MilestoneTemplate {
  title: string
  /** Days before the target date the milestone is due. */
  daysBefore: number
  note?: string
}

export interface Template {
  id: string
  name: string
  category: CategoryId
  keywords: string[]
  blurb?: string
  /** 0 means a day experience with no overnight stay. */
  defaultNights: number
  requiresBooking: boolean
  milestones: MilestoneTemplate[]
  prep: string[]
}

export type BookingMode = 'direct' | 'redirect' | 'none'

export interface LocationCosts {
  /** All costs are stored in USD, per person unless noted. */
  entry: number
  activity: number
  lodgingPerNight: number
  foodPerDay: number
}

export interface Location {
  id: string
  name: string
  /** Extra names people use in free text, e.g. "masai mara". */
  aliases?: string[]
  city: string
  country: string
  address: string
  lat: number
  lng: number
  description: string
  templates: string[]
  activities: string[]
  hours: string
  contact: { phone?: string; email?: string; website?: string }
  booking: {
    mode: BookingMode
    url?: string
    slots?: string[]
    capacity?: number
    depositPct?: number
  }
  costs: LocationCosts
  hue: number
  active: boolean
}

export interface City {
  id: string
  name: string
  country: string
  lat: number
  lng: number
}

export type Currency = 'NGN' | 'USD'

export interface User {
  id: string
  name: string
  email: string
  password: string
  homeCity: string
  currency: Currency
  role: 'user' | 'admin'
  createdAt: string
}

export interface Milestone {
  id: string
  title: string
  due: string | null
  done: boolean
  note?: string
}

export type ItemStatus = 'idea' | 'planning' | 'booked' | 'completed'

export interface BucketItem {
  id: string
  userId: string
  idea: string
  title: string
  description: string
  category: CategoryId
  templateId: string | null
  locationId: string | null
  targetDate: string | null
  travelers: number
  nights: number
  budget: number | null
  milestones: Milestone[]
  checkIns: { date: string; note: string }[]
  status: ItemStatus
  createdAt: string
  completedAt?: string
  reflection?: string
}

export type BookingStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'failed'

export interface Booking {
  id: string
  ref: string
  userId: string
  itemId: string
  locationId: string
  date: string
  time: string
  participants: number
  total: number
  amountDue: number
  deposit: boolean
  status: BookingStatus
  createdAt: string
}

export type PaymentStatus = 'processing' | 'success' | 'failed' | 'refunded'

export interface Payment {
  id: string
  txRef: string
  userId: string
  bookingId: string
  amount: number
  method: string
  status: PaymentStatus
  createdAt: string
}

export interface Catalog {
  locations: Location[]
  fxRate: number
}
