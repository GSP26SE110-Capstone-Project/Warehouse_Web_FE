import { apiRequest } from './client'

export interface ApiOutboundDelivery {
  outboundDeliveryId: string
  outboundRequestId: string
  tenantId: string
  vehiclePlate?: string | null
  driverName?: string | null
  driverPhone?: string | null
  driverIdNumber?: string | null
  carrierName?: string | null
  shipToAddress?: string | null
  shipToCity?: string | null
  shipToDistrict?: string | null
  shipToContactName?: string | null
  shipToContactPhone?: string | null
  shipToNotes?: string | null
  assignedDriverUserId?: string | null
  deliveryStatus?: 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED'
  actualPickupAt?: string | null
  actualDeliveredAt?: string | null
  notes?: string | null
}

export function getOutboundDelivery(outboundRequestId: string) {
  return apiRequest<ApiOutboundDelivery | null>(
    `/outbound-requests/${outboundRequestId}/delivery`
  )
}

export function upsertOutboundDelivery(
  outboundRequestId: string,
  body: Partial<ApiOutboundDelivery> & { assignedDriverUserId?: string | null }
) {
  return apiRequest<ApiOutboundDelivery>(`/outbound-requests/${outboundRequestId}/delivery`, {
    method: 'PUT',
    body,
  })
}

export function reportOutboundPickup(outboundRequestId: string) {
  return apiRequest<{ outbound: unknown; delivery: ApiOutboundDelivery }>(
    `/outbound-requests/${outboundRequestId}/report-pickup`,
    { method: 'POST' }
  )
}

export function reportOutboundDelivery(outboundRequestId: string) {
  return apiRequest<{ outbound: unknown; delivery: ApiOutboundDelivery }>(
    `/outbound-requests/${outboundRequestId}/report-delivery`,
    { method: 'POST' }
  )
}
