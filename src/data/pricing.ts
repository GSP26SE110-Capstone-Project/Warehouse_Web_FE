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
  price: 120_000,
  unit: 'm²/tháng',
  description: 'Thuê toàn bộ warehouse theo diện tích. Ví dụ: 500m² × 120.000 = 60 triệu/tháng.',
  icon: 'warehouse',
  highlight: true,
}

export const ZONE_PRICING: PricingTier[] = [
  {
    name: 'PREMIUM',
    label: 'Premium Zone',
    price: 300_000,
    unit: 'm²/tháng',
    description: 'Khu premium với kiểm soát môi trường & bảo mật cao',
    icon: 'diamond',
  },
  {
    name: 'PRIVATE',
    label: 'Private Zone',
    price: 250_000,
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

export const BIN_PRICING: PricingTier[] = [
  {
    name: 'SMALL',
    label: 'Small Box',
    price: 10_000,
    unit: 'box/ngày',
    description: 'Thùng nhỏ, hàng nhẹ — đơn giá BOX_DAY',
    icon: 'inventory',
  },
  {
    name: 'MEDIUM',
    label: 'Medium Box',
    price: 20_000,
    unit: 'box/ngày',
    description: 'Đơn giá/ngày × tổng box-day trong kỳ; hóa đơn tổng hợp theo tháng/năm',
    icon: 'package_2',
    highlight: true,
  },
  {
    name: 'LARGE',
    label: 'Large Box',
    price: 35_000,
    unit: 'box/ngày',
    description: 'Thùng lớn, hàng cồng kềnh — đơn giá BOX_DAY',
    icon: 'package',
  },
  {
    name: 'EXTRA',
    label: 'Extra Box',
    price: 50_000,
    unit: 'box/ngày',
    description: 'Thùng siêu lớn hoặc hàng đặc biệt — đơn giá BOX_DAY',
    icon: 'deployed_code',
  },
]

export const HANDLING_FEES = [
  { operation: 'Inbound LPN', fee: '5.000 – 15.000 ₫' },
  { operation: 'Outbound LPN', fee: '7.000 – 20.000 ₫' },
  { operation: 'Repacking', fee: '10.000 ₫' },
  { operation: 'QC Inspection', fee: '5.000 ₫' },
  { operation: 'Relocation', fee: '3.000 ₫' },
]

/** Đồng bộ BE: STORAGE_BOX_DAY × 30 (docs/pricing.md) */
export const DAYS_PER_BILLING_MONTH = 30

export const BOX_MONTH_PRICING: PricingTier[] = [
  {
    name: 'SMALL',
    label: 'Thùng nhỏ (Small)',
    price: 10_000 * DAYS_PER_BILLING_MONTH,
    unit: 'thùng/tháng',
    description: 'Hàng nhẹ, volume 1U — tương đương 10.000 ₫/ngày',
    icon: 'inventory',
  },
  {
    name: 'MEDIUM',
    label: 'Thùng trung (Medium)',
    price: 20_000 * DAYS_PER_BILLING_MONTH,
    unit: 'thùng/tháng',
    description: 'Phổ biến nhất — tương đương 20.000 ₫/ngày',
    icon: 'package_2',
    highlight: true,
  },
  {
    name: 'LARGE',
    label: 'Thùng lớn (Large)',
    price: 35_000 * DAYS_PER_BILLING_MONTH,
    unit: 'thùng/tháng',
    description: 'Hàng cồng kềnh — tương đương 35.000 ₫/ngày',
    icon: 'package',
  },
  {
    name: 'EXTRA',
    label: 'Thùng siêu lớn (Extra)',
    price: 50_000 * DAYS_PER_BILLING_MONTH,
    unit: 'thùng/tháng',
    description: 'Pallet/thùng đặc biệt — tương đương 50.000 ₫/ngày',
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
  return getBinDayPrice(boxType) * DAYS_PER_BILLING_MONTH
}
