# Idekart — web MVP prototype

Turns bucket-list ideas into plans: **Idea → Structure → Location → Budget → Map → Plan → Book/Pay → Track → Complete**.
Rule-based (no AI), per the BRD. Everything runs in the browser; data is kept in `localStorage`.

```bash
npm install
npm run dev
```

Demo accounts (seeded on first load): `demo@idekart.app / demo1234`, `admin@idekart.app / admin1234`.
Test payment cards: `4242 4242 4242 4242` succeeds, any card ending `0002` fails.

## Where things live

| Area | File |
| --- | --- |
| Rules engine: idea matching, location ranking, budget, travel, milestones, slot availability | `src/lib/rules.ts` |
| Templates (keywords, milestones, prep) | `src/data/templates.ts` |
| Categories | `src/data/categories.ts` |
| Location catalog + origin cities (sample data) | `src/data/locations.ts` |
| App state: auth, items, bookings, payments, admin catalog | `src/lib/store.tsx` |
| Pages | `src/pages/*` |

## BRD coverage

- FR-001 register/auth · FR-002–004 create/edit/delete/categorise items · FR-005 templates · FR-006 plan generation
- FR-007–009 location suggestions, budget estimates, location info · FR-010–011 Google Maps embed + directions
- FR-012–014 booking with slots, deposits, references, cancellation · simulated payment gateway
- FR-015–017 milestones, check-ins, completion, history · Admin: catalog costs, booking mode, FX rate, templates, reporting metrics

Business rules enforced: auth required, a booking is confirmed only after payment confirmation, availability is rechecked before charging, and estimates are always labelled as estimates.

## Before production

- Replace `localStorage` auth/data with a real backend (passwords are stored in plain text here, for the demo only).
- Swap the simulated payment for a real gateway (e.g. Paystack/Flutterwave) using server-side verification.
- Use the Maps Embed/Directions API with a key. The current embed is keyless.
- Locations, prices and contacts are placeholders and need real, validated data.
# Idekart
