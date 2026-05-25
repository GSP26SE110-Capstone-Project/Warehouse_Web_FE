import { RACK_FIXED_LEVEL_COUNT } from '../data/rackStructure'

/** Đồng bộ với BE `warehouseCapacity.js` */
export const RACK_FOOTPRINT_M2 = 3
export const BIN_SLOT_FOOTPRINT_M2 = 0.25

/** 30% diện tích zone = lối đi xe; 70% còn lại đặt rack */
export const ZONE_AISLE_RATIO = 0.3

export type ZoneStorageCapacity = {
  hasArea: boolean
  areaM2: number | null
  aisleAreaM2: number
  storageAreaM2: number
  aisleRatio: number
  maxRacks: number
  binsPerLevel: number
  totalBinSlots: number
}

export function computeZoneStorageCapacity(areaM2?: number | null): ZoneStorageCapacity {
  const area = areaM2 != null ? Number(areaM2) : NaN
  if (!Number.isFinite(area) || area <= 0) {
    return {
      hasArea: false,
      areaM2: areaM2 ?? null,
      aisleAreaM2: 0,
      storageAreaM2: 0,
      aisleRatio: ZONE_AISLE_RATIO,
      maxRacks: 0,
      binsPerLevel: 0,
      totalBinSlots: 0,
    }
  }

  const aisleAreaM2 = area * ZONE_AISLE_RATIO
  const storageAreaM2 = area - aisleAreaM2

  const maxRacks = Math.floor(storageAreaM2 / RACK_FOOTPRINT_M2)
  const totalBinSlots = Math.floor(storageAreaM2 / BIN_SLOT_FOOTPRINT_M2)
  const binsPerLevel =
    maxRacks > 0
      ? Math.max(1, Math.floor(totalBinSlots / (maxRacks * RACK_FIXED_LEVEL_COUNT)))
      : 0

  return {
    hasArea: true,
    areaM2: area,
    aisleAreaM2,
    storageAreaM2,
    aisleRatio: ZONE_AISLE_RATIO,
    maxRacks,
    binsPerLevel,
    totalBinSlots,
  }
}

function fmtM2(n: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(n)
}

export function formatZoneCapacitySummary(c: ZoneStorageCapacity): string {
  if (!c.hasArea) return ''
  const pct = Math.round(c.aisleRatio * 100)
  return `${c.maxRacks} rack · ${c.binsPerLevel} bin/tầng · ${c.totalBinSlots} ô (sau trừ ${pct}% lối đi ≈ ${fmtM2(c.storageAreaM2)} m² đặt rack)`
}
