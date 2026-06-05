import type { ApiContract } from '../api/types'
import { parseContractAmount } from './contractSigning'

/** Số tháng lịch trong kỳ HĐ (mirror BE rentalPeriodPricing.contractBillingMonths). */
export function contractBillingMonths(
  startDate?: string | null,
  endDate?: string | null
): number {
  if (!startDate || !endDate) return 12
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 12
  }
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  if (end.getDate() < start.getDate()) {
    months -= 1
  }
  return Math.max(1, months)
}

type ContractBillingInput = Pick<
  ApiContract,
  'estimatedTotalAmount' | 'startDate' | 'endDate' | 'billingCycle'
>

export function deriveMonthlyRent(contract: ContractBillingInput): number {
  const total = parseContractAmount(contract.estimatedTotalAmount) ?? 0
  const months = contractBillingMonths(contract.startDate, contract.endDate)
  if (months <= 0) return Math.round(total)
  return Math.round(total / months)
}

/** Số tiền invoice đầu — khớp BE contractBilling.initialInvoiceAmount. */
export function initialInvoiceAmount(contract: ContractBillingInput): number | null {
  const total = parseContractAmount(contract.estimatedTotalAmount)
  if (total == null) return null
  if (contract.billingCycle === 'YEARLY') {
    return Math.round(total)
  }
  return deriveMonthlyRent(contract)
}

/** Cộng 1 tháng, giữ ngày trong tháng (31/1 → 28/2). */
export function addMonthSameCalendarDay(iso: string): Date {
  const d = new Date(iso)
  const day = d.getDate()
  const next = new Date(d)
  next.setMonth(next.getMonth() + 1)
  if (next.getDate() !== day) {
    next.setDate(0)
  }
  return next
}

function formatDateVi(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN')
}

export function recurringPaymentScheduleNote(
  contract: Pick<ApiContract, 'billingCycle' | 'status'>,
  activationDate?: string | null
): string | null {
  if (contract.billingCycle !== 'MONTHLY') return null

  if (contract.status === 'ACTIVE' && activationDate) {
    const next = addMonthSameCalendarDay(activationDate)
    return `Kỳ tiền thuê tiếp theo dự kiến: ${formatDateVi(next.toISOString())} (cùng ngày trong tháng sau ngày HĐ ACTIVE).`
  }

  return 'Các kỳ tiền thuê tiếp theo sẽ đến hạn cùng ngày trong tháng sau ngày HĐ được kích hoạt (ACTIVE).'
}

export function actualPaymentSubtitle(billingCycle?: string | null): string {
  if (billingCycle === 'YEARLY') {
    return 'Thanh toán một lần cho cả kỳ hợp đồng'
  }
  return 'Tiền thuê tháng đầu — thanh toán ngay sau khi ký'
}
