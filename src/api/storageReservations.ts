import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiStorageReservation {
  reservationId: string
  contractId: string
  tenantId: string
  reservationType: string
  storageLevel: string
  warehouseId?: string
  zoneId?: string | null
  rackId?: string | null
  rackLevelId?: string | null
  binId?: string | null
  startDate: string
  endDate: string
  status: string
  reservedCapacity?: number | string | null
  warehouseCode?: string | null
  warehouseName?: string | null
  zoneCode?: string | null
  zoneName?: string | null
  rackCode?: string | null
  levelNumber?: number | null
  binCode?: string | null
}

export function listStorageReservations(params?: {
  contractId?: string
  tenantId?: string
  warehouseId?: string
  status?: string
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiStorageReservation>(
    `/storage-reservations${buildQuery(params ?? {})}`
  )
}

export function createStorageReservation(body: {
  contractId: string
  reservationType: string
  storageLevel: string
  warehouseId: string
  zoneId?: string
  rackId?: string
  rackLevelId?: string
  binId?: string
  reservedCapacity?: number
  startDate: string
  endDate: string
  status?: string
}) {
  return apiRequest<ApiStorageReservation>('/storage-reservations', { method: 'POST', body })
}
