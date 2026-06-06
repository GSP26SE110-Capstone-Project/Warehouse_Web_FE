import { RACK_FIXED_LEVEL_COUNT } from '../data/rackStructure'
import { getDefaultBinCapacity, getMaxLpnBoxTypeForZone } from '../data/binCapacityDefaults'
import { formatBoxTypeName } from '../data/lpnTerminology'
import { lpnsPerBin } from './putawayCapacity'

/** Đồng bộ với BE `warehouseCapacity.js` */
export const RACK_FOOTPRINT_M2 = 3
export const BIN_SLOT_FOOTPRINT_M2 = 0.25

/** 30% diện tích zone = lối đi xe; 70% còn lại đặt rack */
export const ZONE_AISLE_RATIO = 0.3

/** Đồng bộ BE — gợi ý số zone tối thiểu */
export const REFERENCE_ZONE_AREA_M2 = 50

/** Đồng bộ BE `pricingDefaults.js` */
export const DEFAULT_BIN_MAX_LPN_COUNT = 4

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

/** Ước tính số LPN theo max box type của zone (SHARED→EXTRA, PREMIUM/PRIVATE→LARGE). */
export function estimateMaxBoxCapacity(
  totalBinSlots: number,
  zoneType?: string | null
): number {
  if (totalBinSlots <= 0) return 0
  return totalBinSlots * maxLpnsPerBinSlot(zoneType)
}

/** @deprecated Dùng estimateMaxBoxCapacity */
export function estimateExtraBoxCapacity(
  totalBinSlots: number,
  zoneType?: string | null
): number {
  return estimateMaxBoxCapacity(totalBinSlots, zoneType)
}

function maxLpnsPerBinSlot(zoneType?: string | null): number {
  const maxBoxType = getMaxLpnBoxTypeForZone(zoneType)
  const binVolume = getDefaultBinCapacity(zoneType).maxVolumeUnits
  return lpnsPerBin(maxBoxType, binVolume)
}

export function formatZoneCapacitySummary(
  c: ZoneStorageCapacity,
  zoneType?: string | null
): string {
  if (!c.hasArea) return ''
  const maxBoxType = getMaxLpnBoxTypeForZone(zoneType)
  const maxBoxes = estimateMaxBoxCapacity(c.totalBinSlots, zoneType)
  const perBin = maxLpnsPerBinSlot(zoneType)
  const vol = getDefaultBinCapacity(zoneType).maxVolumeUnits
  const boxLabel = formatBoxTypeName(maxBoxType)
  return `${c.maxRacks} rack · ${c.binsPerLevel} bin/tầng · tối đa ~${maxBoxes.toLocaleString('vi-VN')} LPN cỡ ${boxLabel} (${perBin} LPN/ngăn · bin ${vol} vol.)`
}

/** SHARED_STORAGE cho phép ghép nhiều zone; các loại thuê khác cần zone đủ chứa toàn bộ LPN yêu cầu. */
export function allowsCombiningZonesForLpn(contractType: string): boolean {
  return contractType === 'SHARED_STORAGE'
}

export function isZoneEligibleForLpnDemand(
  zone: {
    areaM2?: number | null
    estimatedLpnCapacity?: number | null
    totalBinSlots?: number | null
    zoneType?: string | null
  },
  requiredLpn: number | null | undefined,
  contractType: string
): boolean {
  if (requiredLpn == null || requiredLpn <= 0) return true
  if (allowsCombiningZonesForLpn(contractType)) return true
  return estimateZoneLpnCapacity(zone) >= requiredLpn
}

export function zoneLpnShortfallMessage(
  zoneLpn: number,
  requiredLpn: number
): string {
  return `Không đủ sức chứa — zone ~${zoneLpn.toLocaleString('vi-VN')} thùng, tenant cần ~${requiredLpn.toLocaleString('vi-VN')} thùng`
}

/** Ước tính LPN theo loại zone (SHARED→EXTRA, PRIVATE/PREMIUM→LARGE), đồng bộ formatZoneCapacitySummary. */
export function estimateZoneLpnCapacity(zone: {
  areaM2?: number | null
  estimatedLpnCapacity?: number | null
  totalBinSlots?: number | null
  zoneType?: string | null
}): number {
  const perSlot = maxLpnsPerBinSlot(zone.zoneType)
  if (zone.totalBinSlots != null && zone.totalBinSlots > 0) {
    return zone.totalBinSlots * perSlot
  }
  const cap = computeZoneStorageCapacity(zone.areaM2)
  if (cap.totalBinSlots > 0) {
    return cap.totalBinSlots * perSlot
  }
  if (zone.estimatedLpnCapacity != null && zone.estimatedLpnCapacity > 0) {
    return zone.estimatedLpnCapacity
  }
  return 0
}

export function formatZoneRackSummary(zone: {
  rackCount?: number | null
  maxRacks?: number | null
  areaM2?: number | null
}): string {
  const actual = zone.rackCount ?? 0
  const cap = computeZoneStorageCapacity(zone.areaM2)
  const maxR = zone.maxRacks ?? cap.maxRacks
  if (maxR > 0) {
    return `${actual} rack đã tạo / tối đa ~${maxR} rack (theo ${fmtM2(Number(zone.areaM2) || 0)} m²)`
  }
  return `${actual} rack đã tạo`
}

/** Số zone tối thiểu nếu mỗi zone tối đa ~referenceLpn thùng. */
export function suggestMinZoneCountForLpnCapacity(
  requiredLpn: number,
  referenceLpnPerZone: number
): number {
  if (requiredLpn <= 0) return 0
  if (referenceLpnPerZone <= 0) return 1
  return Math.ceil(requiredLpn / referenceLpnPerZone)
}

export type MinZonesCapacityHint = {
  minZones: number
  requiredLpn: number
  referenceLpnPerZone: number
  referenceAreaM2: number | null
}

/** Gợi ý số zone tối thiểu từ danh sách zone trong kho (lấy zone có sức chứa LPN lớn nhất làm mốc 1 zone). */
export function computeMinZonesCapacityHint(
  requiredLpn: number,
  zones: Array<{ areaM2?: number | null; estimatedLpnCapacity?: number | null; totalBinSlots?: number | null }>
): MinZonesCapacityHint | null {
  if (requiredLpn <= 0 || !zones.length) return null

  let bestLpn = 0
  let bestArea: number | null = null
  for (const z of zones) {
    const lpn = estimateZoneLpnCapacity(z)
    if (lpn > bestLpn) {
      bestLpn = lpn
      const area = z.areaM2 != null ? Number(z.areaM2) : NaN
      bestArea = Number.isFinite(area) && area > 0 ? area : bestArea
    }
  }
  if (bestLpn <= 0) return null

  return {
    minZones: suggestMinZoneCountForLpnCapacity(requiredLpn, bestLpn),
    requiredLpn,
    referenceLpnPerZone: bestLpn,
    referenceAreaM2: bestArea,
  }
}

/** Chia đều số thùng/LPN cho từng zone (phần dư cộng vào zone cuối). */
export function splitReservedCapacityEvenly(
  total: number,
  zones: Array<{ zoneId: string }>
): Map<string, number> {
  const result = new Map<string, number>()
  if (!zones.length || total <= 0) return result
  const base = Math.floor(total / zones.length)
  let assigned = 0
  zones.forEach((z, i) => {
    if (i === zones.length - 1) {
      result.set(z.zoneId, Math.max(0, total - assigned))
    } else {
      result.set(z.zoneId, base)
      assigned += base
    }
  })
  return result
}

/** Chia dung lượng giữ (thùng/LPN) theo tỷ lệ sức chứa từng zone. */
export function splitReservedCapacityAcrossZones(
  total: number,
  zones: Array<{ zoneId: string; estimatedLpnCapacity?: number | null; areaM2?: number | null }>
): Map<string, number> {
  const result = new Map<string, number>()
  if (!zones.length || total <= 0) return result

  const weights = zones.map((z) => Math.max(1, estimateZoneLpnCapacity(z)))
  const weightSum = weights.reduce((a, b) => a + b, 0)
  let assigned = 0

  zones.forEach((z, i) => {
    if (i === zones.length - 1) {
      result.set(z.zoneId, Math.max(0, total - assigned))
      return
    }
    const share = Math.floor((total * weights[i]) / weightSum)
    result.set(z.zoneId, share)
    assigned += share
  })

  return result
}
