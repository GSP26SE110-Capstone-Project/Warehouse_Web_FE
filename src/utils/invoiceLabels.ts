import type { ApiContractInvoice, InvoiceCategory, InvoicePaymentStatus } from '../api/types'

/** Chỉ tiền thuê trên màn HĐ — phụ phí OPERATIONAL pay tại inbound/outbound. */
export function isContractRentInvoice(category?: InvoiceCategory | null) {
  return category === 'INITIAL' || category === 'RECURRING_RENT'
}

export function isPendingRecurringRent(inv: ApiContractInvoice) {
  return inv.invoiceCategory === 'RECURRING_RENT' && inv.paymentStatus === 'PENDING'
}

export const INVOICE_CATEGORY_LABELS: Record<InvoiceCategory, string> = {
  INITIAL: 'Invoice đầu (tháng 1)',
  RECURRING_RENT: 'Tiền thuê tháng',
  OPERATIONAL: 'Phụ phí vận hành',
  APPENDIX_INITIAL: 'Phụ lục',
  TERMINATION_SETTLEMENT: 'Thanh toán chấm dứt',
}

export const INVOICE_PAYMENT_STATUS_LABELS: Record<InvoicePaymentStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  OVERDUE: 'Quá hạn',
  CANCELLED: 'Đã hủy',
}

export function invoiceCategoryLabel(category?: InvoiceCategory | null) {
  if (!category) return 'Hóa đơn'
  return INVOICE_CATEGORY_LABELS[category] ?? category
}

export function invoicePaymentStatusClass(status?: InvoicePaymentStatus | null) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25'
    case 'PENDING':
      return 'bg-orange-400/10 text-orange-300 ring-orange-400/25'
    case 'OVERDUE':
      return 'bg-red-400/10 text-red-300 ring-red-400/25'
    case 'CANCELLED':
      return 'bg-slate-400/10 text-slate-400 ring-slate-400/20'
    default:
      return 'bg-white/5 text-slate-400 ring-white/10'
  }
}
