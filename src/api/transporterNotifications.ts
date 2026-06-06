import { apiRequest } from './client'

export interface TransporterTripAlertItem {
  inboundRequestId: string
  inboundCode: string
  status: string
  expectedArrivalDate?: string | null
  vehiclePlate?: string | null
  companyName?: string | null
  assignedAt?: string | null
}

export interface TransporterTripAlerts {
  assignedCount: number
  inTransitCount: number
  recent: TransporterTripAlertItem[]
}

export function fetchTransporterTripAlerts() {
  return apiRequest<TransporterTripAlerts>('/admin/notifications/transporter-trips')
}
