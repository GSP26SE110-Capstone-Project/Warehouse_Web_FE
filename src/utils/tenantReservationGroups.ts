import type { ApiStorageReservation } from '../api/storageReservations'

export function reservationZoneLabel(r: ApiStorageReservation): string {
  const name = r.zoneName?.trim()
  if (name) return name
  const code = r.zoneCode?.trim()
  if (code) return code
  if (r.storageLevel === 'WAREHOUSE') return 'Toàn kho'
  return '—'
}

export type ContractZoneGroup = {
  key: string
  contractId: string
  contractCode: string
  warehouseName: string
  zoneCode: string
  zoneLabel: string
  zoneId: string | null
  /** Quyền trên HĐ: zone pool, rack, bin cố định… */
  zoneLevelReservations: ApiStorageReservation[]
  /** Rack / tầng / bin (nếu WH cấp chi tiết — có thể nhiều dòng) */
  detailReservations: ApiStorageReservation[]
  totalReservedCapacity: number
  primaryLevel: string
  primaryType: string
}

export function groupReservationsForTenantView(
  reservations: ApiStorageReservation[],
  contractCodeById: Map<string, string>
): ContractZoneGroup[] {
  const map = new Map<string, ContractZoneGroup>()

  for (const r of reservations) {
    const contractCode = contractCodeById.get(r.contractId) ?? r.contractId.slice(0, 8)
    const zoneKey = r.zoneId ?? r.warehouseId ?? 'warehouse'
    const key = `${r.contractId}:${zoneKey}`

    let group = map.get(key)
    if (!group) {
      group = {
        key,
        contractId: r.contractId,
        contractCode,
        warehouseName: r.warehouseName ?? r.warehouseCode ?? '—',
        zoneCode: r.zoneCode ?? r.zoneName ?? (r.storageLevel === 'WAREHOUSE' ? 'Toàn kho' : '—'),
        zoneLabel: reservationZoneLabel(r),
        zoneId: r.zoneId ?? null,
        zoneLevelReservations: [],
        detailReservations: [],
        totalReservedCapacity: 0,
        primaryLevel: r.storageLevel,
        primaryType: r.reservationType ?? 'SHARED',
      }
      map.set(key, group)
    }

    const cap = Number(r.reservedCapacity ?? 0)
    if (Number.isFinite(cap)) group.totalReservedCapacity += cap

    if (r.storageLevel === 'ZONE' || r.storageLevel === 'WAREHOUSE') {
      group.zoneLevelReservations.push(r)
    } else {
      group.detailReservations.push(r)
    }
  }

  return [...map.values()].sort((a, b) =>
    `${a.contractCode}-${a.zoneCode}`.localeCompare(`${b.contractCode}-${b.zoneCode}`, 'vi')
  )
}

export type BinOccupancyRow = {
  binId: string
  binCode: string
  lpnCount: number
  skuLines: number
  totalQty: number
  lpnCodes: string[]
}

export function aggregateInventoryByBin(
  items: Array<{
    binId: string
    binCode?: string
    lpnId: string
    lpnCode?: string
    quantity: number
    skuId: string
  }>
): BinOccupancyRow[] {
  const map = new Map<string, BinOccupancyRow>()

  for (const row of items) {
    let entry = map.get(row.binId)
    if (!entry) {
      entry = {
        binId: row.binId,
        binCode: row.binCode ?? row.binId.slice(0, 8),
        lpnCount: 0,
        skuLines: 0,
        totalQty: 0,
        lpnCodes: [],
      }
      map.set(row.binId, entry)
    }
    entry.skuLines += 1
    entry.totalQty += Number(row.quantity ?? 0)
    if (row.lpnCode && !entry.lpnCodes.includes(row.lpnCode)) {
      entry.lpnCodes.push(row.lpnCode)
      entry.lpnCount = entry.lpnCodes.length
    }
  }

  return [...map.values()].sort((a, b) => a.binCode.localeCompare(b.binCode, 'vi'))
}
