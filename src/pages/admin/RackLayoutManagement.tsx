import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { RackModal, type RackFormPayload } from '../../components/ui/modal/RackModal'
import { BinModal, type BinFormPayload } from '../../components/ui/modal/BinModal'
import { getDefaultBinCapacity } from '../../data/binCapacityDefaults'
import { formatBinOccupancy } from '../../utils/binOccupancy'
import {
  ZoneFloorPlanGrid,
  SeatLegendItem,
  type CinemaSeat,
} from '../../components/rack/ZoneFloorPlanGrid'
import {
  layoutItemsInGrid,
  listEmptyRackSlotCodes,
  suggestRackCode,
} from '../../components/rack/rackLayoutUtils'
import { BulkRackModal } from '../../components/ui/modal/BulkRackModal'
import { BulkBinModal } from '../../components/ui/modal/BulkBinModal'
import { BulkBinDeleteModal } from '../../components/ui/modal/BulkBinDeleteModal'
import { CinemaSeatGrid } from '../../components/rack/CinemaSeatGrid'
import {
  listDeletableBinsForLevel,
  listDeletableBinsForRack,
  listEmptyBinSlotsForLevel,
  listEmptyBinSlotsForRack,
} from '../../components/rack/binLayoutUtils'
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
import * as inventoriesApi from '../../api/inventories'
import type { ApiInventory } from '../../api/inventories'
import { useAuth } from '../../auth/AuthContext'
import { zoneTypeLabel } from '../../data/zoneTypes'
import { BIN_STATUS_LABELS } from '../../data/rackStructure'
import {
  aggregateInventoriesByRackFromBinCodes,
  binBelongsToRack,
  binSeatStatusFromInventory,
  fetchAllWarehouseInventories,
  filterActiveInventories,
  filterInventoriesForZone,
  indexInventoriesByBin,
  rackSeatVisualFromInventory,
} from '../../utils/rackInventoryIndex'

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
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [warehouseInventories, setWarehouseInventories] = useState<ApiInventory[]>([])
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [rackModal, setRackModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    suggestedCode?: string
    data?: ApiRack
  }>({ open: false, mode: 'create' })

  const [bulkRackModalOpen, setBulkRackModalOpen] = useState(false)
  const [bulkBinModalOpen, setBulkBinModalOpen] = useState(false)
  const [bulkBinDeleteModalOpen, setBulkBinDeleteModalOpen] = useState(false)
  const [bulkCreating, setBulkCreating] = useState(false)

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
    type: 'success' | 'confirm' | 'error'
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

  const emptyRackSlotCodes = useMemo(() => {
    if (!capacity.hasArea) return []
    return listEmptyRackSlotCodes(racks, rackGridColumns, capacity.maxRacks)
  }, [racks, rackGridColumns, capacity.hasArea, capacity.maxRacks])

  const remainingRackSlots = capacity.hasArea
    ? Math.max(0, capacity.maxRacks - racks.length)
    : 0

  /** Nút bulk rack: zone đã chọn và còn slot, hoặc zone chưa có m² (mở modal hướng dẫn). */
  const canBulkCreateRacks =
    Boolean(selectedZoneId) && (!capacity.hasArea || remainingRackSlots > 0)

  const emptyBinSlotsForRack = useMemo(() => {
    if (!selectedRack || !levels.length || !capacity.hasArea) return []
    return listEmptyBinSlotsForRack(
      selectedRack.rackCode,
      levels.map((l) => ({ rackLevelId: l.rackLevelId, levelNumber: l.levelNumber })),
      binsByLevel,
      capacity.binsPerLevel
    )
  }, [selectedRack, levels, binsByLevel, capacity.hasArea, capacity.binsPerLevel])

  const emptyBinSlotsByLevel = useMemo(() => {
    if (!selectedRack || !capacity.hasArea) return {}
    const map: Record<string, ReturnType<typeof listEmptyBinSlotsForLevel>> = {}
    for (const lv of levels) {
      map[lv.rackLevelId] = listEmptyBinSlotsForLevel(
        selectedRack.rackCode,
        lv.rackLevelId,
        lv.levelNumber,
        binsByLevel[lv.rackLevelId] ?? [],
        capacity.binsPerLevel
      )
    }
    return map
  }, [selectedRack, levels, binsByLevel, capacity.hasArea, capacity.binsPerLevel])

  const zoneInventories = useMemo(
    () => filterInventoriesForZone(filterActiveInventories(warehouseInventories), racks),
    [warehouseInventories, racks]
  )

  const binInventoryIndex = useMemo(
    () => indexInventoriesByBin(zoneInventories),
    [zoneInventories]
  )

  const rackInventoryById = useMemo(
    () => aggregateInventoriesByRackFromBinCodes(zoneInventories, racks),
    [zoneInventories, racks]
  )

  const selectedRackInventoryRows = useMemo(() => {
    if (!selectedRack) return []
    return zoneInventories
      .filter((row) => binBelongsToRack(row.binCode, selectedRack.rackCode))
      .sort((a, b) => (a.binCode ?? '').localeCompare(b.binCode ?? '', 'vi'))
  }, [zoneInventories, selectedRack])

  const selectedBinInventory = selectedBinId
    ? binInventoryIndex.get(selectedBinId)
    : undefined

  const deletableBinsForRack = useMemo(() => {
    if (!selectedRack || !levels.length) return []
    return listDeletableBinsForRack(
      levels.map((l) => ({ rackLevelId: l.rackLevelId, levelNumber: l.levelNumber })),
      binsByLevel
    ).filter((bin) => (binInventoryIndex.get(bin.binId)?.totalQuantity ?? 0) <= 0)
  }, [selectedRack, levels, binsByLevel, binInventoryIndex])

  const deletableBinsByLevel = useMemo(() => {
    const map: Record<string, ReturnType<typeof listDeletableBinsForLevel>> = {}
    for (const lv of levels) {
      map[lv.rackLevelId] = listDeletableBinsForLevel(binsByLevel[lv.rackLevelId] ?? []).filter(
        (bin) => (binInventoryIndex.get(bin.binId)?.totalQuantity ?? 0) <= 0
      )
    }
    return map
  }, [levels, binsByLevel, binInventoryIndex])

  const totalBinCountForRack = useMemo(
    () => Object.values(binsByLevel).reduce((sum, bins) => sum + bins.length, 0),
    [binsByLevel]
  )

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

  const loadInventories = useCallback(async () => {
    if (!activeWarehouseId) {
      setWarehouseInventories([])
      return
    }
    setInventoryLoading(true)
    try {
      const items = await fetchAllWarehouseInventories(
        activeWarehouseId,
        inventoriesApi.listInventories
      )
      setWarehouseInventories(items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được tồn kho')
    } finally {
      setInventoryLoading(false)
    }
  }, [activeWarehouseId])

  useEffect(() => {
    loadInventories()
  }, [loadInventories])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && activeWarehouseId) {
        loadInventories()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [activeWarehouseId, loadInventories])

  const loadRacks = useCallback(async () => {
    if (!selectedZoneId) {
      setRacks([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const { items } = await racksApi.listRacks({
        zoneId: selectedZoneId,
        limit: 200,
        includeBinStats: true,
      })
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
    setSelectedBinId(null)
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
    if (selectedRackId) {
      setSelectedBinId(null)
      loadRackDetail(selectedRackId)
    } else {
      setLevels([])
      setBinsByLevel({})
      setSelectedBinId(null)
    }
  }, [selectedRackId, loadRackDetail])

  const rackGrid = useMemo(() => {
    const minSlots = capacity.hasArea ? capacity.maxRacks : undefined
    const { cells, cols: gridCols } = layoutItemsInGrid(
      racks,
      rackGridColumns,
      (r) => r.rackCode,
      minSlots
    )
    const seatRows: CinemaSeat[][] = cells.map((row, rowIndex) =>
      row.map((rack, colIndex) => {
        const slotIndex = rowIndex * gridCols + colIndex
        const overCapacity = Boolean(minSlots && slotIndex >= minSlots)
        if (!rack) {
          return {
            id: null,
            label: overCapacity ? '—' : '+',
            hint: overCapacity ? 'Vượt sức chứa zone' : 'Thêm rack',
            status: overCapacity ? 'blocked' : 'empty',
            disabled: overCapacity,
          }
        }
        const visual = rackSeatVisualFromInventory(
          rack,
          rackInventoryById.get(rack.rackId),
          rack.rackId === selectedRackId
        )
        return {
          id: rack.rackId,
          label: rack.rackCode,
          subLabel: visual.subLabel,
          hint: visual.hint,
          status: visual.status,
          disabled: false,
        }
      })
    )
    return seatRows
  }, [racks, rackGridColumns, selectedRackId, capacity.hasArea, capacity.maxRacks, rackInventoryById])

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
        const inv = bin ? binInventoryIndex.get(bin.binId) : undefined
        const hasStock = (inv?.totalQuantity ?? 0) > 0
        row.push({
          id: bin?.binId ?? null,
          label: bin
            ? hasStock
              ? `${bin.binCode.slice(-3)}\n${inv!.totalQuantity} cái`
              : `${bin.binCode.slice(-3)}\n0 cái`
            : '+',
          hint: bin
            ? hasStock
              ? `${bin.binCode} · ${inv!.totalQuantity} cái tồn · ${inv!.skuCodes.length} SKU · ${inv!.lpnCodes.length} LPN · ${
                  BIN_STATUS_LABELS[bin.status ?? ''] ?? bin.status
                }`
              : `${bin.binCode} · trống · ${formatBinOccupancy(bin)} · ${
                  BIN_STATUS_LABELS[bin.status ?? ''] ?? bin.status
                }`
            : `Tầng ${lv.levelNumber} · ô ${c + 1}`,
          status:
            bin?.binId === selectedBinId
              ? 'selected'
              : binSeatStatusFromInventory(bin, inv),
        })
      }
      return row
    })

    return { cells, cols: maxCols }
  }, [levels, binsByLevel, capacity.binsPerLevel, binInventoryIndex, selectedBinId])

  const handleRackSeatClick = (seat: CinemaSeat, row: number, col: number) => {
    if (seat.disabled) return
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

  const openBinConfig = (bin: ApiBin, level: ApiRackLevel) => {
    setBinModal({
      open: true,
      mode: 'edit',
      rackLevelId: level.rackLevelId,
      levelNumber: level.levelNumber,
      binCode: bin.binCode,
      bin,
    })
  }

  const handleBinSeatClick = (seat: CinemaSeat, row: number, col: number) => {
    if (!selectedRack || !levels[row] || !activeZone) return
    const level = levels[row]

    if (seat.id) {
      const bin = (binsByLevel[level.rackLevelId] ?? []).find((b) => b.binId === seat.id)
      if (!bin) return
      setSelectedBinId(bin.binId)
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
    await Promise.all([loadRackDetail(selectedRack.rackId), loadRacks(), loadInventories()])
    setAlert({
      open: true,
      type: 'success',
      message: binModal.mode === 'create' ? 'Đã tạo bin' : 'Đã lưu cấu hình bin',
    })
  }

  const requestDeleteBin = () => {
    const bin = binModal?.bin
    if (!bin || !selectedRack) return
    setAlert({
      open: true,
      type: 'confirm',
      message: `Xóa bin ${bin.binCode}? Chỉ xóa được bin trống (không có LPN/hàng tồn).`,
      onConfirm: async () => {
        try {
          await binsApi.deleteBin(bin.binId)
          setBinModal(null)
          await Promise.all([
            loadRackDetail(selectedRack.rackId),
            loadRacks(),
            loadInventories(),
          ])
          setSelectedBinId(null)
          setAlert({ open: true, type: 'success', message: 'Đã xóa bin' })
        } catch (err) {
          setAlert({
            open: true,
            type: 'error',
            message: err instanceof ApiError ? err.message : 'Không xóa được bin',
          })
        }
      },
    })
  }

  const submitBulkDeleteBins = async (bins: ApiBin[]) => {
    if (!selectedRack) return
    setBulkCreating(true)
    setError('')
    try {
      const { meta, failed } = await binsApi.deleteBinsBulk({
        binIds: bins.map((b) => b.binId),
      })
      await Promise.all([loadRackDetail(selectedRack.rackId), loadRacks(), loadInventories()])
      const partial =
        (failed?.length ?? meta.failed) > 0
          ? ` · ${failed?.length ?? meta.failed} bin bỏ qua (còn hàng/LPN)`
          : ''
      setAlert({
        open: true,
        type: 'success',
        message: `Đã xóa ${meta.deleted} bin${partial}`,
      })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Xóa bin hàng loạt thất bại'
      setError(msg)
      throw err
    } finally {
      setBulkCreating(false)
    }
  }

  const submitBulkBins = async (
    slots: { rackLevelId: string; binCode: string }[]
  ) => {
    if (!selectedRack || !activeZone) return
    const preset = getDefaultBinCapacity(activeZone.zoneType)
    setBulkCreating(true)
    setError('')
    try {
      const { meta } = await binsApi.createBinsBulk({
        bins: slots.map((s) => ({
          rackLevelId: s.rackLevelId,
          binCode: s.binCode,
        })),
        maxLpnCount: preset.maxLpnCount,
        maxVolumeUnits: preset.maxVolumeUnits,
        reservationType: 'SHARED',
        status: 'EMPTY',
      })
      await Promise.all([loadRackDetail(selectedRack.rackId), loadRacks(), loadInventories()])
      setAlert({
        open: true,
        type: 'success',
        message: `Đã tạo ${meta.created} bin (${preset.maxLpnCount} LPN · ${preset.maxVolumeUnits} volume theo zone).`,
      })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Tạo bin hàng loạt thất bại'
      setError(msg)
      throw err
    } finally {
      setBulkCreating(false)
    }
  }

  const submitBulkRacks = async (rackCodes: string[]) => {
    if (!selectedZoneId || !activeZone) return
    setBulkCreating(true)
    setError('')
    try {
      const { items } = await racksApi.createRacksBulk({
        zoneId: selectedZoneId,
        rackCodes,
        status: 'ACTIVE',
      })
      const batchSize = 5
      for (let i = 0; i < items.length; i += batchSize) {
        const chunk = items.slice(i, i + batchSize)
        await Promise.all(
          chunk.map((rack) => ensureRackLevels(rack.rackId, capacity.binsPerLevel))
        )
      }
      await loadRacks()
      setAlert({
        open: true,
        type: 'success',
        message: `Đã tạo ${items.length} rack (${RACK_FIXED_LEVEL_COUNT} tầng/rack mỗi rack).`,
      })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Tạo rack hàng loạt thất bại'
      setError(msg)
      throw err
    } finally {
      setBulkCreating(false)
    }
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
      await loadRacks()
      setAlert({ open: true, type: 'success', message: 'Đã lưu rack (3 tầng)' })
    }
  }

  const requestToggleRackLock = () => {
    if (!selectedRack) return
    const isBlocked = selectedRack.status === 'BLOCKED'
    const nextStatus = isBlocked ? 'ACTIVE' : 'BLOCKED'
    setAlert({
      open: true,
      type: 'confirm',
      message: isBlocked
        ? `Mở khóa rack ${selectedRack.rackCode}? Rack sẽ chuyển sang trạng thái hoạt động.`
        : `Khóa rack ${selectedRack.rackCode}? Rack khóa sẽ hiển thị trên sơ đồ và không dùng cho thao tác mới.`,
      onConfirm: async () => {
        try {
          await racksApi.updateRack(selectedRack.rackId, {
            rackType: RACK_FIXED_TYPE,
            maxLevels: RACK_FIXED_LEVEL_COUNT,
            status: nextStatus,
          })
          await loadRacks()
          setAlert({
            open: true,
            type: 'success',
            message: isBlocked ? 'Đã mở khóa rack' : 'Đã khóa rack',
          })
        } catch (err) {
          setAlert({
            open: true,
            type: 'error',
            message:
              err instanceof ApiError ? err.message : 'Không cập nhật được trạng thái rack',
          })
        }
      },
    })
  }

  const zoneScreenLabel = activeZone
    ? `${activeZone.zoneCode}${activeZone.zoneName ? ` · ${activeZone.zoneName}` : ''} — ${
        zoneTypeLabel(activeZone.zoneType)
      }`
    : 'Chọn zone'

  return (
    <div className="flex min-h-full flex-col gap-6 p-6 lg:p-8">
      <LoadingOverlay
        show={(loading && !racks.length) || bulkCreating}
        text={
          bulkCreating
            ? 'Đang xử lý hàng loạt…'
            : 'Đang tải sơ đồ rack…'
        }
      />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sơ đồ Rack</h1>
          <p className="mt-1 text-sm text-slate-400">
            Màu occupancy theo tồn kho thực (API inventories) · {RACK_FOOTPRINT_M2} m²/rack ·{' '}
            {RACK_FIXED_LEVEL_COUNT} tầng/rack
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeWarehouseId && (
            <button
              type="button"
              onClick={() => loadInventories()}
              disabled={inventoryLoading}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.06] disabled:opacity-50"
              title="Tải lại tồn kho từ API inventories"
            >
              <span className="material-symbols-outlined text-base">inventory_2</span>
              {inventoryLoading ? 'Đang tải tồn…' : 'Làm mới tồn kho'}
            </button>
          )}
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
          {canBulkCreateRacks && (
            <button
              type="button"
              onClick={() => setBulkRackModalOpen(true)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold ${
                capacity.hasArea
                  ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                  : 'border-amber-400/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
              }`}
              title={
                capacity.hasArea
                  ? `Tạo tối đa ${remainingRackSlots} rack còn trống`
                  : 'Zone cần khai báo diện tích (m²) trước khi tạo rack hàng loạt'
              }
            >
              <span className="material-symbols-outlined text-lg">grid_on</span>
              Tạo hàng loạt
            </button>
          )}
          {selectedZoneId && capacity.hasArea && remainingRackSlots === 0 && (
            <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
              Zone đã đủ {capacity.maxRacks} rack theo diện tích
            </span>
          )}
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
              {formatZoneCapacitySummary(capacity, activeZone.zoneType)} · đang có{' '}
              <strong className="text-amber-300">{racks.length}</strong> rack
            </p>
          ) : (
            <p className="text-amber-200/90">
              Zone chưa khai báo diện tích (m²). Vào{' '}
              <Link to="/admin/zones" className="font-semibold text-cyan-400 underline hover:text-cyan-300">
                Quản lý Zone
              </Link>{' '}
              → sửa zone <span className="font-mono text-cyan-400">{activeZone.zoneCode}</span> và nhập{' '}
              <code className="text-cyan-400">Diện tích (m²)</code> để tính số rack/bin và dùng{' '}
              <strong>Tạo hàng loạt</strong>.
            </p>
          )}
        </div>
      )}

      {error && (
        <InlineAlert message={error} onDismiss={() => setError('')} />
      )}

      <section className="glass-panel overflow-x-auto rounded-xl border border-white/5 p-6">
        {!selectedZoneId ? (
          <p className="text-center text-slate-500">Chọn kho và zone để xem sơ đồ rack</p>
        ) : (
          <ZoneFloorPlanGrid
            screenLabel={zoneScreenLabel}
            cells={rackGrid}
            selectedId={selectedRackId}
            areaM2={capacity.areaM2}
            maxRacks={capacity.maxRacks}
            storageAreaM2={capacity.storageAreaM2}
            onSeatClick={handleRackSeatClick}
            legend={
              <>
                <SeatLegendItem status="rack-no-bin" label="Rack chưa có bin" />
                <SeatLegendItem status="rack-low" label="Có bin · chưa có hàng" />
                <SeatLegendItem status="rack-partial" label="Một phần bin có hàng" />
                <SeatLegendItem status="rack-heavy" label="Hầu hết bin có hàng" />
                <SeatLegendItem status="blocked" label="Rack khóa" />
                <SeatLegendItem status="selected" label="Đang chọn" />
                <SeatLegendItem status="empty" label="Ô trống (+ thêm rack)" />
              </>
            }
          />
        )}
        <p className="mt-4 text-center text-xs text-slate-500">
          {racks.length}
          {capacity.hasArea ? ` / ${capacity.maxRacks}` : ''} rack ·{' '}
          {zoneInventories.length} dòng tồn kho trong zone · Nhấn rack để xem bin
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
                {rackInventoryById.get(selectedRack.rackId) && (
                  <>
                    {' '}
                    ·{' '}
                    <span className="text-emerald-300">
                      {rackInventoryById.get(selectedRack.rackId)!.binsWithStock}/
                      {rackInventoryById.get(selectedRack.rackId)!.binCount || totalBinCountForRack}{' '}
                      bin có hàng · {rackInventoryById.get(selectedRack.rackId)!.totalQuantity} cái
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {capacity.hasArea && emptyBinSlotsForRack.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBulkBinModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                >
                  <span className="material-symbols-outlined text-base">view_module</span>
                  Tạo bin hàng loạt
                </button>
              )}
              {totalBinCountForRack > 0 && (
                <button
                  type="button"
                  onClick={() => setBulkBinDeleteModalOpen(true)}
                  disabled={deletableBinsForRack.length === 0}
                  title={
                    deletableBinsForRack.length === 0
                      ? 'Không có bin trống — cần dời hết LPN/hàng trước'
                      : `Xóa tối đa ${deletableBinsForRack.length} bin trống`
                  }
                  className="flex items-center gap-1 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-base">delete_sweep</span>
                  Xóa bin hàng loạt
                </button>
              )}
              <button
                type="button"
                title={
                  selectedRack.status === 'BLOCKED'
                    ? `Mở khóa rack ${selectedRack.rackCode}`
                    : `Khóa rack ${selectedRack.rackCode} (chỉ đổi trạng thái)`
                }
                onClick={requestToggleRackLock}
                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                  selectedRack.status === 'BLOCKED'
                    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    : 'border-amber-400/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {selectedRack.status === 'BLOCKED' ? 'lock_open' : 'lock'}
                </span>
                {selectedRack.status === 'BLOCKED' ? 'Mở khóa rack' : 'Khóa rack'}
              </button>
              <button
                type="button"
                title={`Xóa rack ${selectedRack.rackCode} và toàn bộ tầng/bin bên trong`}
                onClick={() =>
                  setAlert({
                    open: true,
                    type: 'confirm',
                    message: `Xóa rack ${selectedRack.rackCode}? Chỉ xóa được khi mọi bin trống (không LPN, không hàng putaway). Tầng và bin trống sẽ bị xóa theo.`,
                    onConfirm: async () => {
                      try {
                        await racksApi.deleteRack(selectedRack.rackId)
                        setSelectedRackId(null)
                        await loadRacks()
                        setAlert({ open: true, type: 'success', message: 'Đã xóa rack' })
                      } catch (err) {
                        setAlert({
                          open: true,
                          type: 'error',
                          message:
                            err instanceof ApiError
                              ? err.message
                              : 'Không xóa được rack — kiểm tra bin còn hàng/LPN',
                        })
                      }
                    },
                  })
                }
                className="flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10"
              >
                <span className="material-symbols-outlined text-base">shelves</span>
                Xóa rack
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
          {selectedBinId && selectedBinInventory && (
            <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white">
                  Bin <span className="font-mono text-cyan-400">{selectedBinInventory.binCode}</span>
                </h3>
                <div className="flex gap-2">
                  {(() => {
                    const level = levels.find((lv) =>
                      (binsByLevel[lv.rackLevelId] ?? []).some((b) => b.binId === selectedBinId)
                    )
                    const bin = level
                      ? (binsByLevel[level.rackLevelId] ?? []).find((b) => b.binId === selectedBinId)
                      : undefined
                    if (!level || !bin) return null
                    return (
                      <button
                        type="button"
                        onClick={() => openBinConfig(bin, level)}
                        className="rounded-lg border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/5"
                      >
                        Cấu hình bin
                      </button>
                    )
                  })()}
                  <button
                    type="button"
                    onClick={() => setSelectedBinId(null)}
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-400 hover:bg-white/5"
                  >
                    Đóng
                  </button>
                </div>
              </div>
              <p className="mb-3 text-xs text-slate-400">
                {selectedBinInventory.totalQuantity} cái tồn ·{' '}
                {selectedBinInventory.availableQuantity} khả dụng ·{' '}
                {selectedBinInventory.skuCodes.length} SKU · {selectedBinInventory.lpnCodes.length} LPN
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-500">
                      <th className="py-2 pr-3 font-medium">SKU</th>
                      <th className="py-2 pr-3 font-medium">LPN</th>
                      <th className="py-2 pr-3 font-medium text-right">SL</th>
                      <th className="py-2 pr-3 font-medium text-right">Khả dụng</th>
                      <th className="py-2 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBinInventory.rows.map((row) => (
                      <tr key={row.inventoryId} className="border-b border-white/5 text-slate-300">
                        <td className="py-2 pr-3">
                          <span className="font-mono text-cyan-300">{row.sku?.skuCode ?? '—'}</span>
                          {row.sku?.productName ? (
                            <span className="ml-1 text-slate-500">{row.sku.productName}</span>
                          ) : null}
                        </td>
                        <td className="py-2 pr-3 font-mono">{row.lpnCode ?? '—'}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{row.quantity}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {row.availableQuantity ?? row.quantity}
                        </td>
                        <td className="py-2">{row.status ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedRackInventoryRows.length > 0 && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h3 className="mb-3 text-sm font-bold text-white">
                Tồn kho rack <span className="font-mono text-cyan-400">{selectedRack.rackCode}</span>
                <span className="ml-2 text-xs font-normal text-slate-500">
                  ({selectedRackInventoryRows.length} dòng · API inventories)
                </span>
              </h3>
              <div className="max-h-48 overflow-y-auto overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="sticky top-0 bg-[#141c2b]">
                    <tr className="border-b border-white/10 text-slate-500">
                      <th className="py-2 pr-3 font-medium">Bin</th>
                      <th className="py-2 pr-3 font-medium">SKU</th>
                      <th className="py-2 pr-3 font-medium">LPN</th>
                      <th className="py-2 pr-3 font-medium text-right">SL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRackInventoryRows.map((row) => (
                      <tr
                        key={row.inventoryId}
                        className={`cursor-pointer border-b border-white/5 text-slate-300 hover:bg-white/[0.04] ${
                          row.binId === selectedBinId ? 'bg-cyan-500/10' : ''
                        }`}
                        onClick={() => row.binId && setSelectedBinId(row.binId)}
                      >
                        <td className="py-1.5 pr-3 font-mono text-cyan-300">{row.binCode ?? '—'}</td>
                        <td className="py-1.5 pr-3 font-mono">{row.sku?.skuCode ?? '—'}</td>
                        <td className="py-1.5 pr-3 font-mono">{row.lpnCode ?? '—'}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{row.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeZone && (
            <p className="mt-2 text-center text-xs text-slate-400">
              Nhấn bin để xem tồn chi tiết · Nhãn ô hiển thị số cái từ inventories
            </p>
          )}
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
          onDelete={binModal.mode === 'edit' ? requestDeleteBin : undefined}
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

      {bulkRackModalOpen && activeZone && (
        <BulkRackModal
          zoneLabel={`${activeZone.zoneCode}${activeZone.zoneName ? ` · ${activeZone.zoneName}` : ''}`}
          emptySlotCodes={emptyRackSlotCodes}
          maxCreatable={remainingRackSlots}
          onClose={() => setBulkRackModalOpen(false)}
          onSubmit={submitBulkRacks}
        />
      )}

      {bulkBinModalOpen && selectedRack && activeZone && (
        <BulkBinModal
          rackCode={selectedRack.rackCode}
          zoneType={activeZone.zoneType}
          levels={levels.map((l) => ({
            rackLevelId: l.rackLevelId,
            levelNumber: l.levelNumber,
          }))}
          allEmptySlots={emptyBinSlotsForRack}
          slotsByLevel={emptyBinSlotsByLevel}
          binsPerLevel={capacity.binsPerLevel}
          onClose={() => setBulkBinModalOpen(false)}
          onSubmit={submitBulkBins}
        />
      )}

      {bulkBinDeleteModalOpen && selectedRack && (
        <BulkBinDeleteModal
          rackCode={selectedRack.rackCode}
          levels={levels.map((l) => ({
            rackLevelId: l.rackLevelId,
            levelNumber: l.levelNumber,
          }))}
          allDeletableBins={deletableBinsForRack}
          deletableByLevel={deletableBinsByLevel}
          totalBinCount={totalBinCountForRack}
          onClose={() => setBulkBinDeleteModalOpen(false)}
          onSubmit={submitBulkDeleteBins}
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
