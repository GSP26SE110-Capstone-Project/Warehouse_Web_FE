/** Guest-friendly copy aligned with Warehouse_BE_V2/docs/contract_type.md */
export type ContractTypeValue =
  | 'SHARED_STORAGE'
  | 'RESERVED_STORAGE'
  | 'DEDICATED_ZONE'
  | 'DEDICATED_WAREHOUSE'

export interface ContractTypeInfo {
  value: ContractTypeValue
  title: string
  tagline: string
  description: string
  icon: string
  highlight?: boolean
}

export const CONTRACT_TYPE_OPTIONS: ContractTypeInfo[] = [
  {
    value: 'SHARED_STORAGE',
    title: 'Kho chia sẻ',
    tagline: 'Không giữ slot cố định',
    description:
      'Kho xếp hàng giúp bạn — không slot cố định. Trả theo mức dùng trong kỳ; hóa đơn gom theo tháng hoặc năm (không tính phí từng ngày trên đăng ký guest).',
    icon: 'share',
  },
  {
    value: 'RESERVED_STORAGE',
    title: 'Giữ chỗ cố định',
    tagline: 'Slot riêng, kho vẫn dùng chung',
    description:
      'Bạn có một phần không gian được giữ cố định, trong khi warehouse vẫn vận hành chung với tenant khác — cân bằng giữa ổn định và chi phí.',
    icon: 'bookmark',
  },
  {
    value: 'DEDICATED_ZONE',
    title: 'Thuê nguyên zone',
    tagline: 'Một khu riêng trong kho',
    description:
      'Thuê trọn một zone — không chỉ vài bin lẻ tẻ. Phù hợp khi cần tách luồng hàng, quy trình riêng trong cùng tòa kho.',
    icon: 'grid_view',
    highlight: true,
  },
  {
    value: 'DEDICATED_WAREHOUSE',
    title: 'Thuê nguyên kho',
    tagline: '100% riêng cho doanh nghiệp',
    description:
      'Toàn bộ warehouse dành riêng cho bạn — kiểm soát tối đa, phù hợp quy mô lớn hoặc yêu cầu bảo mật / vận hành đặc thù.',
    icon: 'warehouse',
  },
]

export const CONTRACT_TYPE_LABELS: Record<ContractTypeValue, string> = Object.fromEntries(
  CONTRACT_TYPE_OPTIONS.map((c) => [c.value, c.title])
) as Record<ContractTypeValue, string>

export const BILLING_CYCLE_GUEST_OPTIONS = [
  { value: 'MONTHLY', label: 'Thanh toán theo tháng' },
  { value: 'YEARLY', label: 'Thanh toán theo năm' },
] as const

export const BILLING_CYCLE_GUEST_LABELS: Record<string, string> = {
  MONTHLY: 'Theo tháng',
  YEARLY: 'Theo năm',
}

export function defaultPricingModel(contractType: ContractTypeValue): string {
  if (contractType === 'SHARED_STORAGE') return 'USAGE_BASED'
  return 'FIXED'
}

export function showsRequestedAreaField(contractType: ContractTypeValue): boolean {
  return contractType === 'DEDICATED_WAREHOUSE' || contractType === 'DEDICATED_ZONE'
}

export function requestedAreaFieldLabel(contractType: ContractTypeValue): string {
  if (contractType === 'DEDICATED_WAREHOUSE') {
    return 'Diện tích kho tối thiểu bạn cần (m²)'
  }
  return 'Diện tích zone mong muốn (m²)'
}

export function requestedAreaFieldHint(contractType: ContractTypeValue): string {
  if (contractType === 'DEDICATED_WAREHOUSE') {
    return 'Tham khảo diện tích các kho trong khu vực phía trên. Không bắt buộc chọn đúng một kho.'
  }
  return 'Ước tính diện tích zone riêng bạn muốn thuê (tính phí theo m²/tháng).'
}
