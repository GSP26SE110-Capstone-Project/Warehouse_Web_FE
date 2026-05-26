import type { ApiBin } from '../api/bins'

export function formatBinOccupancy(bin: ApiBin): string {
  const lpn = `${bin.currentLpnCount ?? 0}/${bin.maxLpnCount ?? '?'}`
  const vol = `${bin.usedVolumeUnits ?? 0}/${bin.maxVolumeUnits ?? '?'}`
  return `LPN ${lpn} · Vol ${vol}`
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

export function isBinEmpty(bin: ApiBin): boolean {
  return (
    (bin.currentLpnCount ?? 0) === 0 &&
    (bin.usedVolumeUnits ?? 0) === 0 &&
    (bin.status === 'EMPTY' || !bin.status)
  )
}
