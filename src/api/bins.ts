import { apiPaginated, buildQuery } from './client'

export interface ApiBin {
  binId: string
  rackLevelId: string
  binCode: string
  reservationType?: string
  status?: string
  supportedBoxType?: string | null
  maxLpnCount?: number
  currentLpnCount?: number
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
