import { apiPaginated, buildQuery } from './client'

export interface ApiRack {
  rackId: string
  zoneId: string
  rackCode: string
  rackName?: string | null
  rackType?: string | null
  status?: string
}

export function listRacks(params: { zoneId: string; status?: string; page?: number; limit?: number }) {
  return apiPaginated<ApiRack>(`/racks${buildQuery(params)}`)
}
