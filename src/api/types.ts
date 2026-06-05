export type UserRole =
  | 'SYSTEM_ADMIN'
  | 'WH_ADMIN'
  | 'WH_STAFF'
  | 'WH_TRANSPORTER'
  | 'TENANT_ADMIN'
  | 'TENANT_STAFF'

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED'

export interface ApiUser {
  userId: string
  tenantId?: string | null
  warehouseId?: string | null
  fullName: string
  email: string
  phone?: string | null
  defaultVehiclePlate?: string | null
  defaultDriverIdNumber?: string | null
  defaultCarrierName?: string | null
  role: UserRole
  status: UserStatus
  createdAt?: string
  updatedAt?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResult {
  accessToken: string
  user: ApiUser
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

export interface ApiPaginated<T> {
  success: true
  message: string
  data: T[]
  meta: PaginationMeta
}

export interface ApiErrorBody {
  success: false
  message: string
  code?: string
  errors?: unknown
}

export type WarehouseStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'CLOSED'

export interface ApiWarehouse {
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  address?: string | null
  city?: string | null
  district?: string | null
  totalAreaM2?: number | null
  usableAreaM2?: number | null
  status: WarehouseStatus
  createdAt?: string
  updatedAt?: string
}

export type RentalRequestStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONVERTED'

export interface ApiRentalProductLine {
  lineId?: string
  rentalRequestId?: string
  productKind: string
  size?: string | null
  sizeGroup?: string | null
  quantity: number
  baseVolumeUnitsPerPiece?: number | string
  sizeFactor?: number | string
  finalVolumeUnitsPerPiece?: number | string
  lineVolumeUnits?: number | string
}

export interface ApiBoxAllocationRow {
  boxType: string
  count: number
}

export interface ApiRentalRequest {
  rentalRequestId: string
  requestCode: string
  tenantId: string
  city: string
  district: string
  warehouseId?: string | null
  contractType?: string | null
  pricingModel?: string | null
  billingCycle?: string | null
  estimatedSkuCount?: number | null
  estimatedBoxCount?: number | null
  estimatedVolume?: number | null
  totalCommittedVolumeUnits?: number | string | null
  boxAllocationJson?: ApiBoxAllocationRow[] | null
  boxAllocation?: ApiBoxAllocationRow[]
  productLines?: ApiRentalProductLine[]
  requestedAreaM2?: number | null
  estimatedInboundPerWeek?: number | null
  estimatedOutboundPerWeek?: number | null
  requiresFastPicking?: boolean
  requiresPremiumStorage?: boolean
  suggestedZoneType?: string | null
  notes?: string | null
  expectedStartDate?: string | null
  expectedEndDate?: string | null
  status: RentalRequestStatus
  rejectionReason?: string | null
  reviewNote?: string | null
  createdAt?: string
  updatedAt?: string
}

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'TERMINATED'
  | 'CANCELLED'

export type InvoiceCategory =
  | 'INITIAL'
  | 'APPENDIX_INITIAL'
  | 'RECURRING_RENT'
  | 'OPERATIONAL'
  | 'TERMINATION_SETTLEMENT'

export type InvoicePaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface ApiContractInvoice {
  invoiceId: string
  tenantId: string
  contractId: string
  invoiceCode: string
  billingStartDate: string
  billingEndDate: string
  subtotal?: number | string | null
  tax?: number | string | null
  totalAmount?: number | string | null
  paymentStatus?: InvoicePaymentStatus
  invoiceCategory?: InvoiceCategory | null
  issuedAt?: string | null
  dueDate?: string | null
  updatedAt?: string | null
}

export type TerminationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface ContractTerminationPreview {
  contractId: string
  contractStatus: ContractStatus
  billingCycle: string
  hasInbound: boolean
  totalPaid: number
  monthlyRate: number
  contractMonths: number
  usedMonths: number
  unusedMonths: number
  processingFee: number
  terminationFee: number
  refundAmount: number
  processingRatePercent?: number
  contractStartDate?: string | null
  activatedAt?: string | null
  billingDayOfMonth?: number | null
  terminationNoticeDays?: number
  appliesNoticeRule?: boolean
  nextBillingDate?: string | null
  latestRequestDate?: string | null
  daysUntilNextBilling?: number | null
  canRequestNow?: boolean
}

export interface ApiContractTerminationRequest {
  terminationRequestId: string
  contractId: string
  tenantId: string
  requestedBy?: string | null
  status: TerminationRequestStatus
  billingCycle: string
  hasInbound: boolean
  totalPaid?: number | string | null
  monthlyRate?: number | string | null
  contractMonths?: number | null
  usedMonths?: number | null
  unusedMonths?: number | null
  processingFee?: number | string | null
  terminationFee?: number | string | null
  refundAmount?: number | string | null
  reason?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ApiContract {
  contractId: string
  tenantId: string
  warehouseId: string
  rentalRequestId?: string | null
  contractCode: string
  contractName?: string | null
  contractType: string
  pricingModel: string
  billingCycle?: string | null
  startDate: string
  endDate: string
  activatedAt?: string | null
  estimatedTotalAmount?: number | string | null
  tenantSignature?: string | null
  warehouseSignature?: string | null
  status: ContractStatus
  createdAt?: string
  updatedAt?: string
}
