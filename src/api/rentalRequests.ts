import { apiRequest, apiPaginated, buildQuery } from './client'
import type { ApiBoxAllocationRow, ApiRentalProductLine, ApiRentalRequest, RentalRequestStatus } from './types'

export interface RentalRequestPublicLookup {
  requestCode: string
  status: RentalRequestStatus
  companyName: string
  city: string
  district: string
  contractType?: string | null
  pricingModel?: string | null
  billingCycle?: string | null
  estimatedBoxCount?: number | null
  estimatedSkuCount?: number | null
  totalCommittedVolumeUnits?: number | string | null
  boxAllocation?: ApiBoxAllocationRow[]
  productLines?: ApiRentalProductLine[]
  estimatedInboundPerWeek?: number | null
  estimatedOutboundPerWeek?: number | null
  requestedAreaM2?: number | null
  requiresFastPicking?: boolean
  requiresPremiumStorage?: boolean
  expectedStartDate?: string | null
  expectedEndDate?: string | null
  rejectionReason?: string | null
  reviewNote?: string | null
  warehouseName?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  reviewedAt?: string | null
}

export function listRentalRequests(params?: {
  tenantId?: string
  warehouseId?: string
  regionMatch?: boolean
  city?: string
  district?: string
  status?: RentalRequestStatus
  includeProductLines?: boolean
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiRentalRequest>(`/rental-requests${buildQuery(params ?? {})}`)
}

export function lookupRentalRequestByCode(code: string, email: string) {
  const trimmedCode = code.trim()
  const trimmedEmail = email.trim().toLowerCase()
  return apiRequest<RentalRequestPublicLookup>(
    `/rental-requests/guest/lookup${buildQuery({ code: trimmedCode, email: trimmedEmail })}`,
    { auth: false }
  )
}

export function getRentalRequest(rentalRequestId: string) {
  return apiRequest<ApiRentalRequest>(`/rental-requests/${rentalRequestId}`)
}

export function createRentalRequest(body: {
  tenantId: string
  city: string
  district: string
  contractType?: string
  pricingModel?: string
  billingCycle?: string
  estimatedSkuCount?: number
  estimatedBoxCount?: number
  estimatedVolume?: number
  averageStorageDays?: number
  estimatedInboundPerWeek?: number
  estimatedOutboundPerWeek?: number
  requestedAreaM2?: number
  requiresFastPicking?: boolean
  requiresPremiumStorage?: boolean
  notes?: string
  suggestedZoneType?: string
  suggestedRackType?: string
  expectedStartDate?: string
  expectedEndDate?: string
  productLines?: Array<{
    productKind: string
    size?: string
    sizeGroup?: string
    quantity: number
  }>
  selectedBoxTypeHint?: string
}) {
  return apiRequest<ApiRentalRequest>('/rental-requests', { method: 'POST', body, auth: false })
}

export interface ApiContractPriceEstimate {
  rentalRequestId: string
  warehouseId: string | null
  contractType: string
  billingCycle: string
  monthCount: number
  monthlyAmount: number
  suggestedTotalAmount: number
  areaM2Used: number | null
  unitPricePerM2Month: number | null
  basisLabel: string
  breakdown: Array<{ label: string; detail: string }>
  warehouse: {
    warehouseId: string
    warehouseName: string
    totalAreaM2: number | null
    usableAreaM2: number | null
  } | null
  zonePlanning: {
    zoneCount: number
    usedZoneAreaM2: number
    remainingZoneAreaM2: number | null
    usableAreaM2: number | null
    suggestedMinZoneCount: number | null
  } | null
  requestedAreaM2: number | null
  currency: string
  source: string
}

export function getContractPriceEstimate(
  rentalRequestId: string,
  params?: {
    warehouseId?: string
    zoneIds?: string[]
    contractType?: string
    startDate?: string
    endDate?: string
  }
) {
  const q: Record<string, string> = {}
  if (params?.warehouseId) q.warehouseId = params.warehouseId
  if (params?.zoneIds?.length) q.zoneIds = params.zoneIds.join(',')
  if (params?.contractType) q.contractType = params.contractType
  if (params?.startDate) q.startDate = params.startDate
  if (params?.endDate) q.endDate = params.endDate
  return apiRequest<ApiContractPriceEstimate>(
    `/rental-requests/${rentalRequestId}/price-estimate${buildQuery(q)}`
  )
}

export function updateRentalRequest(
  rentalRequestId: string,
  body: {
    status?: RentalRequestStatus
    warehouseId?: string
    rejectionReason?: string
    reviewNote?: string
    reviewedBy?: string
    reviewedAt?: string
    contractType?: string
    pricingModel?: string
    billingCycle?: string
  }
) {
  return apiRequest<ApiRentalRequest>(`/rental-requests/${rentalRequestId}`, {
    method: 'PATCH',
    body,
  })
}
