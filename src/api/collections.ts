import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiCollection {
  collectionId: string
  tenantId: string
  collectionName: string
}

export function listCollections(params: { tenantId: string; page?: number; limit?: number }) {
  return apiPaginated<ApiCollection>(`/collections${buildQuery(params)}`)
}

export function createCollection(body: { tenantId: string; collectionName: string }) {
  return apiRequest<ApiCollection>('/collections', { method: 'POST', body })
}
