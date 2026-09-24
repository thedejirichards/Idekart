import type { Category, CategoryId } from '../lib/types'

export const CATEGORIES: Category[] = [
  { id: 'travel', name: 'Travel', color: '#1f7a6d', blurb: 'Destinations, getaways and trips' },
  { id: 'adventure', name: 'Adventure', color: '#d9542c', blurb: 'Thrills, wildlife and the outdoors' },
  { id: 'entertainment', name: 'Entertainment', color: '#7b4bb7', blurb: 'Concerts, shows and nights out' },
  { id: 'food', name: 'Food & Dining', color: '#c2410c', blurb: 'Restaurants and culinary experiences' },
  { id: 'sports', name: 'Sports', color: '#0e7490', blurb: 'Matches, races and active pursuits' },
  { id: 'education', name: 'Education', color: '#4d5bd6', blurb: 'Courses, tours and learning trips' },
  { id: 'skills', name: 'Skills', color: '#a16207', blurb: 'Learn something new, hands-on' },
  { id: 'wellness', name: 'Wellness', color: '#2f855a', blurb: 'Spas, retreats and rest' },
  { id: 'finance', name: 'Finance', color: '#475569', blurb: 'Saving for the things that matter' },
  { id: 'personal', name: 'Personal Experiences', color: '#be185d', blurb: 'Milestones that are yours alone' },
  { id: 'events', name: 'Events', color: '#b45309', blurb: 'Festivals, carnivals and big occasions' },
]

export function categoryById(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 2]
}
