import type {
  ApiBoxAllocationRow,
  ApiContract,
  ApiRentalProductLine,
  ApiRentalRequest,
  ApiUser,
  ApiWarehouse,
  UserRole,
} from '../api/types'
import type { WarehouseWhAdmin } from '../types/Warehouse'
import type { ApiTenant } from '../api/tenants'
import type { Account } from '../types/Account'
import type { Contract } from '../types/Contract'
import type { Warehouse } from '../types/Warehouse'
import { formatDisplayDate, rentalRequestDateOnly } from '../utils/datePicker'

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  SYSTEM_ADMIN: 'System Admin',
  WH_ADMIN: 'Warehouse Admin',
  TENANT_ADMIN: 'Tenant Admin',
  WH_STAFF: 'Warehouse Staff',
  WH_TRANSPORTER: 'Tài xế kho',
  TENANT_STAFF: 'Tenant Staff',
}

const ROLE_CLASS: Record<UserRole, string> = {
  SYSTEM_ADMIN: 'bg-purple-400/10 text-purple-300 ring-purple-400/20',
  WH_ADMIN: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20',
  TENANT_ADMIN: 'bg-blue-400/10 text-blue-300 ring-blue-400/20',
  WH_STAFF: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  WH_TRANSPORTER: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  TENANT_STAFF: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
}

const STATUS_FE: Record<string, Account['status']> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  BLOCKED: 'Suspended',
}

const STATUS_CLASS: Record<string, string> = {
  Active: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
  Inactive: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
  Suspended: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
}

export function formatRelativeTime(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatDate(iso?: string | null) {
  if (!iso) return '—'
  const dateOnly = rentalRequestDateOnly(iso)
  return dateOnly ? formatDisplayDate(dateOnly) : '—'
}

export function userToAccount(u: ApiUser, index = 0): Account {
  const apiRole = u.role
  const role = USER_ROLE_LABEL[apiRole] ?? apiRole
  const status = STATUS_FE[u.status] ?? 'Inactive'
  return {
    id: u.userId,
    name: u.fullName,
    email: u.email,
    role,
    apiRole,
    apiStatus: u.status,
    roleClassName: ROLE_CLASS[apiRole] ?? 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
    status,
    statusClassName: STATUS_CLASS[status],
    lastLogin: '—',
    createdAt: formatDate(u.createdAt),
    striped: index % 2 === 0,
  }
}

export function whAdminFromUser(u: ApiUser): WarehouseWhAdmin {
  return {
    userId: u.userId,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
  }
}

export function warehouseToRow(w: ApiWarehouse): Warehouse {
  return {
    warehouseId: w.warehouseId,
    warehouseCode: w.warehouseCode,
    warehouseName: w.warehouseName,
    address: w.address ?? '—',
    city: w.city ?? '',
    district: w.district ?? '',
    totalAreaM2: w.totalAreaM2 ?? null,
    usableAreaM2: w.usableAreaM2 ?? null,
    status: w.status,
    lastUpdated: formatRelativeTime(w.updatedAt ?? w.createdAt),
    zones: [],
  }
}

export type RentalRequestRow = {
  id: string
  rentalRequestId: string
  tenantId: string
  customer: string
  customerEmail: string
  city: string
  district: string
  warehouse: string
  warehouseId?: string | null
  type: 'rent' | 'extend'
  startDate: string
  endDate: string
  status: 'pending' | 'approved' | 'rejected'
  apiStatus: ApiRentalRequest['status']
  contractType?: string | null
  pricingModel?: string | null
  billingCycle?: string | null
  estimatedBoxCount?: number | null
  totalCommittedVolumeUnits?: number | null
  boxAllocation?: ApiBoxAllocationRow[]
  productLines?: ApiRentalProductLine[]
  estimatedSkuCount?: number | null
  estimatedInboundPerWeek?: number | null
  estimatedOutboundPerWeek?: number | null
  requestedAreaM2?: number | null
  suggestedZoneType?: string | null
  requiresFastPicking?: boolean
  requiresPremiumStorage?: boolean
  notes?: string | null
  reviewNote?: string | null
  expectedStartDate?: string | null
  expectedEndDate?: string | null
}

const RENTAL_STATUS_FE: Record<string, RentalRequestRow['status']> = {
  PENDING: 'pending',
  UNDER_REVIEW: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CONVERTED: 'approved',
}

export function rentalRequestToRow(
  r: ApiRentalRequest,
  warehouseNameById: Map<string, string> = new Map(),
  tenantById: Map<string, ApiTenant> = new Map()
): RentalRequestRow {
  const tenant = tenantById.get(r.tenantId)
  const regionLabel = `${r.district}, ${r.city}`
  return {
    id: r.requestCode,
    rentalRequestId: r.rentalRequestId,
    tenantId: r.tenantId,
    customer: tenant?.companyName ?? r.tenantId.slice(0, 8),
    customerEmail: tenant?.contactEmail ?? '—',
    city: r.city,
    district: r.district,
    warehouse: r.warehouseId
      ? (warehouseNameById.get(r.warehouseId) ?? r.warehouseId.slice(0, 8))
      : regionLabel,
    warehouseId: r.warehouseId ?? undefined,
    type: 'rent',
    startDate: formatDate(r.expectedStartDate),
    endDate: formatDate(r.expectedEndDate),
    status: RENTAL_STATUS_FE[r.status] ?? 'pending',
    apiStatus: r.status,
    contractType: r.contractType,
    pricingModel: r.pricingModel,
    billingCycle: r.billingCycle,
    estimatedBoxCount: r.estimatedBoxCount,
    totalCommittedVolumeUnits:
      r.totalCommittedVolumeUnits != null ? Number(r.totalCommittedVolumeUnits) : null,
    boxAllocation: r.boxAllocation ?? r.boxAllocationJson ?? undefined,
    productLines: r.productLines,
    estimatedSkuCount: r.estimatedSkuCount,
    estimatedInboundPerWeek: r.estimatedInboundPerWeek,
    estimatedOutboundPerWeek: r.estimatedOutboundPerWeek,
    requestedAreaM2:
      r.requestedAreaM2 != null ? Math.round(Number(r.requestedAreaM2)) : null,
    suggestedZoneType: r.suggestedZoneType,
    requiresFastPicking: r.requiresFastPicking,
    requiresPremiumStorage: r.requiresPremiumStorage,
    notes: r.notes,
    reviewNote: r.reviewNote,
    expectedStartDate: r.expectedStartDate,
    expectedEndDate: r.expectedEndDate,
  }
}

const CONTRACT_STATUS_FE: Record<string, Contract['status']> = {
  DRAFT: 'Pending',
  PENDING_APPROVAL: 'Pending',
  PENDING_PAYMENT: 'Pending',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  TERMINATED: 'Expired',
  CANCELLED: 'Expired',
}

const CONTRACT_STATUS_CLASS: Record<string, string> = {
  Active: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
  Expired: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
  Pending: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
}

export function contractToRow(
  c: ApiContract,
  warehouseNameById: Map<string, string> = new Map(),
  tenantNameById: Map<string, string> = new Map()
): Contract {
  const status = CONTRACT_STATUS_FE[c.status] ?? 'Pending'
  return {
    contractId: c.contractId,
    id: c.contractCode,
    customerName:
      tenantNameById.get(c.tenantId) ?? c.contractName ?? c.contractCode,
    warehouse:
      warehouseNameById.get(c.warehouseId) ?? c.warehouseId.slice(0, 8),
    warehouseId: c.warehouseId,
    tenantId: c.tenantId,
    contractType: c.contractType,
    pricingModel: c.pricingModel,
    billingCycle: c.billingCycle,
    rentalRequestId: c.rentalRequestId,
    startDate: formatDate(c.startDate),
    endDate: formatDate(c.endDate),
    status,
    apiStatus: c.status,
    statusClassName: CONTRACT_STATUS_CLASS[status],
    price: Number(c.estimatedTotalAmount ?? 0),
    createdAt: formatRelativeTime(c.createdAt),
  }
}

export function roleToApiRole(
  feRole: string
): 'WH_ADMIN' | 'TENANT_ADMIN' | 'WH_STAFF' | 'TENANT_STAFF' {
  if (feRole === 'Admin') return 'WH_ADMIN'
  if (feRole === 'Manager') return 'TENANT_ADMIN'
  return 'WH_STAFF'
}

export function statusToApiStatus(feStatus: string): ApiUser['status'] {
  if (feStatus === 'Active') return 'ACTIVE'
  if (feStatus === 'Suspended') return 'SUSPENDED'
  return 'INACTIVE'
}
