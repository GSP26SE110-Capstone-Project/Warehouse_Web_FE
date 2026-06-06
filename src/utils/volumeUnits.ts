import type { ApiProductKind, ApiSizeFactor } from '../api/productCatalog'

export const BOX_VOLUME_UNITS = {
  SMALL: 1,
  MEDIUM: 2,
  LARGE: 4,
  EXTRA: 8,
} as const

export type BoxType = keyof typeof BOX_VOLUME_UNITS

const BOX_ORDER: BoxType[] = ['EXTRA', 'LARGE', 'MEDIUM', 'SMALL']

export interface BoxAllocationRow {
  boxType: BoxType
  count: number
}

export interface ComputedProductLine {
  productKind: string
  displayName: string
  size: string | null
  sizeGroup: string
  quantity: number
  baseVolumeUnitsPerPiece: number
  sizeFactor: number
  finalVolumeUnitsPerPiece: number
  lineVolumeUnits: number
}

export interface ProductLinesSummary {
  lines: ComputedProductLine[]
  totalCommittedVolumeUnits: number
  boxAllocation: BoxAllocationRow[]
  estimatedBoxCount: number
  /** Tổng số cái cam kết (sum quantity các dòng SP), không phải số mã SKU. */
  estimatedSkuCount: number
}

export function roundVolumeUnits(value: number, decimals = 3) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function buildSizeToGroupMap(sizeFactors: ApiSizeFactor[]) {
  const map = new Map<string, { sizeGroup: string; factor: number }>()
  for (const row of sizeFactors) {
    const factor = Number(row.factor)
    for (const size of row.sizes ?? []) {
      map.set(String(size).trim().toUpperCase(), {
        sizeGroup: row.sizeGroup,
        factor,
      })
    }
  }
  return map
}

export function buildFlatSizeOptions(sizeFactors: ApiSizeFactor[]) {
  const options: { value: string; label: string; sizeGroup: string }[] = []
  for (const row of sizeFactors) {
    for (const size of row.sizes ?? []) {
      options.push({
        value: size,
        label: `${size} (${row.displayLabel})`,
        sizeGroup: row.sizeGroup,
      })
    }
  }
  return options
}

function allocateBoxesWithAllowed(allowed: BoxType[], totalU: number): BoxAllocationRow[] {
  let remaining = roundVolumeUnits(Number(totalU))
  if (!Number.isFinite(remaining) || remaining <= 0) return []

  const allocation: Partial<Record<BoxType, number>> = {}
  const floorTypes = allowed.filter((t) => t !== 'SMALL')

  for (const boxType of floorTypes) {
    const vol = BOX_VOLUME_UNITS[boxType]
    const count = Math.floor(remaining / vol)
    if (count > 0) {
      allocation[boxType] = count
      remaining = roundVolumeUnits(remaining - count * vol)
    }
  }

  if (remaining > 0) {
    const ascending = [...allowed].reverse()
    let picked = false
    for (const boxType of ascending) {
      const vol = BOX_VOLUME_UNITS[boxType]
      if (vol >= remaining) {
        allocation[boxType] = (allocation[boxType] ?? 0) + 1
        picked = true
        break
      }
    }
    if (!picked && allowed.includes('EXTRA')) {
      allocation.EXTRA = (allocation.EXTRA ?? 0) + 1
    }
  }

  return BOX_ORDER.filter((t) => (allocation[t] ?? 0) > 0).map((boxType) => ({
    boxType,
    count: allocation[boxType]!,
  }))
}

export function allocateBoxes(totalU: number): BoxAllocationRow[] {
  return allocateBoxesWithAllowed(BOX_ORDER, totalU)
}

/** Phân bổ thùng theo tổng U, chỉ dùng các loại ≤ maxBoxType (vd. Premium → tối đa Large). */
export function allocateBoxesUpTo(maxBoxType: BoxType, totalU: number): BoxAllocationRow[] {
  const maxIdx = BOX_ORDER.indexOf(maxBoxType)
  const allowed = maxIdx >= 0 ? BOX_ORDER.slice(maxIdx) : [...BOX_ORDER]
  return allocateBoxesWithAllowed(allowed, totalU)
}

export function formatBoxAllocation(
  allocation: Array<{ boxType: string; count: number }>,
  formatTypeName: (boxType: string) => string = (t) => t
) {
  if (!allocation.length) return '—'
  return allocation.map((row) => `${row.count} ${formatTypeName(row.boxType)}`).join(' + ')
}

export function formatBoxAllocationVi(allocation: Array<{ boxType: string; count: number }>) {
  if (!allocation.length) return '—'
  return allocation
    .map(
      (row) => `${row.count.toLocaleString('vi-VN')} thùng ${row.boxType.toLowerCase()}`
    )
    .join(' + ')
}

/** Số thùng nếu dùng duy nhất một loại box (làm tròn lên). */
export function pureBoxCount(totalU: number, boxType: BoxType): number {
  const vol = BOX_VOLUME_UNITS[boxType]
  if (!Number.isFinite(totalU) || totalU <= 0) return 0
  return Math.ceil(totalU / vol)
}

export function boxCountsByType(allocation: BoxAllocationRow[]): Record<BoxType, number> {
  const counts: Record<BoxType, number> = { EXTRA: 0, LARGE: 0, MEDIUM: 0, SMALL: 0 }
  for (const row of allocation) {
    counts[row.boxType] = row.count
  }
  return counts
}

export interface SkuVolumeUnitsBreakdown {
  finalVolumeUnitsPerPiece: number
  baseVolumeUnitsPerPiece: number
  sizeFactor: number
  displayName?: string
}

/** U/cái theo productKind + size (cùng công thức rental). */
export function resolveSkuFinalVolumeUnitsPerPiece(
  productKind: string | null | undefined,
  size: string | null | undefined,
  catalogByKind: Map<string, ApiProductKind>,
  sizeFactors: ApiSizeFactor[]
): SkuVolumeUnitsBreakdown | null {
  if (!productKind) return null
  const kind =
    catalogByKind.get(productKind) ??
    catalogByKind.get(String(productKind).trim().toUpperCase())
  if (!kind) return null

  const baseU = roundVolumeUnits(Number(kind.baseVolumeUnitsPerPiece))
  if (!Number.isFinite(baseU) || baseU <= 0) return null

  let sizeFactor = 1
  if (kind.hasSize !== false) {
    const normalizedSize = String(size ?? '').trim().toUpperCase()
    if (normalizedSize) {
      const sizeMap = buildSizeToGroupMap(sizeFactors)
      const resolved = sizeMap.get(normalizedSize)
      if (!resolved) return null
      sizeFactor = resolved.factor
    }
  }

  return {
    finalVolumeUnitsPerPiece: roundVolumeUnits(baseU * sizeFactor),
    baseVolumeUnitsPerPiece: baseU,
    sizeFactor,
    displayName: kind.displayName,
  }
}

export interface PiecesPerLpnResult {
  pieces: number
  boxVolumeUnits: number
  skuVolume: SkuVolumeUnitsBreakdown | null
  usedLegacyFallback: boolean
}

/** Số cái tối đa/LPN = floor(volumeUnits(boxType) / U/cái). */
export function computePiecesPerLpnForSku(
  boxType: BoxType | string,
  productKind: string | null | undefined,
  size: string | null | undefined,
  catalogByKind: Map<string, ApiProductKind>,
  sizeFactors: ApiSizeFactor[]
): PiecesPerLpnResult {
  const boxVolumeUnits = BOX_VOLUME_UNITS[boxType as BoxType] ?? 2
  const skuVolume = resolveSkuFinalVolumeUnitsPerPiece(
    productKind,
    size,
    catalogByKind,
    sizeFactors
  )

  if (skuVolume && skuVolume.finalVolumeUnitsPerPiece > 0) {
    return {
      pieces: Math.max(1, Math.floor(boxVolumeUnits / skuVolume.finalVolumeUnitsPerPiece)),
      boxVolumeUnits,
      skuVolume,
      usedLegacyFallback: false,
    }
  }

  return {
    pieces: Math.max(1, Math.round(25 * (boxVolumeUnits / 2))),
    boxVolumeUnits,
    skuVolume: null,
    usedLegacyFallback: true,
  }
}

export function buildProductKindMap(productKinds: ApiProductKind[]) {
  const map = new Map<string, ApiProductKind>()
  for (const kind of productKinds) {
    map.set(kind.productKind, kind)
    map.set(kind.productKind.toUpperCase(), kind)
  }
  return map
}

export function maxBoxTypeForDedicatedZonePreference(
  zoneType?: 'PRIVATE' | 'PREMIUM' | '' | null
): BoxType | undefined {
  if (zoneType === 'PRIVATE') return 'EXTRA'
  if (zoneType === 'PREMIUM') return 'LARGE'
  return undefined
}

export function dedicatedZoneBoxAllocationHint(
  zoneType?: 'PRIVATE' | 'PREMIUM' | '' | null
): string | null {
  if (zoneType === 'PRIVATE') return 'Private Zone · tối đa thùng Extra'
  if (zoneType === 'PREMIUM') return 'Premium Zone · tối đa thùng Large'
  return null
}

export function computeProductLinesSummary(
  drafts: Array<{ productKind: string; size: string; quantity: number }>,
  catalogByKind: Map<string, ApiProductKind>,
  sizeFactors: ApiSizeFactor[],
  maxBoxType?: BoxType | null
): ProductLinesSummary | null {
  if (!drafts.length) return null

  const sizeMap = buildSizeToGroupMap(sizeFactors)
  const lines: ComputedProductLine[] = []

  for (const draft of drafts) {
    const kind = catalogByKind.get(draft.productKind)
    if (!kind) return null

    const quantity = Number(draft.quantity)
    if (!Number.isInteger(quantity) || quantity <= 0) return null

    const baseU = roundVolumeUnits(Number(kind.baseVolumeUnitsPerPiece))
    let sizeGroup = 'M_L'
    let sizeFactor = 1
    let size: string | null = null

    if (kind.hasSize !== false) {
      const normalizedSize = String(draft.size ?? '').trim().toUpperCase()
      const resolved = sizeMap.get(normalizedSize)
      if (!resolved) return null
      sizeGroup = resolved.sizeGroup
      sizeFactor = resolved.factor
      size = normalizedSize
    }

    const finalU = roundVolumeUnits(baseU * sizeFactor)
    const lineU = roundVolumeUnits(finalU * quantity)

    lines.push({
      productKind: kind.productKind,
      displayName: kind.displayName,
      size,
      sizeGroup,
      quantity,
      baseVolumeUnitsPerPiece: baseU,
      sizeFactor,
      finalVolumeUnitsPerPiece: finalU,
      lineVolumeUnits: lineU,
    })
  }

  const totalCommittedVolumeUnits = roundVolumeUnits(
    lines.reduce((sum, line) => sum + line.lineVolumeUnits, 0)
  )
  const boxAllocation = maxBoxType
    ? allocateBoxesUpTo(maxBoxType, totalCommittedVolumeUnits)
    : allocateBoxes(totalCommittedVolumeUnits)

  return {
    lines,
    totalCommittedVolumeUnits,
    boxAllocation,
    estimatedBoxCount: boxAllocation.reduce((sum, row) => sum + row.count, 0),
    estimatedSkuCount: lines.reduce((sum, line) => sum + line.quantity, 0),
  }
}
