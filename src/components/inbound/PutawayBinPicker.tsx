import { InlineAlert } from '../ui/FeedbackAlert'
import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/client'
import * as inboundApi from '../../api/inboundRequests'
import * as zonesApi from '../../api/zones'
import * as racksApi from '../../api/racks'
import * as rackLevelsApi from '../../api/rackLevels'
import type { ApiRackLevel } from '../../api/rackLevels'
import * as binsApi from '../../api/bins'
import type { ApiBin } from '../../api/bins'
import * as storageReservationsApi from '../../api/storageReservations'
import { formatBinOccupancy, isBinPutawayEligible } from '../../utils/binOccupancy'
import type { BoxType } from '../../api/lpns'
import {
  estimateBinsForLpns,
  lpnsPerBin,
  putawayPendingHint,
} from '../../utils/putawayCapacity'
import {
  buildContractPutawayAllowlist,
  countPutawayEligibleBins,
  isBinAllowedForContract,
  isRackAllowedForContract,
  isRackLevelAllowedForContract,
  isZoneAllowedForContract,
} from '../../utils/putawayReservation'

type LevelStats = { eligible: number; total: number }

type Props = {
  warehouseId: string
  contractId: string
  value: string
  onChange: (binId: string) => void
  disabled?: boolean
  /** Số LPN còn RECEIVING chưa putaway — để gợi ý cần bao nhiêu bin/tầng. */
  pendingPutawayCount?: number
  /** Loại thùng đang chọn khi tạo LPN (hoặc LPN đang chọn putaway). */
  boxType?: BoxType
  inboundRequestId?: string
  movedBy?: string
  onBulkPutawayDone?: (result: {
    putawayCount: number
    assignments: { lpnCode: string; binCode: string }[]
  }) => void
}

function levelLabel(level: ApiRackLevel) {
  return level.levelCode?.trim() || `Tầng ${level.levelNumber}`
}

export function PutawayBinPicker({
  warehouseId,
  contractId,
  value,
  onChange,
  disabled,
  pendingPutawayCount = 0,
  boxType = 'MEDIUM',
  inboundRequestId,
  movedBy,
  onBulkPutawayDone,
}: Props) {
  const [zones, setZones] = useState<zonesApi.ApiZone[]>([])
  const [racks, setRacks] = useState<racksApi.ApiRack[]>([])
  const [levels, setLevels] = useState<ApiRackLevel[]>([])
  const [bins, setBins] = useState<ApiBin[]>([])
  const [levelStats, setLevelStats] = useState<Map<string, LevelStats>>(new Map())
  const [zoneEligibleBins, setZoneEligibleBins] = useState<number | null>(null)
  const [reservationsLoading, setReservationsLoading] = useState(false)
  const [reservations, setReservations] = useState<
    Awaited<ReturnType<typeof storageReservationsApi.listStorageReservations>>['items']
  >([])

  const [zoneId, setZoneId] = useState('')
  const [rackId, setRackId] = useState('')
  const [rackLevelId, setRackLevelId] = useState('')
  const [loading, setLoading] = useState(false)
  const [zoneCapacityLoading, setZoneCapacityLoading] = useState(false)
  const [autoBusy, setAutoBusy] = useState(false)
  const [autoError, setAutoError] = useState('')

  const allowlist = useMemo(
    () => buildContractPutawayAllowlist(reservations, warehouseId),
    [reservations, warehouseId]
  )

  const lpnsPerBinCount = lpnsPerBin(boxType)
  const estimatedBinsNeeded = estimateBinsForLpns(pendingPutawayCount, boxType)

  const selectedZoneAllowed = !zoneId || isZoneAllowedForContract(zoneId, allowlist)
  const selectedRackAllowed =
    !rackId || !zoneId || isRackAllowedForContract(rackId, zoneId, allowlist)
  const selectedLevelAllowed =
    !rackLevelId ||
    !rackId ||
    !zoneId ||
    isRackLevelAllowedForContract(rackLevelId, rackId, zoneId, allowlist)
  const locationAllowed =
    selectedZoneAllowed && selectedRackAllowed && selectedLevelAllowed

  const currentLevelStats = rackLevelId ? levelStats.get(rackLevelId) : undefined
  const eligibleBinsOnLevel = useMemo(() => {
    if (!rackId || !rackLevelId || !zoneId) return []
    return bins.filter((b) => {
      if (!isBinPutawayEligible(b)) return false
      return isBinAllowedForContract(
        b.binId,
        { zoneId, rackId, rackLevelId, binId: b.binId },
        allowlist
      )
    })
  }, [bins, zoneId, rackId, rackLevelId, allowlist])

  useEffect(() => {
    if (!contractId) {
      setReservations([])
      return
    }
    let cancelled = false
    setReservationsLoading(true)
    storageReservationsApi
      .listStorageReservations({ contractId, status: 'ACTIVE', limit: 100 })
      .then(({ items }) => {
        if (!cancelled) setReservations(items)
      })
      .finally(() => {
        if (!cancelled) setReservationsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [contractId])

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
          setLevelStats(new Map())
          setZoneEligibleBins(null)
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
      setZoneEligibleBins(null)
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
        setLevelStats(new Map())
        onChange('')
      }
    })
    return () => {
      cancelled = true
    }
  }, [zoneId, onChange])

  useEffect(() => {
    if (!zoneId || !racks.length) {
      setZoneEligibleBins(null)
      return
    }
    let cancelled = false
    setZoneCapacityLoading(true)
    ;(async () => {
      let total = 0
      try {
        for (const rack of racks) {
          const { items: levelItems } = await rackLevelsApi.listRackLevels({
            rackId: rack.rackId,
            limit: 50,
          })
          for (const lv of levelItems) {
            const { items: binItems } = await binsApi.listBins({
              rackLevelId: lv.rackLevelId,
              limit: 100,
            })
            total += countPutawayEligibleBins(binItems)
          }
        }
        if (!cancelled) setZoneEligibleBins(total)
      } finally {
        if (!cancelled) setZoneCapacityLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [zoneId, racks])

  useEffect(() => {
    if (!rackId) {
      setLevels([])
      setRackLevelId('')
      setLevelStats(new Map())
      return
    }
    let cancelled = false
    ;(async () => {
      const { items } = await rackLevelsApi.listRackLevels({ rackId, limit: 50 })
      const sorted = items.sort((a, b) => a.levelNumber - b.levelNumber)
      if (cancelled) return
      setLevels(sorted)
      setRackLevelId('')
      setBins([])
      onChange('')

      const stats = new Map<string, LevelStats>()
      await Promise.all(
        sorted.map(async (lv) => {
          const { items: binItems } = await binsApi.listBins({
            rackLevelId: lv.rackLevelId,
            limit: 100,
          })
          const loc = {
            zoneId,
            rackId,
            rackLevelId: lv.rackLevelId,
            binId: '',
          }
          const eligible = binItems.filter(
            (b) =>
              isBinPutawayEligible(b) &&
              isBinAllowedForContract(b.binId, { ...loc, binId: b.binId }, allowlist)
          ).length
          stats.set(lv.rackLevelId, {
            eligible,
            total: binItems.length,
          })
        })
      )
      if (!cancelled) setLevelStats(stats)
    })()
    return () => {
      cancelled = true
    }
  }, [rackId, zoneId, allowlist, onChange])

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

  const runAutoPutaway = async (scope: 'level' | 'rack' | 'zone') => {
    if (!inboundRequestId || !zoneId) return
    if (scope === 'level' && !rackLevelId) {
      setAutoError('Chọn tầng (level) trước khi putaway tự động theo tầng.')
      return
    }
    if (scope === 'rack' && !rackId) {
      setAutoError('Chọn rack trước khi putaway tự động theo rack.')
      return
    }
    setAutoBusy(true)
    setAutoError('')
    try {
      const result = await inboundApi.autoPutawayInbound(inboundRequestId, {
        zoneId,
        rackId: scope === 'rack' ? rackId : undefined,
        rackLevelId: scope === 'level' ? rackLevelId : undefined,
        movedBy,
      })
      onBulkPutawayDone?.({
        putawayCount: result.putawayCount,
        assignments: result.assignments,
      })
      setAutoError('')
    } catch (err) {
      setAutoError(err instanceof ApiError ? err.message : 'Putaway tự động thất bại')
    } finally {
      setAutoBusy(false)
    }
  }

  const contractHint =
    reservationsLoading
      ? 'Đang tải phạm vi HĐ...'
      : allowlist.hasWarehouseScope
        ? 'HĐ: toàn kho — mọi zone đều được putaway.'
        : allowlist.zoneCodes.length > 0
          ? `HĐ: zone được cấp — ${allowlist.zoneCodes.join(', ')}.`
          : reservations.length === 0
            ? 'HĐ chưa có phân bổ zone — putaway sẽ bị từ chối.'
            : 'HĐ: chỉ putaway vào rack/bin đã cấp chi tiết.'

  return (
    <div className="space-y-2">
      <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-2 text-[11px] leading-snug text-slate-400">
        {contractHint}
      </p>

      {pendingPutawayCount > 0 && (
        <>
          <p className="text-xs text-amber-200/90">{putawayPendingHint(pendingPutawayCount, boxType)}</p>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[11px] leading-relaxed text-slate-400">
            <p className="mb-1.5 font-medium text-slate-300">Cách chọn bin (mỗi lần 1 LPN)</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>
                <strong className="text-emerald-400">Nhanh:</strong> chọn Zone (và rack/tầng nếu cần) → bấm{' '}
                <strong className="text-emerald-400">Putaway tự động</strong> — ưu tiên bin đang có hàng
                (PARTIAL) trong rack, sau đó bin 0 cái còn chỗ.
              </li>
              <li>
                <strong className="text-slate-300">Thủ công:</strong> chọn 1 LPN → 1 bin → Putaway (lặp
                lại).
              </li>
            </ol>
          </div>
        </>
      )}

      {zoneId && zoneEligibleBins != null && !zoneCapacityLoading && (
        <p className="text-xs text-slate-500">
          Zone đang chọn: ~<strong className="text-slate-300">{zoneEligibleBins}</strong> bin còn
          nhận putaway
          {estimatedBinsNeeded > zoneEligibleBins ? (
            <span className="text-amber-400">
              {' '}
              — thiếu ~{estimatedBinsNeeded - zoneEligibleBins} bin (cần ~{estimatedBinsNeeded} bin cho{' '}
              {pendingPutawayCount} LPN {boxType}); cần zone khác hoặc thêm bin.
            </span>
          ) : null}
        </p>
      )}

      {zoneId && !selectedZoneAllowed && (
        <InlineAlert
          compact
          hideTitle
          message="Zone này không nằm trong hợp đồng. Chọn zone được cấp trên HĐ."
        />
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 text-xs text-slate-500">Zone (theo HĐ)</label>
        <select
          className={`col-span-2 ${selectClass} ${!selectedZoneAllowed ? 'border-red-500/50' : ''}`}
          value={zoneId}
          disabled={disabled || loading || !zones.length}
          onChange={(e) => setZoneId(e.target.value)}
          aria-label="Chọn zone putaway"
        >
          <option value="">— Chọn zone —</option>
          {zones.map((z) => {
            const inContract = isZoneAllowedForContract(z.zoneId, allowlist)
            return (
              <option key={z.zoneId} value={z.zoneId} disabled={!inContract && !allowlist.hasWarehouseScope}>
                {z.zoneCode}
                {z.zoneName ? ` · ${z.zoneName}` : ''}
                {inContract || allowlist.hasWarehouseScope ? ' · trong HĐ' : ' · ngoài HĐ'}
              </option>
            )
          })}
        </select>

        <label className="text-xs text-slate-500">Rack</label>
        <label className="text-xs text-slate-500">Tầng (level)</label>
        <select
          className={selectClass}
          value={rackId}
          disabled={disabled || !zoneId || !racks.length || !selectedZoneAllowed}
          onChange={(e) => setRackId(e.target.value)}
          aria-label="Chọn rack"
        >
          <option value="">— Rack —</option>
          {racks.map((r) => {
            const ok = zoneId
              ? isRackAllowedForContract(r.rackId, zoneId, allowlist)
              : true
            return (
              <option key={r.rackId} value={r.rackId} disabled={!ok}>
                {r.rackCode}
                {!ok ? ' · ngoài HĐ' : ''}
              </option>
            )
          })}
        </select>
        <select
          className={selectClass}
          value={rackLevelId}
          disabled={disabled || !rackId || !levels.length || !locationAllowed}
          onChange={(e) => setRackLevelId(e.target.value)}
          aria-label="Chọn tầng rack"
        >
          <option value="">— Tầng —</option>
          {levels.map((lv) => {
            const st = levelStats.get(lv.rackLevelId)
            const eligible = st?.eligible ?? 0
            const ok =
              zoneId && rackId
                ? isRackLevelAllowedForContract(lv.rackLevelId, rackId, zoneId, allowlist)
                : true
            return (
              <option key={lv.rackLevelId} value={lv.rackLevelId} disabled={!ok}>
                {levelLabel(lv)} ({eligible} bin còn chỗ{st ? ` / ${st.total}` : ''})
                {!ok ? ' · ngoài HĐ' : ''}
              </option>
            )
          })}
        </select>
      </div>

      {rackLevelId && currentLevelStats && (
        <p className="text-xs text-slate-500">
          Tầng này: <strong className="text-slate-300">{currentLevelStats.eligible}</strong> bin còn
          chỗ / {currentLevelStats.total} bin (~{currentLevelStats.eligible * lpnsPerBinCount} LPN{' '}
          {boxType} nếu xếp đầy).
          {currentLevelStats.eligible === 0 ? (
            <span className="text-amber-400"> Đã hết chỗ — chọn tầng hoặc rack khác.</span>
          ) : estimatedBinsNeeded > currentLevelStats.eligible ? (
            <span className="text-amber-400">
              {' '}
              Tầng này chỉ đủ ~{currentLevelStats.eligible} bin (~
              {currentLevelStats.eligible * lpnsPerBinCount} LPN). Bin thứ{' '}
              {estimatedBinsNeeded - currentLevelStats.eligible}+: mở dropdown{' '}
              <strong>Tầng</strong> chọn L2 (hoặc rack khác), rồi chọn bin trống tiếp.
            </span>
          ) : null}
        </p>
      )}

      <label className="block text-xs text-slate-500">
        Bin (mỗi lần putaway 1 bin — ~{lpnsPerBinCount} LPN {boxType}/bin)
      </label>
      <select
        className={selectClass}
        value={value}
        disabled={disabled || !rackLevelId || !eligibleBinsOnLevel.length || !locationAllowed}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Chọn bin putaway"
      >
        <option value="">— Chọn bin —</option>
        {eligibleBinsOnLevel.map((b) => (
          <option key={b.binId} value={b.binId}>
            {b.binCode} · {formatBinOccupancy(b)} · {b.status ?? '—'}
          </option>
        ))}
        {bins.length > 0 && eligibleBinsOnLevel.length === 0 && (
          <option value="" disabled>
            Tầng này không còn bin trống
          </option>
        )}
      </select>

      {bins.some((b) => !isBinPutawayEligible(b)) && eligibleBinsOnLevel.length > 0 && (
        <p className="text-[11px] text-slate-600">
          Ẩn {bins.length - eligibleBinsOnLevel.length} bin đầy / khóa trên tầng này.
        </p>
      )}

      {selectedBin && (
        <p className="text-xs text-slate-500">
          Đã chọn: <span className="font-mono text-cyan-400/90">{selectedBin.binCode}</span>
          {selectedBin.supportedBoxType ? ` · ${selectedBin.supportedBoxType}` : ''}
        </p>
      )}

      {inboundRequestId && pendingPutawayCount > 0 && zoneId && selectedZoneAllowed && (
        <div className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs font-medium text-emerald-300">Putaway hàng loạt</p>
          {autoError && (
            <InlineAlert compact hideTitle message={autoError} onDismiss={() => setAutoError('')} />
          )}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={disabled || autoBusy || !rackId || !selectedRackAllowed}
              onClick={() => runAutoPutaway('rack')}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              {autoBusy ? 'Đang putaway...' : `Tự động rack này (${pendingPutawayCount} LPN)`}
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={disabled || autoBusy || !rackLevelId}
                onClick={() => runAutoPutaway('level')}
                className="flex-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"
              >
                {autoBusy ? '...' : `Tự động tầng này (${pendingPutawayCount} LPN)`}
              </button>
              <button
                type="button"
                disabled={disabled || autoBusy}
                onClick={() => runAutoPutaway('zone')}
                className="flex-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"
              >
                {autoBusy ? '...' : `Tự động cả zone (${pendingPutawayCount} LPN)`}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-600">
            Ưu tiên gộp vào bin PARTIAL trong rack, rồi bin 0 cái. Dùng{' '}
            <strong className="text-slate-500">rack này</strong> để fill đúng rack đang xem (vd. A1).
            Dùng <strong className="text-slate-500">cả zone</strong> khi rack/tầng không đủ chỗ.
          </p>
        </div>
      )}
    </div>
  )
}
