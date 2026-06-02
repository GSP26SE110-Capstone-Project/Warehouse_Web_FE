import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiInventory {
  inventoryId: string
  tenantId: string
  skuId: string
  batchId: string
  lpnId: string
  binId: string
  quantity: number
  reservedQuantity?: number
  availableQuantity?: number
  status?: string
  receivedAt?: string | null
  sku?: { skuId: string; skuCode: string; productName: string }
  lpnCode?: string
  binCode?: string
  batchCode?: string
}

export interface ApiInventoryMovement {
  movementId: string
  inventoryId: string
  movementType: string
  fromBinId?: string | null
  toBinId?: string | null
  quantity: number
  movedAt?: string
  note?: string | null
}

export function listInventories(params?: {
  tenantId?: string
  warehouseId?: string
  skuId?: string
  batchId?: string
  lpnId?: string
  binId?: string
  inboundRequestId?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiInventory>(`/inventories${buildQuery(params ?? {})}`)
}

export function getInventory(inventoryId: string) {
  return apiRequest<ApiInventory>(`/inventories/${inventoryId}`)
}

export function listInventoryMovements(
  inventoryId: string,
  params?: { page?: number; limit?: number }
) {
  return apiPaginated<ApiInventoryMovement>(
    `/inventories/${inventoryId}/movements${buildQuery(params ?? {})}`
  )
}
