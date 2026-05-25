import { apiPaginated, buildQuery } from './client'

export interface ApiSeason {
  seasonId: string
  seasonName: string
}

export function listSeasons(params?: { page?: number; limit?: number }) {
  return apiPaginated<ApiSeason>(`/seasons${buildQuery(params ?? {})}`)
}
