import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import * as binsApi from '../../api/bins'
import * as rackLevelsApi from '../../api/rackLevels'
import * as racksApi from '../../api/racks'
import * as zonesApi from '../../api/zones'
import type { AppendixReservationCreate } from '../../api/contractAppendices'
import type { ContractTypeValue } from '../../data/contractTypes'
import {
  getOnboardingStoragePlan,
  isZoneEligibleForContract,
  requiredZoneTypeForContract,
  storagePlanShortLabel,
  zoneEligibilityHint,
  type StorageLevel,
} from '../../utils/onboardingStorage'
import {
  buildStorageReservations,
  validateStorageSelection,
} from '../../utils/buildStorageReservations'
import {
  allowsCombiningZonesForLpn,
  estimateZoneLpnCapacity,
  formatZoneRackSummary,
  isZoneEligibleForLpnDemand,
  zoneLpnShortfallMessage,
} from '../../utils/warehouseCapacity'

const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
const inputStyle =
  'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400'
const selectStyle = inputStyle

export type ContractStorageAssignmentPanelRef = {
  validate: () => string | null
  buildReservations: () => AppendixReservationCreate[]
}

type Props = {
  contractType: string
  warehouseId: string
  startDate: string
  endDate: string
  requestedStorageLevel?: StorageLevel | null
  reservedCapacityDefault?: string
  compact?: boolean
}

function formatZoneOptionLabel(z: zonesApi.ApiZone) {
  const za = Number(z.areaM2) || 0
  const lpn = estimateZoneLpnCapacity(z)
  return `${z.zoneCode}${z.zoneName ? ` — ${z.zoneName}` : ''} (${z.zoneType}${za > 0 ? ` · ${za} m²` : ''} · ${formatZoneRackSummary(z)}${lpn > 0 ? ` · ~${lpn} thùng` : ''})`
}

export const ContractStorageAssignmentPanel = forwardRef<
  ContractStorageAssignmentPanelRef,
  Props
>(function ContractStorageAssignmentPanel(
  {
    contractType,
    warehouseId,
    startDate,
    endDate,
    requestedStorageLevel,
    reservedCapacityDefault = '',
    compact = false,
  },
  ref
) {
  const storagePlan = useMemo(
    () => getOnboardingStoragePlan(contractType),
    [contractType]
  )
  const effectiveLevel = requestedStorageLevel ?? storagePlan.storageLevel
  const allowsMultiZone = storagePlan.needsZone && effectiveLevel !== 'BIN'
  const requiredZoneType = requiredZoneTypeForContract(contractType)

  const [zones, setZones] = useState<zonesApi.ApiZone[]>([])
  const [racks, setRacks] = useState<racksApi.ApiRack[]>([])
  const [rackLevels, setRackLevels] = useState<rackLevelsApi.ApiRackLevel[]>([])
  const [bins, setBins] = useState<binsApi.ApiBin[]>([])
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([])
  const zoneId = selectedZoneIds[0] ?? ''
  const [rackId, setRackId] = useState('')
  const [rackLevelId, setRackLevelId] = useState('')
  const [binId, setBinId] = useState('')
  const [reservedCapacity, setReservedCapacity] = useState(reservedCapacityDefault)

  const reservedCapacityNum = useMemo(() => {
    const n = Number(reservedCapacity)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [reservedCapacity])

  const selectedZones = useMemo(
    () => zones.filter((z) => selectedZoneIds.includes(z.zoneId)),
    [zones, selectedZoneIds]
  )

  useEffect(() => {
    if (!reservedCapacityNum) return
    setSelectedZoneIds((prev) =>
      prev.filter((id) => {
        const z = zones.find((x) => x.zoneId === id)
        if (!z) return false
        return (
          isZoneEligibleForContract(contractType, z) &&
          isZoneEligibleForLpnDemand(z, reservedCapacityNum, contractType)
        )
      })
    )
  }, [contractType, zones, reservedCapacityNum])

  useEffect(() => {
    if (!warehouseId) return
    let cancelled = false
    zonesApi
      .listZones({ warehouseId, limit: 100, status: 'ACTIVE' })
      .then((res) => {
        if (!cancelled) setZones(res.items)
      })
      .catch(() => {
        if (!cancelled) setZones([])
      })
    return () => {
      cancelled = true
    }
  }, [warehouseId])

  useEffect(() => {
    if (!zoneId) {
      setRacks([])
      setRackId('')
      return
    }
    let cancelled = false
    racksApi
      .listRacks({ zoneId, limit: 100 })
      .then((res) => {
        if (!cancelled) setRacks(res.items)
      })
      .catch(() => {
        if (!cancelled) setRacks([])
      })
    return () => {
      cancelled = true
    }
  }, [zoneId])

  useEffect(() => {
    if (!rackId) {
      setRackLevels([])
      setRackLevelId('')
      return
    }
    let cancelled = false
    rackLevelsApi
      .listRackLevels({ rackId, limit: 20 })
      .then((res) => {
        if (!cancelled) setRackLevels(res.items)
      })
      .catch(() => {
        if (!cancelled) setRackLevels([])
      })
    return () => {
      cancelled = true
    }
  }, [rackId])

  useEffect(() => {
    if (!rackLevelId) {
      setBins([])
      setBinId('')
      return
    }
    let cancelled = false
    binsApi
      .listBins({ rackLevelId, limit: 200, status: 'ACTIVE' })
      .then((res) => {
        if (!cancelled) {
          const eligible = res.items.filter(
            (b) =>
              (b.reservationType === 'RESERVED' || b.reservationType === 'EMPTY') &&
              (b.status === 'EMPTY' || b.status === 'ACTIVE')
          )
          setBins(eligible)
        }
      })
      .catch(() => {
        if (!cancelled) setBins([])
      })
    return () => {
      cancelled = true
    }
  }, [rackLevelId])

  const buildInput = useCallback(
    () => ({
      contractType,
      warehouseId,
      startDate,
      endDate,
      storageLevel: effectiveLevel,
      selectedZoneIds,
      zones,
      zoneId,
      rackId: rackId || undefined,
      rackLevelId: rackLevelId || undefined,
      binId: binId || undefined,
      reservedCapacityNum,
    }),
    [
      contractType,
      warehouseId,
      startDate,
      endDate,
      effectiveLevel,
      selectedZoneIds,
      zones,
      zoneId,
      rackId,
      rackLevelId,
      binId,
      reservedCapacityNum,
    ]
  )

  useImperativeHandle(
    ref,
    () => ({
      validate: () => validateStorageSelection(buildInput()),
      buildReservations: () => buildStorageReservations(buildInput()),
    }),
    [buildInput]
  )

  const needsZone =
    effectiveLevel === 'ZONE' ||
    effectiveLevel === 'RACK' ||
    effectiveLevel === 'RACK_LEVEL' ||
    effectiveLevel === 'BIN' ||
    storagePlan.needsZone
  const needsRack = effectiveLevel === 'RACK' || effectiveLevel === 'RACK_LEVEL' || effectiveLevel === 'BIN'
  const needsBin = effectiveLevel === 'BIN'

  return (
    <div className={`space-y-4 ${compact ? '' : ''}`}>
      <p className="text-sm text-slate-300">
        <span className="mr-2 inline-block rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">
          {storagePlanShortLabel(contractType as ContractTypeValue)}
        </span>
        {storagePlan.hint}
        {requestedStorageLevel && (
          <span className="mt-1 block text-xs text-slate-500">
            Cấp yêu cầu: <strong className="text-slate-400">{requestedStorageLevel}</strong>
          </span>
        )}
      </p>

      {needsZone && (
        <div>
          <label className={labelStyle}>
            {allowsMultiZone ? 'Zone cấp cho tenant (chọn một hoặc nhiều)' : 'Zone'}
          </label>
          {zones.length === 0 ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Chưa có zone ACTIVE — tạo zone trong quản lý kho trước.
            </p>
          ) : allowsMultiZone ? (
            <div className="dark-scrollbar-inset max-h-64 space-y-2 overflow-y-auto rounded-lg border border-white/10 p-2 pr-1">
              {zones.map((z) => {
                const checked = selectedZoneIds.includes(z.zoneId)
                const typeEligible = isZoneEligibleForContract(contractType, z)
                const lpnEligible = isZoneEligibleForLpnDemand(z, reservedCapacityNum, contractType)
                const eligible = typeEligible && lpnEligible
                const zoneLpn = estimateZoneLpnCapacity(z)
                return (
                  <label
                    key={z.zoneId}
                    className={`flex gap-3 rounded-lg border p-3 text-xs ${
                      !eligible
                        ? 'cursor-not-allowed border-white/5 opacity-55'
                        : checked
                          ? 'cursor-pointer border-cyan-400/50 bg-cyan-400/10'
                          : 'cursor-pointer border-white/5 bg-white/[0.02] hover:border-white/15'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!eligible}
                      onChange={() => {
                        if (!eligible) return
                        setSelectedZoneIds((prev) =>
                          prev.includes(z.zoneId)
                            ? prev.filter((id) => id !== z.zoneId)
                            : [...prev, z.zoneId]
                        )
                      }}
                      className="mt-1 rounded border-white/20"
                    />
                    <span className="text-slate-300">
                      {formatZoneOptionLabel(z)}
                      {!typeEligible && requiredZoneType ? (
                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          Cần zone {requiredZoneType}
                        </span>
                      ) : null}
                      {typeEligible && !lpnEligible && reservedCapacityNum != null ? (
                        <span className="mt-0.5 block text-[10px] text-amber-400/90">
                          {zoneLpnShortfallMessage(zoneLpn, reservedCapacityNum)}
                        </span>
                      ) : null}
                    </span>
                  </label>
                )
              })}
            </div>
          ) : (
            <select
              className={selectStyle}
              value={zoneId}
              onChange={(e) => setSelectedZoneIds(e.target.value ? [e.target.value] : [])}
              aria-label="Chọn zone"
            >
              <option value="">— Chọn zone —</option>
              {zones.map((z) => {
                const typeEligible = isZoneEligibleForContract(contractType, z)
                const lpnEligible = isZoneEligibleForLpnDemand(z, reservedCapacityNum, contractType)
                const eligible = typeEligible && lpnEligible
                const zoneLpn = estimateZoneLpnCapacity(z)
                return (
                  <option key={z.zoneId} value={z.zoneId} disabled={!eligible}>
                    {formatZoneOptionLabel(z)}
                    {!typeEligible && requiredZoneType ? ` — cần ${requiredZoneType}` : ''}
                    {typeEligible && !lpnEligible && reservedCapacityNum != null
                      ? ` — ${zoneLpnShortfallMessage(zoneLpn, reservedCapacityNum)}`
                      : ''}
                  </option>
                )
              })}
            </select>
          )}
          {zoneEligibilityHint(contractType) && (
            <p className="mt-1 text-[11px] text-slate-500">{zoneEligibilityHint(contractType)}</p>
          )}
          {reservedCapacityNum != null &&
            reservedCapacityNum > 0 &&
            !allowsCombiningZonesForLpn(contractType) && (
            <p className="mt-1 text-[11px] text-slate-500">
              Chỉ chọn zone ước tính ≥{' '}
              <strong className="text-slate-400">
                {reservedCapacityNum.toLocaleString('vi-VN')}
              </strong>{' '}
              thùng/LPN theo quy mô hàng tenant.
            </p>
          )}
          {selectedZones.length > 0 && reservedCapacityNum != null && (
            <p className="mt-2 text-xs text-slate-400">
              {selectedZones.length} zone · ước tính ~
              {selectedZones
                .reduce((sum, z) => sum + estimateZoneLpnCapacity(z), 0)
                .toLocaleString('vi-VN')}{' '}
              LPN
            </p>
          )}
        </div>
      )}

      {needsRack && zoneId && (
        <div>
          <label className={labelStyle}>Rack</label>
          <select
            className={selectStyle}
            value={rackId}
            aria-label="Chọn rack"
            onChange={(e) => setRackId(e.target.value)}
          >
            <option value="">— Chọn rack —</option>
            {racks.map((r) => (
              <option key={r.rackId} value={r.rackId}>
                {r.rackCode}
              </option>
            ))}
          </select>
        </div>
      )}

      {needsBin && rackId && (
        <>
          <div>
            <label className={labelStyle}>Tầng rack</label>
            <select
              className={selectStyle}
              value={rackLevelId}
              aria-label="Chọn tầng rack"
              onChange={(e) => setRackLevelId(e.target.value)}
            >
              <option value="">— Chọn tầng —</option>
              {rackLevels.map((l) => (
                <option key={l.rackLevelId} value={l.rackLevelId}>
                  Tầng {l.levelNumber}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelStyle}>Bin (RESERVED / EMPTY)</label>
            <select
              className={selectStyle}
              value={binId}
              aria-label="Chọn bin"
              onChange={(e) => setBinId(e.target.value)}
            >
              <option value="">— Chọn bin —</option>
              {bins.map((b) => (
                <option key={b.binId} value={b.binId}>
                  {b.binCode} — {b.status} ({b.reservationType})
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {(effectiveLevel === 'ZONE' || effectiveLevel === 'WAREHOUSE') && (
        <div>
          <label className={labelStyle}>Dung lượng giữ (thùng / LPN)</label>
          <input
            className={inputStyle}
            type="number"
            min={0}
            value={reservedCapacity}
            onChange={(e) => setReservedCapacity(e.target.value)}
            placeholder="VD: 80"
          />
        </div>
      )}
    </div>
  )
})
