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

export function getDefaultBinCapacity(zoneType?: string | null): BinCapacityPreset {
  if (!zoneType) return FALLBACK
  return PRESETS[zoneType] ?? FALLBACK
}
