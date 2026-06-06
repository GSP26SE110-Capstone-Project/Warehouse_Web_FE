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

export interface WhPendingInboundAlertItem {
  inboundRequestId: string
  inboundCode: string
  status: string
  expectedArrivalDate: string | null
  companyName: string
  createdAt: string
}

export interface WhPendingInboundAlerts {
  pendingCount: number
  warehouseName: string | null
  recent: WhPendingInboundAlertItem[]
}

export interface WhArrivedInboundAlertItem {
  inboundRequestId: string
  inboundCode: string
  status: string
  actualArrivalAt: string | null
  vehiclePlate: string | null
  driverName: string | null
  companyName: string
}

export interface WhArrivedInboundAlerts {
  arrivedCount: number
  warehouseName: string | null
  recent: WhArrivedInboundAlertItem[]
}

export function fetchWhPendingInboundAlerts() {
  return apiRequest<WhPendingInboundAlerts>('/admin/notifications/wh-pending-inbounds')
}

export function fetchWhArrivedInboundAlerts() {
  return apiRequest<WhArrivedInboundAlerts>('/admin/notifications/wh-arrived-inbounds')
}

export interface WhInTransitInboundAlertItem {
  inboundRequestId: string
  inboundCode: string
  status: string
  actualPickupAt: string | null
  vehiclePlate: string | null
  driverName: string | null
  pickupAddress: string | null
  companyName: string
}

export interface WhInTransitInboundAlerts {
  inTransitCount: number
  warehouseName: string | null
  recent: WhInTransitInboundAlertItem[]
}

export function fetchWhInTransitInboundAlerts() {
  return apiRequest<WhInTransitInboundAlerts>('/admin/notifications/wh-in-transit-inbounds')
}

export interface WhContractPaymentAlertItem {
  contractId: string
  contractCode: string
  contractName: string | null
  companyName: string
  invoiceCode: string
  totalAmount: number
  paidAt: string
}

export interface WhContractPaymentAlerts {
  recentCount: number
  warehouseName: string | null
  recent: WhContractPaymentAlertItem[]
}

export function fetchWhContractPaymentAlerts() {
  return apiRequest<WhContractPaymentAlerts>('/admin/notifications/wh-contract-payments')
}

export interface WhPendingAppendixAlertItem {
  appendixId: string
  appendixCode: string
  status: string
  title: string | null
  contractId: string
  contractCode: string
  companyName: string
  createdAt: string
}

export interface WhPendingAppendixAlerts {
  pendingCount: number
  warehouseName: string | null
  recent: WhPendingAppendixAlertItem[]
}

export function fetchWhPendingAppendixAlerts() {
  return apiRequest<WhPendingAppendixAlerts>('/admin/notifications/wh-pending-appendices')
}
