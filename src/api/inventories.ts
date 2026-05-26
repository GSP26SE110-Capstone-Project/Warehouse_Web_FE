import { apiPaginated, buildQuery } from './client'

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
}

export function listInventories(params?: {
  tenantId?: string
  skuId?: string
  batchId?: string
  lpnId?: string
  binId?: string
  status?: string
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiInventory>(`/inventories${buildQuery(params ?? {})}`)
}
