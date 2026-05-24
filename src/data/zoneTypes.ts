export const ZONE_TYPE_OPTIONS = [
  { value: 'SHARED', label: 'Chia sẻ (SHARED)' },
  { value: 'FAST_MOVING', label: 'Hàng đi nhanh' },
  { value: 'BULK', label: 'Hàng khối / bulk' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'QC', label: 'Kiểm tra chất lượng' },
  { value: 'RETURN', label: 'Hàng trả' },
] as const

export const ZONE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'BLOCKED', label: 'Khóa' },
] as const

export const ZONE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ZONE_TYPE_OPTIONS.map((o) => [o.value, o.label])
)
