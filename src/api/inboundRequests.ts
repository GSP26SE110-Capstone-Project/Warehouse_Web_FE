import { apiRequest, apiPaginated, buildQuery } from './client'
import type { ApiInboundDelivery } from './inboundDeliveries'
import type { DeliveryMode } from '../data/deliveryMode'
import type { ApiCommitmentWarning } from './contracts'

export type InboundStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'IN_TRANSIT'
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
  commitmentWarningJson?: {
    recordedAt?: string
    inboundRequestId?: string
    warnings?: ApiCommitmentWarning[]
  } | null
  createdAt?: string
  updatedAt?: string
}

export interface CompleteInboundResult extends ApiInboundRequest {
  commitmentWarnings?: ApiCommitmentWarning[]
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
    productKind?: string | null
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
  deliveryMode?: DeliveryMode
  assignedToMe?: boolean
  assignedDriverUserId?: string
  includeDelivery?: boolean
  page?: number
  limit?: number
}) {
  const q: Record<string, string | number | boolean | undefined> = { ...params }
  if (params?.assignedToMe) {
    q.assignedToMe = true
    delete q.assignedDriverUserId
  }
  return apiPaginated<ApiInboundRequestWithItems>(
    `/inbound-requests${buildQuery(q)}`
  )
}

export function reportInboundPickup(inboundRequestId: string) {
  return apiRequest<ApiInboundRequest>(
    `/inbound-requests/${inboundRequestId}/report-pickup`,
    { method: 'POST' }
  )
}

export function reportInboundArrival(inboundRequestId: string) {
  return apiRequest<ApiInboundRequest>(
    `/inbound-requests/${inboundRequestId}/report-arrival`,
    { method: 'POST' }
  )
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
    /** Tổng U = Σ (số cái × U/cái theo loại hàng + size SKU). */
    totalVolumeUnitsFromPieces?: number
    volumeBasedEstimate?: boolean
    avgVolumeUnitsPerPiece?: number
  }
  /** Phân bổ thùng cụ thể, vd. [{ boxType: 'LARGE', count: 188 }, { boxType: 'SMALL', count: 1 }]. */
  boxAllocation?: { boxType: string; count: number }[]
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
    contractZoneTypes?: string[]
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
  estimateUsage?: ApiInboundEstimateUsage | null
  batchCount: number
  canRevokeApproval: boolean
  canWarehouseCancel: boolean
  canWarehouseReject: boolean
}

export interface ApiInboundEstimateUsage {
  rentalRequestId: string
  requestCode: string | null
  estimatedBoxCount: number | null
  estimatedSkuCount: number | null
  cumulativePieces: number
  currentInboundPieces: number
  previousInboundPieces: number
  distinctSkus: number
  boxUtilizationPercent: number | null
  skuUtilizationPercent: number | null
  overageBoxes: number
  overageSkus: number
  softThresholdPercent: number
  hardThresholdPercent: number
  severity: 'ok' | 'near' | 'soft' | 'hard'
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
  /** Tạo kèm dòng SKU trong một transaction — tránh nhiều phiếu rỗng khi lỗi item. */
  items?: { skuId: string; expectedQuantity: number }[]
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
  return apiRequest<CompleteInboundResult>(`/inbound-requests/${inboundRequestId}/complete`, {
    method: 'POST',
    body: body ?? {},
  })
}

export interface PutawayAssignmentResult {
  lpnId: string
  lpnCode: string
  binId: string
  binCode: string
}

export function bulkPutawayInbound(
  inboundRequestId: string,
  body: {
    assignments: { lpnId: string; binId: string }[]
    movedBy?: string
  }
) {
  return apiRequest<{
    inboundRequestId: string
    putawayCount: number
    assignments: PutawayAssignmentResult[]
  }>(`/inbound-requests/${inboundRequestId}/bulk-putaway`, {
    method: 'POST',
    body,
  })
}

export function getInboundOperationalInvoice(inboundRequestId: string) {
  return apiRequest<import('./types').ApiContractInvoice | null>(
    `/inbound-requests/${inboundRequestId}/operational-invoice`
  )
}

export function autoPutawayInbound(
  inboundRequestId: string,
  body: {
    zoneId: string
    rackId?: string
    rackLevelId?: string
    movedBy?: string
  }
) {
  return apiRequest<{
    inboundRequestId: string
    putawayCount: number
    assignments: PutawayAssignmentResult[]
  }>(`/inbound-requests/${inboundRequestId}/auto-putaway`, {
    method: 'POST',
    body,
  })
}
