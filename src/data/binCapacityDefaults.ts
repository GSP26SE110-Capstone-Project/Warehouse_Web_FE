/** Mặc định sức chứa bin theo loại zone (capstone / kho quần áo). */
export type BinCapacityPreset = {
  maxLpnCount: number
  maxVolumeUnits: number
  note: string
}

const PRESETS: Record<string, BinCapacityPreset> = {
  FAST_MOVING: {
    maxLpnCount: 3,
    maxVolumeUnits: 6,
    note: 'Ít chồng — pick nhanh',
  },
  SHARED: {
    maxLpnCount: 4,
    maxVolumeUnits: 16,
    note: 'Chuẩn chung — tối đa 2 EXTRA/bin (8+8 volume)',
  },
  PREMIUM: {
    maxLpnCount: 2,
    maxVolumeUnits: 4,
    note: 'Hàng giá trị cao, ít chồng',
  },
  RETURN: {
    maxLpnCount: 4,
    maxVolumeUnits: 16,
    note: 'Giống shared',
  },
}

const FALLBACK = PRESETS.SHARED

export function getDefaultBinCapacity(zoneType?: string | null): BinCapacityPreset {
  if (!zoneType) return FALLBACK
  return PRESETS[zoneType] ?? FALLBACK
}
