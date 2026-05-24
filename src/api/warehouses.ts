import { apiRequest, apiPaginated, buildQuery } from './client'
import type { ApiWarehouse, WarehouseStatus } from './types'

export function listWarehouses(params?: {
  status?: WarehouseStatus
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiWarehouse>(`/warehouses${buildQuery(params ?? {})}`)
}

export function getWarehouse(warehouseId: string) {
  return apiRequest<ApiWarehouse>(`/warehouses/${warehouseId}`)
}

export function createWarehouse(body: {
  warehouseCode: string
  warehouseName: string
  address?: string
  city?: string
  district?: string
  totalAreaM2?: number
  usableAreaM2?: number
  status?: WarehouseStatus
}) {
  return apiRequest<ApiWarehouse>('/warehouses', {
    method: 'POST',
    body,
  })
}

export function updateWarehouse(
  warehouseId: string,
  body: {
    warehouseName?: string
    address?: string
    city?: string
    district?: string
    totalAreaM2?: number
    usableAreaM2?: number
    status?: WarehouseStatus
  }
) {
  return apiRequest<ApiWarehouse>(`/warehouses/${warehouseId}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteWarehouse(warehouseId: string) {
  return apiRequest<ApiWarehouse>(`/warehouses/${warehouseId}`, {
    method: 'DELETE',
  })
}
