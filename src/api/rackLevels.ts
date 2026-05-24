import { apiPaginated, buildQuery } from './client'

export interface ApiRackLevel {
  rackLevelId: string
  rackId: string
  levelNo: number
  status?: string
}

export function listRackLevels(params: { rackId: string; page?: number; limit?: number }) {
  return apiPaginated<ApiRackLevel>(`/rack-levels${buildQuery(params)}`)
}
