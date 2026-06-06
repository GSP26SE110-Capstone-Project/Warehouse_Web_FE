import type { ApiContract } from '../api/types'
import type {
  ApiContractAppendix,
  AppendixPaymentPreview,
  AppendixStatus,
  StorageLevel,
} from '../api/contractAppendices'
import { formatVnd } from '../data/pricing'

export const APPENDIX_STATUS_LABELS: Record<AppendixStatus, string> = {
  PENDING: 'Chờ kho xử lý',
  UNDER_REVIEW: 'Đang xem xét',
  REJECTED: 'Đã từ chối',
  PENDING_APPROVAL: 'Chờ tenant ký',
  PENDING_PAYMENT: 'Chờ thanh toán',
  ACTIVE: 'Đang hiệu lực',
  TERMINATED: 'Đã chấm dứt',
  CANCELLED: 'Đã hủy',
  DRAFT: 'Nháp',
}

export const STORAGE_LEVEL_LABELS: Record<StorageLevel, string> = {
  WAREHOUSE: 'Toàn kho',
  ZONE: 'Zone',
  RACK: 'Rack',
  RACK_LEVEL: 'Tầng rack',
  BIN: 'Lưu hàng linh hoạt',
}

const STORAGE_LEVEL_ORDER: StorageLevel[] = [
  'BIN',
  'RACK_LEVEL',
  'RACK',
  'ZONE',
  'WAREHOUSE',
]

/** Cấp hiển thị trong form yêu cầu phụ lục (không dùng RACK_LEVEL) */
const APPENDIX_SELECTABLE_LEVELS: StorageLevel[] = [
  'BIN',
  'RACK',
  'ZONE',
  'WAREHOUSE',
]

export function appendixStatusBadgeClass(status: AppendixStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20'
    case 'PENDING':
    case 'UNDER_REVIEW':
      return 'bg-amber-400/10 text-amber-300 ring-amber-400/20'
    case 'PENDING_APPROVAL':
      return 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20'
    case 'PENDING_PAYMENT':
      return 'bg-orange-400/10 text-orange-300 ring-orange-400/20'
    case 'REJECTED':
    case 'TERMINATED':
    case 'CANCELLED':
      return 'bg-red-400/10 text-red-300 ring-red-400/20'
    default:
      return 'bg-white/5 text-slate-400 ring-white/10'
  }
}

export function canTenantRequestAppendix(
  contract: ApiContract | null,
  isTenantAdmin: boolean
): boolean {
  return isTenantAdmin && contract?.status === 'ACTIVE'
}

export function canTenantSign(appendix: ApiContractAppendix): boolean {
  return appendix.status === 'PENDING_APPROVAL'
}

export function canTenantPay(appendix: ApiContractAppendix): boolean {
  return appendix.status === 'PENDING_PAYMENT'
}

export function canTenantDelete(appendix: ApiContractAppendix): boolean {
  return appendix.status === 'PENDING' || appendix.status === 'REJECTED'
}

export function canWhMarkUnderReview(appendix: ApiContractAppendix): boolean {
  return appendix.status === 'PENDING'
}

export function canWhApprove(appendix: ApiContractAppendix): boolean {
  return appendix.status === 'PENDING' || appendix.status === 'UNDER_REVIEW'
}

export function canWhReject(appendix: ApiContractAppendix): boolean {
  return appendix.status === 'PENDING' || appendix.status === 'UNDER_REVIEW'
}

export function canWhTerminate(appendix: ApiContractAppendix): boolean {
  return appendix.status === 'ACTIVE'
}

export function formatAppendixPeriod(effectiveDate?: string, endDate?: string): string {
  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('vi-VN') : '—'
  return `${fmt(effectiveDate)} → ${fmt(endDate)}`
}

export function appendixPaymentSummary(preview: AppendixPaymentPreview): string {
  return (
    `${formatVnd(preview.initialInvoiceAmount)} ` +
    `(${preview.billableMonths} tháng × ${formatVnd(preview.monthlyRate)}/tháng)`
  )
}

export function appendixNeedNewContractMessage(): string {
  return (
    'Yêu cầu vượt trần cấp không gian của hợp đồng hiện tại. ' +
    'Vui lòng liên hệ kho để tạo hợp đồng mới thay vì phụ lục.'
  )
}

export function storageLevelIndex(level: StorageLevel): number {
  return STORAGE_LEVEL_ORDER.indexOf(level)
}

export function isStorageLevelWithinCeiling(
  requested: StorageLevel,
  ceiling: StorageLevel
): boolean {
  return storageLevelIndex(requested) <= storageLevelIndex(ceiling)
}

export function selectableStorageLevels(ceiling: StorageLevel): StorageLevel[] {
  const ceilingIdx = storageLevelIndex(ceiling)
  return APPENDIX_SELECTABLE_LEVELS.filter((l) => storageLevelIndex(l) <= ceilingIdx)
}

export function appendixNeedsTenantAction(appendix: ApiContractAppendix): boolean {
  return appendix.status === 'PENDING_APPROVAL' || appendix.status === 'PENDING_PAYMENT'
}

export const WH_REVIEW_APPENDIX_STATUSES: AppendixStatus[] = ['PENDING', 'UNDER_REVIEW']

export function countWhReviewAppendices(appendices: ApiContractAppendix[]): number {
  return appendices.filter((a) => WH_REVIEW_APPENDIX_STATUSES.includes(a.status)).length
}

export function tenantSignAppendix(
  appendices: ApiContractAppendix[]
): ApiContractAppendix | null {
  return appendices.find((a) => a.status === 'PENDING_APPROVAL') ?? null
}

export function tenantPayAppendix(
  appendices: ApiContractAppendix[]
): ApiContractAppendix | null {
  return appendices.find((a) => a.status === 'PENDING_PAYMENT') ?? null
}

export function tenantWaitingWhAppendices(appendices: ApiContractAppendix[]): number {
  return appendices.filter((a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length
}
