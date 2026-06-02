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

export type BulkCreateBinEntry = {
  rackLevelId: string
  binCode: string
  maxLpnCount?: number
  maxVolumeUnits?: number
  reservationType?: string
  status?: string
}

export type BulkCreateBinsResult = {
  items: ApiBin[]
  meta: { created: number }
}

export function createBinsBulk(body: {
  bins: BulkCreateBinEntry[]
  maxLpnCount?: number
  maxVolumeUnits?: number
  reservationType?: string
  status?: string
}) {
  return apiRequest<BulkCreateBinsResult>('/bins/bulk', { method: 'POST', body })
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

export function deleteBin(binId: string) {
  return apiRequest<ApiBin>(`/bins/${binId}`, { method: 'DELETE' })
}

export type BulkDeleteBinsResult = {
  items: ApiBin[]
  meta: { deleted: number; failed: number }
  failed?: { binId: string; message: string; code?: string }[]
}

export function deleteBinsBulk(body: { binIds: string[] }) {
  return apiRequest<BulkDeleteBinsResult>('/bins/bulk-delete', { method: 'POST', body })
}
