import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiRackLevel {
  rackLevelId: string
  rackId: string
  levelCode?: string | null
  levelNumber: number
  maxBins?: number | null
  maxWeightKg?: number | null
  heightCm?: number | null
  levelPriority?: number | null
}

export function listRackLevels(params: { rackId: string; page?: number; limit?: number }) {
  return apiPaginated<ApiRackLevel>(`/rack-levels${buildQuery(params)}`)
}

export function createRackLevel(body: {
  rackId: string
  levelNumber: number
  levelCode?: string
  maxBins?: number
  maxWeightKg?: number
  heightCm?: number
  levelPriority?: number
}) {
  return apiRequest<ApiRackLevel>('/rack-levels', { method: 'POST', body })
}

export function deleteRackLevel(rackLevelId: string) {
  return apiRequest<ApiRackLevel>(`/rack-levels/${rackLevelId}`, { method: 'DELETE' })
}
