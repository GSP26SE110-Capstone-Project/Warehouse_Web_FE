import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiSeason {
  seasonId: string
  seasonName: string
}

export function listSeasons(params?: { page?: number; limit?: number }) {
  return apiPaginated<ApiSeason>(`/seasons${buildQuery(params ?? {})}`)
}

export function getSeason(seasonId: string) {
  return apiRequest<ApiSeason>(`/seasons/${seasonId}`)
}

export function createSeason(body: { seasonName: string }) {
  return apiRequest<ApiSeason>('/seasons', { method: 'POST', body })
}

export function updateSeason(seasonId: string, body: { seasonName: string }) {
  return apiRequest<ApiSeason>(`/seasons/${seasonId}`, { method: 'PATCH', body })
}

export function deleteSeason(seasonId: string) {
  return apiRequest<ApiSeason>(`/seasons/${seasonId}`, { method: 'DELETE' })
}
