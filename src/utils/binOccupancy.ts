import type { ApiBin } from '../api/bins'

export function formatBinOccupancy(bin: ApiBin): string {
  const vol = `${bin.usedVolumeUnits ?? 0}/${bin.maxVolumeUnits ?? '?'}`
  return `Vol ${vol}`
}

export function isBinAtCapacity(bin: ApiBin): boolean {
  const maxLpn = Number(bin.maxLpnCount ?? 0)
  const maxVol = Number(bin.maxVolumeUnits ?? 0)
  const curLpn = Number(bin.currentLpnCount ?? 0)
  const usedVol = Number(bin.usedVolumeUnits ?? 0)
  if (maxLpn > 0 && curLpn >= maxLpn) return true
  if (maxVol > 0 && usedVol >= maxVol) return true
  return bin.status === 'FULL'
}

/** Bin còn nhận thêm ít nhất 1 LPN (EMPTY hoặc PARTIAL còn slot). */
export function isBinPutawayEligible(bin: ApiBin): boolean {
  if (bin.status === 'BLOCKED' || bin.status === 'FULL') return false
  const maxLpn = Number(bin.maxLpnCount ?? 0)
  const curLpn = Number(bin.currentLpnCount ?? 0)
  if (maxLpn > 0 && curLpn >= maxLpn) return false
  return bin.status === 'EMPTY' || bin.status === 'PARTIAL' || !bin.status
}

export function isBinEmpty(bin: ApiBin): boolean {
  return (
    (bin.currentLpnCount ?? 0) === 0 &&
    (bin.usedVolumeUnits ?? 0) === 0 &&
    (bin.status === 'EMPTY' || !bin.status)
  )
}
