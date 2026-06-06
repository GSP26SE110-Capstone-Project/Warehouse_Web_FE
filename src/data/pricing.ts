export type PricingTier = {
  name: string
  label: string
  price: number
  unit: string
  description?: string
  icon: string
  highlight?: boolean
}

export const WAREHOUSE_PRICING: PricingTier = {
  name: 'DEDICATED_WAREHOUSE',
  label: 'Thuê nguyên kho',
  price: 180_000,
  unit: 'm²/tháng',
  description: 'Thuê toàn bộ warehouse theo diện tích. Ví dụ: 500m² × 180.000 = 90 triệu/tháng.',
  icon: 'warehouse',
  highlight: true,
}

export const ZONE_PRICING: PricingTier[] = [
  {
    name: 'PREMIUM',
    label: 'Premium Zone',
    price: 250_000,
    unit: 'm²/tháng',
    description: 'Khu premium với kiểm soát môi trường & bảo mật cao',
    icon: 'diamond',
  },
  {
    name: 'PRIVATE',
    label: 'Private Zone',
    price: 200_000,
    unit: 'm²/tháng',
    description: 'Khu riêng dành riêng cho tenant, tách biệt khu chia sẻ',
    icon: 'lock',
  },
]

export const RACK_PRICING: PricingTier[] = [
  {
    name: 'STANDARD',
    label: 'Standard Rack',
    price: 120_000,
    unit: 'rack/ngày',
    description: 'Đơn giá RACK_DAY — tổng phí kỳ = đơn giá × số rack-day; hóa đơn tổng hợp theo tháng/năm',
    icon: 'shelves',
  },
]

export const RACK_LEVEL_PRICING: PricingTier[] = [
  {
    name: 'LOWER',
    label: 'Tầng dưới',
    price: 60_000,
    unit: 'level/ngày',
    description: 'Dễ pick, thuận tiện thao tác — đơn giá theo ngày',
    icon: 'arrow_downward',
  },
  {
    name: 'MIDDLE',
    label: 'Tầng giữa',
    price: 50_000,
    unit: 'level/ngày',
    description: 'Cân bằng giữa chi phí và thao tác — đơn giá theo ngày',
    icon: 'drag_handle',
  },
  {
    name: 'UPPER',
    label: 'Tầng trên',
    price: 40_000,
    unit: 'level/ngày',
    description: 'Chi phí thấp nhất, phù hợp hàng ít luân chuyển — đơn giá theo ngày',
    icon: 'arrow_upward',
  },
]

/** Đồng bộ BE STORAGE_BOX_MONTH_PRICE_BY_BOX_TYPE */
export const STORAGE_BOX_MONTH_BY_TYPE = {
  SMALL: 10_000,
  MEDIUM: 15_000,
  LARGE: 25_000,
  EXTRA: 45_000,
} as const

export const DAYS_PER_BILLING_MONTH = 30

export const BIN_PRICING: PricingTier[] = [
  {
    name: 'SMALL',
    label: 'Small Box',
    price: Math.round(STORAGE_BOX_MONTH_BY_TYPE.SMALL / DAYS_PER_BILLING_MONTH),
    unit: 'box/ngày',
    description: 'Thùng nhỏ, hàng nhẹ — prorate từ 10.000 ₫/thùng/tháng',
    icon: 'inventory',
  },
  {
    name: 'MEDIUM',
    label: 'Medium Box',
    price: Math.round(STORAGE_BOX_MONTH_BY_TYPE.MEDIUM / DAYS_PER_BILLING_MONTH),
    unit: 'box/ngày',
    description: 'Phổ biến nhất — prorate từ 15.000 ₫/thùng/tháng',
    icon: 'package_2',
    highlight: true,
  },
  {
    name: 'LARGE',
    label: 'Large Box',
    price: Math.round(STORAGE_BOX_MONTH_BY_TYPE.LARGE / DAYS_PER_BILLING_MONTH),
    unit: 'box/ngày',
    description: 'Thùng lớn, hàng cồng kềnh — prorate từ 25.000 ₫/thùng/tháng',
    icon: 'package',
  },
  {
    name: 'EXTRA',
    label: 'Extra Box',
    price: Math.round(STORAGE_BOX_MONTH_BY_TYPE.EXTRA / DAYS_PER_BILLING_MONTH),
    unit: 'box/ngày',
    description: 'Pallet/thùng đặc biệt — prorate từ 45.000 ₫/thùng/tháng',
    icon: 'deployed_code',
  },
]

export const HANDLING_FEES = [
  { operation: 'Inbound LPN (SMALL / MEDIUM / LARGE / EXTRA)', fee: '2k / 3k / 5k / 8k ₫' },
  { operation: 'Outbound LPN (cùng bảng inbound)', fee: '2k / 3k / 5k / 8k ₫' },
  { operation: 'Vận chuyển kho (WAREHOUSE_TRANSPORT)', fee: '250.000 ₫ / chuyến' },
  { operation: 'Repacking', fee: '10.000 ₫' },
  { operation: 'QC Inspection', fee: '5.000 ₫' },
  { operation: 'Relocation', fee: '3.000 ₫' },
]

export const BOX_MONTH_PRICING: PricingTier[] = [
  {
    name: 'SMALL',
    label: 'Thùng nhỏ (Small)',
    price: STORAGE_BOX_MONTH_BY_TYPE.SMALL,
    unit: 'thùng/tháng',
    description: 'Hàng nhẹ, volume 1U',
    icon: 'inventory',
  },
  {
    name: 'MEDIUM',
    label: 'Thùng trung (Medium)',
    price: STORAGE_BOX_MONTH_BY_TYPE.MEDIUM,
    unit: 'thùng/tháng',
    description: 'Phổ biến nhất cho lưu hàng linh hoạt',
    icon: 'package_2',
    highlight: true,
  },
  {
    name: 'LARGE',
    label: 'Thùng lớn (Large)',
    price: STORAGE_BOX_MONTH_BY_TYPE.LARGE,
    unit: 'thùng/tháng',
    description: 'Hàng cồng kềnh',
    icon: 'package',
  },
  {
    name: 'EXTRA',
    label: 'Thùng siêu lớn (Extra)',
    price: STORAGE_BOX_MONTH_BY_TYPE.EXTRA,
    unit: 'thùng/tháng',
    description: 'Pallet/thùng đặc biệt',
    icon: 'deployed_code',
  },
]

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} ₫`
}

export function getBinDayPrice(boxType: 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA'): number {
  return BIN_PRICING.find((tier) => tier.name === boxType)?.price ?? 0
}

export function getBinMonthPrice(boxType: 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA'): number {
  return STORAGE_BOX_MONTH_BY_TYPE[boxType]
}

export function getZonePricePerM2(zoneType: 'PREMIUM' | 'PRIVATE'): number {
  return ZONE_PRICING.find((z) => z.name === zoneType)?.price ?? 0
}
