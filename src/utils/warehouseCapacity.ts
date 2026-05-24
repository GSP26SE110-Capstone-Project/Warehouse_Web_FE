import { RACK_FIXED_LEVEL_COUNT } from '../data/rackStructure'

/** Đồng bộ với BE `warehouseCapacity.js` */
export const RACK_FOOTPRINT_M2 = 3
export const BIN_SLOT_FOOTPRINT_M2 = 0.25

export type ZoneStorageCapacity = {
  hasArea: boolean
  areaM2: number | null
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
      maxRacks: 0,
      binsPerLevel: 0,
      totalBinSlots: 0,
    }
  }

  const maxRacks = Math.floor(area / RACK_FOOTPRINT_M2)
  const totalBinSlots = Math.floor(area / BIN_SLOT_FOOTPRINT_M2)
  const binsPerLevel =
    maxRacks > 0
      ? Math.max(1, Math.floor(totalBinSlots / (maxRacks * RACK_FIXED_LEVEL_COUNT)))
      : 0

  return {
    hasArea: true,
    areaM2: area,
    maxRacks,
    binsPerLevel,
    totalBinSlots,
  }
}
