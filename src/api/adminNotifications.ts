import { apiRequest } from './client'

export interface GuestAccountAlertItem {
  rentalRequestId: string
  requestCode: string
  status: string
  city: string
  district: string
  companyName: string
  contactEmail: string
  createdAt: string
}

export interface GuestAccountAlerts {
  pendingGuestCount: number
  approvedAwaitingAccountCount: number
  guestWithoutAccountCount: number
  recent: GuestAccountAlertItem[]
}

export function fetchGuestAccountAlerts() {
  return apiRequest<GuestAccountAlerts>('/admin/notifications/guest-account-alerts')
}

export interface WhPendingRentalAlertItem {
  rentalRequestId: string
  requestCode: string
  status: string
  city: string
  district: string
  companyName: string
  contactEmail: string
  createdAt: string
}

export interface WhPendingRentalAlerts {
  pendingCount: number
  warehouseName: string | null
  city: string | null
  district: string | null
  recent: WhPendingRentalAlertItem[]
}

export function fetchWhPendingRentalAlerts() {
  return apiRequest<WhPendingRentalAlerts>('/admin/notifications/wh-pending-rentals')
}
