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
        hint: 'Chọn zone PRIVATE hoặc PREMIUM — khu riêng cho tenant.',
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

export type ZoneEligibilityInput =
  | string
  | null
  | undefined
  | {
      zoneType?: string | null
      isDedicated?: boolean | null
    }

function normalizeZoneType(zone: ZoneEligibilityInput): string {
  const zoneType =
    zone != null && typeof zone === 'object' ? zone.zoneType : zone
  return String(zoneType ?? 'SHARED').toUpperCase()
}

/** Loại zone được phép chọn theo hình thức thuê (null = không giới hạn). */
export function allowedZoneTypesForContract(contractType: string): string[] | null {
  switch (contractType) {
    case 'SHARED_STORAGE':
      return ['SHARED']
    case 'DEDICATED_ZONE':
      return ['PRIVATE', 'PREMIUM']
    default:
      return null
  }
}

/** @deprecated Dùng allowedZoneTypesForContract — giữ cho copy UI đơn giản */
export function requiredZoneTypeForContract(contractType: string): string | null {
  const allowed = allowedZoneTypesForContract(contractType)
  if (!allowed) return null
  if (allowed.length === 1) return allowed[0]
  return allowed.join(' / ')
}

export function zoneEligibilityHint(contractType: string): string | null {
  switch (contractType) {
    case 'SHARED_STORAGE':
      return 'Chỉ zone SHARED — PREMIUM/PRIVATE dành cho thuê khu riêng (DEDICATED_ZONE).'
    case 'DEDICATED_ZONE':
      return 'Chỉ zone PRIVATE hoặc PREMIUM — không dùng zone SHARED.'
    default:
      return null
  }
}

export function isZoneEligibleForContract(
  contractType: string,
  zone: ZoneEligibilityInput
): boolean {
  const allowed = allowedZoneTypesForContract(contractType)
  const zoneType = normalizeZoneType(zone)
  const isDedicated =
    zone != null && typeof zone === 'object' ? Boolean(zone.isDedicated) : false

  if (!allowed) {
    if (contractType === 'RESERVED_STORAGE') {
      return zoneType !== 'PRIVATE'
    }
    return true
  }

  if (contractType === 'DEDICATED_ZONE') {
    return allowed.includes(zoneType) || isDedicated
  }

  return allowed.includes(zoneType)
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
