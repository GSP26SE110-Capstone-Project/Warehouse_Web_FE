import { recommendGuestContractType } from '../utils/contractTypeRecommendation'

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
    tagline: 'Kho đề xuất phương án phù hợp',
    description:
      'Bạn chưa chắc quy mô hay hình thức thuê. Gửi nhu cầu và loại hàng — warehouse admin sẽ đề xuất sau khi xem xét.',
    icon: 'support_agent',
    highlight: true,
  },
  {
    value: 'SHARED_STORAGE',
    title: 'Lưu hàng linh hoạt',
    tagline: 'Kho xếp lên kệ giúp bạn',
    description:
      'Phù hợp hầu hết doanh nghiệp: bạn gửi hàng, kho chọn kệ/ngăn và theo dõi tồn. Trả theo lượng hàng thực tế mỗi kỳ (tháng hoặc năm) — không cần đặt trước một ô cố định.',
    icon: 'inventory_2',
    highlight: true,
  },
  {
    value: 'RESERVED_STORAGE',
    title: 'Giữ chỗ cố định',
    tagline: 'Slot riêng (chỉ WH admin gán)',
    description:
      'Một phần không gian bin được giữ cố định cho tenant. Không hiển thị trên form guest — warehouse admin chọn khi duyệt nếu phù hợp.',
    icon: 'bookmark',
  },
  {
    value: 'DEDICATED_ZONE',
    title: 'Thuê một khu riêng trong kho',
    tagline: 'Tách riêng luồng hàng của bạn',
    description:
      'Một khu vực trong kho dành riêng cho thương hiệu của bạn (vẫn chung tòa nhà với doanh nghiệp khác). Phù hợp quy mô lớn hoặc quy trình riêng.',
    icon: 'grid_view',
  },
  {
    value: 'DEDICATED_WAREHOUSE',
    title: 'Thuê nguyên một kho',
    tagline: 'Toàn bộ tòa kho dành cho bạn',
    description:
      'Cả warehouse chỉ phục vụ doanh nghiệp của bạn — phù hợp quy mô rất lớn hoặc yêu cầu bảo mật / vận hành riêng.',
    icon: 'warehouse',
  },
]

/** Guest landing / rental form — không hiển thị giữ chỗ cố định (WH chọn khi duyệt). */
export const GUEST_CONTRACT_TYPE_OPTIONS = CONTRACT_TYPE_OPTIONS.filter(
  (c) => c.value !== 'RESERVED_STORAGE'
)

/** WH duyệt — cùng danh sách guest (không RESERVED_STORAGE, không NEEDS_CONSULTATION). */
export const WH_ASSIGNABLE_CONTRACT_OPTIONS = GUEST_CONTRACT_TYPE_OPTIONS.filter(
  (c): c is ContractTypeInfo & { value: BillableContractTypeValue } =>
    c.value !== 'NEEDS_CONSULTATION'
)

export const CONTRACT_TYPE_LABELS: Record<ContractTypeValue, string> = Object.fromEntries(
  CONTRACT_TYPE_OPTIONS.map((c) => [c.value, c.title])
) as Record<ContractTypeValue, string>

export const BILLING_CYCLE_GUEST_OPTIONS = [
  { value: 'MONTHLY', label: 'Thanh toán theo tháng' },
] as const

export const BILLING_CYCLE_GUEST_LABELS: Record<string, string> = {
  DAILY: 'Theo ngày',
  MONTHLY: 'Theo tháng',
  QUARTERLY: 'Theo quý',
  YEARLY: 'Theo năm',
}

/** Cách tính tiền trên hợp đồng (pricing_model). */
export const PRICING_MODEL_LABELS: Record<string, string> = {
  USAGE_BASED: 'Theo mức sử dụng',
  FIXED: 'Giá cố định theo kỳ',
  HYBRID: 'Kết hợp (cố định + theo dùng)',
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

/** Thuê nguyên zone/kho — billing theo diện tích, không cần gợi ý bin/thùng. */
export function isDedicatedSpaceRental(
  contractType: ContractTypeValue | string | null | undefined
): boolean {
  return contractType === 'DEDICATED_ZONE' || contractType === 'DEDICATED_WAREHOUSE'
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
    return 'Có thể bỏ trống nếu bạn đã khai báo loại hàng + size bên dưới. Kho sẽ đề xuất loại thuê sau khi xem xét.'
  }
  return 'Ước tính diện tích zone riêng bạn muốn thuê (tính phí theo m²/tháng).'
}

export function suggestBillableContractType(row: {
  contractType?: string | null
  requestedAreaM2?: number | null
  estimatedBoxCount?: number | null
  totalCommittedVolumeUnits?: number | null
}): BillableContractTypeValue {
  if (row.contractType && row.contractType !== 'NEEDS_CONSULTATION') {
    return row.contractType as BillableContractTypeValue
  }

  const rec = recommendGuestContractType({
    estimatedBoxCount: row.estimatedBoxCount,
    totalCommittedVolumeUnits: row.totalCommittedVolumeUnits,
    requestedAreaM2: row.requestedAreaM2,
  })

  if (rec.contractType === 'NEEDS_CONSULTATION') {
    return 'SHARED_STORAGE'
  }

  return rec.contractType as BillableContractTypeValue
}

const WH_ASSIGNABLE_CONTRACT_TYPE_VALUES = new Set(
  WH_ASSIGNABLE_CONTRACT_OPTIONS.map((c) => c.value)
)

/** Gợi ý loại thuê WH chọn khi duyệt — loại giá trị không còn trong dropdown (vd. RESERVED_STORAGE). */
export function resolveWhApprovalContractType(row: {
  contractType?: string | null
  requestedAreaM2?: number | null
  estimatedBoxCount?: number | null
  totalCommittedVolumeUnits?: number | null
}): BillableContractTypeValue {
  const suggested = suggestBillableContractType(row)
  if (WH_ASSIGNABLE_CONTRACT_TYPE_VALUES.has(suggested)) return suggested
  return 'SHARED_STORAGE'
}

export type GuestRegionWarehouseCopy = {
  listIntro: (count: number, district: string, city: string) => string
  footer: string
  empty: (district: string, city: string) => string
}

/** Copy khối preview kho theo loại hình thuê guest chọn. */
export function guestRegionWarehouseCopy(contractType: ContractTypeValue): GuestRegionWarehouseCopy {
  switch (contractType) {
    case 'DEDICATED_WAREHOUSE':
      return {
        listIntro: (count, district, city) =>
          `Có ${count} kho tham khảo tại ${district}, ${city}`,
        footer:
          '% đã thuê = diện tích zone/HĐ đang có khách. Thuê nguyên kho cần kho ~0% thuê — xem nhãn từng kho.',
        empty: (district, city) =>
          `Chưa có kho hoạt động tại ${district}, ${city}. Bạn vẫn có thể gửi yêu cầu — System Admin sẽ liên hệ khi có phương án phù hợp.`,
      }
    case 'DEDICATED_ZONE':
      return {
        listIntro: (count, district, city) =>
          `Có ${count} kho tại ${district}, ${city} — tham khảo diện tích trước khi thuê khu riêng`,
        footer:
          'Thanh % giúp ước lượng kho còn chỗ cho khu riêng. Warehouse admin chọn kho và zone phù hợp khi duyệt.',
        empty: (district, city) =>
          `Chưa có kho tại ${district}, ${city}. Gửi yêu cầu kèm diện tích mong muốn — admin sẽ tư vấn.`,
      }
    case 'SHARED_STORAGE':
      return {
        listIntro: (count, district, city) =>
          `Có ${count} kho đang phục vụ ${district}, ${city}`,
        footer:
          'Thanh % = mức quy hoạch khu trong kho (tham khảo). Bạn không chọn kho — kho phù hợp sẽ tiếp nhận khi duyệt.',
        empty: (district, city) =>
          `Hiện chưa có kho hoạt động tại ${district}, ${city}. Bạn vẫn có thể gửi yêu cầu — admin sẽ liên hệ sau.`,
      }
    default:
      return {
        listIntro: (count, district, city) =>
          `Có ${count} kho tham khảo tại ${district}, ${city}`,
        footer:
          'Bạn không cần chọn kho — admin sẽ đề xuất hình thức thuê và kho phù hợp khi duyệt.',
        empty: (district, city) =>
          `Chưa có kho tại ${district}, ${city}. Bạn vẫn có thể gửi yêu cầu để được tư vấn.`,
      }
  }
}
