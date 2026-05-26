import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiBatch {
  batchId: string
  inboundRequestId: string
  batchCode: string
  warehouseReceivedAt: string
  createdAt?: string
}

export function listBatches(params?: { inboundRequestId?: string; page?: number; limit?: number }) {
  return apiPaginated<ApiBatch>(`/batches${buildQuery(params ?? {})}`)
}

export function createBatch(body: {
  inboundRequestId: string
  batchCode: string
  warehouseReceivedAt?: string
}) {
  return apiRequest<ApiBatch>('/batches', { method: 'POST', body })
}
