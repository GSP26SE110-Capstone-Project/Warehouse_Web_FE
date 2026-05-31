import { apiRequest, buildQuery } from './client'

export interface LocationDistrict {
  districtId: string
  districtName: string
}

export interface LocationCity {
  cityId: string
  cityName: string
  districts: LocationDistrict[]
}

export interface LocationTree {
  cities: LocationCity[]
}

export function fetchLocationTree() {
  return apiRequest<LocationTree>('/locations', { auth: false })
}

export interface RegionWarehouseItem {
  warehouseName: string
  totalAreaM2: number | null
  usableAreaM2: number | null
  /** Diện tích làm mẫu số % — ưu tiên usable, fallback total */
  capacityAreaM2: number | null
  usedAreaM2: number
  availableAreaM2: number | null
  /** ~% diện tích đã quy hoạch thành zone (ACTIVE) */
  utilizationPercent: number | null
  /** Diện tích đang thuê qua HĐ (zone riêng / nguyên kho) */
  leasedAreaM2: number
  /** ~% diện tích đã thuê so với capacity */
  leasedPercent: number | null
  unleasedAreaM2: number | null
  hasActiveTenantContract: boolean
  hasDedicatedWarehouseLease: boolean
  /** Gợi ý thuê nguyên kho cho guest (không lộ tên tenant) */
  dedicatedLeaseAvailability: 'AVAILABLE' | 'NEEDS_REVIEW' | 'OCCUPIED'
}

export interface RegionWarehousesResult {
  count: number
  city: string
  district: string
  items: RegionWarehouseItem[]
}

export function fetchRegionWarehouses(city: string, district: string) {
  return apiRequest<RegionWarehousesResult>(
    `/locations/warehouses${buildQuery({ city: city.trim(), district: district.trim() })}`,
    { auth: false }
  )
}
