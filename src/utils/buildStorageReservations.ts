import type { AppendixReservationCreate } from '../api/contractAppendices'
import type { ApiZone } from '../api/zones'
import {
  getOnboardingStoragePlan,
  isZoneEligibleForContract,
  zoneEligibilityHint,
  type StorageLevel,
} from './onboardingStorage'
import {
  allowsCombiningZonesForLpn,
  estimateZoneLpnCapacity,
  isZoneEligibleForLpnDemand,
  splitReservedCapacityAcrossZones,
  splitReservedCapacityEvenly,
  zoneLpnShortfallMessage,
} from './warehouseCapacity'

export type StorageReservationInput = {
  contractType: string
  warehouseId: string
  startDate: string
  endDate: string
  storageLevel?: StorageLevel
  selectedZoneIds: string[]
  zones: ApiZone[]
  zoneId: string
  rackId?: string
  rackLevelId?: string
  binId?: string
  reservedCapacityNum?: number | null
}

export function validateStorageSelection(input: StorageReservationInput): string | null {
  const plan = getOnboardingStoragePlan(input.contractType)
  const level = input.storageLevel ?? plan.storageLevel
  const selectedZones = input.zones.filter((z) => input.selectedZoneIds.includes(z.zoneId))
  const allowsMultiZone = plan.needsZone && !plan.needsBin

  if (level === 'ZONE' || plan.needsZone) {
    if (input.selectedZoneIds.length === 0) {
      const hint = zoneEligibilityHint(input.contractType)
      return hint ? `Chọn ít nhất một zone phù hợp — ${hint}` : 'Chọn ít nhất một zone'
    }
    const ineligible = selectedZones.filter((z) => !isZoneEligibleForContract(input.contractType, z))
    if (ineligible.length > 0) {
      const hint = zoneEligibilityHint(input.contractType)
      return hint
        ? `${hint} Bỏ chọn: ${ineligible.map((z) => z.zoneCode).join(', ')}.`
        : `Zone không phù hợp loại thuê. Bỏ chọn: ${ineligible.map((z) => z.zoneCode).join(', ')}.`
    }

    if (
      input.reservedCapacityNum != null &&
      input.reservedCapacityNum > 0 &&
      !allowsCombiningZonesForLpn(input.contractType)
    ) {
      const undersized = selectedZones.filter(
        (z) => !isZoneEligibleForLpnDemand(z, input.reservedCapacityNum, input.contractType)
      )
      if (undersized.length > 0) {
        const first = undersized[0]
        return zoneLpnShortfallMessage(
          estimateZoneLpnCapacity(first),
          input.reservedCapacityNum
        )
      }
    }
  }

  if (level === 'BIN' && !input.binId) {
    return 'Chọn bin'
  }

  if (allowsMultiZone && input.reservedCapacityNum != null && selectedZones.length > 0) {
    const available = selectedZones.reduce((sum, z) => sum + estimateZoneLpnCapacity(z), 0)
    if (available < input.reservedCapacityNum) {
      return `Dung lượng giữ ${input.reservedCapacityNum} thùng/LPN nhưng ${selectedZones.length} zone chỉ ước tính ~${available} thùng.`
    }
  }

  return null
}

export function buildStorageReservations(
  input: StorageReservationInput
): AppendixReservationCreate[] {
  const plan = getOnboardingStoragePlan(input.contractType)
  const level = input.storageLevel ?? plan.storageLevel
  const selectedZones = input.zones.filter((z) => input.selectedZoneIds.includes(z.zoneId))
  const base = {
    reservationType: plan.reservationType,
    storageLevel: level,
    warehouseId: input.warehouseId,
    startDate: input.startDate,
    endDate: input.endDate,
  }

  if (level === 'WAREHOUSE') {
    return [
      {
        ...base,
        ...(input.reservedCapacityNum ? { reservedCapacity: input.reservedCapacityNum } : {}),
      },
    ]
  }

  if (level === 'ZONE' || (plan.needsZone && !plan.needsBin)) {
    const capacitySplit =
      input.reservedCapacityNum != null
        ? (() => {
            const proportional = splitReservedCapacityAcrossZones(
              input.reservedCapacityNum,
              selectedZones
            )
            const even = splitReservedCapacityEvenly(input.reservedCapacityNum, selectedZones)
            const zonesEqualCapacity =
              selectedZones.length > 1 &&
              selectedZones.every(
                (z) => estimateZoneLpnCapacity(z) === estimateZoneLpnCapacity(selectedZones[0])
              )
            return zonesEqualCapacity ? even : proportional
          })()
        : new Map<string, number>()

    return input.selectedZoneIds.map((zId) => {
      const share = capacitySplit.get(zId)
      return {
        ...base,
        storageLevel: 'ZONE' as StorageLevel,
        zoneId: zId,
        ...(share != null && share > 0 ? { reservedCapacity: share } : {}),
      }
    })
  }

  return [
    {
      ...base,
      ...(input.zoneId ? { zoneId: input.zoneId } : {}),
      ...(input.rackId ? { rackId: input.rackId } : {}),
      ...(input.rackLevelId ? { rackLevelId: input.rackLevelId } : {}),
      ...(input.binId ? { binId: input.binId } : {}),
      ...(input.reservedCapacityNum ? { reservedCapacity: input.reservedCapacityNum } : {}),
    },
  ]
}
