import { useEffect, useMemo, useState } from 'react'
import * as zonesApi from '../../api/zones'
import * as racksApi from '../../api/racks'
import * as rackLevelsApi from '../../api/rackLevels'
import type { ApiRackLevel } from '../../api/rackLevels'
import * as binsApi from '../../api/bins'
import type { ApiBin } from '../../api/bins'
import { formatBinOccupancy } from '../../utils/binOccupancy'

type Props = {
  warehouseId: string
  value: string
  onChange: (binId: string) => void
  disabled?: boolean
}

function levelLabel(level: ApiRackLevel) {
  return level.levelCode?.trim() || `Tầng ${level.levelNumber}`
}

export function PutawayBinPicker({ warehouseId, value, onChange, disabled }: Props) {
  const [zones, setZones] = useState<zonesApi.ApiZone[]>([])
  const [racks, setRacks] = useState<racksApi.ApiRack[]>([])
  const [levels, setLevels] = useState<rackLevelsApi.ApiRackLevel[]>([])
  const [bins, setBins] = useState<ApiBin[]>([])

  const [zoneId, setZoneId] = useState('')
  const [rackId, setRackId] = useState('')
  const [rackLevelId, setRackLevelId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!warehouseId) return
    let cancelled = false
    setLoading(true)
    zonesApi
      .listZones({ warehouseId, status: 'ACTIVE', limit: 100 })
      .then(({ items }) => {
        if (!cancelled) {
          setZones(items.sort((a, b) => a.zoneCode.localeCompare(b.zoneCode, 'vi')))
          setZoneId('')
          setRackId('')
          setRackLevelId('')
          setRacks([])
          setLevels([])
          setBins([])
          onChange('')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [warehouseId, onChange])

  useEffect(() => {
    if (!zoneId) {
      setRacks([])
      setRackId('')
      return
    }
    let cancelled = false
    racksApi.listRacks({ zoneId, limit: 100 }).then(({ items }) => {
      if (!cancelled) {
        setRacks(items.sort((a, b) => a.rackCode.localeCompare(b.rackCode, 'vi')))
        setRackId('')
        setRackLevelId('')
        setLevels([])
        setBins([])
        onChange('')
      }
    })
    return () => {
      cancelled = true
    }
  }, [zoneId, onChange])

  useEffect(() => {
    if (!rackId) {
      setLevels([])
      setRackLevelId('')
      return
    }
    let cancelled = false
    rackLevelsApi.listRackLevels({ rackId, limit: 50 }).then(({ items }) => {
      if (!cancelled) {
        setLevels(items.sort((a, b) => a.levelNumber - b.levelNumber))
        setRackLevelId('')
        setBins([])
        onChange('')
      }
    })
    return () => {
      cancelled = true
    }
  }, [rackId, onChange])

  useEffect(() => {
    if (!rackLevelId) {
      setBins([])
      return
    }
    let cancelled = false
    binsApi.listBins({ rackLevelId, limit: 100 }).then(({ items }) => {
      if (!cancelled) {
        setBins(items.sort((a, b) => a.binCode.localeCompare(b.binCode, 'vi')))
        onChange('')
      }
    })
    return () => {
      cancelled = true
    }
  }, [rackLevelId, onChange])

  const selectedBin = useMemo(() => bins.find((b) => b.binId === value), [bins, value])

  const selectClass =
    'w-full rounded border border-white/10 bg-[#0f172a] px-2 py-1.5 text-sm disabled:opacity-50'

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 text-xs text-slate-500">Zone</label>
        <select
          className={`col-span-2 ${selectClass}`}
          value={zoneId}
          disabled={disabled || loading || !zones.length}
          onChange={(e) => setZoneId(e.target.value)}
        >
          <option value="">— Chọn zone —</option>
          {zones.map((z) => (
            <option key={z.zoneId} value={z.zoneId}>
              {z.zoneCode}
              {z.zoneName ? ` · ${z.zoneName}` : ''}
            </option>
          ))}
        </select>

        <label className="text-xs text-slate-500">Rack</label>
        <label className="text-xs text-slate-500">Tầng (level)</label>
        <select
          className={selectClass}
          value={rackId}
          disabled={disabled || !zoneId || !racks.length}
          onChange={(e) => setRackId(e.target.value)}
        >
          <option value="">— Rack —</option>
          {racks.map((r) => (
            <option key={r.rackId} value={r.rackId}>
              {r.rackCode}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={rackLevelId}
          disabled={disabled || !rackId || !levels.length}
          onChange={(e) => setRackLevelId(e.target.value)}
        >
          <option value="">— Tầng —</option>
          {levels.map((lv) => (
            <option key={lv.rackLevelId} value={lv.rackLevelId}>
              {levelLabel(lv)}
            </option>
          ))}
        </select>
      </div>

      <label className="block text-xs text-slate-500">Bin</label>
      <select
        className={selectClass}
        value={value}
        disabled={disabled || !rackLevelId || !bins.length}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Chọn bin —</option>
        {bins.map((b) => (
          <option key={b.binId} value={b.binId}>
            {b.binCode} · {formatBinOccupancy(b)} · {b.status ?? '—'}
          </option>
        ))}
      </select>

      {selectedBin && (
        <p className="text-xs text-slate-500">
          Đã chọn: <span className="font-mono text-cyan-400/90">{selectedBin.binCode}</span>
          {selectedBin.supportedBoxType ? ` · ${selectedBin.supportedBoxType}` : ''}
        </p>
      )}
    </div>
  )
}
