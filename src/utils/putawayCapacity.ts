import type { BoxType } from '../api/lpns'
import { BOX_TYPE_OPTIONS } from '../data/inboundStatus'

/** Volume mặc định 1 bin SHARED (2 EXTRA × 8). */
export const DEFAULT_BIN_MAX_VOLUME_UNITS = 16

export function volumeUnitsForBoxType(boxType: BoxType | string): number {
  return BOX_TYPE_OPTIONS.find((b) => b.value === boxType)?.volumeUnits ?? 2
}

export function boxTypeLabel(boxType: BoxType | string): string {
  return BOX_TYPE_OPTIONS.find((b) => b.value === boxType)?.label ?? String(boxType)
}

/** Số LPN cùng loại thùng có thể xếp chung 1 bin (theo volume). */
export function lpnsPerBin(
  boxType: BoxType | string,
  binMaxVolumeUnits = DEFAULT_BIN_MAX_VOLUME_UNITS
): number {
  const vol = volumeUnitsForBoxType(boxType)
  return Math.max(1, Math.floor(binMaxVolumeUnits / vol))
}

export function estimateBinsForLpns(
  lpnCount: number,
  boxType: BoxType | string,
  binMaxVolumeUnits = DEFAULT_BIN_MAX_VOLUME_UNITS
): number {
  if (lpnCount <= 0) return 0
  return Math.ceil(lpnCount / lpnsPerBin(boxType, binMaxVolumeUnits))
}

export function putawayPendingHint(lpnCount: number, boxType: BoxType | string): string {
  const perBin = lpnsPerBin(boxType)
  const binsNeeded = estimateBinsForLpns(lpnCount, boxType)
  const typeLabel = boxTypeLabel(boxType)

  if (perBin <= 1) {
    return `Còn ${lpnCount} LPN (${typeLabel}) — ước tính cần ~${binsNeeded} bin (1 LPN/bin). Chọn đủ tầng/rack nếu một tầng không đủ bin trống.`
  }
  return `Còn ${lpnCount} LPN (${typeLabel}) — ước tính cần ~${binsNeeded} bin (${perBin} LPN/bin). Chọn đủ tầng/rack nếu một tầng không đủ bin trống.`
}
