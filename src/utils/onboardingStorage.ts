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
        hint: 'Chọn zone PRIVATE (khu riêng) trong kho đã claim.',
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
    case 'NEEDS_CONSULTATION':
      return {
        reservationType: 'SHARED',
        storageLevel: 'ZONE',
        needsZone: true,
        needsRack: false,
        needsBin: false,
        hint: 'Chọn loại thuê cụ thể ở bước duyệt trước khi cấp zone/bin.',
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

/** Loại zone bắt buộc khi chọn zone theo hình thức thuê (null = không giới hạn). */
export function requiredZoneTypeForContract(contractType: string): string | null {
  if (contractType === 'DEDICATED_ZONE') return 'PRIVATE'
  return null
}

export function isZoneEligibleForContract(
  contractType: string,
  zoneType: string | null | undefined
): boolean {
  const required = requiredZoneTypeForContract(contractType)
  if (!required) return true
  return (zoneType ?? 'SHARED').toUpperCase() === required
}

/** Nhãn ngắn cho WH admin (không dùng mã reservation/level). */
export function storagePlanShortLabel(contractType: string): string {
  switch (contractType as ContractTypeValue) {
    case 'DEDICATED_WAREHOUSE':
      return 'Thuê riêng cả kho'
    case 'DEDICATED_ZONE':
      return 'Thuê riêng theo zone'
    case 'RESERVED_STORAGE':
      return 'Giữ chỗ theo bin cố định'
    case 'SHARED_STORAGE':
      return 'Kho chia sẻ (zone chung)'
    case 'NEEDS_CONSULTATION':
      return 'Chưa chốt loại thuê'
    default:
      return 'Cấp chỗ lưu trữ'
  }
}
