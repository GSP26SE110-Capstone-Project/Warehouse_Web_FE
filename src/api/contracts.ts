import { apiRequest, apiPaginated, buildQuery } from './client'
import type { ApiContract } from './types'

export function listContracts(params?: { page?: number; limit?: number }) {
  return apiPaginated<ApiContract>(`/contracts${buildQuery(params ?? {})}`)
}

export function createContract(body: {
  tenantId: string
  warehouseId: string
  contractType: string
  pricingModel: string
  startDate: string
  endDate: string
  rentalRequestId?: string
  contractCode?: string
  contractName?: string
  billingCycle?: string
  estimatedTotalAmount?: number
  status?: string
}) {
  return apiRequest<ApiContract>('/contracts', { method: 'POST', body })
}
