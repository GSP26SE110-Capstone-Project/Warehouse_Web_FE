import { apiRequest, apiPaginated, buildQuery } from './client'
import type { ApiWarehouse, WarehouseStatus } from './types'

export function listWarehouses(params?: {
  status?: WarehouseStatus
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiWarehouse>(`/warehouses${buildQuery(params ?? {})}`)
}

export type SharedStorageReadiness = 'READY' | 'CAN_PROVISION' | 'BLOCKED'

export interface ApiWarehouseClaimCandidate {
  warehouseId: string
  warehouseName: string
  city?: string | null
  district?: string | null
  sharedZoneCount: number
  sharedZoneAreaM2: number
  remainingZoneAreaM2: number | null
  hasDedicatedWarehouseLease: boolean
  matchingSuggestedZoneType: boolean
  readiness: SharedStorageReadiness
  eligible: boolean
}

export interface ApiWarehouseClaimCandidatesResult {
  city: string
  district: string
  contractType: string
  count: number
  items: ApiWarehouseClaimCandidate[]
}

export function listWarehouseClaimCandidates(params: {
  city: string
  district: string
  contractType?: string
  suggestedZoneType?: string | null
}) {
  return apiRequest<ApiWarehouseClaimCandidatesResult>(
    `/warehouses/claim-candidates${buildQuery(params)}`
  )
}

export function getWarehouse(warehouseId: string) {
  return apiRequest<ApiWarehouse>(`/warehouses/${warehouseId}`)
}

export interface ApiWarehouseZonePlanning {
  warehouseId: string
  totalAreaM2: number | null
  usableAreaM2: number | null
  usedZoneAreaM2: number
  remainingZoneAreaM2: number | null
  zoneCount: number
  suggestedReferenceZoneAreaM2: number
  suggestedMinZoneCount: number | null
  missingZoneCount: number | null
  suggestedAreaPerZoneForEvenSplit: number | null
  areaValid: boolean
}

export interface ApiWarehouseCapacitySnapshot {
  warehouseId: string
  usableAreaM2?: number
  dataSource?: 'actual' | 'projected'
  warehouseStorage: {
    totalBins: number
    putawayEligibleBins: number
    emptyBins: number
    freeLpnSlots: number
    freeVolumeUnits: number
    isProjected?: boolean
  }
  boxTypeCapacity: Record<
    string,
    {
      candidateBins: number
      /** Ước tính theo volume còn trống / box type */
      estimatedBoxCapacity?: number
      /** Giới hạn thực tế theo slot LPN còn trống */
      totalFreeLpnSlots: number
      totalFreeVolumeUnits: number
      volumeUnits: number
      partialBinsCanAccept?: number
      partialAdditionalLpn?: number
    }
  >
  partialBinFitByType?: Record<
    string,
    { binsCanAcceptOneMore: number; additionalLpnCapacity: number }
  >
  boxTypeSuggestion: {
    recommendedBoxType: string
    reason: string
    alternateNotes?: string[]
  }
  diagnostics?: {
    binsTotal: number
    binsPutawayEligible: number
    binsActiveLayout: number
    binsBelowStandardVolume?: number
  }
  assumptions: {
    binMaxLpnCount: number
    binMaxVolumeUnits: number
  }
  projectedCapacity?: {
    rackFootprintM2: number
    binFootprintM2: number
    aisleRatio: number
    projectedStorageAreaM2: number
    projectedRackCount: number
    projectedBinSlots: number
    projectedLpnCapacity: number
  }
}

export function getWarehouseZonePlanning(warehouseId: string) {
  return apiRequest<ApiWarehouseZonePlanning>(
    `/warehouses/${warehouseId}/zone-planning`
  )
}

export function getWarehouseCapacitySnapshot(warehouseId: string) {
  return apiRequest<ApiWarehouseCapacitySnapshot>(
    `/warehouses/${warehouseId}/capacity-snapshot`
  )
}

export function createWarehouse(body: {
  warehouseCode: string
  warehouseName: string
  address?: string
  city?: string
  district?: string
  totalAreaM2?: number
  usableAreaM2?: number
  status?: WarehouseStatus
}) {
  return apiRequest<ApiWarehouse>('/warehouses', {
    method: 'POST',
    body,
  })
}

export function updateWarehouse(
  warehouseId: string,
  body: {
    warehouseName?: string
    address?: string
    city?: string
    district?: string
    totalAreaM2?: number
    usableAreaM2?: number
    status?: WarehouseStatus
  }
) {
  return apiRequest<ApiWarehouse>(`/warehouses/${warehouseId}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteWarehouse(warehouseId: string) {
  return apiRequest<ApiWarehouse>(`/warehouses/${warehouseId}`, {
    method: 'DELETE',
  })
}
