import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiSku {
  skuId: string
  tenantId: string
  skuCode: string
  productName: string
  productKind?: string | null
  categoryId?: string | null
  collectionId?: string | null
  seasonId?: string | null
  color?: string | null
  size?: string | null
  material?: string | null
  movementCategory?: 'FAST' | 'NORMAL' | 'SLOW'
  status?: 'ACTIVE' | 'INACTIVE'
  createdAt?: string
  updatedAt?: string
}

export function listSkus(params: {
  tenantId: string
  status?: string
  movementCategory?: string
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiSku>(`/skus${buildQuery(params)}`)
}

export function getSku(skuId: string) {
  return apiRequest<ApiSku>(`/skus/${skuId}`)
}

export function createSku(body: {
  tenantId: string
  skuCode: string
  productName: string
  productKind: string
  collectionId?: string
  seasonId?: string
  color?: string
  size?: string
  material?: string
  movementCategory?: string
  status?: string
}) {
  return apiRequest<ApiSku>('/skus', { method: 'POST', body })
}

export function updateSku(
  skuId: string,
  body: {
    skuCode?: string
    productName?: string
    productKind?: string | null
    categoryId?: string | null
    collectionId?: string | null
    seasonId?: string | null
    color?: string
    size?: string
    material?: string
    movementCategory?: string
    status?: string
  }
) {
  return apiRequest<ApiSku>(`/skus/${skuId}`, { method: 'PATCH', body })
}

export function deleteSku(skuId: string) {
  return apiRequest<ApiSku>(`/skus/${skuId}`, { method: 'DELETE' })
}
