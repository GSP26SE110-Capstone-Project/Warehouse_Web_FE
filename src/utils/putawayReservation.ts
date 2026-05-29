import type { ApiStorageReservation } from '../api/storageReservations'
import type { ApiBin } from '../api/bins'
import { isBinPutawayEligible } from './binOccupancy'

export type BinLocation = {
  zoneId: string
  rackId: string
  rackLevelId: string
  binId: string
}

export function reservationCoversLocation(
  reservation: ApiStorageReservation,
  location: BinLocation
): boolean {
  switch (reservation.storageLevel) {
    case 'WAREHOUSE':
      return true
    case 'ZONE':
      return reservation.zoneId != null && reservation.zoneId === location.zoneId
    case 'RACK':
      return reservation.rackId != null && reservation.rackId === location.rackId
    case 'RACK_LEVEL':
      return reservation.rackLevelId != null && reservation.rackLevelId === location.rackLevelId
    case 'BIN':
      return reservation.binId != null && reservation.binId === location.binId
    default:
      return false
  }
}

export type ContractPutawayAllowlist = {
  hasWarehouseScope: boolean
  allowedZoneIds: Set<string>
  allowedRackIds: Set<string>
  allowedRackLevelIds: Set<string>
  allowedBinIds: Set<string>
  zoneCodes: string[]
}

export function buildContractPutawayAllowlist(
  reservations: ApiStorageReservation[],
  warehouseId: string
): ContractPutawayAllowlist {
  const active = reservations.filter(
    (r) =>
      r.status === 'ACTIVE' &&
      (r.warehouseId == null || r.warehouseId === warehouseId)
  )

  const hasWarehouseScope = active.some((r) => r.storageLevel === 'WAREHOUSE')
  const allowedZoneIds = new Set<string>()
  const allowedRackIds = new Set<string>()
  const allowedRackLevelIds = new Set<string>()
  const allowedBinIds = new Set<string>()
  const zoneCodes: string[] = []

  for (const r of active) {
    if (r.storageLevel === 'ZONE' && r.zoneId) {
      allowedZoneIds.add(r.zoneId)
      if (r.zoneCode) zoneCodes.push(r.zoneCode)
    }
    if (r.storageLevel === 'RACK' && r.rackId) allowedRackIds.add(r.rackId)
    if (r.storageLevel === 'RACK_LEVEL' && r.rackLevelId) {
      allowedRackLevelIds.add(r.rackLevelId)
    }
    if (r.storageLevel === 'BIN' && r.binId) allowedBinIds.add(r.binId)
  }

  return {
    hasWarehouseScope,
    allowedZoneIds,
    allowedRackIds,
    allowedRackLevelIds,
    allowedBinIds,
    zoneCodes: [...new Set(zoneCodes)],
  }
}

export function isZoneAllowedForContract(
  zoneId: string,
  allowlist: ContractPutawayAllowlist
): boolean {
  if (allowlist.hasWarehouseScope) return true
  if (allowlist.allowedZoneIds.size > 0) {
    return allowlist.allowedZoneIds.has(zoneId)
  }
  // HĐ chỉ cấp rack/bin — zone vẫn chọn được, lọc ở rack/bin
  if (
    allowlist.allowedRackIds.size > 0 ||
    allowlist.allowedRackLevelIds.size > 0 ||
    allowlist.allowedBinIds.size > 0
  ) {
    return true
  }
  return false
}

export function isRackAllowedForContract(
  rackId: string,
  zoneId: string,
  allowlist: ContractPutawayAllowlist
): boolean {
  if (allowlist.hasWarehouseScope) return true
  if (allowlist.allowedRackIds.size > 0) {
    return allowlist.allowedRackIds.has(rackId)
  }
  if (allowlist.allowedZoneIds.size > 0) {
    return allowlist.allowedZoneIds.has(zoneId)
  }
  if (allowlist.allowedRackLevelIds.size > 0 || allowlist.allowedBinIds.size > 0) {
    return true
  }
  return false
}

export function isRackLevelAllowedForContract(
  rackLevelId: string,
  rackId: string,
  zoneId: string,
  allowlist: ContractPutawayAllowlist
): boolean {
  if (allowlist.hasWarehouseScope) return true
  if (allowlist.allowedRackLevelIds.size > 0) {
    return allowlist.allowedRackLevelIds.has(rackLevelId)
  }
  if (allowlist.allowedRackIds.size > 0) {
    return allowlist.allowedRackIds.has(rackId)
  }
  if (allowlist.allowedZoneIds.size > 0) {
    return allowlist.allowedZoneIds.has(zoneId)
  }
  if (allowlist.allowedBinIds.size > 0) {
    return true
  }
  return false
}

export function isBinAllowedForContract(
  binId: string,
  location: BinLocation,
  allowlist: ContractPutawayAllowlist
): boolean {
  if (allowlist.hasWarehouseScope) return true
  if (allowlist.allowedBinIds.size > 0) {
    return allowlist.allowedBinIds.has(binId)
  }
  if (allowlist.allowedRackLevelIds.size > 0) {
    return allowlist.allowedRackLevelIds.has(location.rackLevelId)
  }
  if (allowlist.allowedRackIds.size > 0) {
    return allowlist.allowedRackIds.has(location.rackId)
  }
  if (allowlist.allowedZoneIds.size > 0) {
    return allowlist.allowedZoneIds.has(location.zoneId)
  }
  return false
}

export function countPutawayEligibleBins(bins: ApiBin[]): number {
  return bins.filter(isBinPutawayEligible).length
}
