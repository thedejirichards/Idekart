export interface PlaceReview {
  name: string
  date: string
  rating: number
  text: string
}

export interface PlaceRating {
  average: number
  count: number
  reviews: PlaceReview[]
}

/** Sample place feedback for the prototype; production reviews should come from verified visitors. */
export const PLACE_REVIEWS: Record<string, PlaceRating> = {
  'koi-sushi': {
    average: 4.8,
    count: 86,
    reviews: [
      { name: 'Tomi A.', date: '2 weeks ago', rating: 5, text: 'The sushi was fresh, the room felt relaxed, and the staff helped us pick a great sharing platter.' },
      { name: 'Bisi O.', date: '1 month ago', rating: 5, text: 'A lovely date-night spot. The omakase tasting was the best way to try a bit of everything.' },
      { name: 'Chidi N.', date: '2 months ago', rating: 4, text: 'Really good rolls and easy to get to. Go with friends and order a few plates for the table.' },
    ],
  },
  tarkwa: {
    average: 4.6,
    count: 214,
    reviews: [
      { name: 'Amaka E.', date: '3 weeks ago', rating: 5, text: 'A proper little escape from the city. The boat ride is part of the fun.' },
      { name: 'Femi K.', date: '1 month ago', rating: 4, text: 'Go early, pack light and agree your boat fare before you set off.' },
    ],
  },
  'eko-convention': {
    average: 4.5,
    count: 173,
    reviews: [
      { name: 'Dara M.', date: '2 weeks ago', rating: 5, text: 'Great sound and a fun crowd. Check the event doors time before you leave.' },
      { name: 'Tunde B.', date: '6 weeks ago', rating: 4, text: 'Easy venue to find, with plenty happening nearby before a show.' },
    ],
  },
  zanzibar: {
    average: 4.9,
    count: 512,
    reviews: [
      { name: 'Nneka P.', date: '1 week ago', rating: 5, text: 'Stone Town in the morning and the beach at sunset made this trip feel like two holidays.' },
      { name: 'Seyi R.', date: '3 weeks ago', rating: 5, text: 'The spice tour was a highlight. Leave room in your plan for doing absolutely nothing.' },
    ],
  },
  yankari: {
    average: 4.7,
    count: 98,
    reviews: [
      { name: 'Uche I.', date: '2 months ago', rating: 5, text: 'Seeing elephants in Nigeria was unforgettable. Wikki Warm Springs was a lovely bonus.' },
      { name: 'Zainab A.', date: '3 months ago', rating: 4, text: 'A special trip. Bring water, give yourself time, and ask a guide what is active that day.' },
    ],
  },
}

export function reviewsForPlace(id: string) {
  return PLACE_REVIEWS[id]
}
