import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiZone {
  zoneId: string
  warehouseId: string
  zoneCode: string
  zoneName?: string | null
  zoneType?: string | null
  areaM2?: number | null
  isDedicated?: boolean
  status?: string
  /** Rack ACTIVE đã tạo trong zone */
  rackCount?: number
  /** Gợi ý tối đa rack theo diện tích (sau trừ lối đi) */
  maxRacks?: number
  totalBinSlots?: number
  /** ≈ totalBinSlots × LPN cỡ lớn nhất theo zoneType (SHARED→EXTRA, PRIVATE/PREMIUM→LARGE) */
  estimatedLpnCapacity?: number
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

export function createZonesBulk(body: {
  warehouseId: string
  count?: number
  areaM2PerZone?: number
  zoneCodePrefix?: string
  zoneNamePrefix?: string
  zoneType?: string
  isDedicated?: boolean
  status?: string
  zones?: Array<{ zoneCode: string; zoneName?: string; areaM2?: number }>
}) {
  return apiRequest<{ items: ApiZone[]; count: number }>('/zones/bulk', {
    method: 'POST',
    body,
  })
}

export function getZonePlanning(warehouseId: string) {
  return apiRequest<import('./warehouses').ApiWarehouseZonePlanning>(
    `/zones/planning${buildQuery({ warehouseId })}`
  )
}

export function createZone(body: {
  warehouseId: string
  zoneCode: string
  zoneName?: string
  zoneType?: string
  areaM2?: number
  isDedicated?: boolean
  status?: string
}) {
  return apiRequest<ApiZone>('/zones', { method: 'POST', body })
}

export function updateZone(
  zoneId: string,
  body: {
    zoneName?: string
    zoneType?: string
    areaM2?: number
    isDedicated?: boolean
    status?: string
  }
) {
  return apiRequest<ApiZone>(`/zones/${zoneId}`, { method: 'PATCH', body })
}

export function deleteZone(zoneId: string) {
  return apiRequest<ApiZone>(`/zones/${zoneId}`, { method: 'DELETE' })
}
