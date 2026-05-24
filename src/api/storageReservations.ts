import { apiRequest } from './client'

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
