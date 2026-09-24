import { useStore } from './store'
import { formatMoney } from './util'

/** Formats a USD amount in the signed-in user's display currency. */
export function useMoney() {
  const { user, catalog } = useStore()
  const cur = user?.currency ?? 'NGN'
  return (usd: number) => formatMoney(usd, cur, catalog.fxRate)
}
