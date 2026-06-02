/** Mặc định sức chứa bin theo loại zone (capstone / kho quần áo). */
export type BinCapacityPreset = {
  maxLpnCount: number
  maxVolumeUnits: number
  note: string
}

/**
 * Quy ước thiết kế: `maxLpnCount = maxVolumeUnits` để LPN count không phải là constraint
 * (mỗi SMALL = 1 volume unit, nên upper bound vật lý của số LPN = số volume units).
 * Bin chỉ bị chặn bởi volume → tenant nhập nhiều box nhỏ vẫn tận dụng đầy bin.
 */
const PRESETS: Record<string, BinCapacityPreset> = {
  FAST_MOVING: {
    maxLpnCount: 6,
    maxVolumeUnits: 6,
    note: 'Pick nhanh — tối đa 6 SMALL / 3 MEDIUM / 1 LARGE+1 MEDIUM',
  },
  SHARED: {
    maxLpnCount: 16,
    maxVolumeUnits: 16,
    note: 'Chuẩn chung — 2 EXTRA / 4 LARGE / 8 MEDIUM / 16 SMALL (chặn bởi volume)',
  },
  PREMIUM: {
    maxLpnCount: 4,
    maxVolumeUnits: 4,
    note: 'Hàng giá trị cao — 1 LARGE / 2 MEDIUM / 4 SMALL',
  },
  PRIVATE: {
    maxLpnCount: 16,
    maxVolumeUnits: 16,
    note: 'Khu riêng tenant — cùng chuẩn bin SHARED (2 EXTRA / 4 LARGE / 8 MEDIUM / 16 SMALL)',
  },
}

const FALLBACK = PRESETS.SHARED

export type LpnBoxType = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA'

const LPN_BOX_VOLUME: Record<LpnBoxType, number> = {
  SMALL: 1,
  MEDIUM: 2,
  LARGE: 4,
  EXTRA: 8,
}

/** LPN box type lớn nhất mà bin mặc định của zone chứa được (theo maxVolumeUnits). */
export function getMaxLpnBoxTypeForZone(zoneType?: string | null): LpnBoxType {
  const vol = getDefaultBinCapacity(zoneType).maxVolumeUnits
  const order: LpnBoxType[] = ['EXTRA', 'LARGE', 'MEDIUM', 'SMALL']
  for (const type of order) {
    if (vol >= LPN_BOX_VOLUME[type]) return type
  }
  return 'SMALL'
}

/** Loại thùng lớn nhất trong các zone được cấp (đồng bộ BE pickLargestBoxTypeForZoneTypes). */
export function pickLargestBoxTypeForZoneTypes(zoneTypes?: string[] | null): LpnBoxType {
  const types = zoneTypes?.length ? zoneTypes : ['SHARED']
  let best: LpnBoxType = 'SMALL'
  let bestVol = 0
  for (const zt of types) {
    const t = getMaxLpnBoxTypeForZone(zt)
    const vol = LPN_BOX_VOLUME[t]
    if (vol > bestVol) {
      bestVol = vol
      best = t
    }
  }
  return best
}

export function lpnBoxVolumeUnits(boxType: LpnBoxType | string): number {
  return LPN_BOX_VOLUME[boxType as LpnBoxType] ?? 1
}

export function isBoxTypeWithinMax(
  boxType: string,
  maxBoxType: LpnBoxType | string
): boolean {
  return lpnBoxVolumeUnits(boxType) <= lpnBoxVolumeUnits(maxBoxType)
}

export function getDefaultBinCapacity(zoneType?: string | null): BinCapacityPreset {
  if (!zoneType) return FALLBACK
  return PRESETS[zoneType] ?? FALLBACK
}
