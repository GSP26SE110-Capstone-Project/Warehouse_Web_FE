import { apiRequest } from './client'

export interface ApiInboundDelivery {
  inboundDeliveryId: string
  inboundRequestId: string
  tenantId: string
  vehiclePlate?: string | null
  driverName?: string | null
  driverPhone?: string | null
  driverIdNumber?: string | null
  carrierName?: string | null
  scheduledAt?: string | null
  notes?: string | null
  assignedDriverUserId?: string | null
  pickupAddress?: string | null
  pickupCity?: string | null
  pickupDistrict?: string | null
  pickupContactName?: string | null
  pickupContactPhone?: string | null
  pickupNotes?: string | null
  actualPickupAt?: string | null
}

export type InboundDeliveryPayload = {
  vehiclePlate?: string
  driverName?: string
  driverPhone?: string
  driverIdNumber?: string
  carrierName?: string
  scheduledAt?: string
  notes?: string
  assignedDriverUserId?: string | null
  pickupAddress?: string
  pickupCity?: string
  pickupDistrict?: string
  pickupContactName?: string
  pickupContactPhone?: string
  pickupNotes?: string
}

export function getInboundDelivery(inboundRequestId: string) {
  return apiRequest<ApiInboundDelivery | null>(
    `/inbound-requests/${inboundRequestId}/delivery`
  )
}

export function upsertInboundDelivery(
  inboundRequestId: string,
  body: InboundDeliveryPayload
) {
  return apiRequest<ApiInboundDelivery>(`/inbound-requests/${inboundRequestId}/delivery`, {
    method: 'PUT',
    body,
  })
}
