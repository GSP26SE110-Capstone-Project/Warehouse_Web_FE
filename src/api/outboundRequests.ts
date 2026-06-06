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
}

export interface ApiPickingTaskItem {
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
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiOutboundRequest>(
    `/outbound-requests${buildQuery({
      ...params,
      assignedPickerMe: params?.assignedPickerMe ? 'true' : undefined,
    })}`
  )
}

export function getOutboundRequest(
  outboundRequestId: string,
  options?: { includeItems?: boolean }
) {
  return apiRequest<ApiOutboundRequestWithItems>(
    `/outbound-requests/${outboundRequestId}${buildQuery({
      includeItems: options?.includeItems ? 'true' : undefined,
    })}`
  )
}

export function createOutboundRequest(body: {
  tenantId: string
  contractId: string
  warehouseId: string
  requestedShipDate?: string
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

export function assignOutboundPicker(
  outboundRequestId: string,
  body: { assignedPickerUserId: string }
) {
  return apiRequest<OutboundPickingTasksResponse>(
    `/outbound-requests/${outboundRequestId}/picking-tasks/assign`,
    { method: 'PATCH', body }
  )
}
