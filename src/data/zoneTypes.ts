export const ZONE_TYPE_OPTIONS = [
  { value: 'SHARED', label: 'Chia sẻ' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'PRIVATE', label: 'Khu riêng' },
] as const

export type ActiveZoneType = (typeof ZONE_TYPE_OPTIONS)[number]['value']

/** Loại zone đã bỏ — không hiển thị trong dropdown tạo/sửa. */
export const DEPRECATED_ZONE_TYPES = ['FAST_MOVING', 'BULK', 'QC', 'RETURN'] as const

export const ZONE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'BLOCKED', label: 'Khóa' },
] as const

export const ZONE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ZONE_TYPE_OPTIONS.map((o) => [o.value, o.label])
)

/** Chuẩn hóa zone type cũ (vd. FAST_MOVING) về loại còn dùng. */
export function normalizeZoneType(zoneType?: string | null): ActiveZoneType {
  const key = String(zoneType ?? 'SHARED').toUpperCase()
  if (key === 'PRIVATE' || key === 'PREMIUM') return key
  return 'SHARED'
}

export function zoneTypeLabel(zoneType?: string | null): string {
  return ZONE_TYPE_LABELS[normalizeZoneType(zoneType)] ?? normalizeZoneType(zoneType)
}
