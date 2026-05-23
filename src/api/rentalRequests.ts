import { apiRequest, apiPaginated, buildQuery } from './client'
import type { ApiRentalRequest, RentalRequestStatus } from './types'

export function listRentalRequests(params?: {
  warehouseId?: string
  status?: RentalRequestStatus
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiRentalRequest>(`/rental-requests${buildQuery(params ?? {})}`)
}

export function updateRentalRequest(
  rentalRequestId: string,
  body: {
    status?: RentalRequestStatus
    rejectionReason?: string
    reviewNote?: string
  }
) {
  return apiRequest<ApiRentalRequest>(`/rental-requests/${rentalRequestId}`, {
    method: 'PATCH',
    body,
  })
}
