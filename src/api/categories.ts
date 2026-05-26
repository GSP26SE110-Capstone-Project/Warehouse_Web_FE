import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiCategory {
  categoryId: string
  categoryName: string
}

export function listCategories(params?: { page?: number; limit?: number }) {
  return apiPaginated<ApiCategory>(`/categories${buildQuery(params ?? {})}`)
}

export function getCategory(categoryId: string) {
  return apiRequest<ApiCategory>(`/categories/${categoryId}`)
}

export function createCategory(body: { categoryName: string }) {
  return apiRequest<ApiCategory>('/categories', { method: 'POST', body })
}

export function updateCategory(categoryId: string, body: { categoryName: string }) {
  return apiRequest<ApiCategory>(`/categories/${categoryId}`, { method: 'PATCH', body })
}

export function deleteCategory(categoryId: string) {
  return apiRequest<ApiCategory>(`/categories/${categoryId}`, { method: 'DELETE' })
}
