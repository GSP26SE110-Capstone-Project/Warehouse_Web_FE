import { apiRequest, apiPaginated, buildQuery } from './client'

export type OutboundStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'RESERVED'
  | 'PICKING'
  | 'PACKING'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED'

export interface ApiOutboundRequest {
  outboundRequestId: string
  tenantId: string
  contractId: string
  warehouseId: string
  outboundCode: string
  requestedShipDate?: string | null
  actualShippedAt?: string | null
  status: OutboundStatus
  deliveryMode?: 'TENANT_SELF' | 'WAREHOUSE_TRANSPORT'
  createdBy?: string | null
  approvedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ApiOutboundRequestItem {
  outboundRequestItemId: string
  outboundRequestId: string
  skuId: string
  requestedQuantity: number
  allocatedQuantity?: number | null
  pickedQuantity?: number | null
  sku?: {
    skuId: string
    skuCode: string
    productName: string
    color?: string | null
    size?: string | null
  }
}

export type ApiOutboundRequestWithItems = ApiOutboundRequest & {
  items: ApiOutboundRequestItem[]
  delivery?: import('./outboundDeliveries').ApiOutboundDelivery | null
}

export interface ApiPickingTaskItem {
  fifoOrder?: number
  pickingTaskItemId: string
  pickingTaskId: string
  inventoryId: string
  lpnId: string
  binId: string
  batchId: string
  quantityToPick: number
  pickedQuantity?: number | null
  lpnCode?: string
  binCode?: string
  batchCode?: string
  skuId?: string
  skuCode?: string
  productName?: string
  size?: string | null
  color?: string | null
}

export interface OutboundFifoAllocationRow {
  fifoOrder: number
  outboundRequestItemId: string
  skuId: string
  skuCode?: string
  productName?: string
  size?: string | null
  color?: string | null
  inventoryId: string
  lpnId: string
  lpnCode?: string
  binId: string
  binCode?: string
  batchId: string
  batchCode?: string
  quantityToPick: number
  receivedAt?: string | null
  warehouseReceivedAt?: string | null
}

export interface OutboundFifoPreviewResponse {
  outboundRequestId: string
  outboundStatus: OutboundStatus
  fifoPolicy: string
  sufficient: boolean
  lines: {
    outboundRequestItemId: string
    skuId: string
    skuCode?: string
    productName?: string
    requestedQuantity: number
    allocatedQuantity: number
    shortBy: number
    allocations: OutboundFifoAllocationRow[]
  }[]
  allocations: OutboundFifoAllocationRow[]
}

export interface ApiPickingTask {
  pickingTaskId: string
  outboundRequestId: string
  assignedTo?: string | null
  status: string
  createdAt?: string | null
  updatedAt?: string | null
  items: ApiPickingTaskItem[]
}

export interface OutboundPickingTasksResponse {
  outboundRequestId: string
  outboundStatus: OutboundStatus
  hint?: string
  tasks: ApiPickingTask[]
}

export function listOutboundRequests(params?: {
  tenantId?: string
  warehouseId?: string
  contractId?: string
  status?: OutboundStatus
  assignedPickerMe?: boolean
  assignedToMe?: boolean
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiOutboundRequest>(
    `/outbound-requests${buildQuery({
      ...params,
      assignedPickerMe: params?.assignedPickerMe ? 'true' : undefined,
      assignedToMe: params?.assignedToMe ? 'true' : undefined,
    })}`
  )
}

export function getOutboundRequest(
  outboundRequestId: string,
  options?: { includeItems?: boolean; includeDelivery?: boolean }
) {
  return apiRequest<ApiOutboundRequestWithItems>(
    `/outbound-requests/${outboundRequestId}${buildQuery({
      includeItems: options?.includeItems ? 'true' : undefined,
      includeDelivery: options?.includeDelivery ? 'true' : undefined,
    })}`
  )
}

export function createOutboundRequest(body: {
  tenantId: string
  contractId: string
  warehouseId: string
  requestedShipDate?: string
  deliveryMode?: 'TENANT_SELF' | 'WAREHOUSE_TRANSPORT'
  status?: OutboundStatus
  items?: { skuId: string; requestedQuantity: number }[]
}) {
  return apiRequest<ApiOutboundRequestWithItems>('/outbound-requests', {
    method: 'POST',
    body,
  })
}

export function updateOutboundRequest(
  outboundRequestId: string,
  body: {
    status?: OutboundStatus
    requestedShipDate?: string | null
    actualShippedAt?: string | null
    assignedPickerUserId?: string
  }
) {
  return apiRequest<ApiOutboundRequest>(`/outbound-requests/${outboundRequestId}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteOutboundRequest(outboundRequestId: string) {
  return apiRequest<ApiOutboundRequest>(`/outbound-requests/${outboundRequestId}`, {
    method: 'DELETE',
  })
}

export function listOutboundItems(outboundRequestId: string) {
  return apiPaginated<ApiOutboundRequestItem>(
    `/outbound-requests/${outboundRequestId}/items${buildQuery({ limit: 100 })}`
  )
}

export function addOutboundItem(
  outboundRequestId: string,
  body: { skuId: string; requestedQuantity: number }
) {
  return apiRequest<ApiOutboundRequestItem>(
    `/outbound-requests/${outboundRequestId}/items`,
    { method: 'POST', body }
  )
}

export function listOutboundPickingTasks(outboundRequestId: string) {
  return apiRequest<OutboundPickingTasksResponse>(
    `/outbound-requests/${outboundRequestId}/picking-tasks`
  )
}

export function getOutboundOperationalInvoice(outboundRequestId: string) {
  return apiRequest<import('./types').ApiContractInvoice | null>(
    `/outbound-requests/${outboundRequestId}/operational-invoice`
  )
}

export function previewOutboundFifoAllocation(outboundRequestId: string) {
  return apiRequest<OutboundFifoPreviewResponse>(
    `/outbound-requests/${outboundRequestId}/fifo-preview`
  )
}

export function assignOutboundPicker(
  outboundRequestId: string,
  body: { assignedPickerUserId: string }
) {
  return apiRequest<OutboundPickingTasksResponse>(
    `/outbound-requests/${outboundRequestId}/picking-tasks/assign`,
    { method: 'PATCH', body }
  )
}
