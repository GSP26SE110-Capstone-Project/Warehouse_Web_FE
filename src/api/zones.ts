import { apiPaginated, buildQuery } from './client'

export interface ApiZone {
  zoneId: string
  warehouseId: string
  zoneCode: string
  zoneName?: string | null
  zoneType?: string | null
  areaM2?: number | null
  isDedicated?: boolean
  status?: string
}

export function listZones(params: {
  warehouseId: string
  status?: string
  zoneType?: string
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiZone>(`/zones${buildQuery(params)}`)
}
