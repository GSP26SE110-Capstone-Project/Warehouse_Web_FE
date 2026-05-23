export type UserRole =
  | 'SYSTEM_ADMIN'
  | 'WH_ADMIN'
  | 'WH_STAFF'
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

export interface ApiRentalRequest {
  rentalRequestId: string
  requestCode: string
  companyName: string
  companyCode?: string | null
  taxCode?: string | null
  address?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  warehouseId: string
  contractType?: string | null
  pricingModel?: string | null
  billingCycle?: string | null
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
  | 'ACTIVE'
  | 'EXPIRED'
  | 'TERMINATED'
  | 'CANCELLED'

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
  estimatedTotalAmount?: number | null
  status: ContractStatus
  createdAt?: string
  updatedAt?: string
}
