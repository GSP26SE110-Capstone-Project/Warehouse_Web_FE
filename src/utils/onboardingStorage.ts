import type { ContractTypeValue } from '../data/contractTypes'

export type StorageLevel = 'WAREHOUSE' | 'ZONE' | 'RACK' | 'RACK_LEVEL' | 'BIN'
export type ReservationType = 'SHARED' | 'RESERVED' | 'DEDICATED'

export interface OnboardingStoragePlan {
  reservationType: ReservationType
  storageLevel: StorageLevel
  needsZone: boolean
  needsRack: boolean
  needsBin: boolean
  hint: string
}

export function getOnboardingStoragePlan(contractType: string): OnboardingStoragePlan {
  const t = contractType as ContractTypeValue
  switch (t) {
    case 'DEDICATED_WAREHOUSE':
      return {
        reservationType: 'DEDICATED',
        storageLevel: 'WAREHOUSE',
        needsZone: false,
        needsRack: false,
        needsBin: false,
        hint: 'Gán toàn bộ kho cho tenant (không cần chọn zone/bin).',
      }
    case 'DEDICATED_ZONE':
      return {
        reservationType: 'DEDICATED',
        storageLevel: 'ZONE',
        needsZone: true,
        needsRack: false,
        needsBin: false,
        hint: 'Chọn zone riêng trong kho đã claim.',
      }
    case 'RESERVED_STORAGE':
      return {
        reservationType: 'RESERVED',
        storageLevel: 'BIN',
        needsZone: true,
        needsRack: true,
        needsBin: true,
        hint: 'Chọn bin RESERVED/EMPTY — slot cố định cho tenant.',
      }
    case 'SHARED_STORAGE':
    default:
      return {
        reservationType: 'SHARED',
        storageLevel: 'ZONE',
        needsZone: true,
        needsRack: false,
        needsBin: false,
        hint: 'Chọn zone SHARED làm pool chung; putaway bin cụ thể khi nhập hàng.',
      }
  }
}
