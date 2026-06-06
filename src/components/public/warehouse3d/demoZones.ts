import { getDefaultBinCapacity, getMaxLpnBoxTypeForZone } from '../../../data/binCapacityDefaults'
import { formatBoxTypeName } from '../../../data/lpnTerminology'
import { ZONE_TYPE_LABELS } from '../../../data/zoneTypes'

export type DemoZoneType = 'SHARED' | 'PREMIUM' | 'PRIVATE'

export type DemoZone3D = {
  id: string
  zoneType: DemoZoneType
  title: string
  x: number
  z: number
  w: number
  d: number
  color: string
}

export const DEMO_ZONES: DemoZone3D[] = [
  {
    id: 'A',
    zoneType: 'SHARED',
    title: ZONE_TYPE_LABELS.SHARED,
    x: -4.75,
    z: -3.5,
    w: 9,
    d: 6.2,
    color: '#06edf9',
  },
  {
    id: 'B',
    zoneType: 'SHARED',
    title: 'SHARED B',
    x: 4.75,
    z: -3.5,
    w: 9,
    d: 6.2,
    color: '#38bdf8',
  },
  {
    id: 'C',
    zoneType: 'PREMIUM',
    title: ZONE_TYPE_LABELS.PREMIUM,
    x: -4.75,
    z: 3.5,
    w: 9,
    d: 6.2,
    color: '#a78bfa',
  },
  {
    id: 'D',
    zoneType: 'PRIVATE',
    title: ZONE_TYPE_LABELS.PRIVATE,
    x: 4.75,
    z: 3.5,
    w: 9,
    d: 6.2,
    color: '#34d399',
  },
]

export function describeZoneLpnCapacity(zoneType: DemoZoneType) {
  const preset = getDefaultBinCapacity(zoneType)
  const maxBoxType = getMaxLpnBoxTypeForZone(zoneType)
  return {
    maxBoxType,
    maxBoxTypeLabel: formatBoxTypeName(maxBoxType),
    binVolume: preset.maxVolumeUnits,
    note: preset.note,
  }
}
