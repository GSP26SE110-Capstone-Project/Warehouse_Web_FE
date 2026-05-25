import { apiRequest, apiPaginated, buildQuery } from './client'
import type { ApiContract } from './types'

export function getContract(contractId: string) {
  return apiRequest<ApiContract>(`/contracts/${contractId}`)
}

export function listContracts(params?: {
  tenantId?: string
  warehouseId?: string
  rentalRequestId?: string
  status?: string
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiContract>(`/contracts${buildQuery(params ?? {})}`)
}

export function updateContract(
  contractId: string,
  body: {
    status?: string
    contractName?: string
    billingCycle?: string
    estimatedTotalAmount?: number
    tenantSignature?: string
    warehouseSignature?: string
    startDate?: string
    endDate?: string
  }
) {
  return apiRequest<ApiContract>(`/contracts/${contractId}`, { method: 'PATCH', body })
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
