import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiBin {
  binId: string
  rackLevelId: string
  binCode: string
  reservationType?: string
  status?: string
  supportedBoxType?: string | null
  maxLpnCount?: number
  currentLpnCount?: number
  maxVolumeUnits?: number
  usedVolumeUnits?: number
}

export function getBin(binId: string) {
  return apiRequest<ApiBin>(`/bins/${binId}`)
}

export function listBins(params: {
  rackLevelId: string
  status?: string
  reservationType?: string
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiBin>(`/bins${buildQuery(params)}`)
}

export function createBin(body: {
  rackLevelId: string
  binCode: string
  maxLpnCount: number
  maxVolumeUnits: number
  supportedBoxType?: string
  maxOwnerCount?: number
  reservationType?: string
  status?: string
}) {
  return apiRequest<ApiBin>('/bins', { method: 'POST', body })
}

export function updateBin(
  binId: string,
  body: {
    reservationType?: string
    status?: string
    maxLpnCount?: number
    maxVolumeUnits?: number
    maxOwnerCount?: number
  }
) {
  return apiRequest<ApiBin>(`/bins/${binId}`, { method: 'PATCH', body })
}
