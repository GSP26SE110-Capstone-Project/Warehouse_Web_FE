import { apiRequest } from './client'

export interface ApiGarmentCategoryGroup {
  groupCode: string
  displayNameVi: string
  displayNameEn?: string | null
  sortOrder?: number
  status?: string
}

export interface ApiProductKind {
  productKind: string
  groupCode: string
  displayName: string
  baseVolumeUnitsPerPiece: number | string
  hasSize?: boolean
  sortOrder?: number
  status?: string
}

export interface ApiProductKindTreeNode extends ApiGarmentCategoryGroup {
  productKinds: ApiProductKind[]
}

export interface ApiProductKindCatalogTree {
  groups: ApiGarmentCategoryGroup[]
  productKinds: ApiProductKind[]
  tree: ApiProductKindTreeNode[]
}

export interface ApiSizeFactor {
  sizeGroup: string
  displayLabel: string
  factor: number | string
  sizes: string[]
  sortOrder?: number
  status?: string
}

export function fetchProductKindCatalogTree() {
  return apiRequest<ApiProductKindCatalogTree>('/product-kinds/tree', { auth: false })
}

export function fetchSizeFactors() {
  return apiRequest<ApiSizeFactor[]>('/size-factors', { auth: false })
}
