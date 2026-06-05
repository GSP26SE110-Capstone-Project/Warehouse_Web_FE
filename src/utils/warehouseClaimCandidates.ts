export const SHARED_POOL_ZONE_TYPES = ['SHARED'] as const

export type SharedStorageReadiness = 'READY' | 'CAN_PROVISION' | 'BLOCKED'

export type WarehouseClaimCandidate = {
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

const READINESS_RANK: Record<SharedStorageReadiness, number> = {
  READY: 0,
  CAN_PROVISION: 1,
  BLOCKED: 2,
}

export function readinessLabel(readiness: SharedStorageReadiness): string {
  switch (readiness) {
    case 'READY':
      return 'Sẵn sàng'
    case 'CAN_PROVISION':
      return 'Cần tạo zone ở bước 3'
    case 'BLOCKED':
      return 'Không phù hợp'
    default:
      return readiness
  }
}

export function rankSharedStorageCandidates(
  candidates: WarehouseClaimCandidate[],
  options?: {
    suggestedZoneType?: string | null
    operatorWarehouseId?: string | null
  }
): WarehouseClaimCandidate[] {
  const suggested = String(options?.suggestedZoneType ?? '')
    .trim()
    .toUpperCase()
  const operatorId = options?.operatorWarehouseId ?? null

  return [...candidates].sort((a, b) => {
    const aBlocked = a.readiness === 'BLOCKED'
    const bBlocked = b.readiness === 'BLOCKED'
    if (aBlocked !== bBlocked) return aBlocked ? 1 : -1

    if (suggested) {
      const aMatch = a.matchingSuggestedZoneType
      const bMatch = b.matchingSuggestedZoneType
      if (aMatch !== bMatch) return aMatch ? -1 : 1
    }

    const rankDiff = READINESS_RANK[a.readiness] - READINESS_RANK[b.readiness]
    if (rankDiff !== 0) return rankDiff

    if (operatorId) {
      const aOp = a.warehouseId === operatorId
      const bOp = b.warehouseId === operatorId
      if (aOp !== bOp) return aOp ? -1 : 1
    }

    const areaDiff = b.sharedZoneAreaM2 - a.sharedZoneAreaM2
    if (areaDiff !== 0) return areaDiff

    return a.warehouseName.localeCompare(b.warehouseName, 'vi')
  })
}

export function filterEligibleSharedStorageCandidates(
  candidates: WarehouseClaimCandidate[]
): WarehouseClaimCandidate[] {
  return candidates.filter((c) => c.eligible)
}

export function findOperatorClaimCandidate(
  candidates: WarehouseClaimCandidate[],
  operatorWarehouseId?: string | null
): WarehouseClaimCandidate | null {
  if (!operatorWarehouseId) return null
  return candidates.find((c) => c.warehouseId === operatorWarehouseId) ?? null
}

export function operatorCanApproveSharedStorage(
  candidate: WarehouseClaimCandidate | null | undefined
): boolean {
  return candidate != null && candidate.readiness !== 'BLOCKED'
}
