import { apiRequest, apiPaginated, buildQuery } from './client'

export type ShipmentStatus = 'READY' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export interface ApiShipment {
  shipmentId: string
  tenantId: string
  outboundRequestId: string
  shipmentCode?: string | null
  carrierName?: string | null
  trackingNumber?: string | null
  vehiclePlate?: string | null
  driverName?: string | null
  driverPhone?: string | null
  driverIdNumber?: string | null
  status?: ShipmentStatus
  shippedAt?: string | null
  deliveredAt?: string | null
}

export function listShipments(params?: {
  tenantId?: string
  outboundRequestId?: string
  status?: string
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiShipment>(`/shipments${buildQuery(params ?? {})}`)
}

export function createShipment(body: {
  tenantId: string
  outboundRequestId: string
  carrierName?: string
  trackingNumber?: string
  vehiclePlate?: string
  driverName?: string
  driverPhone?: string
  driverIdNumber?: string
}) {
  return apiRequest<ApiShipment>('/shipments', { method: 'POST', body })
}

export function updateShipment(
  shipmentId: string,
  body: Partial<{
    carrierName: string
    trackingNumber: string
    vehiclePlate: string
    driverName: string
    driverPhone: string
    driverIdNumber: string
    status: ShipmentStatus
  }>
) {
  return apiRequest<ApiShipment>(`/shipments/${shipmentId}`, { method: 'PATCH', body })
}
