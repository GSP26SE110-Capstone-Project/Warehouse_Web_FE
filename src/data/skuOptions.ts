export const MOVEMENT_CATEGORY_OPTIONS = [
  { value: 'FAST', label: 'Đi nhanh' },
  { value: 'NORMAL', label: 'Bình thường' },
  { value: 'SLOW', label: 'Chậm' },
] as const

export const SKU_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng' },
] as const

export const MOVEMENT_LABELS: Record<string, string> = Object.fromEntries(
  MOVEMENT_CATEGORY_OPTIONS.map((o) => [o.value, o.label])
)

/** Size cố định (hướng A) — lưu giá trị string trên cột `skus.size` */
export const SIZE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'XXS', label: 'XXS' },
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
  { value: '3XL', label: '3XL' },
  { value: 'FREE', label: 'Free size' },
] as const
