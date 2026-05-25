import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiRack {
  rackId: string
  zoneId: string
  rackCode: string
  rackType?: string | null
  maxLevels?: number | null
  status?: string
}

export function listRacks(params: { zoneId: string; status?: string; page?: number; limit?: number }) {
  return apiPaginated<ApiRack>(`/racks${buildQuery(params)}`)
}

export function getRack(rackId: string) {
  return apiRequest<ApiRack>(`/racks/${rackId}`)
}

export function createRack(body: {
  zoneId: string
  rackCode: string
  rackType?: string
  maxLevels?: number
  status?: string
}) {
  return apiRequest<ApiRack>('/racks', { method: 'POST', body })
}

export function updateRack(
  rackId: string,
  body: { rackType?: string; maxLevels?: number; status?: string }
) {
  return apiRequest<ApiRack>(`/racks/${rackId}`, { method: 'PATCH', body })
}

export function deleteRack(rackId: string) {
  return apiRequest<ApiRack>(`/racks/${rackId}`, { method: 'DELETE' })
}
