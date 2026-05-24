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
