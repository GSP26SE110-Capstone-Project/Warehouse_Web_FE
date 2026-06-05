import type { ApiInventory } from '../api/inventories'
import type { ApiRack } from '../api/racks'
import type { ApiBin } from '../api/bins'
import type { SeatVisualStatus } from '../components/rack/CinemaSeatGrid'

export type BinInventorySummary = {
  binId: string
  binCode: string
  lineCount: number
  totalQuantity: number
  availableQuantity: number
  reservedQuantity: number
  skuCodes: string[]
  lpnCodes: string[]
  rows: ApiInventory[]
}

export type RackInventorySummary = {
  rackId: string
  rackCode: string
  binCount: number
  binsWithStock: number
  lineCount: number
  totalQuantity: number
  usagePercent: number
}

/** Chỉ tồn còn trong bin (quantity > 0) — bỏ dòng SHIPPED/0 sau outbound. */
export function filterActiveInventories(inventories: ApiInventory[]): ApiInventory[] {
  return inventories.filter((row) => Number(row.quantity) > 0)
}

export async function fetchAllWarehouseInventories(
  warehouseId: string,
  listFn: (params: {
    warehouseId: string
    page: number
    limit: number
  }) => Promise<{ items: ApiInventory[]; meta: { totalPages: number } }>
): Promise<ApiInventory[]> {
  const limit = 200
  const first = await listFn({ warehouseId, page: 1, limit })
  const all = [...first.items]
  for (let page = 2; page <= first.meta.totalPages; page += 1) {
    const next = await listFn({ warehouseId, page, limit })
    all.push(...next.items)
  }
  return all
}

export function indexInventoriesByBin(inventories: ApiInventory[]): Map<string, BinInventorySummary> {
  const map = new Map<string, BinInventorySummary>()
  for (const row of inventories) {
    if (!row.binId) continue
    const existing = map.get(row.binId)
    const qty = Number(row.quantity) || 0
    const avail = Number(row.availableQuantity ?? row.quantity) || 0
    const reserved = Number(row.reservedQuantity) || 0
    if (!existing) {
      map.set(row.binId, {
        binId: row.binId,
        binCode: row.binCode ?? '',
        lineCount: 1,
        totalQuantity: qty,
        availableQuantity: avail,
        reservedQuantity: reserved,
        skuCodes: row.sku?.skuCode ? [row.sku.skuCode] : [],
        lpnCodes: row.lpnCode ? [row.lpnCode] : [],
        rows: [row],
      })
      continue
    }
    existing.lineCount += 1
    existing.totalQuantity += qty
    existing.availableQuantity += avail
    existing.reservedQuantity += reserved
    existing.rows.push(row)
    if (row.sku?.skuCode && !existing.skuCodes.includes(row.sku.skuCode)) {
      existing.skuCodes.push(row.sku.skuCode)
    }
    if (row.lpnCode && !existing.lpnCodes.includes(row.lpnCode)) {
      existing.lpnCodes.push(row.lpnCode)
    }
  }
  return map
}

/** Bin mã `B-C01-01-L1-04` thuộc rack `R-C01-01` (seed/bulk dùng tiền tố B-). */
export function binBelongsToRack(binCode: string | undefined, rackCode: string): boolean {
  if (!binCode || !rackCode) return false
  if (binCode === rackCode || binCode.startsWith(`${rackCode}-`)) return true
  if (rackCode.startsWith('R-') && binCode.startsWith(`B-${rackCode.slice(2)}-`)) return true
  return false
}

export function matchRackCodeFromBinCode(binCode: string | undefined, racks: ApiRack[]): string | null {
  if (!binCode) return null
  const sorted = [...racks].sort((a, b) => b.rackCode.length - a.rackCode.length)
  for (const rack of sorted) {
    if (binBelongsToRack(binCode, rack.rackCode)) {
      return rack.rackCode
    }
  }
  return null
}

export function filterInventoriesForZone(
  inventories: ApiInventory[],
  racks: ApiRack[]
): ApiInventory[] {
  if (!racks.length) return []
  return inventories.filter((row) => matchRackCodeFromBinCode(row.binCode, racks) != null)
}

/** Tổng hợp theo rack từ mã bin (dùng cho sơ đồ zone khi chưa load hết bin). */
export function aggregateInventoriesByRackFromBinCodes(
  inventories: ApiInventory[],
  racks: ApiRack[]
): Map<string, RackInventorySummary> {
  const zoneInv = filterInventoriesForZone(inventories, racks)
  const byBin = indexInventoriesByBin(zoneInv)
  const map = new Map<string, RackInventorySummary>()

  for (const rack of racks) {
    map.set(rack.rackId, {
      rackId: rack.rackId,
      rackCode: rack.rackCode,
      binCount: rack.binCount ?? 0,
      binsWithStock: 0,
      lineCount: 0,
      totalQuantity: 0,
      usagePercent: 0,
    })
  }

  for (const summary of byBin.values()) {
    if (summary.totalQuantity <= 0) continue
    const rackCode = matchRackCodeFromBinCode(summary.binCode, racks)
    if (!rackCode) continue
    const rack = racks.find((r) => r.rackCode === rackCode)
    if (!rack) continue
    const agg = map.get(rack.rackId)
    if (!agg) continue
    agg.binsWithStock += 1
    agg.lineCount += summary.lineCount
    agg.totalQuantity += summary.totalQuantity
  }

  for (const agg of map.values()) {
    const binCount = agg.binCount
    agg.usagePercent =
      binCount > 0
        ? Math.min(100, Math.round((agg.binsWithStock / binCount) * 100))
        : agg.binsWithStock > 0
          ? 100
          : 0
  }

  return map
}

export function aggregateInventoriesByRack(
  inventories: ApiInventory[],
  racks: ApiRack[],
  binsByRackId: Record<string, ApiBin[]>
): Map<string, RackInventorySummary> {
  const zoneInv = filterInventoriesForZone(inventories, racks)
  const byBin = indexInventoriesByBin(zoneInv)
  const map = new Map<string, RackInventorySummary>()

  for (const rack of racks) {
    const bins = binsByRackId[rack.rackId] ?? []
    let binsWithStock = 0
    let lineCount = 0
    let totalQuantity = 0

    for (const bin of bins) {
      const summary = byBin.get(bin.binId)
      if (!summary || summary.totalQuantity <= 0) continue
      binsWithStock += 1
      lineCount += summary.lineCount
      totalQuantity += summary.totalQuantity
    }

    const binCount = bins.length || rack.binCount || 0
    const usagePercent =
      binCount > 0 ? Math.min(100, Math.round((binsWithStock / binCount) * 100)) : 0

    map.set(rack.rackId, {
      rackId: rack.rackId,
      rackCode: rack.rackCode,
      binCount,
      binsWithStock,
      lineCount,
      totalQuantity,
      usagePercent,
    })
  }

  return map
}

export function rackSeatVisualFromInventory(
  rack: ApiRack,
  summary: RackInventorySummary | undefined,
  selected: boolean
): { status: SeatVisualStatus; subLabel?: string; hint: string } {
  if (selected) {
    return {
      status: 'selected',
      hint: `${rack.rackType ?? 'STANDARD'} · ${rack.status ?? 'ACTIVE'}`,
    }
  }
  if (rack.status === 'BLOCKED') {
    return { status: 'blocked', hint: 'Rack khóa' }
  }

  const binCount = summary?.binCount ?? rack.binCount ?? 0
  const hasBins = binCount > 0 || (rack.hasBins ?? false)

  if (!hasBins) {
    return {
      status: 'rack-no-bin',
      subLabel: 'chưa bin',
      hint: `${rack.rackCode} · chưa tạo bin`,
    }
  }

  const usage = summary?.usagePercent ?? rack.usagePercent ?? 0
  const stockBins = summary?.binsWithStock ?? 0
  const qty = summary?.totalQuantity ?? 0

  let status: SeatVisualStatus = 'rack-low'
  if (usage >= 85 || stockBins === binCount && binCount > 0) status = 'rack-heavy'
  else if (usage >= 35 || stockBins > 0) status = 'rack-partial'

  return {
    status,
    subLabel: stockBins > 0 ? `${qty} cái` : 'trống',
    hint:
      stockBins > 0
        ? `${rack.rackCode} · ${stockBins}/${binCount} bin có hàng · ${qty} cái tồn`
        : `${rack.rackCode} · ${binCount} bin · chưa có tồn kho`,
  }
}

export function binSeatStatusFromInventory(
  bin: ApiBin | null,
  summary: BinInventorySummary | undefined
): SeatVisualStatus {
  if (!bin) return 'empty-bin'
  if (bin.status === 'BLOCKED') return 'blocked'
  if (bin.status === 'RESERVED') return 'reserved'

  const hasStock = (summary?.totalQuantity ?? 0) > 0
  if (!hasStock) {
    return 'empty-bin'
  }

  const maxVol = Number(bin.maxVolumeUnits) || 0
  const usedVol = Number(bin.usedVolumeUnits) || 0
  if (maxVol > 0) {
    const ratio = usedVol / maxVol
    if (ratio >= 0.95 || bin.status === 'FULL') return 'full'
    if (ratio >= 0.35) return 'partial'
    return 'partial'
  }

  return 'partial'
}
