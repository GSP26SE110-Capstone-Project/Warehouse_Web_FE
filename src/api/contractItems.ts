import { apiPaginated, buildQuery } from './client'

export interface ApiContractItem {
  contractItemId: string
  contractId: string
  appendixId?: string | null
  itemType: string
  storageLevel?: string | null
  billingUnit: string
  quantity?: number | string | null
  reservedQuantity?: number | null
  boxType?: string | null
  unitPrice: number | string
  createdAt?: string
}

export function listContractItems(contractId: string, params?: { page?: number; limit?: number }) {
  return apiPaginated<ApiContractItem>(
    `/contract-items${buildQuery({ contractId, limit: 100, ...params })}`
  )
}
