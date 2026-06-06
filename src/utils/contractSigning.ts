import type { ApiContract, ContractStatus } from '../api/types'

export function parseContractAmount(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function hasWarehouseSignature(contract: Pick<ApiContract, 'warehouseSignature'>): boolean {
  return Boolean(String(contract.warehouseSignature ?? '').trim())
}

export function hasTenantSignature(contract: Pick<ApiContract, 'tenantSignature'>): boolean {
  return Boolean(String(contract.tenantSignature ?? '').trim())
}

export type ContractSigningContext = {
  /** Ít nhất một storage reservation ACTIVE cho HĐ này */
  hasStorageReservation?: boolean
}

/** Tenant admin — ký sau khi kho đã ký và đã cấp bin/zone. */
export function needsTenantSignature(
  contract: Pick<ApiContract, 'status' | 'tenantSignature' | 'warehouseSignature'>,
  context?: ContractSigningContext
): boolean {
  if (hasTenantSignature(contract)) return false
  if (!hasWarehouseSignature(contract)) return false
  if (context?.hasStorageReservation === false) return false
  return contract.status === 'PENDING_APPROVAL'
}

/** Kho đã ký nhưng chưa cấp chỗ — tenant chưa được ký. */
export function waitingForStorageAssignment(
  contract: Pick<ApiContract, 'status' | 'tenantSignature' | 'warehouseSignature'>,
  context?: ContractSigningContext
): boolean {
  if (hasTenantSignature(contract)) return false
  if (!hasWarehouseSignature(contract)) return false
  return context?.hasStorageReservation === false
}

const STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Nháp',
  PENDING_APPROVAL: 'Chờ bạn ký',
  PENDING_PAYMENT: 'Chờ thanh toán invoice đầu',
  ACTIVE: 'Đang hiệu lực',
  EXPIRED: 'Hết hạn',
  TERMINATED: 'Chấm dứt',
  CANCELLED: 'Đã hủy',
}

/** Nhãn trạng thái HĐ cho màn quản trị kho (WH_ADMIN / SYSTEM_ADMIN). */
const ADMIN_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Nháp',
  PENDING_APPROVAL: 'Chờ ký',
  PENDING_PAYMENT: 'Chờ thanh toán',
  ACTIVE: 'Đang hiệu lực',
  EXPIRED: 'Hết hạn',
  TERMINATED: 'Chấm dứt',
  CANCELLED: 'Đã hủy',
}

export function contractStatusLabel(status: ContractStatus): string {
  return STATUS_LABELS[status] ?? status
}

export function adminContractStatusLabel(status: ContractStatus | string): string {
  return ADMIN_STATUS_LABELS[status as ContractStatus] ?? status
}

const ADMIN_STATUS_BADGE_CLASS: Record<ContractStatus, string> = {
  DRAFT: 'bg-slate-500/10 text-slate-300 ring-slate-400/25',
  PENDING_APPROVAL: 'bg-amber-500/10 text-amber-300 ring-amber-400/30',
  PENDING_PAYMENT: 'bg-orange-500/10 text-orange-300 ring-orange-400/30',
  ACTIVE: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
  EXPIRED: 'bg-slate-500/10 text-slate-400 ring-slate-500/25',
  TERMINATED: 'bg-rose-500/10 text-rose-300 ring-rose-400/30',
  CANCELLED: 'bg-rose-500/10 text-rose-300 ring-rose-400/30',
}

const ADMIN_STATUS_ICONS: Record<ContractStatus, string> = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'draw',
  PENDING_PAYMENT: 'payments',
  ACTIVE: 'verified',
  EXPIRED: 'schedule',
  TERMINATED: 'block',
  CANCELLED: 'cancel',
}

export function adminContractStatusBadgeClass(status: ContractStatus | string): string {
  return (
    ADMIN_STATUS_BADGE_CLASS[status as ContractStatus] ??
    'bg-white/5 text-slate-400 ring-white/10'
  )
}

export function adminContractStatusIcon(status: ContractStatus | string): string {
  return ADMIN_STATUS_ICONS[status as ContractStatus] ?? 'info'
}

export function contractSigningStepLabel(
  contract: Pick<ApiContract, 'status' | 'tenantSignature' | 'warehouseSignature'>,
  context?: ContractSigningContext
): string {
  if (contract.status === 'PENDING_PAYMENT') {
    return 'Đã ký — chờ thanh toán invoice đầu'
  }
  if (contract.status === 'ACTIVE' && hasTenantSignature(contract)) {
    return 'Đã ký đủ hai bên — HĐ đang hiệu lực'
  }
  if (waitingForStorageAssignment(contract, context)) {
    return 'Chờ kho cấp vị trí lưu trữ'
  }
  if (needsTenantSignature(contract, context)) {
    return 'Chờ Tenant Admin ký'
  }
  if (!hasWarehouseSignature(contract)) {
    return 'Chờ kho ký / gửi hợp đồng'
  }
  if (hasTenantSignature(contract) && !hasWarehouseSignature(contract)) {
    return 'Chờ kho ký'
  }
  return contractStatusLabel(contract.status)
}
