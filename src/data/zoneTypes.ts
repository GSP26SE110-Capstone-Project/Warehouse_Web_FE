export const ZONE_TYPE_OPTIONS = [
  { value: 'SHARED', label: 'Chia sẻ' },
  { value: 'FAST_MOVING', label: 'Hàng đi nhanh' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'PRIVATE', label: 'Khu riêng' },
] as const

export const ZONE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'BLOCKED', label: 'Khóa' },
] as const

export const ZONE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ZONE_TYPE_OPTIONS.map((o) => [o.value, o.label])
)
