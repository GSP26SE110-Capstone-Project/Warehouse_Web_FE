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
    name: 'SHARED',
    label: 'Shared Zone',
    price: 120_000,
    unit: 'm²/tháng',
    description: 'Khu vực chia sẻ, phù hợp hàng tồn ổn định',
    icon: 'grid_view',
  },
  {
    name: 'FAST_MOVING',
    label: 'Fast Moving Zone',
    price: 220_000,
    unit: 'm²/tháng',
    description: 'Gần outbound, tối ưu cho hàng luân chuyển nhanh',
    icon: 'speed',
    highlight: true,
  },
  {
    name: 'PREMIUM',
    label: 'Premium Zone',
    price: 300_000,
    unit: 'm²/tháng',
    description: 'Khu premium với kiểm soát môi trường & bảo mật cao',
    icon: 'diamond',
  },
  {
    name: 'RETURN',
    label: 'Return Zone',
    price: 90_000,
    unit: 'm²/tháng',
    description: 'Khu xử lý hàng trả, hoàn',
    icon: 'undo',
  },
]

export const RACK_PRICING: PricingTier[] = [
  {
    name: 'STANDARD',
    label: 'Standard Rack',
    price: 120_000,
    unit: 'rack/tháng (tham chiếu)',
    description: 'Đơn giá tham chiếu; tổng hợp vào hóa đơn tháng/năm theo mức sử dụng',
    icon: 'shelves',
  },
]

export const RACK_LEVEL_PRICING: PricingTier[] = [
  {
    name: 'LOWER',
    label: 'Tầng dưới',
    price: 60_000,
    unit: 'level/tháng (tham chiếu)',
    description: 'Dễ pick, thuận tiện thao tác',
    icon: 'arrow_downward',
  },
  {
    name: 'MIDDLE',
    label: 'Tầng giữa',
    price: 50_000,
    unit: 'level/tháng (tham chiếu)',
    description: 'Cân bằng giữa chi phí và thao tác',
    icon: 'drag_handle',
  },
  {
    name: 'UPPER',
    label: 'Tầng trên',
    price: 40_000,
    unit: 'level/tháng (tham chiếu)',
    description: 'Chi phí thấp nhất, phù hợp hàng ít luân chuyển',
    icon: 'arrow_upward',
  },
]

export const BIN_PRICING: PricingTier[] = [
  {
    name: 'SMALL',
    label: 'Small Box',
    price: 10_000,
    unit: 'box/tháng (tham chiếu)',
    description: 'Thùng nhỏ, hàng nhẹ',
    icon: 'inventory',
  },
  {
    name: 'MEDIUM',
    label: 'Medium Box',
    price: 20_000,
    unit: 'box/tháng (tham chiếu)',
    description: 'Mức sử dụng trung bình trong kỳ × đơn giá; một hóa đơn/tháng hoặc/năm',
    icon: 'package_2',
    highlight: true,
  },
  {
    name: 'LARGE',
    label: 'Large Box',
    price: 35_000,
    unit: 'box/tháng (tham chiếu)',
    description: 'Thùng lớn, hàng cồng kềnh',
    icon: 'package',
  },
  {
    name: 'EXTRA',
    label: 'Extra Box',
    price: 50_000,
    unit: 'box/tháng (tham chiếu)',
    description: 'Thùng siêu lớn hoặc hàng đặc biệt',
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

export const SURCHARGES = [
  { name: 'Fast Moving SKU', detail: '+20% – +40% trên phí lưu trữ' },
  { name: 'Humidity Control', detail: '+20% (Premium Zone)' },
  { name: 'Camera / Security', detail: '+15% (Premium Zone)' },
  { name: 'Restricted Access', detail: '+10% (Premium Zone)' },
]

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} ₫`
}
