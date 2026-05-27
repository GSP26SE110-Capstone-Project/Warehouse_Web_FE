import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { RackModal, type RackFormPayload } from '../../components/ui/modal/RackModal'
import { BinModal, type BinFormPayload } from '../../components/ui/modal/BinModal'
import { getDefaultBinCapacity } from '../../data/binCapacityDefaults'
import { formatBinOccupancy } from '../../utils/binOccupancy'
import {
  CinemaSeatGrid,
  SeatLegendItem,
  type CinemaSeat,
  type SeatVisualStatus,
} from '../../components/rack/CinemaSeatGrid'
import { layoutItemsInGrid, suggestRackCode } from '../../components/rack/rackLayoutUtils'
import { ensureRackLevels } from '../../components/rack/ensureRackLevels'
import { RACK_FIXED_LEVEL_COUNT, RACK_FIXED_TYPE } from '../../data/rackStructure'
import {
  computeZoneStorageCapacity,
  formatZoneCapacitySummary,
  RACK_FOOTPRINT_M2,
} from '../../utils/warehouseCapacity'
import { ApiError } from '../../api/client'
import * as warehousesApi from '../../api/warehouses'
import * as zonesApi from '../../api/zones'
import type { ApiZone } from '../../api/zones'
import * as racksApi from '../../api/racks'
import type { ApiRack } from '../../api/racks'
import * as rackLevelsApi from '../../api/rackLevels'
import type { ApiRackLevel } from '../../api/rackLevels'
import * as binsApi from '../../api/bins'
import type { ApiBin } from '../../api/bins'
import { useAuth } from '../../auth/AuthContext'
import { ZONE_TYPE_LABELS } from '../../data/zoneTypes'
import { BIN_STATUS_LABELS } from '../../data/rackStructure'

function binSeatStatus(bin: ApiBin | null): SeatVisualStatus {
  if (!bin) return 'empty-bin'
  switch (bin.status) {
    case 'FULL':
      return 'full'
    case 'PARTIAL':
      return 'partial'
    case 'RESERVED':
      return 'reserved'
    case 'BLOCKED':
      return 'blocked'
    default:
      return 'empty-bin'
  }
}

function rackSeatStatus(rack: ApiRack | null, selected: boolean): SeatVisualStatus {
  if (!rack) return 'empty'
  if (selected) return 'selected'
  return rack.status === 'BLOCKED' ? 'blocked' : 'active'
}

export const RackLayoutManagement = () => {
  const { user } = useAuth()
  const isWhAdmin = user?.role === 'WH_ADMIN'
  const fixedWarehouseId = isWhAdmin ? user?.warehouseId ?? '' : ''
  const [searchParams, setSearchParams] = useSearchParams()

  const [warehouses, setWarehouses] = useState<
    Awaited<ReturnType<typeof warehousesApi.listWarehouses>>['items']
  >([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(fixedWarehouseId)
  const [zones, setZones] = useState<ApiZone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState(searchParams.get('zoneId') ?? '')
  const [racks, setRacks] = useState<ApiRack[]>([])

  const [selectedRackId, setSelectedRackId] = useState<string | null>(null)
  const [levels, setLevels] = useState<ApiRackLevel[]>([])
  const [binsByLevel, setBinsByLevel] = useState<Record<string, ApiBin[]>>({})

  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  const [rackModal, setRackModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    suggestedCode?: string
    data?: ApiRack
  }>({ open: false, mode: 'create' })

  const [binModal, setBinModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    rackLevelId: string
    levelNumber: number
    binCode: string
    bin?: ApiBin
  } | null>(null)

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'confirm'
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  const activeWarehouseId = isWhAdmin ? fixedWarehouseId : selectedWarehouseId
  const activeZone = zones.find((z) => z.zoneId === selectedZoneId)
  const selectedRack = racks.find((r) => r.rackId === selectedRackId)

  const capacity = useMemo(
    () => computeZoneStorageCapacity(activeZone?.areaM2),
    [activeZone?.areaM2]
  )

  const rackGridColumns = useMemo(() => {
    if (!capacity.hasArea || capacity.maxRacks <= 0) return 8
    return Math.min(14, Math.max(4, Math.ceil(Math.sqrt(capacity.maxRacks))))
  }, [capacity])

  useEffect(() => {
    if (!isWhAdmin) {
      warehousesApi.listWarehouses({ limit: 100 }).then(({ items }) => {
        setWarehouses(items)
        if (items.length && !selectedWarehouseId) {
          setSelectedWarehouseId(items[0].warehouseId)
        }
      })
    } else if (fixedWarehouseId) {
      warehousesApi.getWarehouse(fixedWarehouseId).then((w) => setWarehouses([w]))
    }
  }, [isWhAdmin, fixedWarehouseId, selectedWarehouseId])

  useEffect(() => {
    if (!activeWarehouseId) {
      setZones([])
      return
    }
    let cancelled = false
    zonesApi.listZones({ warehouseId: activeWarehouseId, limit: 100 }).then(({ items }) => {
      if (cancelled) return
      setZones(items)
      const fromUrl = searchParams.get('zoneId')
      if (fromUrl && items.some((z) => z.zoneId === fromUrl)) {
        setSelectedZoneId(fromUrl)
      } else {
        setSelectedZoneId((prev) => {
          if (prev && items.some((z) => z.zoneId === prev)) return prev
          return items[0]?.zoneId ?? ''
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [activeWarehouseId, searchParams])

  const loadRacks = useCallback(async () => {
    if (!selectedZoneId) {
      setRacks([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const { items } = await racksApi.listRacks({ zoneId: selectedZoneId, limit: 200 })
      setRacks(items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được rack')
    } finally {
      setLoading(false)
    }
  }, [selectedZoneId])

  useEffect(() => {
    loadRacks()
    setSelectedRackId(null)
  }, [loadRacks])

  useEffect(() => {
    if (selectedZoneId) {
      setSearchParams((p) => {
        const next = new URLSearchParams(p)
        next.set('zoneId', selectedZoneId)
        return next
      })
    }
  }, [selectedZoneId, setSearchParams])

  const loadRackDetail = useCallback(async (rackId: string) => {
    setDetailLoading(true)
    try {
      await ensureRackLevels(rackId, capacity.binsPerLevel)
      const { items: levelItems } = await rackLevelsApi.listRackLevels({ rackId, limit: 50 })
      const sorted = [...levelItems]
        .filter((l) => l.levelNumber >= 1 && l.levelNumber <= RACK_FIXED_LEVEL_COUNT)
        .sort((a, b) => a.levelNumber - b.levelNumber)
      setLevels(sorted)

      const binMap: Record<string, ApiBin[]> = {}
      await Promise.all(
        sorted.map(async (lv) => {
          const { items } = await binsApi.listBins({ rackLevelId: lv.rackLevelId, limit: 100 })
          binMap[lv.rackLevelId] = items.sort((a, b) => a.binCode.localeCompare(b.binCode, 'vi'))
        })
      )
      setBinsByLevel(binMap)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải chi tiết rack')
    } finally {
      setDetailLoading(false)
    }
  }, [capacity.binsPerLevel])

  useEffect(() => {
    if (selectedRackId) loadRackDetail(selectedRackId)
    else {
      setLevels([])
      setBinsByLevel({})
    }
  }, [selectedRackId, loadRackDetail])

  const rackGrid = useMemo(() => {
    const { cells } = layoutItemsInGrid(racks, rackGridColumns, (r) => r.rackCode)
    const seatRows: CinemaSeat[][] = cells.map((row) =>
      row.map((rack) => {
        const selected = rack?.rackId === selectedRackId
        return {
          id: rack?.rackId ?? null,
          label: rack ? rack.rackCode : '+',
          hint: rack
            ? `${rack.rackType ?? 'STANDARD'} · ${rack.status ?? 'ACTIVE'}`
            : 'Thêm rack',
          status: rackSeatStatus(rack, Boolean(selected)),
        }
      })
    )
    return seatRows
  }, [racks, rackGridColumns, selectedRackId])

  const binGrid = useMemo(() => {
    if (!levels.length) return { cells: [] as CinemaSeat[][], cols: 0 }

    const maxCols = Math.max(
      capacity.binsPerLevel,
      ...levels.map((lv) => {
        const bins = binsByLevel[lv.rackLevelId] ?? []
        return Math.max(bins.length, 1)
      })
    )

    const cells: CinemaSeat[][] = levels.map((lv) => {
      const bins = binsByLevel[lv.rackLevelId] ?? []
      const row: CinemaSeat[] = []
      for (let c = 0; c < maxCols; c += 1) {
        const bin = bins[c] ?? null
        row.push({
          id: bin?.binId ?? null,
          label: bin
            ? `${bin.binCode.slice(-3)}\n${bin.currentLpnCount ?? 0}/${bin.maxLpnCount ?? '?'}`
            : '+',
          hint: bin
            ? `${bin.binCode} · ${formatBinOccupancy(bin)} · ${
                BIN_STATUS_LABELS[bin.status ?? ''] ?? bin.status
              }`
            : `Tầng ${lv.levelNumber} · ô ${c + 1}`,
          status: binSeatStatus(bin),
        })
      }
      return row
    })

    return { cells, cols: maxCols }
  }, [levels, binsByLevel, capacity.binsPerLevel])

  const handleRackSeatClick = (seat: CinemaSeat, row: number, col: number) => {
    if (seat.id) {
      setSelectedRackId(seat.id)
      return
    }
    if (!capacity.hasArea) {
      setError('Zone chưa có diện tích (m²). Cập nhật tại Quản lý Zone trước khi thêm rack.')
      return
    }
    if (racks.length >= capacity.maxRacks) {
      setError(
        `Đã đủ ${capacity.maxRacks} rack (${RACK_FOOTPRINT_M2} m²/rack, zone ${capacity.areaM2} m²)`
      )
      return
    }
    setRackModal({
      open: true,
      mode: 'create',
      suggestedCode: suggestRackCode(row, col),
    })
  }

  const handleBinSeatClick = (seat: CinemaSeat, row: number, col: number) => {
    if (!selectedRack || !levels[row] || !activeZone) return
    const level = levels[row]

    if (seat.id) {
      const bin = (binsByLevel[level.rackLevelId] ?? []).find((b) => b.binId === seat.id)
      if (!bin) return
      setBinModal({
        open: true,
        mode: 'edit',
        rackLevelId: level.rackLevelId,
        levelNumber: level.levelNumber,
        binCode: bin.binCode,
        bin,
      })
      return
    }

    if (col >= capacity.binsPerLevel) {
      setError(`Mỗi tầng tối đa ${capacity.binsPerLevel} bin (theo diện tích zone)`)
      return
    }
    const existing = binsByLevel[level.rackLevelId] ?? []
    if (existing.length >= capacity.binsPerLevel) {
      setError(`Tầng ${level.levelNumber} đã đủ ${capacity.binsPerLevel} bin`)
      return
    }

    const code = `${selectedRack.rackCode}-L${level.levelNumber}-${col + 1}`
    setBinModal({
      open: true,
      mode: 'create',
      rackLevelId: level.rackLevelId,
      levelNumber: level.levelNumber,
      binCode: code,
    })
  }

  const submitBin = async (payload: BinFormPayload) => {
    if (!binModal || !selectedRack) return
    if (binModal.mode === 'create') {
      await binsApi.createBin({
        rackLevelId: binModal.rackLevelId,
        binCode: binModal.binCode,
        maxLpnCount: payload.maxLpnCount,
        maxVolumeUnits: payload.maxVolumeUnits,
        reservationType: payload.reservationType,
        status: 'EMPTY',
      })
    } else if (binModal.bin) {
      const body: Parameters<typeof binsApi.updateBin>[1] = {
        maxLpnCount: payload.maxLpnCount,
        maxVolumeUnits: payload.maxVolumeUnits,
        reservationType: payload.reservationType,
      }
      if (payload.status) body.status = payload.status
      await binsApi.updateBin(binModal.bin.binId, body)
    }
    await loadRackDetail(selectedRack.rackId)
    setAlert({
      open: true,
      type: 'success',
      message: binModal.mode === 'create' ? 'Đã tạo bin' : 'Đã lưu cấu hình bin',
    })
  }

  const submitRack = async (payload: RackFormPayload) => {
    if (!selectedZoneId) return
    if (rackModal.mode === 'create') {
      const rack = await racksApi.createRack({
        zoneId: selectedZoneId,
        rackCode: payload.rackCode,
        rackType: RACK_FIXED_TYPE,
        maxLevels: RACK_FIXED_LEVEL_COUNT,
        status: payload.status,
      })
      await ensureRackLevels(rack.rackId, capacity.binsPerLevel)
    } else if (rackModal.data) {
      await racksApi.updateRack(rackModal.data.rackId, {
        rackType: RACK_FIXED_TYPE,
        maxLevels: RACK_FIXED_LEVEL_COUNT,
        status: payload.status,
      })
    }
    await loadRacks()
    setAlert({ open: true, type: 'success', message: 'Đã lưu rack (3 tầng)' })
  }

  const zoneScreenLabel = activeZone
    ? `${activeZone.zoneCode}${activeZone.zoneName ? ` · ${activeZone.zoneName}` : ''} — ${
        ZONE_TYPE_LABELS[activeZone.zoneType ?? ''] ?? activeZone.zoneType
      }`
    : 'Chọn zone'

  return (
    <div className="flex min-h-full flex-col gap-6 p-6 lg:p-8">
      <LoadingOverlay show={loading && !racks.length} text="Đang tải sơ đồ rack…" />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sơ đồ Rack</h1>
          <p className="mt-1 text-sm text-slate-400">
            {RACK_FOOTPRINT_M2} m²/rack · {RACK_FIXED_LEVEL_COUNT} tầng/rack · bin/tầng theo diện tích zone
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isWhAdmin && (
            <select
              aria-label="Chọn kho"
              className="rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm text-white"
              value={selectedWarehouseId}
              onChange={(e) => {
                setSelectedWarehouseId(e.target.value)
                setSelectedZoneId('')
              }}
            >
              {warehouses.map((w) => (
                <option key={w.warehouseId} value={w.warehouseId}>
                  {w.warehouseName}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Chọn zone"
            className="rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm text-white"
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            disabled={!zones.length}
          >
            {zones.map((z) => (
              <option key={z.zoneId} value={z.zoneId}>
                {z.zoneCode} {z.zoneName ? `— ${z.zoneName}` : ''}
              </option>
            ))}
          </select>
        </div>
      </header>

      {activeZone && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          {capacity.hasArea ? (
            <p>
              Zone <span className="font-mono text-cyan-400">{activeZone.zoneCode}</span>:{' '}
              <strong>{capacity.areaM2}</strong> m² tổng · trừ{' '}
              <strong>{Math.round(capacity.aisleRatio * 100)}%</strong> lối đi xe (
              {capacity.aisleAreaM2.toFixed(1)} m²) →{' '}
              <strong>{capacity.storageAreaM2.toFixed(1)}</strong> m² đặt rack →{' '}
              {formatZoneCapacitySummary(capacity).split('(')[0].trim()} · đang có{' '}
              <strong className="text-amber-300">{racks.length}</strong> rack
            </p>
          ) : (
            <p className="text-amber-200/90">
              Zone chưa khai báo diện tích (m²). Vào{' '}
              <strong>Quản lý Zone</strong> nhập <code className="text-cyan-400">areaM2</code> để
              tính số rack và bin.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
          <button type="button" className="ml-3 underline" onClick={() => setError('')}>
            Đóng
          </button>
        </div>
      )}

      <section className="glass-panel overflow-x-auto rounded-xl border border-white/5 p-6">
        {!selectedZoneId ? (
          <p className="text-center text-slate-500">Chọn kho và zone để xem sơ đồ rack</p>
        ) : (
          <CinemaSeatGrid
            screenLabel={zoneScreenLabel}
            cells={rackGrid}
            selectedId={selectedRackId}
            perspective
            onSeatClick={handleRackSeatClick}
            legend={
              <>
                <SeatLegendItem status="active" label="Rack hoạt động" />
                <SeatLegendItem status="blocked" label="Rack khóa" />
                <SeatLegendItem status="selected" label="Đang chọn" />
                <SeatLegendItem status="empty" label="Ô trống (+ thêm rack)" />
              </>
            }
          />
        )}
        <p className="mt-4 text-center text-xs text-slate-500">
          {racks.length}
          {capacity.hasArea ? ` / ${capacity.maxRacks}` : ''} rack · Nhấn ô trống để thêm · Nhấn
          rack để xem bin
        </p>
      </section>

      {selectedRack && (
        <section className="glass-panel rounded-xl border border-white/5 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                Rack <span className="font-mono text-cyan-400">{selectedRack.rackCode}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {RACK_FIXED_TYPE} · {selectedRack.status} · {RACK_FIXED_LEVEL_COUNT} tầng ·{' '}
                {capacity.binsPerLevel} bin/tầng
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setRackModal({ open: true, mode: 'edit', data: selectedRack })
                }
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
              >
                Sửa rack
              </button>
              <button
                type="button"
                onClick={() =>
                  setAlert({
                    open: true,
                    type: 'confirm',
                    message: `Xóa rack ${selectedRack.rackCode}?`,
                    onConfirm: async () => {
                      await racksApi.deleteRack(selectedRack.rackId)
                      setSelectedRackId(null)
                      await loadRacks()
                      setAlert({ open: true, type: 'success', message: 'Đã xóa rack' })
                    },
                  })
                }
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
              >
                Xóa
              </button>
            </div>
          </div>

          <LoadingOverlay show={detailLoading} text="Đang tải bin…" />

          {levels.length < RACK_FIXED_LEVEL_COUNT && !detailLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Đang khởi tạo 3 tầng…</p>
          ) : (
            <CinemaSeatGrid
              screenLabel={`BIN · ${selectedRack.rackCode}`}
              rowLabels={levels.map((l) => `T${l.levelNumber}`)}
              cells={binGrid.cells}
              perspective={false}
              compact
              onSeatClick={handleBinSeatClick}
              legend={
                <>
                  <SeatLegendItem status="empty-bin" label="Bin trống" />
                  <SeatLegendItem status="partial" label="Một phần" />
                  <SeatLegendItem status="full" label="Đầy" />
                  <SeatLegendItem status="reserved" label="Giữ chỗ" />
                  <SeatLegendItem status="blocked" label="Khóa" />
                </>
              }
            />
          )}
          {activeZone && (
            <p className="mt-2 text-center text-xs text-slate-400">
              Mặc định zone {ZONE_TYPE_LABELS[activeZone.zoneType ?? ''] ?? activeZone.zoneType}:{' '}
              {getDefaultBinCapacity(activeZone.zoneType).maxLpnCount} LPN /{' '}
              {getDefaultBinCapacity(activeZone.zoneType).maxVolumeUnits} volume
            </p>
          )}
          <p className="mt-1 text-center text-[10px] text-slate-500">
            Nhấn ô &quot;+&quot; hoặc bin để cấu hình maxLpnCount · maxVolumeUnits · tooltip hiển thị
            LPN/Vol đang dùng
          </p>
        </section>
      )}

      {binModal?.open && activeZone && selectedRack && (
        <BinModal
          mode={binModal.mode}
          zoneType={activeZone.zoneType}
          zoneLabel={`${activeZone.zoneCode}${activeZone.zoneName ? ` · ${activeZone.zoneName}` : ''}`}
          rackCode={selectedRack.rackCode}
          levelLabel={`Tầng ${binModal.levelNumber}`}
          binCode={binModal.binCode}
          data={binModal.bin}
          onClose={() => setBinModal(null)}
          onSubmit={submitBin}
        />
      )}

      {rackModal.open && activeZone && (
        <RackModal
          mode={rackModal.mode}
          zoneLabel={`${activeZone.zoneCode}`}
          suggestedCode={rackModal.suggestedCode}
          data={rackModal.data}
          onClose={() => setRackModal({ open: false, mode: 'create' })}
          onSubmit={submitRack}
        />
      )}

      {alert.open && alert.message && (
        <AlertModal
          title={alert.type === 'confirm' ? 'Xác nhận' : 'Thông báo'}
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ open: false, type: 'success', message: '' })}
          onConfirm={alert.onConfirm}
        />
      )}
    </div>
  )
}
