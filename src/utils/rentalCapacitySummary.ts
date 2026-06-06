import type { ApiBoxAllocationRow, ApiRentalProductLine } from '../api/types'
import { formatLpnSize } from '../data/lpnTerminology'

export function parsePiecesPerMonthFromNotes(notes?: string | null): number | null {
  if (!notes) return null
  const match = notes.match(/Tổng cái\/tháng \(ước tính\):\s*([\d.,]+)/i)
  if (!match) return null
  const normalized = match[1].replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) && n > 0 ? n : null
}

export type RentalCapacityInput = {
  totalCommittedVolumeUnits?: number | string | null
  boxAllocation?: ApiBoxAllocationRow[] | null
  boxAllocationJson?: ApiBoxAllocationRow[] | null
  estimatedBoxCount?: number | null
  estimatedSkuCount?: number | null
  requestedAreaM2?: number | null
  notes?: string | null
  productLines?: ApiRentalProductLine[] | null
}

function resolveBoxAllocation(item: RentalCapacityInput): ApiBoxAllocationRow[] {
  if (item.boxAllocation?.length) return item.boxAllocation
  if (Array.isArray(item.boxAllocationJson)) return item.boxAllocationJson
  return []
}

function formatRentalBoxAllocation(allocation: ApiBoxAllocationRow[]): string {
  return allocation
    .map((row) => `${row.count.toLocaleString('vi-VN')} thùng ${formatLpnSize(row.boxType)}`)
    .join(' + ')
}

export function formatRentalBoxAllocationSummary(
  allocation: ApiBoxAllocationRow[] | null | undefined
): string | null {
  const rows = allocation?.filter((row) => row.count > 0) ?? []
  return rows.length ? formatRentalBoxAllocation(rows) : null
}

function formatEstimatedBoxes(item: RentalCapacityInput): string | null {
  const allocation = resolveBoxAllocation(item)
  if (allocation.length) return formatRentalBoxAllocation(allocation)
  if (item.estimatedBoxCount != null && item.estimatedBoxCount > 0) {
    return `~${item.estimatedBoxCount.toLocaleString('vi-VN')} thùng`
  }
  return null
}

export function formatRentalProductLineLabel(line: ApiRentalProductLine): string {
  const sizePart = line.size?.trim() ? ` · ${line.size.trim()}` : ''
  return `${line.productKind}${sizePart} · ${line.quantity.toLocaleString('vi-VN')} cái/tháng`
}

export function formatRentalCapacitySummary(item: RentalCapacityInput): string {
  const totalU =
    item.totalCommittedVolumeUnits != null ? Number(item.totalCommittedVolumeUnits) : 0
  if (totalU > 0) {
    const parts = [`${totalU.toLocaleString('vi-VN')} U`]
    const boxLabel = formatEstimatedBoxes(item)
    if (boxLabel) parts.push(boxLabel)
    return parts.join(' · ')
  }

  const pieces =
    parsePiecesPerMonthFromNotes(item.notes) ??
    (item.estimatedSkuCount != null && item.estimatedSkuCount > 0 ? item.estimatedSkuCount : null)
  const parts: string[] = []
  if (pieces != null) {
    parts.push(`${pieces.toLocaleString('vi-VN')} cái/tháng`)
  }
  const boxLabel = formatEstimatedBoxes(item)
  if (boxLabel) parts.push(boxLabel)
  if (item.requestedAreaM2 != null && item.requestedAreaM2 > 0) {
    parts.push(`${item.requestedAreaM2.toLocaleString('vi-VN')} m²`)
  }
  return parts.length ? parts.join(' · ') : '—'
}

export function hasRentalCapacityData(item: RentalCapacityInput): boolean {
  return (item.productLines?.length ?? 0) > 0 || formatRentalCapacitySummary(item) !== '—'
}

/** Nhãn dung lượng giữ chỗ trên HĐ — ưu tiên loại thùng nếu có phân bổ từ yêu cầu thuê. */
export function formatReservedCapacityLabel(
  reservedCapacity: number,
  boxAllocation?: ApiBoxAllocationRow[] | null
): string {
  if (reservedCapacity <= 0) return ''
  const boxLabel = formatRentalBoxAllocationSummary(boxAllocation)
  if (boxLabel) {
    const allocTotal = (boxAllocation ?? []).reduce((sum, row) => sum + row.count, 0)
    if (allocTotal === reservedCapacity) {
      return `Giữ ${boxLabel}`
    }
    return `Giữ ~${reservedCapacity.toLocaleString('vi-VN')} LPN (${boxLabel})`
  }
  return `Giữ ~${reservedCapacity.toLocaleString('vi-VN')} LPN`
}
