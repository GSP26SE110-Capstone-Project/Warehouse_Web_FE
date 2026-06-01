export type ActivityDayBucket = {
  key: string
  label: string
  rentals: number
  inbounds: number
  contracts: number
}

function startOfLocalDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function dayKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function countByDay<T extends { createdAt?: string | null }>(
  items: T[],
  fromMs: number,
  toMs: number
): Map<string, number> {
  const map = new Map<string, number>()
  for (const item of items) {
    if (!item.createdAt) continue
    const t = new Date(item.createdAt).getTime()
    if (Number.isNaN(t) || t < fromMs || t > toMs) continue
    const key = dayKey(new Date(t))
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

/** Gom hoạt động theo ngày (7 ngày gần nhất, gồm hôm nay). */
export function buildActivitySeries(
  rentalRequests: Array<{ createdAt?: string | null }>,
  inboundRequests: Array<{ createdAt?: string | null }>,
  contracts: Array<{ createdAt?: string | null }>,
  dayCount = 7
): ActivityDayBucket[] {
  const today = startOfLocalDay(new Date())
  const from = new Date(today)
  from.setDate(from.getDate() - (dayCount - 1))
  const fromMs = from.getTime()
  const toMs = today.getTime() + 24 * 60 * 60 * 1000 - 1

  const rentals = countByDay(rentalRequests, fromMs, toMs)
  const inbounds = countByDay(inboundRequests, fromMs, toMs)
  const contractMap = countByDay(contracts, fromMs, toMs)

  const buckets: ActivityDayBucket[] = []
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(from)
    d.setDate(from.getDate() + i)
    const key = dayKey(d)
    buckets.push({
      key,
      label: d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      rentals: rentals.get(key) ?? 0,
      inbounds: inbounds.get(key) ?? 0,
      contracts: contractMap.get(key) ?? 0,
    })
  }
  return buckets
}

export function seriesTotals(buckets: ActivityDayBucket[]) {
  return buckets.reduce(
    (acc, b) => ({
      rentals: acc.rentals + b.rentals,
      inbounds: acc.inbounds + b.inbounds,
      contracts: acc.contracts + b.contracts,
    }),
    { rentals: 0, inbounds: 0, contracts: 0 }
  )
}
