export const MOVEMENT_CATEGORY_OPTIONS = [
  { value: 'FAST', label: 'Đi nhanh' },
  { value: 'NORMAL', label: 'Bình thường' },
  { value: 'SLOW', label: 'Chậm' },
] as const

export const SKU_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang bán / active' },
  { value: 'INACTIVE', label: 'Ngừng' },
] as const

export const MOVEMENT_LABELS: Record<string, string> = Object.fromEntries(
  MOVEMENT_CATEGORY_OPTIONS.map((o) => [o.value, o.label])
)
