import { InlineAlert } from '../FeedbackAlert'
import { AlertModal } from './AlertModal'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ContractStorageAssignmentPanel,
  type ContractStorageAssignmentPanelRef,
} from '../../contracts/ContractStorageAssignmentPanel'
import { ApiError } from '../../../api/client'
import * as contractsApi from '../../../api/contracts'
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
  resolveWhApprovalContractType,
  WH_ASSIGNABLE_CONTRACT_OPTIONS,
  type BillableContractTypeValue,
  type ContractTypeValue,
} from '../../../data/contractTypes'
import type { ApiContract, UserRole } from '../../../api/types'
import type { RentalRequestRow } from '../../../mappers'
import {
  getOnboardingStoragePlan,
  isZoneEligibleForContract,
} from '../../../utils/onboardingStorage'
import {
  computeMinZonesCapacityHint,
  type MinZonesCapacityHint,
  estimateZoneLpnCapacity,
  formatZoneRackSummary,
  isZoneEligibleForLpnDemand,
  zoneLpnShortfallMessage,
} from '../../../utils/warehouseCapacity'
import { estimateMonthCount, resolveContractDatesFromApproval } from '../../../utils/rentalPeriod'
import { formatDisplayDate, rentalRequestDateOnly } from '../../../utils/datePicker'
import {
  filterWarehousesForRentalClaim,
  type WarehouseWithRegion,
} from '../../../utils/warehouseRegion'
import {
  filterEligibleSharedStorageCandidates,
  findOperatorClaimCandidate,
  operatorCanApproveSharedStorage,
  rankSharedStorageCandidates,
  readinessLabel,
  type WarehouseClaimCandidate,
} from '../../../utils/warehouseClaimCandidates'

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
  const initialContractType = resolveWhApprovalContractType({
    contractType: row.contractType,
    requestedAreaM2: row.requestedAreaM2,
    estimatedBoxCount: row.estimatedBoxCount,
    totalCommittedVolumeUnits: row.totalCommittedVolumeUnits,
  })

  const [contractType, setContractType] = useState<BillableContractTypeValue>(
    initialContractType
  )
  const [pricingModel, setPricingModel] = useState<string>(
    row.pricingModel ?? defaultPricingModel(initialContractType)
  )

  useEffect(() => {
    // Đồng bộ pricingModel theo loại hợp đồng được WH chọn.
    setPricingModel(defaultPricingModel(contractType))
  }, [contractType])
  const [contractId, setContractId] = useState<string | null>(null)
  const [linkedContract, setLinkedContract] = useState<ApiContract | null>(null)
  const [contractLoading, setContractLoading] = useState(false)
  const effectiveDates = useMemo(() => {
    const requestedStart = rentalRequestDateOnly(row.expectedStartDate)
    const requestedEnd = rentalRequestDateOnly(row.expectedEndDate)
    if (!requestedStart || !requestedEnd) {
      return {
        startDate: requestedStart,
        endDate: requestedEnd,
        shifted: false,
        billingMonths: 0,
      }
    }
    return resolveContractDatesFromApproval(requestedStart, requestedEnd)
  }, [row.expectedStartDate, row.expectedEndDate])
  const contractStart = effectiveDates.startDate
  const contractEnd = effectiveDates.endDate
  const [priceEstimate, setPriceEstimate] = useState<ApiContractPriceEstimate | null>(null)
  const [allocationPriceEstimate, setAllocationPriceEstimate] =
    useState<ApiContractPriceEstimate | null>(null)
  const [allocationPriceLoading, setAllocationPriceLoading] = useState(false)

  const [zones, setZones] = useState<zonesApi.ApiZone[]>([])
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([])
  const reservedCapacity = String(row.estimatedBoxCount ?? row.estimatedSkuCount ?? '')
  const [tenantRequiredAreaM2, setTenantRequiredAreaM2] = useState(
    areaM2ToInputValue(row.requestedAreaM2)
  )
  const [allowUndersizedZone, setAllowUndersizedZone] = useState(false)
  const [warehousePlanning, setWarehousePlanning] = useState<
    warehousesApi.ApiWarehouseZonePlanning | null
  >(null)
  const [warehouseCapacitySnapshot, setWarehouseCapacitySnapshot] = useState<
    warehousesApi.ApiWarehouseCapacitySnapshot | null
  >(null)
  const [claimCandidates, setClaimCandidates] = useState<WarehouseClaimCandidate[]>([])
  const [claimCandidatesLoading, setClaimCandidatesLoading] = useState(false)
  const storagePanelRef = useRef<ContractStorageAssignmentPanelRef>(null)

  const storagePlan = useMemo(() => getOnboardingStoragePlan(contractType), [contractType])
  const allowsMultiZone = storagePlan.needsZone && !storagePlan.needsBin
  const eligibleZones = useMemo(
    () => zones.filter((z) => isZoneEligibleForContract(contractType, z)),
    [zones, contractType]
  )

  const tenantRequiredAreaNum = useMemo(() => {
    const n = Number(tenantRequiredAreaM2)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [tenantRequiredAreaM2])

  const selectedZones = useMemo(
    () => zones.filter((z) => selectedZoneIds.includes(z.zoneId)),
    [zones, selectedZoneIds]
  )

  const reservedCapacityNum = useMemo(() => {
    const n = Number(reservedCapacity)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [reservedCapacity])

  useEffect(() => {
    setSelectedZoneIds((prev) =>
      prev.filter((id) => {
        const z = zones.find((x) => x.zoneId === id)
        return (
          z != null &&
          isZoneEligibleForContract(contractType, z) &&
          isZoneEligibleForLpnDemand(z, reservedCapacityNum, contractType)
        )
      })
    )
  }, [contractType, zones, reservedCapacityNum])

  const preAllocationPreviewAreaM2 = useMemo(
    () => selectedZones.reduce((sum, z) => sum + (Number(z.areaM2) || 0), 0),
    [selectedZones]
  )

  const minZonesHint = useMemo(() => {
    if (!reservedCapacityNum || !allowsMultiZone || zones.length === 0) return null
    return computeMinZonesCapacityHint(reservedCapacityNum, zones)
  }, [reservedCapacityNum, allowsMultiZone, zones])

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

  const rankedClaimCandidates = useMemo(
    () =>
      rankSharedStorageCandidates(claimCandidates, {
        suggestedZoneType: row.suggestedZoneType,
        operatorWarehouseId: operatorWhId,
      }),
    [claimCandidates, row.suggestedZoneType, operatorWhId]
  )

  const eligibleClaimCandidates = useMemo(
    () => filterEligibleSharedStorageCandidates(rankedClaimCandidates),
    [rankedClaimCandidates]
  )

  const operatorClaimCandidate = useMemo(
    () =>
      findOperatorClaimCandidate(
        rankedClaimCandidates,
        isWhOperator ? operatorWhId : warehouseId || null
      ),
    [rankedClaimCandidates, isWhOperator, operatorWhId, warehouseId]
  )

  const canApproveSharedStorage = useMemo(
    () =>
      contractType !== 'SHARED_STORAGE' ||
      operatorCanApproveSharedStorage(operatorClaimCandidate),
    [contractType, operatorClaimCandidate]
  )

  const claimableWarehouses = useMemo(() => {
    if (isWhOperator) return []
    const regional = filterWarehousesForRentalClaim(
      warehouses,
      row.city,
      row.district,
      row.warehouseId
    )
    if (contractType !== 'SHARED_STORAGE' || eligibleClaimCandidates.length === 0) {
      return regional
    }
    const eligibleIds = new Set(eligibleClaimCandidates.map((c) => c.warehouseId))
    return regional.filter((w) => eligibleIds.has(w.warehouseId))
  }, [
    isWhOperator,
    warehouses,
    row.city,
    row.district,
    row.warehouseId,
    contractType,
    eligibleClaimCandidates,
  ])

  useEffect(() => {
    if (contractType !== 'SHARED_STORAGE') {
      setClaimCandidates([])
      return
    }
    let cancelled = false
    setClaimCandidatesLoading(true)
    warehousesApi
      .listWarehouseClaimCandidates({
        city: row.city,
        district: row.district,
        contractType: 'SHARED_STORAGE',
        suggestedZoneType: row.suggestedZoneType,
      })
      .then((res) => {
        if (!cancelled) setClaimCandidates(res.items)
      })
      .catch(() => {
        if (!cancelled) setClaimCandidates([])
      })
      .finally(() => {
        if (!cancelled) setClaimCandidatesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [contractType, row.city, row.district, row.suggestedZoneType])

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
        startDate: contractStart || undefined,
        endDate: contractEnd || undefined,
      })
    },
    [row.rentalRequestId, row.contractType, contractType, contractStart, contractEnd]
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
    const zoneIdsForPrice =
      contractType === 'SHARED_STORAGE'
        ? []
        : storagePlan.needsZone
          ? selectedZoneIds
          : []
    fetchContractPriceEstimate(loadWh, zoneIdsForPrice)
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
    contractType,
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
    } else if (storagePlan.storageLevel === 'BIN') {
      const targetBinId = storagePanelRef.current?.buildReservations()[0]?.binId
      if (targetBinId && !items.some((r) => r.binId === targetBinId)) return false
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
        if (contractType === 'SHARED_STORAGE' && !canApproveSharedStorage) {
          setError(
            'Kho không phù hợp SHARED_STORAGE — đang thuê nguyên kho hoặc hết diện tích tạo zone chung'
          )
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
        const existingStart = rentalRequestDateOnly(existing.startDate)
        const existingEnd = rentalRequestDateOnly(existing.endDate)
        const datesOutOfSync =
          contractStart !== existingStart || contractEnd !== existingEnd
        if (!contractReadyForStorage(existing) || datesOutOfSync) {
          const updated = await contractsApi.updateContract(existing.contractId, {
            ...(!contractReadyForStorage(existing)
              ? { warehouseSignature: 'SIGNED_WH_ONBOARDING' }
              : {}),
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
      const panelErr = storagePanelRef.current?.validate() ?? null
      if (panelErr) {
        setError(panelErr)
        return
      }

      const wh = whId || resolveWarehouseId(row)
      const built = storagePanelRef.current?.buildReservations() ?? []

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

      for (const raw of built) {
        await createReservation({
          contractId,
          reservationType: raw.reservationType,
          storageLevel: raw.storageLevel,
          warehouseId: raw.warehouseId,
          zoneId: raw.zoneId,
          rackId: raw.rackId,
          rackLevelId: raw.rackLevelId,
          binId: raw.binId,
          reservedCapacity: raw.reservedCapacity,
          startDate: raw.startDate ?? contractStart,
          endDate: raw.endDate ?? contractEnd,
          status: 'ACTIVE',
        })
      }
      let contractAmount: number | undefined
      try {
        // SHARED_STORAGE tính theo thùng — không truyền zoneIds (tránh lỗi area zone).
        const zoneIdsForPrice =
          contractType === 'SHARED_STORAGE'
            ? []
            : storagePlan.needsZone
              ? selectedZoneIds
              : []
        if (contractType === 'SHARED_STORAGE' || !storagePlan.needsZone || zoneIdsForPrice.length > 0) {
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
                  {contractType === 'SHARED_STORAGE' && (
                    <SharedStorageReadinessPanel
                      loading={claimCandidatesLoading}
                      candidates={eligibleClaimCandidates}
                      operatorCandidate={operatorClaimCandidate}
                      operatorWarehouseId={isWhOperator ? operatorWhId : warehouseId || null}
                      district={row.district}
                      city={row.city}
                      suggestedZoneType={row.suggestedZoneType}
                    />
                  )}
                  {approvalCapacity && !isDedicatedSpaceRental(contractType) && (
                    <WarehouseApprovalCapacityCard
                      whName={whName}
                      capacity={approvalCapacity}
                      contractType={contractType}
                      snapshot={warehouseCapacitySnapshot}
                      sharedStorageCandidate={operatorClaimCandidate}
                    />
                  )}
                  {contractType === 'DEDICATED_ZONE' && zones.length > 0 && (
                    <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-300">
                        Pre-allocation preview (nháp trước hợp đồng)
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Chọn zone PRIVATE hoặc PREMIUM ngay ở bước duyệt để ước tính giá sát thực tế. Zone SHARED
                        không áp dụng cho thuê khu riêng.
                      </p>
                      {eligibleZones.length === 0 && (
                        <p className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-100">
                          Kho chưa có zone PRIVATE hoặc PREMIUM — tạo zone khu riêng trước khi duyệt.
                        </p>
                      )}
                      <div className="dark-scrollbar-inset mt-2 grid max-h-44 grid-cols-1 gap-2 overflow-y-auto rounded border border-white/10 p-2 pr-1">
                        {zones.map((z) => {
                          const checked = selectedZoneIds.includes(z.zoneId)
                          const typeEligible = isZoneEligibleForContract(contractType, z)
                          const lpnEligible = isZoneEligibleForLpnDemand(
                            z,
                            reservedCapacityNum,
                            contractType
                          )
                          const eligible = typeEligible && lpnEligible
                          const zoneLpn = estimateZoneLpnCapacity(z)
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
                                {!typeEligible && (
                                  <span className="mt-0.5 block text-[10px] text-slate-500">
                                    Không chọn — cần zone PRIVATE hoặc dedicated
                                  </span>
                                )}
                                {typeEligible && !lpnEligible && reservedCapacityNum != null && (
                                  <span className="mt-0.5 block text-[10px] text-amber-400/90">
                                    {zoneLpnShortfallMessage(zoneLpn, reservedCapacityNum)}
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
              {effectiveDates.shifted && effectiveDates.requestedStartDate && effectiveDates.requestedEndDate && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-100">
                  <p className="font-semibold text-amber-200">
                    Ngày bắt đầu dự kiến đã qua — thời hạn HĐ được điều chỉnh
                  </p>
                  <p className="mt-1.5 leading-relaxed">
                    Khách gửi:{' '}
                    <strong className="text-white">
                      {formatDisplayDate(effectiveDates.requestedStartDate)} →{' '}
                      {formatDisplayDate(effectiveDates.requestedEndDate)}
                    </strong>{' '}
                    ({effectiveDates.billingMonths} tháng). HĐ áp dụng:{' '}
                    <strong className="text-white">
                      {formatDisplayDate(contractStart)} → {formatDisplayDate(contractEnd)}
                    </strong>{' '}
                    — giữ nguyên {effectiveDates.billingMonths} tháng thuê.
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Thời hạn HĐ:{' '}
                <strong className="text-slate-300">
                  {contractStart ? formatDisplayDate(contractStart) : '—'} →{' '}
                  {contractEnd ? formatDisplayDate(contractEnd) : '—'}
                </strong>
                {effectiveDates.shifted ? ' (đã điều chỉnh)' : ' (từ yêu cầu khách)'}.{' '}
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
                  <AllocationPricePreview
                    loading={allocationPriceLoading}
                    estimate={allocationPriceEstimate}
                    needsZone={storagePlan.needsZone}
                    hasZonesSelected={selectedZoneIds.length > 0}
                  />
                  {whId && (
                    <ContractStorageAssignmentPanel
                      ref={storagePanelRef}
                      contractType={contractType}
                      warehouseId={whId}
                      startDate={contractStart}
                      endDate={contractEnd}
                      reservedCapacityDefault={reservedCapacity}
                    />
                  )}
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
                  disabled={busy || claimedByOther || !canApproveSharedStorage}
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

function formatAreaM2Int(value: number | string | null | undefined): string {
  if (value == null || value === '') return '—'
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('vi-VN')
}

function areaM2ToInputValue(value: number | string | null | undefined): string {
  if (value == null || value === '') return ''
  const n = Math.round(Number(value))
  return Number.isFinite(n) ? String(n) : ''
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
          step={readOnly ? '1' : '0.01'}
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
  const dedicatedTag =
    z.isDedicated && (z.zoneType ?? '').toUpperCase() !== 'PRIVATE' ? ' · dedicated' : ''
  return `${z.zoneCode}${z.zoneName ? ` — ${z.zoneName}` : ''} (${z.zoneType}${dedicatedTag}${za > 0 ? ` · ${za} m²` : ''} · ${formatZoneRackSummary(z)}${lpn > 0 ? ` · ~${lpn} thùng` : ''})`
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

function readinessBadgeClass(readiness: WarehouseClaimCandidate['readiness']) {
  switch (readiness) {
    case 'READY':
      return 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
    case 'CAN_PROVISION':
      return 'border-amber-400/40 bg-amber-400/15 text-amber-200'
    default:
      return 'border-red-400/40 bg-red-400/15 text-red-200'
  }
}

function SharedStorageReadinessPanel({
  loading,
  candidates,
  operatorCandidate,
  operatorWarehouseId,
  district,
  city,
  suggestedZoneType,
}: {
  loading: boolean
  candidates: WarehouseClaimCandidate[]
  operatorCandidate: WarehouseClaimCandidate | null
  operatorWarehouseId: string | null
  district: string
  city: string
  suggestedZoneType?: string | null
}) {
  return (
    <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-300">
        Gợi ý kho SHARED_STORAGE — {district}, {city}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Zone SHARED sẽ được chọn hoặc tạo ở <strong className="text-slate-300">bước 3</strong>.
        Ở bước này chỉ xác nhận kho đủ điều kiện nhận yêu cầu.
        {suggestedZoneType && (
          <>
            {' '}
            Khách gợi ý zone <strong className="text-cyan-200">{suggestedZoneType}</strong>.
          </>
        )}
      </p>

      {operatorCandidate && (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-xs text-slate-300">
            Kho của bạn: <strong className="text-white">{operatorCandidate.warehouseName}</strong>
          </p>
          <span
            className={`mt-1.5 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${readinessBadgeClass(operatorCandidate.readiness)}`}
          >
            {readinessLabel(operatorCandidate.readiness)}
          </span>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {operatorCandidate.sharedZoneCount > 0 ? (
              <>
                {operatorCandidate.sharedZoneCount} zone pool · ~
                {fmtM2(operatorCandidate.sharedZoneAreaM2)} m²
              </>
            ) : operatorCandidate.remainingZoneAreaM2 != null &&
              operatorCandidate.remainingZoneAreaM2 > 0 ? (
              <>Chưa có zone pool · còn ~{fmtM2(operatorCandidate.remainingZoneAreaM2)} m² để tạo zone</>
            ) : (
              <>Không còn diện tích hoặc kho đang thuê nguyên</>
            )}
          </p>
          {operatorCandidate.readiness === 'BLOCKED' && (
            <p className="mt-1 text-[11px] text-red-200/90">
              Không thể duyệt SHARED_STORAGE cho kho này.
            </p>
          )}
        </div>
      )}

      {loading ? (
        <p className="mt-3 text-xs text-slate-500">Đang kiểm tra kho trong khu vực...</p>
      ) : candidates.length === 0 ? (
        <p className="mt-3 text-xs text-amber-200/90">
          Không có kho phù hợp SHARED_STORAGE tại {district}, {city}.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {candidates.map((c) => {
            const isOperator = c.warehouseId === operatorWarehouseId
            return (
              <li
                key={c.warehouseId}
                className={`flex flex-col gap-1 rounded border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between ${
                  isOperator
                    ? 'border-cyan-400/35 bg-cyan-400/10 text-cyan-100'
                    : 'border-white/10 bg-white/[0.02] text-slate-300'
                }`}
              >
                <div>
                  <span className="font-medium text-white">
                    {c.warehouseName}
                    {isOperator && (
                      <span className="ml-2 text-[10px] font-normal text-cyan-300">(kho bạn)</span>
                    )}
                  </span>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {c.sharedZoneCount > 0
                      ? `${c.sharedZoneCount} zone pool · ~${fmtM2(c.sharedZoneAreaM2)} m²`
                      : `Chưa có zone · còn ~${fmtM2(c.remainingZoneAreaM2)} m²`}
                    {c.matchingSuggestedZoneType && (
                      <span className="ml-1 text-cyan-300">· khớp loại zone khách</span>
                    )}
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${readinessBadgeClass(c.readiness)}`}
                >
                  {readinessLabel(c.readiness)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function WarehouseApprovalCapacityCard({
  whName,
  capacity,
  contractType,
  snapshot,
  sharedStorageCandidate,
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
  sharedStorageCandidate?: WarehouseClaimCandidate | null
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
      {contractType === 'SHARED_STORAGE' && sharedStorageCandidate && (
        <p className="mt-1 text-[11px] text-cyan-200/90">
          Zone pool SHARED:{' '}
          <strong className="text-cyan-100">{sharedStorageCandidate.sharedZoneCount}</strong> zone
          {sharedStorageCandidate.sharedZoneAreaM2 > 0
            ? ` (~${fmtM2(sharedStorageCandidate.sharedZoneAreaM2)} m²)`
            : ''}
          {sharedStorageCandidate.remainingZoneAreaM2 != null &&
          sharedStorageCandidate.remainingZoneAreaM2 > 0 ? (
            <> · còn ~{fmtM2(sharedStorageCandidate.remainingZoneAreaM2)} m² để tạo zone mới</>
          ) : null}
        </p>
      )}
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
              {snapshot.diagnostics?.binsBelowStandardVolume} bin đang dùng volume &lt; 16 (chỉ ~1 EXTRA/bin).
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
  const boxLines = estimate.breakdown.filter((b) => b.label?.startsWith('Thùng '))
  if (boxLines.length > 0) {
    return boxLines.map((b) => b.detail.replace(/ VND/g, ' ₫')).join(' + ')
  }
  const zoneLines = estimate.breakdown.filter((b) => b.label && b.label !== 'Thuê zone đã chọn')
  if (zoneLines.length > 0) {
    return zoneLines.map((b) => b.detail.replace(/ VND/g, ' ₫')).join(' + ')
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
          {row.estimatedSkuCount != null && (
            <p>Tổng cái (peak): {row.estimatedSkuCount.toLocaleString('vi-VN')}</p>
          )}
          {row.estimatedInboundPerWeek != null && (
            <p>Nhập/tuần: {row.estimatedInboundPerWeek}</p>
          )}
          {row.estimatedOutboundPerWeek != null && (
            <p>Xuất/tuần: {row.estimatedOutboundPerWeek}</p>
          )}
          {row.requestedAreaM2 != null && (
            <p>Diện tích: {formatAreaM2Int(row.requestedAreaM2)} m²</p>
          )}
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
