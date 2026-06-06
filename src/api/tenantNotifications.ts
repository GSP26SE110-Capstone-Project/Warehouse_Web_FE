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
