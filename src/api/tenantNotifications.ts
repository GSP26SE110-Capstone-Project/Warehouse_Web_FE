import { apiRequest } from './client'

export interface TenantTransportAlertItem {
  inboundRequestId: string
  inboundCode: string
  status: string
  expectedArrivalDate?: string | null
  actualArrivalAt?: string | null
  driverName?: string | null
  vehiclePlate?: string | null
  assignedAt?: string | null
}

export interface TenantTransportAlerts {
  assignedCount: number
  inTransitCount: number
  arrivedCount: number
  recent: TenantTransportAlertItem[]
}

export function fetchTenantInboundTransportAlerts() {
  return apiRequest<TenantTransportAlerts>('/admin/notifications/tenant-inbound-transport')
}

export interface TenantRentalAlertItem {
  rentalRequestId: string
  requestCode: string
  status: string
  city?: string | null
  district?: string | null
  warehouseName?: string | null
  rejectionReason?: string | null
  reviewedAt?: string | null
}

export interface TenantRentalAlerts {
  approvedCount: number
  rejectedCount: number
  recent: TenantRentalAlertItem[]
}

export function fetchTenantRentalStatusAlerts() {
  return apiRequest<TenantRentalAlerts>('/admin/notifications/tenant-rental-status')
}

export interface TenantContractAlertItem {
  contractId: string
  contractCode: string
  contractName?: string | null
  status: string
  estimatedTotalAmount?: number
  warehouseName?: string | null
  updatedAt?: string | null
}

export interface TenantContractAlerts {
  needsSignCount: number
  needsPaymentCount: number
  recent: TenantContractAlertItem[]
}

export function fetchTenantContractActionAlerts() {
  return apiRequest<TenantContractAlerts>('/admin/notifications/tenant-contract-actions')
}

export interface TenantRecurringRentAlertItem {
  contractId: string
  contractCode: string
  warehouseName?: string | null
  nextBillingDate?: string | null
  nextBillingDateLabel?: string | null
  daysUntilNextBilling?: number | null
  monthlyRent: number
  paymentStatus: string
  pendingInvoiceId?: string | null
  pendingInvoiceCode?: string | null
}

export interface TenantRecurringRentAlerts {
  dueSoonCount: number
  pendingRecurringCount: number
  reminderDays: number
  recent: TenantRecurringRentAlertItem[]
}

export function fetchTenantRecurringRentAlerts() {
  return apiRequest<TenantRecurringRentAlerts>('/admin/notifications/tenant-recurring-rent')
}
