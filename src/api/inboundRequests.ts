import { apiRequest, apiPaginated, buildQuery } from './client'
import type { ApiInboundDelivery } from './inboundDeliveries'
import type { DeliveryMode } from '../data/deliveryMode'

export type InboundStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'ARRIVED'
  | 'RECEIVING'
  | 'COMPLETED'
  | 'CANCELLED'

export interface ApiInboundRequest {
  inboundRequestId: string
  tenantId: string
  contractId: string
  warehouseId: string
  inboundCode: string
  deliveryMode?: DeliveryMode | null
  expectedArrivalDate?: string | null
  actualArrivalAt?: string | null
  status: InboundStatus
  createdBy?: string | null
  approvedBy?: string | null
  receivedBy?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ApiInboundRequestItem {
  inboundRequestItemId: string
  inboundRequestId: string
  skuId: string
  expectedQuantity: number
  receivedQuantity?: number
  discrepancyQuantity?: number
  createdAt?: string
  sku?: {
    skuId: string
    skuCode: string
    productName: string
    color?: string | null
    size?: string | null
  }
}

export interface ApiInboundRequestWithItems extends ApiInboundRequest {
  items?: ApiInboundRequestItem[]
  delivery?: ApiInboundDelivery | null
}

export function listInboundRequests(params?: {
  tenantId?: string
  warehouseId?: string
  contractId?: string
  status?: string
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiInboundRequest>(`/inbound-requests${buildQuery(params ?? {})}`)
}

export interface ApiInboundApprovalReadiness {
  inboundRequestId: string
  status: InboundStatus
  warehouseId: string
  totalExpectedPieces: number
  inboundLineCount: number
  assumptions: {
    piecesPerLpn: number
    volumeUnitsPerLpn: number
    boxType: string
    binMaxLpnCount?: number
    binMaxVolumeUnits?: number
  }
  estimatedLpnNeeded: number
  estimatedVolumeUnitsNeeded: number
  estimatedBinsNeeded?: number
  warehouseStorage: {
    totalBins: number
    putawayEligibleBins: number
    emptyBins: number
    freeLpnSlots: number
    freeVolumeUnits: number
  }
  sufficient: boolean
  sufficientLpnSlots: boolean
  sufficientVolume: boolean
  boxTypeCapacity: Record<
    string,
    {
      candidateBins: number
      totalFreeLpnSlots: number
      totalFreeVolumeUnits: number
      volumeUnits: number
    }
  >
  boxTypeSuggestion: {
    recommendedBoxType: string
    reason: string
  }
  pricingEstimate: {
    hasPricing: boolean
    inboundLpnUnitPrice: number | null
    handlingUnitPrice: number | null
    storageBoxDayUnitPrice?: number | null
    billingDaysPerMonth?: number
    estimatedAvgBoxesForMonth?: number
    estimatedInboundLpnCost: number | null
    estimatedHandlingCost: number | null
    estimatedOneTimeOpsCost?: number | null
    estimatedMonthlyStorageCost?: number | null
    estimatedFirstMonthTotal?: number | null
    estimatedTotalCost: number | null
    currency: string
    usedFallback?: boolean
  }
  warnings: string[]
  batchCount: number
  canRevokeApproval: boolean
  canWarehouseCancel: boolean
  canWarehouseReject: boolean
}

export function getApprovalReadiness(inboundRequestId: string) {
  return apiRequest<ApiInboundApprovalReadiness>(
    `/inbound-requests/${inboundRequestId}/approval-readiness`
  )
}

export function getInboundRequest(
  inboundRequestId: string,
  options?: { includeItems?: boolean; includeDelivery?: boolean }
) {
  return apiRequest<ApiInboundRequestWithItems>(
    `/inbound-requests/${inboundRequestId}${buildQuery({
      includeItems: options?.includeItems ? 'true' : undefined,
      includeDelivery: options?.includeDelivery ? 'true' : undefined,
    })}`
  )
}

export function createInboundRequest(body: {
  tenantId: string
  contractId: string
  warehouseId: string
  deliveryMode?: DeliveryMode
  expectedArrivalDate?: string
  status?: InboundStatus
  createdBy?: string
}) {
  return apiRequest<ApiInboundRequest>('/inbound-requests', { method: 'POST', body })
}

export function updateInboundRequest(
  inboundRequestId: string,
  body: {
    deliveryMode?: DeliveryMode
    expectedArrivalDate?: string | null
    actualArrivalAt?: string | null
    status?: InboundStatus
    approvedBy?: string | null
    receivedBy?: string | null
  }
) {
  return apiRequest<ApiInboundRequest>(`/inbound-requests/${inboundRequestId}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteInboundRequest(inboundRequestId: string) {
  return apiRequest<ApiInboundRequest>(`/inbound-requests/${inboundRequestId}`, {
    method: 'DELETE',
  })
}

export function listInboundItems(inboundRequestId: string, params?: { page?: number; limit?: number }) {
  return apiPaginated<ApiInboundRequestItem>(
    `/inbound-requests/${inboundRequestId}/items${buildQuery(params ?? {})}`
  )
}

export function createInboundItem(
  inboundRequestId: string,
  body: { skuId: string; expectedQuantity: number }
) {
  return apiRequest<ApiInboundRequestItem>(`/inbound-requests/${inboundRequestId}/items`, {
    method: 'POST',
    body,
  })
}

export function updateInboundItem(
  inboundRequestItemId: string,
  body: {
    expectedQuantity?: number
    receivedQuantity?: number
    discrepancyQuantity?: number
  }
) {
  return apiRequest<ApiInboundRequestItem>(`/inbound-request-items/${inboundRequestItemId}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteInboundItem(inboundRequestItemId: string) {
  return apiRequest<ApiInboundRequestItem>(`/inbound-request-items/${inboundRequestItemId}`, {
    method: 'DELETE',
  })
}

export function startReceiving(inboundRequestId: string, body?: { receivedBy?: string }) {
  return apiRequest<ApiInboundRequest>(`/inbound-requests/${inboundRequestId}/start-receiving`, {
    method: 'POST',
    body: body ?? {},
  })
}

export function completeReceiving(
  inboundRequestId: string,
  body?: {
    items?: { inboundRequestItemId: string; receivedQuantity: number }[]
  }
) {
  return apiRequest<{
    inboundRequestId: string
    status: string
    items: ApiInboundRequestItem[]
    message: string
  }>(`/inbound-requests/${inboundRequestId}/complete-receiving`, {
    method: 'POST',
    body: body ?? {},
  })
}

export function completeInbound(inboundRequestId: string, body?: { receivedBy?: string }) {
  return apiRequest<ApiInboundRequest>(`/inbound-requests/${inboundRequestId}/complete`, {
    method: 'POST',
    body: body ?? {},
  })
}
