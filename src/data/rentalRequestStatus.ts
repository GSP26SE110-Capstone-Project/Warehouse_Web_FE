import type { RentalRequestStatus } from '../api/types'

export const RENTAL_REQUEST_STATUS_LABEL: Record<RentalRequestStatus, string> = {
  PENDING: 'Chờ xử lý',
  UNDER_REVIEW: 'Đang xem xét',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CONVERTED: 'Đã chuyển HĐ',
}

export const RENTAL_REQUEST_STATUS_CLASS: Record<RentalRequestStatus, string> = {
  PENDING: 'bg-amber-500/20 text-amber-300',
  UNDER_REVIEW: 'bg-sky-500/20 text-sky-300',
  APPROVED: 'bg-emerald-500/20 text-emerald-300',
  REJECTED: 'bg-red-500/20 text-red-400',
  CONVERTED: 'bg-violet-500/20 text-violet-300',
}

export function rentalRequestStatusLabel(status: RentalRequestStatus | string | null | undefined): string {
  if (!status) return '—'
  return RENTAL_REQUEST_STATUS_LABEL[status as RentalRequestStatus] ?? status
}

export function rentalRequestStatusClass(status: RentalRequestStatus | string | null | undefined): string {
  if (!status) return 'bg-white/10 text-slate-400'
  return RENTAL_REQUEST_STATUS_CLASS[status as RentalRequestStatus] ?? 'bg-white/10 text-slate-300'
}
