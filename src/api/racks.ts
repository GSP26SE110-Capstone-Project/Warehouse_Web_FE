import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiRack {
  rackId: string
  zoneId: string
  rackCode: string
  rackType?: string | null
  maxLevels?: number | null
  status?: string
  binCount?: number
  usedBinCount?: number
  maxLpnTotal?: number
  usedLpnTotal?: number
  usagePercent?: number
  hasBins?: boolean
}

export function listRacks(params: {
  zoneId: string
  status?: string
  page?: number
  limit?: number
  includeBinStats?: boolean
}) {
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

export type BulkCreateRacksResult = {
  items: ApiRack[]
  meta: { created: number; zoneId: string; remainingSlots: number }
}

export function createRacksBulk(body: {
  zoneId: string
  rackCodes: string[]
  status?: string
  rackType?: string
  maxLevels?: number
}) {
  return apiRequest<BulkCreateRacksResult>('/racks/bulk', { method: 'POST', body })
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
