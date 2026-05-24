/** Mỗi rack cố định 3 tầng — phù hợp kho quần áo */
export const RACK_FIXED_LEVEL_COUNT = 3

/** Chỉ dùng rack tiêu chuẩn (quần áo) */
export const RACK_FIXED_TYPE = 'STANDARD' as const

export const RACK_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'BLOCKED', label: 'Khóa' },
] as const

export const BIN_STATUS_LABELS: Record<string, string> = {
  EMPTY: 'Trống',
  PARTIAL: 'Một phần',
  FULL: 'Đầy',
  RESERVED: 'Giữ chỗ',
  BLOCKED: 'Khóa',
}

export const RESERVATION_TYPE_LABELS: Record<string, string> = {
  SHARED: 'Chia sẻ',
  RESERVED: 'Giữ riêng',
  DEDICATED: 'Dedicated',
}
