/** Guest-friendly copy aligned with Warehouse_BE_V2/docs/contract_type.md */
export type ContractTypeValue =
  | 'SHARED_STORAGE'
  | 'RESERVED_STORAGE'
  | 'DEDICATED_ZONE'
  | 'DEDICATED_WAREHOUSE'
  | 'NEEDS_CONSULTATION'

/** Loại thuê ghi trên hợp đồng — WH chọn khi duyệt / onboarding */
export type BillableContractTypeValue = Exclude<ContractTypeValue, 'NEEDS_CONSULTATION'>

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
    value: 'NEEDS_CONSULTATION',
    title: 'Chưa rõ / để kho tư vấn',
    tagline: 'Kho đề xuất hình thức phù hợp',
    description:
      'Bạn chưa chắc nên thuê zone, giữ chỗ hay kho chia sẻ. Gửi nhu cầu và diện tích ước tính — warehouse admin sẽ chọn loại thuê khi duyệt.',
    icon: 'support_agent',
    highlight: true,
  },
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

export const WH_ASSIGNABLE_CONTRACT_OPTIONS = CONTRACT_TYPE_OPTIONS.filter(
  (c): c is ContractTypeInfo & { value: BillableContractTypeValue } =>
    c.value !== 'NEEDS_CONSULTATION'
)

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
  if (contractType === 'NEEDS_CONSULTATION') return 'HYBRID'
  return 'FIXED'
}

export function showsRequestedAreaField(contractType: ContractTypeValue): boolean {
  return (
    contractType === 'DEDICATED_WAREHOUSE' ||
    contractType === 'DEDICATED_ZONE' ||
    contractType === 'NEEDS_CONSULTATION'
  )
}

export function requestedAreaFieldLabel(contractType: ContractTypeValue): string {
  if (contractType === 'DEDICATED_WAREHOUSE') {
    return 'Diện tích kho tối thiểu bạn cần (m²)'
  }
  if (contractType === 'NEEDS_CONSULTATION') {
    return 'Diện tích mong muốn (m²) — nếu chưa rõ'
  }
  return 'Diện tích zone mong muốn (m²)'
}

export function requestedAreaFieldHint(contractType: ContractTypeValue): string {
  if (contractType === 'DEDICATED_WAREHOUSE') {
    return 'Tham khảo diện tích các kho trong khu vực phía trên. Không bắt buộc chọn đúng một kho.'
  }
  if (contractType === 'NEEDS_CONSULTATION') {
    return 'Có thể bỏ trống nếu bạn đã nhập tổng số cái/tháng bên dưới. Kho sẽ đề xuất loại thuê sau khi xem xét.'
  }
  return 'Ước tính diện tích zone riêng bạn muốn thuê (tính phí theo m²/tháng).'
}

export function suggestBillableContractType(
  row: { contractType?: string | null; requestedAreaM2?: number | null }
): BillableContractTypeValue {
  if (
    row.contractType &&
    row.contractType !== 'NEEDS_CONSULTATION'
  ) {
    return row.contractType as BillableContractTypeValue
  }
  if (row.requestedAreaM2 != null && row.requestedAreaM2 > 0) {
    return 'DEDICATED_ZONE'
  }
  return 'SHARED_STORAGE'
}
