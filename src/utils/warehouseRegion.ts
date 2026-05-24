export type WarehouseWithRegion = {
  warehouseId: string
  warehouseName: string
  city?: string | null
  district?: string | null
}

function norm(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase()
}

/** Kho claim được phải trùng city + district với yêu cầu regional. */
export function warehouseMatchesRentalRegion(
  warehouse: WarehouseWithRegion,
  city: string,
  district: string
) {
  return norm(warehouse.city) === norm(city) && norm(warehouse.district) === norm(district)
}

export function filterWarehousesForRentalClaim(
  warehouses: WarehouseWithRegion[],
  city: string,
  district: string,
  preferredWarehouseId?: string | null
) {
  const regional = warehouses.filter((w) => warehouseMatchesRentalRegion(w, city, district))
  if (!preferredWarehouseId) return regional
  const preferred = warehouses.find((w) => w.warehouseId === preferredWarehouseId)
  if (preferred && !regional.some((w) => w.warehouseId === preferred.warehouseId)) {
    return [preferred, ...regional]
  }
  return regional
}

export function resolveClaimWarehouseId(
  warehouses: WarehouseWithRegion[],
  city: string,
  district: string,
  existingWarehouseId?: string | null
) {
  if (existingWarehouseId) return existingWarehouseId
  const matches = filterWarehousesForRentalClaim(warehouses, city, district)
  if (matches.length === 0) {
    throw new Error(`Không có kho ACTIVE tại ${district}, ${city} để nhận yêu cầu`)
  }
  if (matches.length > 1) {
    throw new Error(
      `Có ${matches.length} kho tại ${district}, ${city} — vui lòng chọn kho trong danh sách`
    )
  }
  return matches[0].warehouseId
}
