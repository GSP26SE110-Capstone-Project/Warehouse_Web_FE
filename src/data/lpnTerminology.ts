/**
 * Thuật ngữ UI: 1 LPN = 1 thùng/pallet có nhãn khi nhập kho.
 * Dùng "LPN" thống nhất thay vì xen kẽ LPN / thùng.
 */

export const LPN_SIZE_LABELS: Record<string, string> = {
  SMALL: 'Nhỏ (S)',
  MEDIUM: 'Vừa (M)',
  LARGE: 'Large',
  EXTRA: 'Extra',
}

export const CONTRACT_ITEM_TYPE_LABELS: Record<string, string> = {
  INBOUND: 'Nhập kho',
  STORAGE: 'Lưu kho',
  HANDLING: 'Xử lý hàng',
}

/** Nhãn đơn vị tính trên bảng giá HĐ (billing_unit trong DB giữ nguyên). */
export const CONTRACT_BILLING_UNIT_LABELS: Record<string, string> = {
  INBOUND_LPN: 'LPN/lần nhập',
  OUTBOUND_LPN: 'LPN/lần xuất',
  BOX_DAY: 'LPN/ngày',
  BIN_DAY: 'Bin/ngày',
  RACK_DAY: 'Rack/ngày',
  ZONE_DAY: 'Zone/ngày',
  WAREHOUSE_DAY: 'Kho/ngày',
  HANDLING_UNIT: 'Đơn vị xử lý',
}

export const LPN_SIZE_COLUMN_HEADER = 'Kích cỡ LPN'

export function formatLpnSize(boxType: string | null | undefined): string {
  if (!boxType) return '—'
  return LPN_SIZE_LABELS[boxType] ?? boxType
}

/** Tên loại thùng tiếng Anh (Small, Medium, Large, Extra) — dùng trong ước tính inbound. */
export const LPN_BOX_TYPE_NAMES: Record<string, string> = {
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
  EXTRA: 'Extra',
}

export function formatBoxTypeName(boxType: string | null | undefined): string {
  if (!boxType) return '—'
  return LPN_BOX_TYPE_NAMES[boxType] ?? boxType
}

export function formatLpnCount(count: number): string {
  return `${count.toLocaleString('vi-VN')} LPN`
}
