import { describe, expect, it } from 'vitest'
import {
  filterEligibleSharedStorageCandidates,
  findOperatorClaimCandidate,
  operatorCanApproveSharedStorage,
  rankSharedStorageCandidates,
  type WarehouseClaimCandidate,
} from './warehouseClaimCandidates'

function candidate(
  partial: Partial<WarehouseClaimCandidate> & Pick<WarehouseClaimCandidate, 'warehouseId' | 'warehouseName'>
): WarehouseClaimCandidate {
  return {
    city: 'HCM',
    district: 'Quận 1',
    sharedZoneCount: 0,
    sharedZoneAreaM2: 0,
    remainingZoneAreaM2: null,
    hasDedicatedWarehouseLease: false,
    matchingSuggestedZoneType: false,
    readiness: 'BLOCKED',
    eligible: false,
    ...partial,
  }
}

describe('rankSharedStorageCandidates', () => {
  it('puts READY before CAN_PROVISION and hides BLOCKED last', () => {
    const items = [
      candidate({ warehouseId: 'b', warehouseName: 'B', readiness: 'CAN_PROVISION', eligible: true }),
      candidate({
        warehouseId: 'a',
        warehouseName: 'A',
        readiness: 'READY',
        eligible: true,
        sharedZoneCount: 2,
        sharedZoneAreaM2: 100,
      }),
      candidate({
        warehouseId: 'c',
        warehouseName: 'C',
        readiness: 'BLOCKED',
        eligible: false,
        hasDedicatedWarehouseLease: true,
      }),
    ]
    const ranked = rankSharedStorageCandidates(items)
    expect(ranked.map((c) => c.warehouseId)).toEqual(['a', 'b', 'c'])
  })

  it('prefers matching suggested zone type SHARED', () => {
    const items = [
      candidate({
        warehouseId: 'a',
        warehouseName: 'A',
        readiness: 'READY',
        eligible: true,
        sharedZoneAreaM2: 50,
      }),
      candidate({
        warehouseId: 'b',
        warehouseName: 'B',
        readiness: 'READY',
        eligible: true,
        sharedZoneAreaM2: 30,
        matchingSuggestedZoneType: true,
      }),
    ]
    const ranked = rankSharedStorageCandidates(items, { suggestedZoneType: 'SHARED' })
    expect(ranked[0].warehouseId).toBe('b')
  })

  it('highlights operator warehouse when otherwise tied', () => {
    const items = [
      candidate({
        warehouseId: 'other',
        warehouseName: 'Other',
        readiness: 'READY',
        eligible: true,
        sharedZoneAreaM2: 80,
      }),
      candidate({
        warehouseId: 'mine',
        warehouseName: 'Mine',
        readiness: 'READY',
        eligible: true,
        sharedZoneAreaM2: 80,
      }),
    ]
    const ranked = rankSharedStorageCandidates(items, { operatorWarehouseId: 'mine' })
    expect(ranked[0].warehouseId).toBe('mine')
  })
})

describe('filterEligibleSharedStorageCandidates', () => {
  it('removes BLOCKED warehouses', () => {
    const items = [
      candidate({ warehouseId: 'a', warehouseName: 'A', readiness: 'READY', eligible: true }),
      candidate({ warehouseId: 'b', warehouseName: 'B', readiness: 'BLOCKED', eligible: false }),
    ]
    expect(filterEligibleSharedStorageCandidates(items)).toHaveLength(1)
  })
})

describe('operatorCanApproveSharedStorage', () => {
  it('allows READY and CAN_PROVISION', () => {
    expect(
      operatorCanApproveSharedStorage(
        candidate({ warehouseId: 'a', warehouseName: 'A', readiness: 'READY', eligible: true })
      )
    ).toBe(true)
    expect(
      operatorCanApproveSharedStorage(
        candidate({
          warehouseId: 'b',
          warehouseName: 'B',
          readiness: 'CAN_PROVISION',
          eligible: true,
          remainingZoneAreaM2: 100,
        })
      )
    ).toBe(true)
  })

  it('blocks BLOCKED readiness', () => {
    expect(
      operatorCanApproveSharedStorage(
        candidate({ warehouseId: 'c', warehouseName: 'C', readiness: 'BLOCKED', eligible: false })
      )
    ).toBe(false)
    expect(operatorCanApproveSharedStorage(null)).toBe(false)
  })
})

describe('findOperatorClaimCandidate', () => {
  it('finds operator warehouse in list', () => {
    const items = [
      candidate({ warehouseId: 'x', warehouseName: 'X', readiness: 'READY', eligible: true }),
    ]
    expect(findOperatorClaimCandidate(items, 'x')?.warehouseName).toBe('X')
    expect(findOperatorClaimCandidate(items, 'missing')).toBeNull()
  })
})
