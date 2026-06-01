import { InlineAlert } from '../FeedbackAlert'
import { AlertModal } from './AlertModal'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../../api/client'
import * as binsApi from '../../../api/bins'
import * as contractsApi from '../../../api/contracts'
import * as rackLevelsApi from '../../../api/rackLevels'
import * as racksApi from '../../../api/racks'
import * as warehousesApi from '../../../api/warehouses'
import * as rentalRequestsApi from '../../../api/rentalRequests'
import type { ApiContractPriceEstimate } from '../../../api/rentalRequests'
import * as storageReservationsApi from '../../../api/storageReservations'
import * as zonesApi from '../../../api/zones'
import { getStoredUser } from '../../../auth/storage'
import {
  BILLING_CYCLE_GUEST_LABELS,
  CONTRACT_TYPE_LABELS,
  PRICING_MODEL_LABELS,
  defaultPricingModel,
  isDedicatedSpaceRental,
  requestedAreaFieldLabel,
  showsRequestedAreaField,
  suggestBillableContractType,
  WH_ASSIGNABLE_CONTRACT_OPTIONS,
  type BillableContractTypeValue,
  type ContractTypeValue,
} from '../../../data/contractTypes'
import type { ApiContract, UserRole } from '../../../api/types'
import type { RentalRequestRow } from '../../../mappers'
import {
  getOnboardingStoragePlan,
  isZoneEligibleForContract,
  requiredZoneTypeForContract,
  storagePlanShortLabel,
} from '../../../utils/onboardingStorage'
import {
  computeMinZonesCapacityHint,
  type MinZonesCapacityHint,
  computeZoneStorageCapacity,
  estimateZoneLpnCapacity,
  formatZoneCapacitySummary,
  formatZoneRackSummary,
  splitReservedCapacityAcrossZones,
  splitReservedCapacityEvenly,
} from '../../../utils/warehouseCapacity'
import { estimateMonthCount } from '../../../utils/rentalPeriod'
import {
  filterWarehousesForRentalClaim,
  type WarehouseWithRegion,
} from '../../../utils/warehouseRegion'

export type OnboardingOperator = {
  role: UserRole
  warehouseId?: string | null
  warehouseName?: string
}

type Props = {
  row: RentalRequestRow
  warehouses: WarehouseWithRegion[]
  operator: OnboardingOperator
  resolveWarehouseId: (row: RentalRequestRow) => string
  onClose: () => void
  onComplete: () => void
}

const STEPS = ['Duyệt yêu cầu', 'Tạo hợp đồng', 'Cấp bin / zone'] as const

const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
const inputStyle =
  'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400'
const selectStyle = inputStyle
const ESTIMATE_BIN_SLOT_FOOTPRINT_M2 = 0.25
const ESTIMATE_DEFAULT_BIN_MAX_LPN_COUNT = 4

function toDateInput(iso?: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function initialStep(row: RentalRequestRow): number {
  if (row.apiStatus === 'APPROVED') return 1
  if (row.apiStatus === 'CONVERTED') return 2
  return 0
}

function pickLinkedContract(items: ApiContract[]): ApiContract | null {
  if (items.length === 0) return null
  return (
    items.find((c) => c.status === 'ACTIVE') ??
    items.find((c) => c.status === 'PENDING_APPROVAL') ??
    items.find((c) => c.status === 'DRAFT') ??
    items[0]
  )
}

function contractReadyForStorage(contract: ApiContract): boolean {
  return (
    contract.status === 'ACTIVE' ||
    contract.status === 'PENDING_APPROVAL' ||
    Boolean(String(contract.warehouseSignature ?? '').trim())
  )
}

export function RentalOnboardingWizard({
  row,
  warehouses,
  operator,
  resolveWarehouseId,
  onClose,
  onComplete,
}: Props) {
  const isWhOperator = operator.role === 'WH_ADMIN' && Boolean(operator.warehouseId)
  const canApproveRental = operator.role === 'WH_ADMIN'
  const operatorWhId = operator.warehouseId ?? ''

  const [step, setStep] = useState(() => initialStep(row))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [apiAlert, setApiAlert] = useState<{
    open: boolean
    message: string
    type: 'error' | 'warning'
    title?: string
  }>({ open: false, message: '', type: 'error' })

  const [rejectionReason, setRejectionReason] = useState('')
  const [warehouseId, setWarehouseId] = useState(
    () => row.warehouseId ?? (isWhOperator ? operatorWhId : '')
  )
  const [approved, setApproved] = useState(
    row.apiStatus === 'APPROVED' || row.apiStatus === 'CONVERTED'
  )

  const tenantContractType = row.contractType as ContractTypeValue | undefined
  const suggestedBillableType = suggestBillableContractType({
    contractType: row.contractType,
    requestedAreaM2: row.requestedAreaM2,
  })

  const [contractType, setContractType] = useState<BillableContractTypeValue>(
    suggestedBillableType
  )
  const [pricingModel, setPricingModel] = useState<string>(
    row.pricingModel ?? defaultPricingModel(suggestedBillableType)
  )

  useEffect(() => {
    // Đồng bộ pricingModel theo loại hợp đồng được WH chọn.
    setPricingModel(defaultPricingModel(contractType))
  }, [contractType])
  const [contractId, setContractId] = useState<string | null>(null)
  const [linkedContract, setLinkedContract] = useState<ApiContract | null>(null)
  const [contractLoading, setContractLoading] = useState(false)
  const contractStart = toDateInput(row.expectedStartDate)
  const contractEnd = toDateInput(row.expectedEndDate)
  const [priceEstimate, setPriceEstimate] = useState<ApiContractPriceEstimate | null>(null)
  const [allocationPriceEstimate, setAllocationPriceEstimate] =
    useState<ApiContractPriceEstimate | null>(null)
  const [allocationPriceLoading, setAllocationPriceLoading] = useState(false)

  const [zones, setZones] = useState<zonesApi.ApiZone[]>([])
  const [racks, setRacks] = useState<racksApi.ApiRack[]>([])
  const [rackLevels, setRackLevels] = useState<rackLevelsApi.ApiRackLevel[]>([])
  const [bins, setBins] = useState<binsApi.ApiBin[]>([])
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([])
  const zoneId = selectedZoneIds[0] ?? ''
  const [rackId, setRackId] = useState('')
  const [rackLevelId, setRackLevelId] = useState('')
  const [binId, setBinId] = useState('')
  const [reservedCapacity, setReservedCapacity] = useState(
    String(row.estimatedBoxCount ?? row.estimatedSkuCount ?? '')
  )
  const [tenantRequiredAreaM2, setTenantRequiredAreaM2] = useState(
    row.requestedAreaM2 != null ? String(row.requestedAreaM2) : ''
  )
  const [allowUndersizedZone, setAllowUndersizedZone] = useState(false)
  const [warehousePlanning, setWarehousePlanning] = useState<
    warehousesApi.ApiWarehouseZonePlanning | null
  >(null)
  const [warehouseCapacitySnapshot, setWarehouseCapacitySnapshot] = useState<
    warehousesApi.ApiWarehouseCapacitySnapshot | null
  >(null)

  const storagePlan = useMemo(() => getOnboardingStoragePlan(contractType), [contractType])
  const allowsMultiZone = storagePlan.needsZone && !storagePlan.needsBin
  const requiredZoneType = requiredZoneTypeForContract(contractType)
  const eligibleZones = useMemo(
    () => zones.filter((z) => isZoneEligibleForContract(contractType, z.zoneType)),
    [zones, contractType]
  )

  useEffect(() => {
    setSelectedZoneIds((prev) =>
      prev.filter((id) => {
        const z = zones.find((x) => x.zoneId === id)
        return z != null && isZoneEligibleForContract(contractType, z.zoneType)
      })
    )
  }, [contractType, zones])

  const tenantRequiredAreaNum = useMemo(() => {
    const n = Number(tenantRequiredAreaM2)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [tenantRequiredAreaM2])

  const selectedZones = useMemo(
    () => zones.filter((z) => selectedZoneIds.includes(z.zoneId)),
    [zones, selectedZoneIds]
  )

  const selectedZone = selectedZones[0] ?? null

  const reservedCapacityNum = useMemo(() => {
    const n = Number(reservedCapacity)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [reservedCapacity])

  const selectedZonesLpnCapacity = useMemo(
    () => selectedZones.reduce((sum, z) => sum + estimateZoneLpnCapacity(z), 0),
    [selectedZones]
  )

  const selectedZonesAreaM2 = useMemo(
    () => selectedZones.reduce((sum, z) => sum + (Number(z.areaM2) || 0), 0),
    [selectedZones]
  )
  const preAllocationPreviewAreaM2 = useMemo(
    () => selectedZones.reduce((sum, z) => sum + (Number(z.areaM2) || 0), 0),
    [selectedZones]
  )

  const zoneAreaFit = useMemo(() => {
    if (!tenantRequiredAreaNum) return null

    if (allowsMultiZone && selectedZones.length > 0) {
      const zoneArea = selectedZonesAreaM2
      if (zoneArea <= 0) return { zoneArea: 0, sufficient: true, deficit: 0, minZones: null }
      const sufficient = zoneArea >= tenantRequiredAreaNum
      const deficit = Math.max(0, tenantRequiredAreaNum - zoneArea)
      return { zoneArea, sufficient, deficit, minZones: null, multi: true as const }
    }

    if (!selectedZone) return null
    const zoneArea = Number(selectedZone.areaM2) || 0
    if (zoneArea <= 0) return { zoneArea: 0, sufficient: true, deficit: 0, minZones: null }
    const sufficient = zoneArea >= tenantRequiredAreaNum
    const deficit = Math.max(0, tenantRequiredAreaNum - zoneArea)
    const minZones = Math.ceil(tenantRequiredAreaNum / zoneArea)
    return { zoneArea, sufficient, deficit, minZones, multi: false as const }
  }, [
    allowsMultiZone,
    selectedZone,
    selectedZones.length,
    selectedZonesAreaM2,
    tenantRequiredAreaNum,
  ])

  const capacityFit = useMemo(() => {
    if (!reservedCapacityNum || selectedZones.length === 0) return null
    const sufficient = selectedZonesLpnCapacity >= reservedCapacityNum
    const deficit = Math.max(0, reservedCapacityNum - selectedZonesLpnCapacity)
    return { required: reservedCapacityNum, available: selectedZonesLpnCapacity, sufficient, deficit }
  }, [reservedCapacityNum, selectedZones.length, selectedZonesLpnCapacity])

  const minZonesHint = useMemo(() => {
    if (!reservedCapacityNum || !allowsMultiZone || zones.length === 0) return null
    return computeMinZonesCapacityHint(reservedCapacityNum, zones)
  }, [reservedCapacityNum, allowsMultiZone, zones])

  const zoneCapacitySplit = useMemo(() => {
    if (!reservedCapacityNum || selectedZones.length === 0) return null
    const proportional = splitReservedCapacityAcrossZones(reservedCapacityNum, selectedZones)
    const even = splitReservedCapacityEvenly(reservedCapacityNum, selectedZones)
    const zonesEqualCapacity =
      selectedZones.length > 1 &&
      selectedZones.every(
        (z) => estimateZoneLpnCapacity(z) === estimateZoneLpnCapacity(selectedZones[0])
      )
    return {
      proportional,
      even,
      useEven: zonesEqualCapacity,
      active: zonesEqualCapacity ? even : proportional,
    }
  }, [reservedCapacityNum, selectedZones])

  const preAllocationPreview = useMemo(() => {
    if (!priceEstimate || !selectedZones.length) return null
    const monthlyBySelectedZones =
      priceEstimate.unitPricePerM2Month != null && preAllocationPreviewAreaM2 > 0
        ? Math.round(preAllocationPreviewAreaM2 * priceEstimate.unitPricePerM2Month)
        : null
    const totalBySelectedZones =
      monthlyBySelectedZones != null ? monthlyBySelectedZones * priceEstimate.monthCount : null
    return {
      zoneCount: selectedZones.length,
      totalAreaM2: preAllocationPreviewAreaM2,
      monthlyBySelectedZones,
      totalBySelectedZones,
      baseMonthly: priceEstimate.monthlyAmount,
      baseTotal: priceEstimate.suggestedTotalAmount,
      monthCount: priceEstimate.monthCount,
    }
  }, [priceEstimate, selectedZones, preAllocationPreviewAreaM2])

  const approvalCapacity = useMemo(() => {
    if (!warehousePlanning) return null
    const usable = Number(warehousePlanning.usableAreaM2) || 0
    const used = Number(warehousePlanning.usedZoneAreaM2) || 0
    const remaining = warehousePlanning.remainingZoneAreaM2
    const utilizationPct = usable > 0 ? Math.round((used / usable) * 100) : 0
    const areaRequired = tenantRequiredAreaNum
    const areaFeasible =
      areaRequired == null ||
      remaining == null ||
      areaRequired <= Number(remaining)

    const referenceArea = Number(warehousePlanning.suggestedReferenceZoneAreaM2) || 50
    const suggestedZoneCount =
      areaRequired != null && referenceArea > 0 ? Math.ceil(areaRequired / referenceArea) : null

    return {
      utilizationPct: Math.max(0, Math.min(100, utilizationPct)),
      usable,
      used,
      remaining: remaining == null ? null : Number(remaining),
      areaRequired,
      areaFeasible,
      suggestedZoneCount,
    }
  }, [warehousePlanning, tenantRequiredAreaNum])

  const claimableWarehouses = useMemo(() => {
    if (isWhOperator) return []
    return filterWarehousesForRentalClaim(warehouses, row.city, row.district, row.warehouseId)
  }, [isWhOperator, warehouses, row.city, row.district, row.warehouseId])

  useEffect(() => {
    if (isWhOperator && operatorWhId) setWarehouseId(operatorWhId)
  }, [isWhOperator, operatorWhId])

  useEffect(() => {
    if (isWhOperator || approved || row.warehouseId) return
    if (claimableWarehouses.length === 1) {
      setWarehouseId(claimableWarehouses[0].warehouseId)
    }
  }, [isWhOperator, approved, claimableWarehouses, row.warehouseId])

  const claimedByOther =
    isWhOperator &&
    Boolean(row.warehouseId) &&
    row.warehouseId !== operatorWhId

  const whId = isWhOperator
    ? operatorWhId
    : warehouseId || (approved ? resolveWarehouseId(row) : '')
  const whName =
    operator.warehouseName ??
    warehouses.find((w) => w.warehouseId === whId)?.warehouseName ??
    row.warehouse

  useEffect(() => {
    if (!whId) return
    let cancelled = false
    ;(async () => {
      try {
        const planningPromise = warehousesApi.getWarehouseZonePlanning(whId).catch(() => null)
        const capacityPromise = warehousesApi.getWarehouseCapacitySnapshot(whId).catch(() => null)
        const zonesPromise =
          (step === 0 && contractType === 'DEDICATED_ZONE') || (approved && step >= 2)
            ? zonesApi.listZones({ warehouseId: whId, limit: 100, status: 'ACTIVE' })
            : Promise.resolve({ items: [] as zonesApi.ApiZone[] })
        const [{ items }, planning, capacity] = await Promise.all([
          zonesPromise,
          planningPromise,
          capacityPromise,
        ])
        if (!cancelled) {
          if ((step === 0 && contractType === 'DEDICATED_ZONE') || (approved && step >= 2)) {
            setZones(items)
          }
          setWarehousePlanning(planning)
          setWarehouseCapacitySnapshot(capacity)
        }
      } catch {
        if (!cancelled) {
          if ((step === 0 && contractType === 'DEDICATED_ZONE') || (approved && step >= 2)) {
            setZones([])
          }
          setWarehousePlanning(null)
          setWarehouseCapacitySnapshot(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [approved, step, whId, contractType])

  useEffect(() => {
    if (!storagePlan.needsRack || !zoneId) {
      setRacks([])
      setRackId('')
      return
    }
    let cancelled = false
    ;(async () => {
      const { items } = await racksApi.listRacks({ zoneId, limit: 100 })
      if (!cancelled) setRacks(items)
    })()
    return () => {
      cancelled = true
    }
  }, [zoneId, storagePlan.needsRack])

  useEffect(() => {
    if (!storagePlan.needsBin || !rackId) {
      setRackLevels([])
      setRackLevelId('')
      return
    }
    let cancelled = false
    ;(async () => {
      const { items } = await rackLevelsApi.listRackLevels({ rackId, limit: 100 })
      if (!cancelled) setRackLevels(items)
    })()
    return () => {
      cancelled = true
    }
  }, [rackId, storagePlan.needsBin])

  useEffect(() => {
    if (!storagePlan.needsBin || !rackLevelId) {
      setBins([])
      setBinId('')
      return
    }
    let cancelled = false
    ;(async () => {
      const { items } = await binsApi.listBins({
        rackLevelId,
        limit: 100,
        reservationType: 'RESERVED',
      })
      if (!cancelled) setBins(items.filter((b) => b.status === 'EMPTY' || b.status === 'RESERVED'))
    })()
    return () => {
      cancelled = true
    }
  }, [rackLevelId, storagePlan.needsBin])

  const applyLinkedContract = useCallback((pick: ApiContract) => {
    setContractId(pick.contractId)
    setLinkedContract(pick)
  }, [])

  const fetchContractPriceEstimate = useCallback(
    (wh: string, zoneIds: string[]) => {
      const contractTypeParam =
        contractType !== (row.contractType as BillableContractTypeValue | undefined)
          ? contractType
          : undefined
      return rentalRequestsApi.getContractPriceEstimate(row.rentalRequestId, {
        warehouseId: wh,
        zoneIds: zoneIds.length > 0 ? zoneIds : undefined,
        contractType: contractTypeParam,
      })
    },
    [row.rentalRequestId, row.contractType, contractType]
  )

  const resolveLinkedContract = useCallback(
    async (wh: string): Promise<ApiContract | null> => {
      const byRr = await contractsApi.listContracts({
        rentalRequestId: row.rentalRequestId,
        limit: 10,
      })
      let pick = pickLinkedContract(byRr.items)
      if (pick) return pick

      if (row.tenantId && wh) {
        const byTenantWh = await contractsApi.listContracts({
          tenantId: row.tenantId,
          warehouseId: wh,
          limit: 50,
        })
        pick = pickLinkedContract(
          byTenantWh.items.filter(
            (c) => !c.rentalRequestId || c.rentalRequestId === row.rentalRequestId
          )
        )
        if (pick) return pick
      }

      if (row.tenantId) {
        const byTenant = await contractsApi.listContracts({
          tenantId: row.tenantId,
          limit: 50,
        })
        pick = pickLinkedContract(
          byTenant.items.filter(
            (c) => !c.rentalRequestId || c.rentalRequestId === row.rentalRequestId
          )
        )
        if (pick) return pick
      }

      return null
    },
    [row.rentalRequestId, row.tenantId]
  )

  const loadExistingContract = useCallback(async (): Promise<ApiContract | null> => {
    const wh = whId || resolveWarehouseId(row)
    const pick = await resolveLinkedContract(wh)
    if (!pick) {
      setLinkedContract(null)
      return null
    }
    applyLinkedContract(pick)
    return pick
  }, [whId, row, resolveWarehouseId, resolveLinkedContract, applyLinkedContract])

  useEffect(() => {
    if (step < 1) return
    let cancelled = false
    setContractLoading(true)
    loadExistingContract()
      .catch(() => {
        if (!cancelled) setLinkedContract(null)
      })
      .finally(() => {
        if (!cancelled) setContractLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [step, loadExistingContract])

  useEffect(() => {
    if (step !== 0 || contractType !== 'DEDICATED_ZONE') return
    const loadWh = whId || warehouseId
    if (!loadWh) return
    let cancelled = false
    fetchContractPriceEstimate(loadWh, selectedZoneIds)
      .then((est) => {
        if (!cancelled) setPriceEstimate(est)
      })
      .catch(() => {
        if (!cancelled) setPriceEstimate(null)
      })
    return () => {
      cancelled = true
    }
  }, [step, whId, warehouseId, contractType, selectedZoneIds, fetchContractPriceEstimate])

  useEffect(() => {
    if (step !== 2) {
      setAllocationPriceEstimate(null)
      return
    }
    const loadWh = whId || warehouseId
    if (!loadWh) return
    if (storagePlan.needsZone && selectedZoneIds.length === 0) {
      setAllocationPriceEstimate(null)
      return
    }
    let cancelled = false
    setAllocationPriceLoading(true)
    fetchContractPriceEstimate(loadWh, storagePlan.needsZone ? selectedZoneIds : [])
      .then((est) => {
        if (!cancelled) setAllocationPriceEstimate(est)
      })
      .catch(() => {
        if (!cancelled) setAllocationPriceEstimate(null)
      })
      .finally(() => {
        if (!cancelled) setAllocationPriceLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [
    step,
    whId,
    warehouseId,
    storagePlan.needsZone,
    selectedZoneIds,
    fetchContractPriceEstimate,
  ])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (err) {
      if (err instanceof ApiError) {
        const isConflict = err.status === 409
        const isContractDuplicate = err.code === 'CONTRACT_ALREADY_LINKED'
        setApiAlert({
          open: true,
          type: isConflict ? 'warning' : 'error',
          title: isContractDuplicate
            ? 'Hợp đồng đã tồn tại'
            : isConflict
              ? 'Không thể hoàn tất'
              : 'Có lỗi xảy ra',
          message: err.message,
        })
      } else {
        setError('Thao tác thất bại')
      }
    } finally {
      setBusy(false)
    }
  }

  const finishOnboarding = async () => {
    await rentalRequestsApi.updateRentalRequest(row.rentalRequestId, { status: 'CONVERTED' })
    onComplete()
    onClose()
  }

  const tryRecoverFromReservationConflict = async (): Promise<boolean> => {
    if (!contractId) return false
    const { items } = await storageReservationsApi.listStorageReservations({
      contractId,
      status: 'ACTIVE',
      limit: 50,
    })
    if (items.length === 0) return false

    if (storagePlan.storageLevel === 'ZONE' && selectedZoneIds.length > 0) {
      const allZonesCovered = selectedZoneIds.every((zId) =>
        items.some((r) => r.zoneId === zId)
      )
      if (!allZonesCovered) return false
    } else if (storagePlan.storageLevel === 'BIN' && binId) {
      if (!items.some((r) => r.binId === binId)) return false
    }

    await contractsApi.updateContract(contractId, { status: 'PENDING_APPROVAL' })
    await finishOnboarding()
    return true
  }

  const handleApprove = () =>
    run(async () => {
      if (!canApproveRental) {
        setError('Chỉ Warehouse Admin mới được duyệt yêu cầu thuê')
        return
      }
      if (claimedByOther) {
        setError('Yêu cầu đã được kho khác trong khu vực duyệt trước. Tải lại danh sách.')
        return
      }
      if (isWhOperator) {
        if (!operatorWhId) {
          setError('Tài khoản chưa gắn kho — liên hệ System Admin')
          return
        }
      } else if (claimableWarehouses.length === 0) {
        setError(`Không có kho tại ${row.district}, ${row.city}`)
        return
      } else if (claimableWarehouses.length > 1 && !warehouseId) {
        setError('Chọn kho nhận yêu cầu trong danh sách')
        return
      }
      const wh = isWhOperator ? operatorWhId : warehouseId || resolveWarehouseId(row)
      const user = getStoredUser()
      await rentalRequestsApi.updateRentalRequest(row.rentalRequestId, {
        status: 'APPROVED',
        warehouseId: wh,
        contractType,
        pricingModel,
        reviewedBy: user?.userId,
        reviewedAt: new Date().toISOString(),
      })
      setWarehouseId(wh)
      setApproved(true)
      setStep(1)
    })

  const handleReject = () =>
    run(async () => {
      if (!rejectionReason.trim()) {
        setError('Vui lòng nhập lý do từ chối')
        return
      }
      await rentalRequestsApi.updateRentalRequest(row.rentalRequestId, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      })
      onComplete()
      onClose()
    })

  const handleContinueToStorageStep = () => {
    run(async () => {
      setApiAlert({ open: false, message: '', type: 'error' })
      const wh = whId || resolveWarehouseId(row)
      let existing = linkedContract

      if (!existing && contractId) {
        existing = await contractsApi.getContract(contractId).catch(() => null)
      }
      if (!existing) {
        existing = await resolveLinkedContract(wh)
      }
      if (!existing) {
        setError('Không tìm thấy hợp đồng cho yêu cầu này.')
        return
      }

      applyLinkedContract(existing)
      setStep(2)
    })
  }

  const handleCreateContract = () =>
    run(async () => {
      if (!contractStart || !contractEnd) {
        setError(
          'Yêu cầu thiếu ngày bắt đầu/kết thúc do khách chưa khai báo khi gửi form — liên hệ khách bổ sung'
        )
        return
      }
      const wh = whId || resolveWarehouseId(row)

      let existing = linkedContract
      if (!existing && contractId) {
        existing = await contractsApi.getContract(contractId).catch(() => null)
      }
      if (!existing) {
        existing = await resolveLinkedContract(wh)
      }

      if (existing) {
        applyLinkedContract(existing)
        if (!contractReadyForStorage(existing)) {
          const updated = await contractsApi.updateContract(existing.contractId, {
            warehouseSignature: 'SIGNED_WH_ONBOARDING',
            startDate: contractStart,
            endDate: contractEnd,
          })
          applyLinkedContract(updated)
        }
        setStep(2)
        return
      }

      try {
        const draft = await contractsApi.createContract({
          tenantId: row.tenantId,
          warehouseId: wh,
          rentalRequestId: row.rentalRequestId,
          contractType,
          pricingModel,
          billingCycle: row.billingCycle ?? 'MONTHLY',
          startDate: contractStart,
          endDate: contractEnd,
          contractName: row.customer,
          status: 'DRAFT',
        })
        applyLinkedContract(draft)
        const updated = await contractsApi.updateContract(draft.contractId, {
          warehouseSignature: 'SIGNED_WH_ONBOARDING',
          startDate: contractStart,
          endDate: contractEnd,
        })
        applyLinkedContract(updated)
        setStep(2)
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          const recovered = await resolveLinkedContract(wh)
          if (recovered) {
            applyLinkedContract(recovered)
            setStep(2)
            return
          }
        }
        throw err
      }
    })

  const handleAssignStorage = () =>
    run(async () => {
      if (!contractId) {
        setError('Chưa có hợp đồng — hoàn tất bước 2 (tạo HĐ & ký kho) trước')
        return
      }
      if (
        contractType === 'DEDICATED_WAREHOUSE' &&
        tenantRequiredAreaNum != null &&
        warehousePlanning?.usableAreaM2 != null &&
        warehousePlanning.usableAreaM2 < tenantRequiredAreaNum &&
        !allowUndersizedZone
      ) {
        setError(
          `Kho chỉ có ${warehousePlanning.usableAreaM2} m² sử dụng, tenant cần ${tenantRequiredAreaNum} m². Điều chỉnh HĐ hoặc xác nhận cấp tạm.`
        )
        return
      }
      if (
        storagePlan.needsZone &&
        tenantRequiredAreaNum != null &&
        zoneAreaFit &&
        !zoneAreaFit.sufficient &&
        !allowUndersizedZone
      ) {
        const zoneLabel = allowsMultiZone
          ? `${selectedZones.length} zone đã chọn (tổng ${zoneAreaFit.zoneArea} m²)`
          : `Zone ${selectedZone?.zoneCode}`
        setError(
          `${zoneLabel} chưa đủ diện tích — tenant cần ${tenantRequiredAreaNum} m². Chọn thêm zone, zone lớn hơn, hoặc tick xác nhận cấp tạm.`
        )
        return
      }
      if (
        capacityFit &&
        !capacityFit.sufficient &&
        !allowUndersizedZone
      ) {
        setError(
          `Dung lượng giữ ${capacityFit.required} thùng/LPN nhưng ${selectedZones.length} zone chỉ ước tính ~${capacityFit.available} thùng. Chọn thêm zone hoặc tick xác nhận cấp tạm.`
        )
        return
      }
      if (storagePlan.storageLevel === 'ZONE') {
        if (selectedZoneIds.length === 0) {
          setError(
            requiredZoneType
              ? `Chọn ít nhất một zone ${requiredZoneType} — loại hình thuê khu riêng không dùng zone SHARED/FAST_MOVING/PREMIUM.`
              : 'Chọn ít nhất một zone'
          )
          return
        }
        const ineligible = selectedZones.filter(
          (z) => !isZoneEligibleForContract(contractType, z.zoneType)
        )
        if (ineligible.length > 0) {
          setError(
            `Thuê khu riêng chỉ được chọn zone PRIVATE. Bỏ chọn: ${ineligible.map((z) => z.zoneCode).join(', ')}.`
          )
          return
        }
      }
      if (storagePlan.storageLevel === 'BIN' && !binId) {
        setError('Chọn bin')
        return
      }

      const wh = whId || resolveWarehouseId(row)

      const createReservation = async (body: Parameters<typeof storageReservationsApi.createStorageReservation>[0]) => {
        try {
          await storageReservationsApi.createStorageReservation(body)
        } catch (err) {
          if (err instanceof ApiError && err.status === 409 && (await tryRecoverFromReservationConflict())) {
            return
          }
          throw err
        }
      }

      if (storagePlan.storageLevel === 'WAREHOUSE') {
        await createReservation({
          contractId,
          reservationType: storagePlan.reservationType,
          storageLevel: storagePlan.storageLevel,
          warehouseId: wh,
          startDate: contractStart,
          endDate: contractEnd,
          status: 'ACTIVE',
          ...(reservedCapacityNum ? { reservedCapacity: reservedCapacityNum } : {}),
        })
      } else if (storagePlan.storageLevel === 'ZONE') {
        const capacitySplit =
          reservedCapacityNum != null
            ? zoneCapacitySplit?.active ??
              splitReservedCapacityAcrossZones(reservedCapacityNum, selectedZones)
            : new Map<string, number>()

        for (const zId of selectedZoneIds) {
          const share = capacitySplit.get(zId)
          await createReservation({
            contractId,
            reservationType: storagePlan.reservationType,
            storageLevel: storagePlan.storageLevel,
            warehouseId: wh,
            zoneId: zId,
            startDate: contractStart,
            endDate: contractEnd,
            status: 'ACTIVE',
            ...(share != null && share > 0 ? { reservedCapacity: share } : {}),
          })
        }
      } else {
        await createReservation({
          contractId,
          reservationType: storagePlan.reservationType,
          storageLevel: storagePlan.storageLevel,
          warehouseId: wh,
          ...(zoneId ? { zoneId } : {}),
          ...(rackId ? { rackId } : {}),
          ...(rackLevelId ? { rackLevelId } : {}),
          ...(binId ? { binId } : {}),
          startDate: contractStart,
          endDate: contractEnd,
          status: 'ACTIVE',
          ...(reservedCapacityNum ? { reservedCapacity: reservedCapacityNum } : {}),
        })
      }
      let contractAmount: number | undefined
      try {
        const zoneIdsForPrice = storagePlan.needsZone ? selectedZoneIds : []
        if (!storagePlan.needsZone || zoneIdsForPrice.length > 0) {
          const est = await fetchContractPriceEstimate(wh, zoneIdsForPrice)
          if (est.suggestedTotalAmount > 0) {
            contractAmount = est.suggestedTotalAmount
          }
        }
      } catch {
        contractAmount = undefined
      }

      await contractsApi.updateContract(contractId, {
        status: 'PENDING_APPROVAL',
        ...(contractAmount != null ? { estimatedTotalAmount: contractAmount } : {}),
      })
      await finishOnboarding()
    })

  const stepDone = row.apiStatus === 'CONVERTED'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/95 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b101a] shadow-2xl">
        <div className="border-b border-white/5 bg-white/[0.02] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <span className="material-symbols-outlined text-cyan-400">route</span>
                Onboarding tenant — {row.id}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {row.customer} · {row.district}, {row.city}
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded p-2 hover:bg-white/10">
              <span className="material-symbols-outlined text-slate-400">close</span>
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 rounded-lg border px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide ${
                  i === step
                    ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300'
                    : i < step
                      ? 'border-emerald-400/30 bg-emerald-400/5 text-emerald-400'
                      : 'border-white/5 text-slate-500'
                }`}
              >
                {i + 1}. {label}
              </div>
            ))}
          </div>
        </div>

        {(error && !apiAlert.open) && (
          <div className="shrink-0 border-b border-red-400/20 bg-red-500/[0.06] px-6 py-3">
            <InlineAlert message={error} onDismiss={() => setError('')} />
          </div>
        )}

        <div className="dark-scrollbar flex-1 space-y-4 overflow-y-auto p-6 pr-5 [scrollbar-gutter:stable]">
          {step === 0 && (
            <div className="space-y-4">
              <SummaryBlock
                row={row}
                whName={whName}
                tenantContractType={tenantContractType}
                contractType={contractType}
              />
              {isWhOperator && (
                <div>
                  <label className={labelStyle}>Loại thuê (WH chọn)</label>
                  {tenantContractType === 'NEEDS_CONSULTATION' && (
                    <p className="mb-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                      Khách gửi dạng <strong>chưa rõ / để kho tư vấn</strong> — chọn hình thức thuê
                      thực tế bên dưới trước khi duyệt.
                    </p>
                  )}
                  <select
                    className={selectStyle}
                    value={contractType}
                    onChange={(e) =>
                      setContractType(e.target.value as BillableContractTypeValue)
                    }
                    aria-label="Chọn loại hợp đồng"
                  >
                    {WH_ASSIGNABLE_CONTRACT_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Loại thuê ghi vào yêu cầu và hợp đồng sau khi duyệt — khác với lựa chọn ban đầu của khách
                    nếu họ chọn “tư vấn”.
                  </p>
                  <ContractTypeStorageHint
                    contractType={contractType}
                    reservedCapacity={reservedCapacityNum}
                  />
                  {minZonesHint && minZonesHint.minZones > 1 && !isDedicatedSpaceRental(contractType) && (
                    <MinZonesCapacityAlert
                      hint={minZonesHint}
                      selectedZoneCount={selectedZoneIds.length}
                    />
                  )}
                </div>
              )}
              <TenantAreaRequirementCard
                contractType={contractType}
                value={tenantRequiredAreaM2}
                onChange={setTenantRequiredAreaM2}
                readOnly
                stepHint="approve"
              />
              {!approved && (
                <>
                  <div>
                    <label className={labelStyle}>
                      Kho nhận yêu cầu (claim) — {row.district}, {row.city}
                    </label>
                    {claimedByOther ? (
                      <InlineAlert
                        variant="error"
                        message={
                          <>
                            Yêu cầu đã được <strong>kho khác</strong> trong khu vực duyệt trước. Bạn không thể
                            claim lại.
                          </>
                        }
                      />
                    ) : isWhOperator ? (
                      <div className="space-y-2">
                        <input
                          className={inputStyle}
                          disabled
                          title="Kho nhận yêu cầu"
                          aria-label="Kho nhận yêu cầu"
                          value={`${whName} (${row.district}, ${row.city})`}
                        />
                        <p className="text-[11px] text-cyan-300/90">
                          Bạn đăng nhập với quyền Warehouse Admin — duyệt sẽ claim cho kho của bạn. Các kho
                          cùng khu vực cùng thấy yêu cầu chưa nhận; <strong>ai duyệt trước được nhận</strong>.
                        </p>
                      </div>
                    ) : claimableWarehouses.length === 0 ? (
                      <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
                        Không có kho nào cấu hình đúng khu vực <strong>{row.district}, {row.city}</strong>.
                      </p>
                    ) : claimableWarehouses.length === 1 ? (
                      <input
                        className={inputStyle}
                        disabled
                        title="Kho nhận yêu cầu"
                        aria-label="Kho nhận yêu cầu"
                        value={`${claimableWarehouses[0].warehouseName} (${claimableWarehouses[0].district}, ${claimableWarehouses[0].city})`}
                      />
                    ) : (
                      <select
                        className={selectStyle}
                        value={warehouseId}
                        onChange={(e) => setWarehouseId(e.target.value)}
                        aria-label="Chọn kho nhận yêu cầu"
                      >
                        <option value="">— Chọn kho trong khu vực —</option>
                        {claimableWarehouses.map((w) => (
                          <option key={w.warehouseId} value={w.warehouseId}>
                            {w.warehouseName} ({w.district}, {w.city})
                          </option>
                        ))}
                      </select>
                    )}
                    {!canApproveRental && (
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        System Admin chỉ được xem yêu cầu; Warehouse Admin mới có quyền duyệt/claim.
                      </p>
                    )}
                  </div>
                  {approvalCapacity && !isDedicatedSpaceRental(contractType) && (
                    <WarehouseApprovalCapacityCard
                      whName={whName}
                      capacity={approvalCapacity}
                      contractType={contractType}
                      snapshot={warehouseCapacitySnapshot}
                    />
                  )}
                  {contractType === 'DEDICATED_ZONE' && zones.length > 0 && (
                    <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-300">
                        Pre-allocation preview (nháp trước hợp đồng)
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Chọn zone PRIVATE dự kiến ngay ở bước duyệt để ước tính giá sát thực tế. Zone
                        SHARED / FAST_MOVING / PREMIUM không áp dụng cho thuê khu riêng.
                      </p>
                      {eligibleZones.length === 0 && (
                        <p className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-100">
                          Kho chưa có zone PRIVATE — tạo zone loại &quot;Khu riêng (PRIVATE)&quot; trong
                          quản lý kho trước khi duyệt.
                        </p>
                      )}
                      <div className="dark-scrollbar-inset mt-2 grid max-h-44 grid-cols-1 gap-2 overflow-y-auto rounded border border-white/10 p-2 pr-1">
                        {zones.map((z) => {
                          const checked = selectedZoneIds.includes(z.zoneId)
                          const eligible = isZoneEligibleForContract(contractType, z.zoneType)
                          return (
                            <label
                              key={z.zoneId}
                              className={`flex items-start gap-2 rounded px-2 py-1.5 text-xs ${
                                !eligible
                                  ? 'cursor-not-allowed bg-white/[0.02] text-slate-500 opacity-60'
                                  : checked
                                    ? 'cursor-pointer bg-cyan-500/15 text-cyan-100'
                                    : 'cursor-pointer bg-white/[0.03] text-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!eligible}
                                onChange={(e) => {
                                  if (!eligible) return
                                  if (e.target.checked) {
                                    setSelectedZoneIds((prev) => [...prev, z.zoneId])
                                  } else {
                                    setSelectedZoneIds((prev) => prev.filter((id) => id !== z.zoneId))
                                  }
                                }}
                                className="mt-0.5 rounded border-white/20 disabled:cursor-not-allowed"
                              />
                              <span>
                                {formatZoneOptionLabel(z)}
                                {!eligible && (
                                  <span className="mt-0.5 block text-[10px] text-slate-500">
                                    Không chọn — cần zone PRIVATE
                                  </span>
                                )}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                      {preAllocationPreview && (
                        <div className="mt-2 rounded border border-cyan-400/30 bg-cyan-400/10 p-2 text-xs text-cyan-100">
                          <p>
                            Đã chọn {preAllocationPreview.zoneCount} zone · tổng{' '}
                            {fmtM2(preAllocationPreview.totalAreaM2)} m²
                          </p>
                          {preAllocationPreview.monthlyBySelectedZones != null && (
                            <p className="mt-1">
                              Ước tính mới: ~{preAllocationPreview.monthlyBySelectedZones.toLocaleString('vi-VN')} VND/tháng
                              (so với gốc {preAllocationPreview.baseMonthly.toLocaleString('vi-VN')}/tháng)
                            </p>
                          )}
                          {preAllocationPreview.totalBySelectedZones != null && (
                            <p className="mt-1 text-[10px] text-cyan-200/80">
                              Tổng kỳ ~{preAllocationPreview.totalBySelectedZones.toLocaleString('vi-VN')} VND — sẽ
                              ghi vào HĐ khi cấp zone (bước 3).
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className={labelStyle}>Lý do từ chối (nếu từ chối)</label>
                    <textarea
                      className={`${inputStyle} dark-scrollbar-inset min-h-[80px]`}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do..."
                    />
                  </div>
                </>
              )}
              {approved && (
                <p className="text-sm text-emerald-400">
                  Yêu cầu đã được duyệt — kho: <strong>{whName}</strong>
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <SummaryBlock row={row} whName={whName} compact />
              {linkedContract && (
                <InlineAlert
                  variant="success"
                  title="Hợp đồng đã có"
                  message={
                    <>
                      Mã <strong>{linkedContract.contractCode}</strong> · trạng thái{' '}
                      <strong>{linkedContract.status}</strong>. Bấm{' '}
                      <strong>Tiếp — Cấp bin / zone</strong> bên dưới để cấp chỗ lưu trữ — không
                      tạo hợp đồng mới.
                    </>
                  }
                />
              )}
              {contractLoading && !linkedContract && (
                <p className="text-sm text-slate-400">Đang kiểm tra hợp đồng hiện có...</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Loại HĐ</label>
                  <input
                    className={inputStyle}
                    disabled
                      title="Loại hợp đồng"
                      aria-label="Loại hợp đồng"
                    value={CONTRACT_TYPE_LABELS[contractType] ?? contractType}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Cách tính giá</label>
                  <input
                    className={inputStyle}
                    disabled
                    title="Cách tính giá"
                    aria-label="Cách tính giá"
                    value={PRICING_MODEL_LABELS[pricingModel] ?? pricingModel}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Thời hạn: <strong className="text-slate-300">{row.startDate || '—'}</strong> →{' '}
                <strong className="text-slate-300">{row.endDate || '—'}</strong> (từ yêu cầu khách).{' '}
                <strong className="text-slate-300">Giá trị HĐ</strong> không nhập ở bước này — hệ thống tính và ghi
                khi <strong className="text-slate-300">cấp bin/zone (bước 3)</strong> theo diện tích zone thực tế. Sau
                đó HĐ chuyển <strong className="text-slate-300">Chờ tenant ký</strong>.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {stepDone ? (
                <p className="text-emerald-400 text-sm">Yêu cầu đã CONVERTED — onboarding hoàn tất.</p>
              ) : (
                <>
                  <TenantAreaRequirementCard
                    contractType={contractType}
                    value={tenantRequiredAreaM2}
                    onChange={setTenantRequiredAreaM2}
                    stepHint="allocate"
                    warehousePlanning={warehousePlanning}
                    allowUndersized={allowUndersizedZone}
                    onAllowUndersizedChange={setAllowUndersizedZone}
                  />
                  <p className="text-sm text-slate-300">
                    <span className="mr-2 inline-block rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">
                      {storagePlanShortLabel(contractType)}
                    </span>
                    {storagePlan.hint}
                  </p>
                  <AllocationPricePreview
                    loading={allocationPriceLoading}
                    estimate={allocationPriceEstimate}
                    needsZone={storagePlan.needsZone}
                    hasZonesSelected={selectedZoneIds.length > 0}
                  />
                  {contractType === 'SHARED_STORAGE' && (
                    <p className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-100">
                      Chỉ gán <strong>zone chung</strong> — bin/rack cụ thể khi nhập hàng.
                    </p>
                  )}

                  {storagePlan.needsZone && (
                    <div>
                      <label className={labelStyle}>
                        {allowsMultiZone ? 'Zone cấp cho tenant (chọn một hoặc nhiều)' : 'Zone'}
                      </label>
                      <p className="mb-2 text-[11px] text-slate-500">
                        {allowsMultiZone
                          ? 'Cùng diện tích có thể khác sức chứa LPN vì loại zone (PRIVATE / SHARED…) quy định kích cỡ bin mặc định. Chọn đủ zone nếu một zone không đủ.'
                          : 'Chọn zone trước khi chọn rack/bin.'}
                      </p>
                      {allowsMultiZone ? (
                        <ZoneMultiSelectList
                          zones={zones}
                          contractType={contractType}
                          selectedIds={selectedZoneIds}
                          tenantRequiredAreaM2={tenantRequiredAreaNum}
                          reservedCapacity={reservedCapacityNum}
                          onChange={(ids) => {
                            setSelectedZoneIds(ids)
                            setAllowUndersizedZone(false)
                          }}
                        />
                      ) : (
                        <select
                          className={selectStyle}
                          value={zoneId}
                          onChange={(e) => {
                            setSelectedZoneIds(e.target.value ? [e.target.value] : [])
                            setAllowUndersizedZone(false)
                          }}
                          aria-label="Chọn zone cấp cho tenant"
                        >
                          <option value="">— Chọn zone —</option>
                          {zones.map((z) => {
                            const eligible = isZoneEligibleForContract(contractType, z.zoneType)
                            return (
                              <option key={z.zoneId} value={z.zoneId} disabled={!eligible}>
                                {formatZoneOptionLabel(z)}
                                {!eligible && requiredZoneType ? ` — cần ${requiredZoneType}` : ''}
                              </option>
                            )
                          })}
                        </select>
                      )}
                      {minZonesHint && minZonesHint.minZones > 1 && allowsMultiZone && (
                        <MinZonesCapacityAlert
                          hint={minZonesHint}
                          selectedZoneCount={selectedZones.length}
                        />
                      )}

                      {selectedZones.length > 0 && allowsMultiZone && (
                        <MultiZoneSelectionSummary
                          zones={selectedZones}
                          reservedCapacity={reservedCapacityNum}
                          totalLpnCapacity={selectedZonesLpnCapacity}
                          totalAreaM2={selectedZonesAreaM2}
                          capacitySplit={zoneCapacitySplit?.active ?? null}
                          splitMode={
                            zoneCapacitySplit?.useEven ? ('even' as const) : ('proportional' as const)
                          }
                        />
                      )}

                      {!isDedicatedSpaceRental(contractType) && (
                        <ContractTypeStorageHint
                          contractType={contractType}
                          reservedCapacity={reservedCapacityNum}
                        />
                      )}
                      {zoneAreaFit && tenantRequiredAreaNum != null && selectedZones.length > 0 && (
                        <ZoneAreaFitAlert
                          fit={zoneAreaFit}
                          required={tenantRequiredAreaNum}
                          zoneCode={
                            allowsMultiZone
                              ? `${selectedZones.length} zone`
                              : (selectedZone?.zoneCode ?? '')
                          }
                          allowUndersized={allowUndersizedZone}
                          onAllowUndersizedChange={setAllowUndersizedZone}
                        />
                      )}
                      {capacityFit && !capacityFit.sufficient && (
                        <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                          Cần giữ ~{capacityFit.required} thùng/LPN — {selectedZones.length} zone đã chọn
                          ước tính ~{capacityFit.available} thùng (thiếu {capacityFit.deficit}). Chọn thêm
                          zone hoặc tick xác nhận cấp tạm.
                        </p>
                      )}
                    </div>
                  )}

                  {storagePlan.needsRack && zoneId && (
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

                  {storagePlan.needsBin && rackId && (
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
                    <p className="mt-1 text-[11px] text-slate-500">
                      Tổng số thùng/LPN cần giữ cho tenant. Với{' '}
                      <strong className="text-slate-400">SHARED_STORAGE</strong> /{' '}
                      <strong className="text-slate-400">DEDICATED_ZONE</strong>: khi chọn nhiều zone, hệ thống
                      chia theo bảng phân bổ bên dưới (zone bằng nhau → chia đều).
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-6 py-4">
          <button
            type="button"
            className="text-sm text-slate-400 hover:text-white disabled:opacity-40"
            disabled={busy || step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Quay lại
          </button>
          <div className="flex gap-2">
            {step === 0 && !approved && canApproveRental && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleReject}
                  className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  disabled={busy || claimedByOther}
                  onClick={handleApprove}
                  className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
                >
                  Duyệt & tiếp
                </button>
              </>
            )}
            {step === 0 && approved && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep(1)}
                className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-bold text-black"
              >
                Tiếp — Hợp đồng
              </button>
            )}
            {step === 1 &&
              (contractLoading ? (
                <span className="text-sm text-slate-400">Đang kiểm tra hợp đồng...</span>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleContinueToStorageStep}
                    className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
                  >
                    Tiếp — Cấp bin / zone
                  </button>
                  {!linkedContract && !contractId && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleCreateContract}
                      className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
                    >
                      Kích hoạt HĐ & tiếp
                    </button>
                  )}
                </>
              ))}
            {step === 2 && !stepDone && (
              <button
                type="button"
                disabled={busy}
                onClick={handleAssignStorage}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                Cấp chỗ & hoàn tất
              </button>
            )}
            {stepDone && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>

      {apiAlert.open && (
        <AlertModal
          title={apiAlert.title}
          type={apiAlert.type}
          message={apiAlert.message}
          onClose={() => setApiAlert({ open: false, message: '', type: 'error' })}
        />
      )}
    </div>
  )
}

function fmtM2(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(n)
}

function fmtMoney(n: number) {
  return `${n.toLocaleString('vi-VN')} VND`
}

function estimateAreaFromLpnCount(lpnCount: number | null | undefined) {
  if (lpnCount == null || !Number.isFinite(lpnCount) || lpnCount <= 0) return null
  return (lpnCount / ESTIMATE_DEFAULT_BIN_MAX_LPN_COUNT) * ESTIMATE_BIN_SLOT_FOOTPRINT_M2
}

function TenantAreaRequirementCard({
  contractType,
  value,
  onChange,
  readOnly = false,
  stepHint,
  warehousePlanning = null,
  allowUndersized = false,
  onAllowUndersizedChange,
}: {
  contractType: ContractTypeValue
  value: string
  onChange: (v: string) => void
  readOnly?: boolean
  stepHint: 'approve' | 'allocate'
  warehousePlanning?: warehousesApi.ApiWarehouseZonePlanning | null
  allowUndersized?: boolean
  onAllowUndersizedChange?: (v: boolean) => void
}) {
  const requiredNum = value.trim() ? Number(value) : null
  const warehouseUndersized =
    contractType === 'DEDICATED_WAREHOUSE' &&
    requiredNum != null &&
    warehousePlanning?.usableAreaM2 != null &&
    warehousePlanning.usableAreaM2 < requiredNum
  const showsArea = showsRequestedAreaField(contractType)
  const label = showsArea
    ? requestedAreaFieldLabel(contractType)
    : 'Diện tích / quy mô tenant (tham khảo)'

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300/90">
        Nhu cầu diện tích tenant
      </p>
      {stepHint === 'approve' && (
        <p className="mt-1 text-xs text-slate-400">
          Kiểm tra trước khi duyệt: tenant khai báo cần bao nhiêu m² (zone/kho). Bước cấp chỗ sẽ
          đối chiếu với diện tích từng zone.
        </p>
      )}
      {stepHint === 'allocate' && (
        <p className="mt-1 text-xs text-slate-400">
          Chọn zone có diện tích ≥ nhu cầu. Nếu zone nhỏ hơn (vd. zone 50 m², tenant cần 200 m²),
          phải chọn zone khác hoặc bổ sung zone — một reservation hiện chỉ gắn một zone.
        </p>
      )}
      <div className="mt-3">
        <label className={labelStyle} htmlFor="tenant-required-area">
          {label}
        </label>
        <input
          id="tenant-required-area"
          type="number"
          min={0}
          step="0.01"
          readOnly={readOnly}
          disabled={readOnly}
          className={inputStyle}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            showsArea ? 'VD: 200 (m² tenant cần)' : 'Khách chưa khai báo m² — nhập nếu WH ghi nhận'
          }
        />
        {!value.trim() && showsArea && (
          <p className="mt-1 text-xs text-amber-300/90">
            Tenant chưa khai báo diện tích trên form — xác nhận với khách trước khi cấp zone.
          </p>
        )}
        {stepHint === 'allocate' && warehousePlanning && (
          <p className="mt-2 text-xs text-slate-400">
            Kho: sử dụng <strong className="text-slate-200">{fmtM2(warehousePlanning.usableAreaM2)} m²</strong>
            · zone đã phân bổ {fmtM2(warehousePlanning.usedZoneAreaM2)} m² · còn{' '}
            <strong className="text-cyan-300">{fmtM2(warehousePlanning.remainingZoneAreaM2)} m²</strong>
          </p>
        )}
        {contractType === 'DEDICATED_WAREHOUSE' && stepHint === 'allocate' && (
          <>
            <p className="mt-1 text-xs text-slate-500">
              Thuê nguyên kho: không chọn zone — đảm bảo diện tích sử dụng kho ≥ nhu cầu tenant.
            </p>
            {warehouseUndersized && (
              <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200">
                <p>
                  Kho thiếu {fmtM2(requiredNum! - warehousePlanning!.usableAreaM2!)} m² so với yêu cầu
                  tenant ({fmtM2(warehousePlanning!.usableAreaM2)} m² sử dụng).
                </p>
                {onAllowUndersizedChange && (
                  <label className="mt-2 flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={allowUndersized}
                      onChange={(e) => onAllowUndersizedChange(e.target.checked)}
                      className="mt-0.5 rounded border-white/20"
                    />
                    <span>Vẫn cấp toàn kho (xác nhận đã thỏa thuận với tenant)</span>
                  </label>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function formatZoneOptionLabel(z: zonesApi.ApiZone) {
  const za = Number(z.areaM2) || 0
  const lpn = estimateZoneLpnCapacity(z)
  return `${z.zoneCode}${z.zoneName ? ` — ${z.zoneName}` : ''} (${z.zoneType}${za > 0 ? ` · ${za} m²` : ''} · ${formatZoneRackSummary(z)}${lpn > 0 ? ` · ~${lpn} thùng` : ''})`
}

function ZoneMultiSelectList({
  zones,
  contractType,
  selectedIds,
  tenantRequiredAreaM2,
  reservedCapacity,
  onChange,
}: {
  zones: zonesApi.ApiZone[]
  contractType: string
  selectedIds: string[]
  tenantRequiredAreaM2: number | null
  reservedCapacity: number | null
  onChange: (ids: string[]) => void
}) {
  const requiredZoneType = requiredZoneTypeForContract(contractType)
  const eligibleCount = zones.filter((z) =>
    isZoneEligibleForContract(contractType, z.zoneType)
  ).length

  const toggle = (zoneId: string, eligible: boolean) => {
    if (!eligible) return
    if (selectedIds.includes(zoneId)) {
      onChange(selectedIds.filter((id) => id !== zoneId))
    } else {
      onChange([...selectedIds, zoneId])
    }
  }

  if (zones.length === 0) {
    return (
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        Chưa có zone ACTIVE — tạo zone trong quản lý kho trước.
      </p>
    )
  }

  return (
    <>
      {requiredZoneType && eligibleCount === 0 && (
        <p className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Kho chưa có zone {requiredZoneType} — tạo zone loại &quot;Khu riêng (PRIVATE)&quot; trước khi cấp
          cho tenant thuê khu riêng.
        </p>
      )}
      <div className="dark-scrollbar-inset max-h-64 space-y-2 overflow-y-auto rounded-lg border border-white/10 p-2 pr-1">
        {zones.map((z) => {
          const checked = selectedIds.includes(z.zoneId)
          const eligible = isZoneEligibleForContract(contractType, z.zoneType)
        const area = Number(z.areaM2) || 0
        const lpnCap = estimateZoneLpnCapacity(z)
        const cap = computeZoneStorageCapacity(z.areaM2)
        const areaOk =
          tenantRequiredAreaM2 == null || area <= 0 || area >= tenantRequiredAreaM2
        const lpnOk = reservedCapacity == null || lpnCap >= reservedCapacity

        return (
          <label
            key={z.zoneId}
            className={`flex gap-3 rounded-lg border p-3 transition-colors ${
              !eligible
                ? 'cursor-not-allowed border-white/5 bg-white/[0.01] opacity-55'
                : checked
                  ? 'cursor-pointer border-cyan-400/50 bg-cyan-400/10'
                  : 'cursor-pointer border-white/5 bg-white/[0.02] hover:border-white/15'
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={!eligible}
              onChange={() => toggle(z.zoneId, eligible)}
              className="mt-1 rounded border-white/20 disabled:cursor-not-allowed"
            />
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-semibold text-white">
                {z.zoneCode}
                {z.zoneName ? ` — ${z.zoneName}` : ''}
                <span className="ml-2 font-normal text-slate-400">({z.zoneType})</span>
              </p>
              <p className="mt-1 text-slate-400">{formatZoneRackSummary(z)}</p>
              {cap.hasArea && (
                <p className="mt-0.5 text-slate-500">{formatZoneCapacitySummary(cap, z.zoneType)}</p>
              )}
              {lpnCap > 0 && (
                <p className="mt-1 text-cyan-300/90">≈ {lpnCap.toLocaleString('vi-VN')} LPN (tối đa theo loại zone)</p>
              )}
              {tenantRequiredAreaM2 != null && area > 0 && !areaOk && (
                <p className="mt-1 text-amber-300">Diện tích &lt; nhu cầu {fmtM2(tenantRequiredAreaM2)} — chọn thêm zone</p>
              )}
              {reservedCapacity != null && lpnCap > 0 && !lpnOk && eligible && (
                <p className="mt-1 text-amber-300">
                  Một zone chưa đủ {reservedCapacity} thùng — chọn thêm zone
                </p>
              )}
              {!eligible && requiredZoneType && (
                <p className="mt-1 text-slate-500">
                  Không chọn — loại hình thuê khu riêng chỉ dùng zone {requiredZoneType}
                </p>
              )}
            </div>
          </label>
        )
      })}
      </div>
    </>
  )
}

function MinZonesCapacityAlert({
  hint,
  selectedZoneCount,
}: {
  hint: MinZonesCapacityHint
  selectedZoneCount: number
}) {
  const areaPart =
    hint.referenceAreaM2 != null && hint.referenceAreaM2 > 0
      ? ` (~${new Intl.NumberFormat('vi-VN').format(hint.referenceAreaM2)} m²/zone)`
      : ''
  const needsMore = selectedZoneCount < hint.minZones

  return (
    <div
      className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
        needsMore
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
      }`}
    >
      <p className="font-semibold text-white">
        {needsMore ? 'Cần thêm zone' : 'Đủ số zone theo ước tính'}
      </p>
      <p className="mt-1">
        Tenant cần giữ <strong>{hint.requiredLpn.toLocaleString('vi-VN')}</strong> thùng/LPN — mỗi zone
        tối đa ~<strong>{hint.referenceLpnPerZone.toLocaleString('vi-VN')}</strong> thùng{areaPart}.
      </p>
      <p className="mt-1">
        → Cần tối thiểu <strong>{hint.minZones} zone</strong>
        {hint.minZones === 2 && hint.referenceAreaM2 != null
          ? ` (vd. 2 zone × ${new Intl.NumberFormat('vi-VN').format(hint.referenceAreaM2)} m²)`
          : ''}
        .
        {selectedZoneCount > 0 && (
          <>
            {' '}
            Hiện đã chọn <strong>{selectedZoneCount}</strong>.
          </>
        )}
      </p>
    </div>
  )
}

function ContractTypeStorageHint({
  contractType,
  reservedCapacity,
}: {
  contractType: BillableContractTypeValue
  reservedCapacity: number | null
}) {
  if (contractType === 'DEDICATED_ZONE' || contractType === 'DEDICATED_WAREHOUSE') {
    return null
  }

  if (contractType === 'SHARED_STORAGE') {
    return (
      <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-100/95">
        <p className="font-semibold text-emerald-200">SHARED_STORAGE — gợi ý cho nhu cầu lớn</p>
        <p className="mt-1 text-slate-300">
          Chọn nhiều zone SHARED; phần thùng được <strong>chia cho tenant</strong> theo bảng phân bổ. Ô
          trống còn lại trong zone vẫn có thể dùng cho tenant khác — thường <strong>tiết kiệm hơn</strong>{' '}
          thuê nguyên 2 zone DEDICATED.
        </p>
        {reservedCapacity != null && reservedCapacity > 500 && (
          <p className="mt-1 text-slate-400">
            Billing theo mức dùng (USAGE_BASED), không trả cố định toàn bộ m² zone nếu không dùng hết.
          </p>
        )}
      </div>
    )
  }

  if (contractType === 'RESERVED_STORAGE') {
    return (
      <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        <p className="font-semibold text-amber-200">RESERVED_STORAGE — giữ chỗ bin cố định</p>
        <p className="mt-1">
          Mỗi lần onboarding hiện tạo <strong>một reservation gắn một bin</strong> (chọn zone → rack →
          tầng → bin). Một bin thường chứa vài thùng/LPN (theo maxLpnCount), không phải cả zone.
        </p>
        {reservedCapacity != null && reservedCapacity > 100 && (
          <p className="mt-1 text-amber-200/90">
            Với ~{reservedCapacity.toLocaleString('vi-VN')} thùng: cần <strong>nhiều bin RESERVED</strong>{' '}
            (nhiều lần cấp / mở rộng sau) hoặc chuyển sang{' '}
            <strong>SHARED_STORAGE</strong> + nhiều zone để chia dung lượng trên HĐ.
          </p>
        )}
      </div>
    )
  }

  return null
}

function MultiZoneSelectionSummary({
  zones,
  reservedCapacity,
  totalLpnCapacity,
  totalAreaM2,
  capacitySplit,
  splitMode,
}: {
  zones: zonesApi.ApiZone[]
  reservedCapacity: number | null
  totalLpnCapacity: number
  totalAreaM2: number
  capacitySplit: Map<string, number> | null
  splitMode: 'even' | 'proportional'
}) {
  return (
    <div className="mt-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-100">
      <p className="font-medium text-white">
        Đã chọn {zones.length} zone: {zones.map((z) => z.zoneCode).join(', ')}
      </p>
      <p className="mt-1">
        Tổng ~{totalLpnCapacity.toLocaleString('vi-VN')} thùng/LPN
        {totalAreaM2 > 0 ? ` · ${fmtM2(totalAreaM2)}` : ''}
        {reservedCapacity != null && (
          <>
            {' '}
            — yêu cầu giữ {reservedCapacity.toLocaleString('vi-VN')} thùng
            {totalLpnCapacity >= reservedCapacity ? (
              <span className="text-emerald-300"> (đủ)</span>
            ) : (
              <span className="text-amber-300">
                {' '}
                (thiếu ~{reservedCapacity - totalLpnCapacity})
              </span>
            )}
          </>
        )}
      </p>
      {reservedCapacity != null && capacitySplit && zones.length > 0 && (
        <div className="mt-2 border-t border-cyan-500/20 pt-2">
          <p className="font-medium text-cyan-200">
            Phân bổ lên HĐ ({splitMode === 'even' ? 'chia đều' : 'theo sức chứa zone'}):
          </p>
          <ul className="mt-1 space-y-0.5">
            {zones.map((z) => {
              const share = capacitySplit.get(z.zoneId) ?? 0
              const pct =
                reservedCapacity > 0 ? Math.round((share / reservedCapacity) * 100) : 0
              return (
                <li key={z.zoneId} className="flex justify-between gap-2 text-slate-300">
                  <span>
                    <strong className="text-white">{z.zoneCode}</strong>
                    {z.zoneType ? ` (${z.zoneType})` : ''}
                  </span>
                  <span className="shrink-0 font-mono text-cyan-300">
                    {share.toLocaleString('vi-VN')} thùng{pct > 0 ? ` · ${pct}%` : ''}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-1.5 text-[10px] text-slate-500">
            Khi kích hoạt HĐ, mỗi zone nhận một storage reservation với reservedCapacity tương ứng. Phần
            capacity zone còn trống (SHARED) có thể nhận tenant khác.
          </p>
        </div>
      )}
    </div>
  )
}

function WarehouseApprovalCapacityCard({
  whName,
  capacity,
  contractType,
  snapshot,
}: {
  whName: string
  capacity: {
    utilizationPct: number
    usable: number
    used: number
    remaining: number | null
    areaRequired: number | null
    areaFeasible: boolean
    suggestedZoneCount: number | null
  }
  contractType: ContractTypeValue
  snapshot: warehousesApi.ApiWarehouseCapacitySnapshot | null
}) {
  const canApprove = contractType === 'DEDICATED_WAREHOUSE' ? true : capacity.areaFeasible
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs ${
        canApprove
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
          : 'border-amber-500/40 bg-amber-500/10 text-amber-100'
      }`}
    >
      <p className="font-semibold text-white">
        Sức chứa kho hiện tại — <span className="text-cyan-300">{whName}</span>
      </p>
      <p className="mt-1">
        Đang dùng {fmtM2(capacity.used)} / {fmtM2(capacity.usable)} m² ({capacity.utilizationPct}%)
        {capacity.remaining != null ? ` · còn ~${fmtM2(capacity.remaining)} m²` : ''}
      </p>
      {capacity.areaRequired != null && (
        <p className="mt-1">
          Tenant cần ~{fmtM2(capacity.areaRequired)} m² ·{' '}
          {canApprove ? (
            <span className="text-emerald-300 font-medium">có thể duyệt</span>
          ) : (
            <span className="text-amber-300 font-medium">nên cân nhắc (thiếu diện tích)</span>
          )}
        </p>
      )}
      {capacity.suggestedZoneCount != null && capacity.suggestedZoneCount > 1 && (
        <p className="mt-1 text-amber-200/90">
          Ước tính cần khoảng {capacity.suggestedZoneCount} zone tham chiếu để đáp ứng.
        </p>
      )}
      {snapshot && (
        <div className="mt-2 rounded border border-white/10 bg-white/[0.03] p-2 text-[11px] text-slate-300">
          {snapshot.dataSource === 'projected' && (
            <p className="mb-1 text-amber-200/90">
              Chưa có bin thực tế trong layout — số dưới đây là <strong>ước tính</strong> theo diện tích kho.
            </p>
          )}
          {(snapshot.diagnostics?.binsBelowStandardVolume ?? 0) > 0 && (
            <p className="mb-1 text-amber-200/90">
              {snapshot.diagnostics.binsBelowStandardVolume} bin đang dùng volume &lt; 16 (chỉ ~1 EXTRA/bin).
              Cập nhật bin lên 16 volume để đủ 2 EXTRA/bin.
            </p>
          )}
          <p>
            Bin trống/khả dụng: <strong className="text-white">{snapshot.warehouseStorage.emptyBins}</strong> /{' '}
            {snapshot.warehouseStorage.putawayEligibleBins} · free slot ~
            <strong className="text-cyan-300">
              {' '}
              {snapshot.warehouseStorage.freeLpnSlots.toLocaleString('vi-VN')}
            </strong>{' '}
            thùng/LPN
          </p>
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
            {Object.entries(snapshot.boxTypeCapacity).map(([boxType, c]) => {
              const byVolume = c.estimatedBoxCapacity ?? c.totalFreeLpnSlots
              const lpnCap = c.totalFreeLpnSlots
              return (
                <p key={boxType}>
                  <span className="text-cyan-300">{boxType}</span>: {c.candidateBins} bin · ~
                  {byVolume.toLocaleString('vi-VN')} thùng
                  {lpnCap < byVolume && (
                    <span className="text-slate-500">
                      {' '}
                      (≤ {lpnCap.toLocaleString('vi-VN')} theo slot LPN)
                    </span>
                  )}
                  {(c.partialAdditionalLpn ?? 0) > 0 && (
                    <span className="text-slate-500">
                      {' '}
                      (+{c.partialAdditionalLpn} trên bin dở)
                    </span>
                  )}
                </p>
              )
            })}
          </div>
          <p className="mt-1 text-slate-400">
            Gợi ý box type: <strong className="text-cyan-200">{snapshot.boxTypeSuggestion.recommendedBoxType}</strong>
            <span className="text-slate-500"> (ưu tiên EXTRA)</span>
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">{snapshot.boxTypeSuggestion.reason}</p>
          {(snapshot.boxTypeSuggestion.alternateNotes ?? []).map((note) => (
            <p key={note} className="mt-0.5 text-[10px] text-amber-200/80">
              {note}
            </p>
          ))}
          {contractType === 'DEDICATED_WAREHOUSE' && snapshot.projectedCapacity && (
            <p className="mt-1 text-amber-200/90">
              Nếu chưa tạo rack/bin đầy đủ: với usable ~{fmtM2(snapshot.usableAreaM2)} m² có thể ước tính
              ~{snapshot.projectedCapacity.projectedRackCount.toLocaleString('vi-VN')} rack ·{' '}
              ~{snapshot.projectedCapacity.projectedBinSlots.toLocaleString('vi-VN')} bin ·{' '}
              ~{snapshot.projectedCapacity.projectedLpnCapacity.toLocaleString('vi-VN')} thùng/LPN.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ZoneAreaFitAlert({
  fit,
  required,
  zoneCode,
  allowUndersized,
  onAllowUndersizedChange,
}: {
  fit: { zoneArea: number; sufficient: boolean; deficit: number; minZones: number | null; multi?: boolean }
  required: number
  zoneCode: string
  allowUndersized: boolean
  onAllowUndersizedChange: (v: boolean) => void
}) {
  if (fit.sufficient) {
    return (
      <p className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
        {fit.multi ? (
          <>
            <strong>{zoneCode}</strong> tổng {fmtM2(fit.zoneArea)} — đủ so với tenant cần{' '}
            {fmtM2(required)} m².
          </>
        ) : (
          <>
            Zone <strong>{zoneCode}</strong> có {fmtM2(fit.zoneArea)} m² — đủ so với tenant cần{' '}
            {fmtM2(required)} m².
          </>
        )}
      </p>
    )
  }

  return (
    <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
      <p className="font-medium text-amber-200">
        {fit.multi ? (
          <>
            <strong>{zoneCode}</strong> tổng {fmtM2(fit.zoneArea)} — tenant cần {fmtM2(required)} m²
            (thiếu {fmtM2(fit.deficit)} m²).
          </>
        ) : (
          <>
            Zone <strong>{zoneCode}</strong> chỉ {fmtM2(fit.zoneArea)} m² — tenant cần {fmtM2(required)}{' '}
            m² (thiếu {fmtM2(fit.deficit)} m²).
          </>
        )}
      </p>
      {fit.minZones != null && fit.minZones > 1 && (
        <p className="mt-1 text-amber-200/80">
          Gợi ý: cần khoảng <strong>{fit.minZones} zone</strong> cùng cỡ (~{fmtM2(fit.zoneArea)} m²/zone)
          hoặc một zone ≥ {fmtM2(required)} m².
        </p>
      )}
      <label className="mt-2 flex cursor-pointer items-start gap-2 text-amber-100/90">
        <input
          type="checkbox"
          checked={allowUndersized}
          onChange={(e) => onAllowUndersizedChange(e.target.checked)}
          className="mt-0.5 rounded border-white/20"
        />
        <span>
          Vẫn cấp zone này (tạm thời / sẽ bổ sung zone sau) — không khuyến nghị nếu HĐ thuê nguyên
          zone.
        </span>
      </label>
    </div>
  )
}

function AllocationPricePreview({
  loading,
  estimate,
  needsZone,
  hasZonesSelected,
}: {
  loading: boolean
  estimate: ApiContractPriceEstimate | null
  needsZone: boolean
  hasZonesSelected: boolean
}) {
  if (needsZone && !hasZonesSelected) {
    return (
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        Chọn zone để xem giá HĐ trước khi hoàn tất.
      </p>
    )
  }
  if (loading) {
    return (
      <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-slate-400">
        Đang tính giá...
      </p>
    )
  }
  if (!estimate) return null

  const formula = formatContractPriceFormula(estimate)

  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
      <p className="font-medium text-emerald-200">
        Giá HĐ ước tính: <strong className="text-white">{fmtMoney(estimate.suggestedTotalAmount)}</strong>
      </p>
      {formula && <p className="mt-1 text-emerald-200/90">{formula}</p>}
      <p className="mt-1 text-[10px] text-emerald-200/70">
        Ghi vào hợp đồng khi bấm <strong>Cấp chỗ & hoàn tất</strong>.
      </p>
    </div>
  )
}

function formatContractPriceFormula(estimate: ApiContractPriceEstimate): string | null {
  const zoneLines = estimate.breakdown.filter((b) => b.label && b.label !== 'Thuê zone đã chọn')
  if (zoneLines.length > 0) {
    const parts = zoneLines.map((b) => b.detail.replace(/ VND/g, ' ₫'))
    const tail = `× ${estimate.monthCount} tháng`
    return parts.length === 1 ? `${parts[0]} ${tail}` : `${parts.join(' + ')} ${tail}`
  }
  if (estimate.areaM2Used != null && estimate.unitPricePerM2Month != null) {
    return `${estimate.areaM2Used.toLocaleString('vi-VN')} m² × ${estimate.unitPricePerM2Month.toLocaleString('vi-VN')} ₫/m²/tháng × ${estimate.monthCount} tháng`
  }
  if (estimate.monthlyAmount > 0) {
    return `~${estimate.monthlyAmount.toLocaleString('vi-VN')} ₫/tháng × ${estimate.monthCount} tháng`
  }
  return null
}

function SummaryBlock({
  row,
  whName,
  compact,
  tenantContractType,
  contractType,
}: {
  row: RentalRequestRow
  whName: string
  compact?: boolean
  tenantContractType?: ContractTypeValue
  contractType?: BillableContractTypeValue
}) {
  const ct = (tenantContractType ?? row.contractType) as ContractTypeValue | undefined
  const effectiveType = contractType ?? ct
  const hideVolumeEstimate = isDedicatedSpaceRental(effectiveType)
  const estimatedLpn = row.estimatedBoxCount ?? null
  const estimatedAreaM2 = estimateAreaFromLpnCount(estimatedLpn)
  const rentalMonths = estimateMonthCount(row.expectedStartDate ?? '', row.expectedEndDate ?? '')
  const totalEstimatedAreaM2 =
    estimatedAreaM2 != null && rentalMonths > 0 ? estimatedAreaM2 * rentalMonths : null
  return (
    <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={labelStyle}>Khách</span>
          <p className="text-white">{row.customer}</p>
          <p className="text-xs text-slate-500">{row.customerEmail}</p>
        </div>
        <div>
          <span className={labelStyle}>Kho / vùng</span>
          <p className="text-white">{whName}</p>
        </div>
        {ct && (
          <div>
            <span className={labelStyle}>
              {ct === 'NEEDS_CONSULTATION' ? 'Loại thuê (khách)' : 'Loại thuê'}
            </span>
            <p className="text-white">{CONTRACT_TYPE_LABELS[ct] ?? ct}</p>
          </div>
        )}
        {row.billingCycle && (
          <div>
            <span className={labelStyle}>Chu kỳ thanh toán</span>
            <p className="text-white">
              {BILLING_CYCLE_GUEST_LABELS[row.billingCycle] ?? row.billingCycle}
            </p>
          </div>
        )}
        {(row.startDate || row.endDate) && (
          <div className="col-span-2">
            <span className={labelStyle}>Thời hạn thuê (khách)</span>
            <p className="text-white">
              {row.startDate || '—'} → {row.endDate || '—'}
            </p>
          </div>
        )}
      </div>
      {!compact && (
        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3 text-xs text-slate-400">
          {!hideVolumeEstimate && row.estimatedBoxCount != null && (
            <div className="col-span-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-amber-100">
              <p className="font-semibold">
                Hộp ước tính: {row.estimatedBoxCount.toLocaleString('vi-VN')} thùng-LPN
              </p>
              <p className="mt-1 text-[11px] text-amber-200/90">
                Diện tích ước tính: ~{fmtM2(estimatedAreaM2)} m² (tham chiếu: ~
                {ESTIMATE_DEFAULT_BIN_MAX_LPN_COUNT} thùng/bin, {ESTIMATE_BIN_SLOT_FOOTPRINT_M2} m²/bin)
              </p>
              {rentalMonths > 0 && totalEstimatedAreaM2 != null && (
                <p className="mt-1 text-[11px] text-amber-200/90">
                  Diện tích tham chiếu toàn kỳ: ~{fmtM2(totalEstimatedAreaM2)} m².
                </p>
              )}
            </div>
          )}
          {row.estimatedSkuCount != null && <p>SKU: {row.estimatedSkuCount}</p>}
          {row.estimatedInboundPerWeek != null && (
            <p>Nhập/tuần: {row.estimatedInboundPerWeek}</p>
          )}
          {row.estimatedOutboundPerWeek != null && (
            <p>Xuất/tuần: {row.estimatedOutboundPerWeek}</p>
          )}
          {row.requestedAreaM2 != null && <p>Diện tích: {row.requestedAreaM2} m²</p>}
          {row.requiresFastPicking && <p className="text-cyan-400">Fast picking</p>}
          {row.requiresPremiumStorage && <p className="text-cyan-400">Premium storage</p>}
          {row.notes && (
            <p className="col-span-2 text-slate-300">
              Ghi chú: {row.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
