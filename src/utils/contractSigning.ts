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
  ACTIVE: 'Đang hiệu lực',
  EXPIRED: 'Hết hạn',
  TERMINATED: 'Chấm dứt',
  CANCELLED: 'Đã hủy',
}

export function contractStatusLabel(status: ContractStatus): string {
  return STATUS_LABELS[status] ?? status
}

export function contractSigningStepLabel(
  contract: Pick<ApiContract, 'status' | 'tenantSignature' | 'warehouseSignature'>,
  context?: ContractSigningContext
): string {
  if (contract.status === 'ACTIVE' && hasTenantSignature(contract)) {
    return 'Đã ký đủ hai bên'
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
