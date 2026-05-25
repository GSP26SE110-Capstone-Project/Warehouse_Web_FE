import { apiPaginated, buildQuery } from './client'

export interface ApiCategory {
  categoryId: string
  categoryName: string
}

export function listCategories(params?: { page?: number; limit?: number }) {
  return apiPaginated<ApiCategory>(`/categories${buildQuery(params ?? {})}`)
}
