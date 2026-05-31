import { apiRequest, apiPaginated, buildQuery } from './client'
import type { ApiSku } from './skus'

export type LpnStatus = 'RECEIVING' | 'STORED' | 'PICKED' | 'SHIPPED' | 'DAMAGED'
export type BoxType = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA'

export interface ApiLpn {
  lpnId: string
  tenantId: string
  batchId: string
  lpnCode: string
  boxType: BoxType
  volumeUnits: number
  maxCapacity?: number | null
  actualQuantity?: number
  fillPercentage?: number | null
  weightKg?: number | null
  currentBinId?: string | null
  status?: LpnStatus
  createdAt?: string
  updatedAt?: string
}

export interface ApiLpnDetail {
  lpnDetailId: string
  lpnId: string
  skuId: string
  quantity: number
  sku?: Pick<ApiSku, 'skuId' | 'skuCode' | 'productName' | 'color' | 'size'>
}

export interface ApiLpnWithDetails extends ApiLpn {
  details: ApiLpnDetail[]
}

export function listLpns(params?: {
  tenantId?: string
  batchId?: string
  status?: string
  boxType?: BoxType
  currentBinId?: string
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiLpn>(`/lpns${buildQuery(params ?? {})}`)
}

export function getLpnWithDetails(lpnId: string) {
  return apiRequest<ApiLpnWithDetails>(`/lpns/${lpnId}/details`)
}

export function createLpn(body: {
  tenantId: string
  batchId: string
  lpnCode: string
  boxType: BoxType
  volumeUnits?: number
  maxCapacity?: number
  weightKg?: number
  status?: LpnStatus
}) {
  return apiRequest<ApiLpn>('/lpns', { method: 'POST', body })
}

export function createLpnDetail(body: { lpnId: string; skuId: string; quantity: number }) {
  return apiRequest<ApiLpnDetail>('/lpn-details', { method: 'POST', body })
}

export function putawayLpn(
  lpnId: string,
  body: { binId: string; recommendationId?: string; movedBy?: string }
) {
  return apiRequest<{
    lpn: ApiLpnWithDetails
    inboundRequestId: string
    inboundStatus: string
  }>(`/lpns/${lpnId}/putaway`, { method: 'POST', body })
}
