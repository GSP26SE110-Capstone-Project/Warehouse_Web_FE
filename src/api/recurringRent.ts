import { apiRequest } from './client'

export type RecurringRentPaymentStatus =
  | 'UPCOMING'
  | 'DUE_SOON'
  | 'PENDING_INVOICE'
  | 'UNKNOWN'

export interface RecurringRentPendingInvoice {
  invoiceId: string
  invoiceCode: string
  totalAmount: number
  paymentStatus: string
  dueDate?: string | null
  issuedAt?: string | null
  billingStartDate?: string | null
  billingEndDate?: string | null
}

export interface RecurringRentOverviewItem {
  contractId: string
  contractCode: string
  contractName?: string | null
  warehouseId: string
  warehouseName?: string | null
  warehouseCode?: string | null
  startDate?: string | null
  endDate?: string | null
  monthlyRent: number
  billingDayOfMonth?: number | null
  nextBillingDate?: string | null
  nextBillingDateLabel?: string | null
  daysUntilNextBilling?: number | null
  reminderDays: number
  paymentDueDays: number
  paymentStatus: RecurringRentPaymentStatus
  pendingInvoice?: RecurringRentPendingInvoice | null
}

export interface RecurringRentOverview {
  reminderDays: number
  dueSoonCount: number
  pendingInvoiceCount: number
  items: RecurringRentOverviewItem[]
}

export function fetchRecurringRentOverview() {
  return apiRequest<RecurringRentOverview>('/contracts/recurring-rent/overview')
}
