import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { InboundApprovalPanel } from '../../components/inbound/InboundApprovalPanel'
import { InboundStatusBadge } from '../../components/inbound/InboundStatusBadge'
import { PutawayBinPicker } from '../../components/inbound/PutawayBinPicker'
import { AiPutawayPanel } from '../../components/ai/AiPutawayPanel'
import { InboundLpnReceivingSection } from '../../components/inbound/InboundLpnReceivingSection'
import { TenantInboundWorkflow } from '../../components/inbound/TenantInboundWorkflow'
import { OperationalInvoicePayPanel } from '../../components/billing/OperationalInvoicePayPanel'
import {
  InboundDeliveryForm,
  emptyDeliveryForm,
  type DeliveryFormState,
} from '../../components/inbound/InboundDeliveryForm'
import {
  InboundPickupForm,
  emptyPickupForm,
  type PickupFormState,
} from '../../components/inbound/InboundPickupForm'
import { InboundTransportRoutePanel } from '../../components/inbound/InboundTransportRoutePanel'
import { generateLpnCode } from '../../utils/codeGenerators'
import * as deliveryApi from '../../api/inboundDeliveries'
import { DELIVERY_MODE_OPTIONS, type DeliveryMode } from '../../data/deliveryMode'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as inboundApi from '../../api/inboundRequests'
import type {
  ApiInboundApprovalReadiness,
  ApiInboundRequestItem,
  ApiInboundRequestWithItems,
  InboundStatus,
} from '../../api/inboundRequests'
import * as batchesApi from '../../api/batches'
import type { ApiBatch } from '../../api/batches'
import * as lpnsApi from '../../api/lpns'
import type { ApiLpn, ApiLpnDetail, BoxType } from '../../api/lpns'
import { BOX_TYPE_OPTIONS, filterBoxTypeOptionsForMax } from '../../data/inboundStatus'
import { pickLargestBoxTypeForZoneTypes } from '../../data/binCapacityDefaults'
import { formatDate } from '../../mappers'
import * as usersApi from '../../api/users'
import * as warehousesApi from '../../api/warehouses'
import type { ApiUser, ApiWarehouse } from '../../api/types'
import { fillDeliveryFromTransporterProfile } from '../../utils/transporterProfile'
import {
  fetchProductKindCatalogTree,
  fetchSizeFactors,
  type ApiProductKind,
  type ApiSizeFactor,
} from '../../api/productCatalog'
import {
  buildProductKindMap,
  computePiecesPerLpnForSku,
} from '../../utils/volumeUnits'
import * as contractsApi from '../../api/contracts'
import type { ApiContractInboundCommitment } from '../../api/contracts'

type Mode = 'tenant' | 'warehouse' | 'transporter'

type Props = {
  mode: Mode
  basePath: string
}

export function InboundDetailPage({ mode, basePath }: Props) {
  const { inboundRequestId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''
  const isWhAdmin = user?.role === 'WH_ADMIN' || user?.role === 'SYSTEM_ADMIN'
  const isTransporter = mode === 'transporter'
  const isWarehouse = mode === 'warehouse'
  const isTenantAdmin = user?.role === 'TENANT_ADMIN'

  const [inbound, setInbound] = useState<ApiInboundRequestWithItems | null>(null)
  const [batches, setBatches] = useState<ApiBatch[]>([])
  const [lpns, setLpns] = useState<ApiLpn[]>([])
  const [lpnDetails, setLpnDetails] = useState<ApiLpnDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [batchCode, setBatchCode] = useState('')
  const [lpnCode, setLpnCode] = useState('')
  const [boxType, setBoxType] = useState<BoxType>('MEDIUM')
  const [boxTypeTouched, setBoxTypeTouched] = useState(false)
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [selectedLpnId, setSelectedLpnId] = useState('')
  const [detailSkuId, setDetailSkuId] = useState('')
  const [detailQty, setDetailQty] = useState(1)
  const [putawayBinId, setPutawayBinId] = useState('')
  const [aiRecommendationId, setAiRecommendationId] = useState<string | undefined>()

  const [receivedDraft, setReceivedDraft] = useState<Record<string, number>>({})
  const [receivingDirty, setReceivingDirty] = useState(false)
  const [receivingEditing, setReceivingEditing] = useState(true)
  const [receivingCommitted, setReceivingCommitted] = useState(false)

  const [readiness, setReadiness] = useState<ApiInboundApprovalReadiness | null>(null)
  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormState>(emptyDeliveryForm())
  const [pickupForm, setPickupForm] = useState<PickupFormState>(emptyPickupForm())
  const [deliveryDirty, setDeliveryDirty] = useState(false)
  const [pickupDirty, setPickupDirty] = useState(false)
  const [deliveryEditing, setDeliveryEditing] = useState(true)
  const [warehouse, setWarehouse] = useState<ApiWarehouse | null>(null)
  const [assignedDriverUserId, setAssignedDriverUserId] = useState('')
  const [transporters, setTransporters] = useState<ApiUser[]>([])
  const [busyTransporterTrips, setBusyTransporterTrips] = useState<Record<string, string>>({})
  const [productCatalogByKind, setProductCatalogByKind] = useState<Map<string, ApiProductKind>>(
    () => new Map()
  )
  const [sizeFactors, setSizeFactors] = useState<ApiSizeFactor[]>([])
  const [commitment, setCommitment] = useState<ApiContractInboundCommitment | null>(null)
  const [commitmentLoading, setCommitmentLoading] = useState(false)

  const [alert, setAlert] = useState<{
    open: boolean
    message: string
    title?: string
    type?: 'success' | 'error' | 'confirm'
    onConfirm?: () => void
  }>({
    open: false,
    message: '',
  })

  const load = useCallback(async () => {
    if (!inboundRequestId) return
    setLoading(true)
    setError('')
    try {
      const data = await inboundApi.getInboundRequest(inboundRequestId, {
        includeItems: true,
        includeDelivery: true,
      })
      setInbound(data)

      const d = data.delivery
      setDeliveryForm({
        vehiclePlate: d?.vehiclePlate ?? '',
        driverName: d?.driverName ?? '',
        driverPhone: d?.driverPhone ?? '',
        driverIdNumber: d?.driverIdNumber ?? '',
        carrierName: d?.carrierName ?? '',
        notes: d?.notes ?? '',
      })
      setPickupForm({
        pickupAddress: d?.pickupAddress ?? '',
        pickupCity: d?.pickupCity ?? '',
        pickupDistrict: d?.pickupDistrict ?? '',
        pickupContactName: d?.pickupContactName ?? '',
        pickupContactPhone: d?.pickupContactPhone ?? '',
        pickupNotes: d?.pickupNotes ?? '',
      })
      setAssignedDriverUserId(d?.assignedDriverUserId ?? '')
      setDeliveryDirty(false)
      setPickupDirty(false)
      const hasSavedDispatch = Boolean(d?.assignedDriverUserId || d?.vehiclePlate?.trim())
      setDeliveryEditing(!hasSavedDispatch)

      if (data.deliveryMode === 'WAREHOUSE_TRANSPORT' && data.warehouseId) {
        warehousesApi
          .getWarehouse(data.warehouseId)
          .then(setWarehouse)
          .catch(() => setWarehouse(null))
      } else {
        setWarehouse(null)
      }

      const draft: Record<string, number> = {}
      for (const item of data.items ?? []) {
        draft[item.inboundRequestItemId] = item.receivedQuantity ?? 0
      }
      setReceivedDraft(draft)
      const itemList = data.items ?? []
      const hasSavedReceiving =
        data.status === 'RECEIVING' &&
        itemList.length > 0 &&
        itemList.some((item) => (item.receivedQuantity ?? 0) > 0)
      setReceivingDirty(false)
      setReceivingEditing(!hasSavedReceiving)
      setReceivingCommitted(hasSavedReceiving)

      if (!isTransporter) {
        const batchRes = await batchesApi.listBatches({ inboundRequestId, limit: 50 })
        setBatches(batchRes.items)
        if (batchRes.items.length > 0 && !selectedBatchId) {
          setSelectedBatchId(batchRes.items[0].batchId)
        }

        if (batchRes.items.length > 0) {
          const lpnLists = await Promise.all(
            batchRes.items.map((b) => lpnsApi.listLpns({ batchId: b.batchId, limit: 100 }))
          )
          const allLpns = lpnLists.flatMap((r) => r.items)
          setLpns(allLpns)
          if (allLpns.length > 0) {
            const withDetails = await Promise.all(
              allLpns.map((l) => lpnsApi.getLpnWithDetails(l.lpnId))
            )
            setLpnDetails(withDetails.flatMap((w) => w.details ?? []))
          } else {
            setLpnDetails([])
          }
        } else {
          setLpns([])
          setLpnDetails([])
        }
      }

      if (
        isWarehouse &&
        ['PENDING', 'APPROVED', 'ARRIVED', 'RECEIVING'].includes(data.status)
      ) {
        const r = await inboundApi.getApprovalReadiness(inboundRequestId)
        setReadiness(r)
      } else {
        setReadiness(null)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải chi tiết')
    } finally {
      setLoading(false)
    }
  }, [inboundRequestId, isWarehouse, isTransporter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!inbound?.contractId) {
      setCommitment(null)
      return
    }
    let cancelled = false
    setCommitmentLoading(true)
    contractsApi
      .getContractInboundCommitment(inbound.contractId)
      .then((data) => {
        if (!cancelled) setCommitment(data)
      })
      .catch(() => {
        if (!cancelled) setCommitment(null)
      })
      .finally(() => {
        if (!cancelled) setCommitmentLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [inbound?.contractId])

  useEffect(() => {
    if (
      !isWarehouse ||
      !isWhAdmin
    ) {
      return
    }
    let cancelled = false
    Promise.all([
      usersApi.listUsers({ role: 'WH_TRANSPORTER', status: 'ACTIVE', limit: 100 }),
      inboundApi.listInboundRequests({
        status: 'PENDING',
        deliveryMode: 'WAREHOUSE_TRANSPORT',
        includeDelivery: true,
        limit: 100,
      }),
      inboundApi.listInboundRequests({
        status: 'APPROVED',
        deliveryMode: 'WAREHOUSE_TRANSPORT',
        includeDelivery: true,
        limit: 100,
      }),
      inboundApi.listInboundRequests({
        status: 'IN_TRANSIT',
        deliveryMode: 'WAREHOUSE_TRANSPORT',
        includeDelivery: true,
        limit: 100,
      }),
    ])
      .then(([usersRes, pendingRes, approvedRes, inTransitRes]) => {
        if (cancelled) return
        setTransporters(usersRes.items)
        const busy: Record<string, string> = {}
        for (const row of [...pendingRes.items, ...approvedRes.items, ...inTransitRes.items]) {
          if (row.inboundRequestId === inboundRequestId) continue
          const driverId = row.delivery?.assignedDriverUserId
          if (driverId && !busy[driverId]) {
            busy[driverId] = row.inboundCode
          }
        }
        setBusyTransporterTrips(busy)
      })
      .catch(() => {
        if (!cancelled) {
          setTransporters([])
          setBusyTransporterTrips({})
        }
      })
    return () => {
      cancelled = true
    }
  }, [isWarehouse, isWhAdmin, inboundRequestId])

  useEffect(() => {
    if (!isWarehouse || isTransporter) return
    let cancelled = false
    Promise.all([fetchProductKindCatalogTree(), fetchSizeFactors()])
      .then(([tree, factors]) => {
        if (cancelled) return
        setProductCatalogByKind(buildProductKindMap(tree.productKinds))
        setSizeFactors(factors)
      })
      .catch(() => {
        if (!cancelled) {
          setProductCatalogByKind(new Map())
          setSizeFactors([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [isWarehouse, isTransporter])

  useEffect(() => {
    if (!readiness || boxTypeTouched) return
    const zoneTypes = readiness.boxTypeSuggestion?.contractZoneTypes
    const maxBoxType = pickLargestBoxTypeForZoneTypes(zoneTypes)
    const allowed = filterBoxTypeOptionsForMax(maxBoxType)
    const recommended = readiness.boxTypeSuggestion?.recommendedBoxType as BoxType
    const next = allowed.some((o) => o.value === recommended)
      ? recommended
      : (allowed[allowed.length - 1]?.value as BoxType | undefined)
    if (next) setBoxType(next)
  }, [readiness, boxTypeTouched])

  const runAction = async (fn: () => Promise<unknown>, successMsg?: string) => {
    setBusy(true)
    try {
      await fn()
      if (successMsg) setAlert({ open: true, type: 'success', message: successMsg })
      await load()
    } catch (err) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Có lỗi xảy ra',
        message: err instanceof ApiError ? err.message : 'Thao tác thất bại',
      })
    } finally {
      setBusy(false)
    }
  }

  const patchStatus = (
    status: InboundStatus,
    extra?: {
      actualArrivalAt?: string
      approvedBy?: string | null
    }
  ) =>
    runAction(async () => {
      await inboundApi.updateInboundRequest(inboundRequestId, {
        status,
        actualArrivalAt: extra?.actualArrivalAt,
        approvedBy:
          extra?.approvedBy !== undefined
            ? extra.approvedBy
            : status === 'APPROVED'
              ? user?.userId
              : undefined,
        receivedBy:
          status === 'ARRIVED' || status === 'RECEIVING' ? user?.userId : undefined,
      })
    }, `Cập nhật trạng thái: ${status}`)

  const confirmApprove = () => {
    const warn = readiness && !readiness.sufficient
    const willAssign = Boolean(canAssignTransporter && assignedDriverUserId.trim())
    setAlert({
      open: true,
      type: 'confirm',
      title: warn ? 'Duyệt dù thiếu chỗ?' : 'Duyệt inbound?',
      message: warn
        ? `Ước tính thiếu slot LPN hoặc volume. Bạn vẫn muốn duyệt yêu cầu ${inbound?.inboundCode}?`
        : willAssign
          ? `Xác nhận duyệt ${inbound?.inboundCode} và gán tài xế? Thông tin xe sẽ được điền từ hồ sơ tài xế.`
          : `Xác nhận duyệt ${inbound?.inboundCode}?`,
      onConfirm: () =>
        runAction(async () => {
          if (willAssign) {
            await persistDelivery()
          }
          await inboundApi.updateInboundRequest(inboundRequestId, {
            status: 'APPROVED',
            approvedBy: user?.userId,
          })
        }, 'Đã duyệt inbound'),
    })
  }

  const isWarehouseTransport =
    inbound?.deliveryMode === 'WAREHOUSE_TRANSPORT'

  const isTenant = mode === 'tenant'
  const tenantDeliveryLocked = isTenant && isWarehouseTransport

  const canEditDelivery = isTransporter
    ? inbound && inbound.status === 'APPROVED'
    : isWarehouse
      ? inbound && ['PENDING', 'APPROVED', 'IN_TRANSIT', 'ARRIVED'].includes(inbound.status)
      : inbound &&
        ['DRAFT', 'PENDING', 'APPROVED'].includes(inbound.status) &&
        !tenantDeliveryLocked

  const canAssignTransporter =
    isWhAdmin &&
    isWarehouse &&
    isWarehouseTransport &&
    inbound &&
    ['PENDING', 'APPROVED', 'ARRIVED'].includes(inbound.status)

  const hasSavedDispatch = Boolean(
    inbound?.delivery?.assignedDriverUserId || inbound?.delivery?.vehiclePlate?.trim()
  )
  const deliveryFieldsLocked = hasSavedDispatch && !deliveryEditing

  const startDeliveryEdit = () => {
    setDeliveryEditing(true)
    setDeliveryDirty(true)
  }

  const persistDelivery = async () => {
    const plate = deliveryForm.vehiclePlate?.trim() ?? ''
    const assignId = assignedDriverUserId.trim() || undefined
    if (!isTransporter && !plate && !assignId) {
      throw new ApiError('Nhập biển số xe hoặc chọn tài xế', 400)
    }
    if (isTransporter && !plate) {
      throw new ApiError('Nhập biển số xe trước khi lưu', 400)
    }
    await deliveryApi.upsertInboundDelivery(inboundRequestId, {
      vehiclePlate: plate || undefined,
      driverName: deliveryForm.driverName?.trim() || undefined,
      driverPhone: deliveryForm.driverPhone?.trim() || undefined,
      driverIdNumber: deliveryForm.driverIdNumber?.trim() || undefined,
      carrierName: deliveryForm.carrierName?.trim() || undefined,
      notes: deliveryForm.notes?.trim() || undefined,
      assignedDriverUserId: canAssignTransporter ? assignId ?? null : undefined,
    })
    setDeliveryDirty(false)
  }

  const saveDelivery = () => runAction(() => persistDelivery(), 'Đã lưu thông tin vận chuyển')

  const persistPickup = async () => {
    const city = warehouse?.city?.trim() ?? pickupForm.pickupCity.trim()
    const district = warehouse?.district?.trim() ?? pickupForm.pickupDistrict.trim()
    if (!pickupForm.pickupAddress.trim()) {
      throw new ApiError('Nhập địa chỉ lấy hàng', 400)
    }
    if (!city || !district) {
      throw new ApiError('Kho chưa có thông tin thành phố/quận — liên hệ WH Admin', 400)
    }
    if (!pickupForm.pickupContactName.trim() || !pickupForm.pickupContactPhone.trim()) {
      throw new ApiError('Nhập người liên hệ và SĐT tại điểm lấy', 400)
    }
    await deliveryApi.upsertInboundDelivery(inboundRequestId, {
      pickupAddress: pickupForm.pickupAddress.trim(),
      pickupCity: city,
      pickupDistrict: district,
      pickupContactName: pickupForm.pickupContactName.trim(),
      pickupContactPhone: pickupForm.pickupContactPhone.trim(),
      pickupNotes: pickupForm.pickupNotes?.trim() || undefined,
    })
    setPickupDirty(false)
  }

  const savePickup = () => runAction(() => persistPickup(), 'Đã lưu điểm lấy hàng')

  const canEditPickup =
    mode === 'tenant' &&
    isWarehouseTransport &&
    inbound &&
    ['PENDING', 'APPROVED'].includes(inbound.status)

  const reportPickup = () =>
    runAction(async () => {
      await inboundApi.reportInboundPickup(inboundRequestId)
    }, 'Đã báo lấy hàng tại tenant')

  const reportArrival = () =>
    runAction(async () => {
      await inboundApi.reportInboundArrival(inboundRequestId)
    }, 'Đã báo xe đến kho')

  const confirmWarehouseCancel = () => {
    setAlert({
      open: true,
      type: 'confirm',
      title: 'Hủy yêu cầu inbound?',
      message: readiness?.batchCount
        ? 'Đã có batch nhận hàng — không thể hủy.'
        : `Chuyển ${inbound?.inboundCode} sang CANCELLED.`,
      onConfirm: readiness?.batchCount
        ? undefined
        : () => patchStatus('CANCELLED'),
    })
  }

  const items = inbound?.items ?? []
  const commitmentApplies = Boolean(
    commitment?.applies && (commitment?.productLines?.length ?? 0) > 0
  )

  const skuCommitmentKey = (sku?: ApiInboundRequestItem['sku']) => {
    const kind = String(sku?.productKind ?? '').trim()
    const size = String(sku?.size ?? '').trim().toUpperCase()
    return `${kind}|${size}`
  }

  const storedCommitmentWarnings =
    inbound?.commitmentWarningJson?.warnings ??
    (inbound as { commitmentWarnings?: contractsApi.ApiCommitmentWarning[] } | null)
      ?.commitmentWarnings ??
    []

  const receivingOveragePreview = useMemo(() => {
    if (!commitmentApplies || inbound?.status !== 'RECEIVING') return []
    const previews: string[] = []
    for (const line of commitment?.productLines ?? []) {
      if (line.uncommitted) continue
      let inflightToRemove = 0
      let receivedToAdd = 0
      for (const item of items) {
        if (skuCommitmentKey(item.sku) !== line.key) continue
        const saved = item.receivedQuantity ?? 0
        const draft = receivedDraft[item.inboundRequestItemId] ?? saved
        inflightToRemove += Math.max(0, item.expectedQuantity - saved)
        receivedToAdd += draft
      }
      const projectedUsed = line.usedPieces - inflightToRemove + receivedToAdd
      const overage = Math.max(0, projectedUsed - line.effectiveCommittedPieces)
      if (overage > 0) {
        previews.push(
          `Sau khi nhập kho, ${line.productKind}${line.size ? ` size ${line.size}` : ''} có thể vượt cam kết ${overage} cái (hiệu lực ${line.effectiveCommittedPieces}).`
        )
      }
    }
    return previews
  }, [commitment, commitmentApplies, inbound?.status, items, receivedDraft])

  const closableCommitmentLines = useMemo(
    () =>
      (commitment?.productLines ?? []).filter(
        (line) => !line.uncommitted && line.canCloseLine
      ),
    [commitment]
  )

  const handleCloseCommitmentLine = (
    line: contractsApi.ApiContractInboundCommitmentLine
  ) =>
    runAction(async () => {
      if (!inbound?.contractId || !line.productKind) return
      await contractsApi.closeInboundCommitmentLine(inbound.contractId, {
        productKind: line.productKind,
        size: line.size,
      })
    }, `Đã đóng ${line.remainingPieces} cái còn lại trên cam kết`)

  const getSkuPackInfo = useCallback(
    (skuId: string, bt: BoxType = boxType) => {
      const item = items.find((i) => i.skuId === skuId)
      return computePiecesPerLpnForSku(
        bt,
        item?.sku?.productKind,
        item?.sku?.size,
        productCatalogByKind,
        sizeFactors
      )
    },
    [items, boxType, productCatalogByKind, sizeFactors]
  )

  const getTargetQtyForItem = (item: ApiInboundRequestItem) =>
    receivedDraft[item.inboundRequestItemId] ?? item.receivedQuantity ?? 0

  const allocatedForSku = (skuId: string) =>
    lpnDetails
      .filter((d) => d.skuId === skuId)
      .reduce((sum, d) => sum + Number(d.quantity ?? 0), 0)

  const remainingForSku = (skuId: string) => {
    const item = items.find((i) => i.skuId === skuId)
    if (!item) return 0
    return Math.max(0, getTargetQtyForItem(item) - allocatedForSku(skuId))
  }

  const nextLpnCode = () =>
    generateLpnCode(inbound?.inboundCode, lpns.length, boxType)

  const createLpnWithSkuQty = async (
    qty: number,
    code?: string,
    knownRemaining?: number
  ) => {
    if (!inbound || !selectedBatchId || !detailSkuId || qty < 1) {
      throw new ApiError('Chọn batch, SKU và số lượng hợp lệ', 400)
    }
    const rem = knownRemaining ?? remainingForSku(detailSkuId)
    if (rem <= 0) throw new ApiError('SKU đã đủ số lượng trong các LPN', 400)
    const actualQty = Math.min(qty, rem)
    const vol = BOX_TYPE_OPTIONS.find((b) => b.value === boxType)?.volumeUnits ?? 2
    const lpn = await lpnsApi.createLpn({
      tenantId: inbound.tenantId,
      batchId: selectedBatchId,
      lpnCode: (code ?? lpnCode).trim() || nextLpnCode(),
      boxType,
      volumeUnits: vol,
      status: 'RECEIVING',
    })
    await lpnsApi.createLpnDetail({
      lpnId: lpn.lpnId,
      skuId: detailSkuId,
      quantity: actualQty,
    })
    setLpnCode('')
    return actualQty
  }

  const handleCreateBatch = () =>
    runAction(async () => {
      if (!batchCode.trim()) throw new ApiError('Nhập mã batch', 400)
      await batchesApi.createBatch({
        inboundRequestId,
        batchCode: batchCode.trim(),
      })
      setBatchCode('')
    }, 'Đã tạo batch')

  const handleCreateNextLpn = () =>
    runAction(async () => {
      const qty = Math.min(getSkuPackInfo(detailSkuId).pieces, remainingForSku(detailSkuId))
      await createLpnWithSkuQty(qty)
    }, 'Đã tạo LPN và gán SKU')

  const handleFillSkuLpns = () =>
    runAction(async () => {
      if (!detailSkuId) throw new ApiError('Chọn SKU', 400)
      let created = 0
      let rem = remainingForSku(detailSkuId)
      const perLpn = getSkuPackInfo(detailSkuId).pieces
      const base = inbound?.inboundCode?.replace(/[^a-zA-Z0-9-]/g, '') ?? 'IN'
      let seq = lpns.length
      while (rem > 0 && created < 200) {
        seq += 1
        const qty = Math.min(perLpn, rem)
        const code = `${base}-LPN-${String(seq).padStart(3, '0')}`
        await createLpnWithSkuQty(qty, code, rem)
        rem -= qty
        created += 1
      }
      if (created === 0) throw new ApiError('SKU đã đủ hoặc chưa chọn batch', 400)
    }, 'Đã tạo đủ LPN cho SKU')

  const handleAddLpnDetail = () =>
    runAction(async () => {
      if (!selectedLpnId || !detailSkuId || detailQty < 1) {
        throw new ApiError('Chọn LPN, SKU và số lượng', 400)
      }
      const rem = remainingForSku(detailSkuId)
      if (detailQty > rem) {
        throw new ApiError(`Chỉ còn ${rem} cái cần gán cho SKU này`, 400)
      }
      await lpnsApi.createLpnDetail({
        lpnId: selectedLpnId,
        skuId: detailSkuId,
        quantity: detailQty,
      })
    }, 'Đã thêm SKU vào LPN')

  const pendingPutawayCount = useMemo(
    () => lpns.filter((l) => l.status === 'RECEIVING').length,
    [lpns]
  )

  const putawayBoxType = useMemo((): BoxType => {
    const selected = lpns.find((l) => l.lpnId === selectedLpnId)
    return selected?.boxType ?? boxType
  }, [lpns, selectedLpnId, boxType])

  const selectedLpnHasDetails = useMemo(
    () => Boolean(selectedLpnId && lpnDetails.some((d) => d.lpnId === selectedLpnId)),
    [selectedLpnId, lpnDetails]
  )

  const selectedLpnCode = useMemo(
    () => lpns.find((l) => l.lpnId === selectedLpnId)?.lpnCode,
    [lpns, selectedLpnId]
  )

  const handlePutaway = () =>
    runAction(async () => {
      if (!selectedLpnId || !putawayBinId.trim()) {
        throw new ApiError('Chọn LPN và bin putaway', 400)
      }
      await lpnsApi.putawayLpn(selectedLpnId, {
        binId: putawayBinId.trim(),
        recommendationId: aiRecommendationId,
        movedBy: user?.userId,
      })
      setPutawayBinId('')
      setAiRecommendationId(undefined)
    }, 'Putaway thành công')

  const handleCompleteReceiving = () =>
    runAction(async () => {
      const payload = items.map((item) => ({
        inboundRequestItemId: item.inboundRequestItemId,
        receivedQuantity: receivedDraft[item.inboundRequestItemId] ?? 0,
      }))
      await inboundApi.completeReceiving(inboundRequestId, { items: payload })
      setReceivingCommitted(true)
      setReceivingEditing(false)
      setReceivingDirty(false)
    }, 'Đã hoàn tất kiểm đếm')

  const startReceivingEdit = () => {
    setReceivingEditing(true)
    setReceivingDirty(true)
  }

  const receivingFieldsLocked = receivingCommitted && !receivingEditing
  const showCompleteReceivingBtn =
    inbound?.status === 'RECEIVING' && receivingEditing && (!receivingCommitted || receivingDirty)

  const handleCancel = () =>
    runAction(async () => {
      await inboundApi.updateInboundRequest(inboundRequestId, { status: 'CANCELLED' })
      navigate(basePath)
    })

  if (!inbound && !loading) {
    return (
      <div className="p-8 text-slate-400">
        Không tìm thấy yêu cầu.{' '}
        <button type="button" className="text-cyan-400" onClick={() => navigate(basePath)}>
          Quay lại
        </button>
      </div>
    )
  }

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading || busy} text="Đang xử lý..." />
      <main className="relative flex flex-1 flex-col overflow-y-auto bg-[#0b101a]">
        <div className="mx-auto w-full max-w-5xl p-8">
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="mb-4 text-sm text-cyan-400 hover:underline"
          >
            ← Danh sách
          </button>

          {error && (
            <InlineAlert
              className="mb-4"
              message={error}
              onDismiss={() => setError('')}
            />
          )}

          {inbound && (
            <>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-mono text-2xl font-bold text-cyan-300">{inbound.inboundCode}</h1>
                  <p className="mt-1 text-sm text-slate-400">
                    Dự kiến: {formatDate(inbound.expectedArrivalDate)} · Thực tế:{' '}
                    {formatDate(inbound.actualArrivalAt)}
                  </p>
                </div>
                <InboundStatusBadge status={inbound.status} />
              </div>

              {isWarehouse && readiness && ['PENDING', 'APPROVED', 'ARRIVED'].includes(inbound.status) && (
                <InboundApprovalPanel readiness={readiness} />
              )}

              {isWarehouse && user?.role === 'WH_STAFF' && inbound.status === 'PENDING' && (
                <div className="mb-4 rounded-lg border border-slate-500/30 bg-slate-500/10 px-4 py-3 text-sm text-slate-300">
                  Phiếu đang chờ WH Admin duyệt — nhân viên kho xử lý receiving sau khi{' '}
                  <strong>APPROVED → ARRIVED</strong>.
                </div>
              )}

              <section className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
                <h2 className="mb-2 font-semibold">Vận chuyển đến kho</h2>
                <p className="mb-3 text-xs text-slate-500">
                  {DELIVERY_MODE_OPTIONS.find((o) => o.value === inbound.deliveryMode)?.label ??
                    inbound.deliveryMode ??
                    '—'}
                  {inbound.status === 'APPROVED' && !inbound.delivery && isWarehouse && !isWarehouseTransport && (
                    <span className="ml-2 text-amber-300">
                      · Cần lưu biển số trước khi &quot;Xe đã đến&quot;
                    </span>
                  )}
                  {inbound.status === 'APPROVED' && isWarehouseTransport && isWarehouse && !isTransporter && (
                    <span className="ml-2 text-slate-400">
                      · Tài xế báo &quot;Đã lấy hàng&quot; rồi &quot;Xe đến kho&quot;
                    </span>
                  )}
                  {inbound.status === 'IN_TRANSIT' && isWarehouseTransport && isWarehouse && !isTransporter && (
                    <span className="ml-2 text-orange-300">
                      · Hàng đang về kho
                      {inbound.delivery?.actualPickupAt
                        ? ` (lấy lúc ${formatDate(inbound.delivery.actualPickupAt)})`
                        : ''}
                    </span>
                  )}
                </p>

                {isWarehouseTransport && (
                  <InboundTransportRoutePanel delivery={inbound.delivery} warehouse={warehouse} />
                )}

                {canEditPickup && (
                  <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="mb-2 text-sm font-medium text-emerald-200">Điểm lấy hàng của bạn</p>
                    <InboundPickupForm
                      value={pickupForm}
                      warehouseCity={warehouse?.city}
                      warehouseDistrict={warehouse?.district}
                      onChange={(next) => {
                        setPickupForm({
                          ...next,
                          pickupCity: warehouse?.city?.trim() ?? next.pickupCity,
                          pickupDistrict: warehouse?.district?.trim() ?? next.pickupDistrict,
                        })
                        setPickupDirty(true)
                      }}
                    />
                    {pickupDirty ? (
                      <button
                        type="button"
                        onClick={savePickup}
                        className="mt-3 rounded bg-emerald-600 px-3 py-1.5 text-sm hover:bg-emerald-500"
                      >
                        Lưu điểm lấy hàng
                      </button>
                    ) : inbound.delivery?.pickupAddress ? (
                      <p className="mt-3 text-xs text-emerald-300">✓ Đã lưu điểm lấy hàng</p>
                    ) : null}
                  </div>
                )}

                {canAssignTransporter && (
                  <div className="mb-3">
                    <label className="mb-1 block text-xs text-slate-500">Tài xế kho được gán</label>
                    <select
                      aria-label="Tài xế kho được gán"
                      value={assignedDriverUserId}
                      disabled={deliveryFieldsLocked}
                      onChange={(e) => {
                        const nextId = e.target.value
                        setAssignedDriverUserId(nextId)
                        const picked = transporters.find((t) => t.userId === nextId)
                        if (picked) {
                          setDeliveryForm((prev) =>
                            fillDeliveryFromTransporterProfile(picked, prev, { overwrite: true })
                          )
                        }
                        setDeliveryDirty(true)
                      }}
                      className="w-full max-w-md rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    >
                      <option value="">— Chưa gán —</option>
                      {transporters.map((t) => {
                        const busyCode = busyTransporterTrips[t.userId]
                        const isCurrentAssignee =
                          t.userId === inbound?.delivery?.assignedDriverUserId
                        const isBusyElsewhere = Boolean(busyCode && !isCurrentAssignee)
                        return (
                          <option
                            key={t.userId}
                            value={t.userId}
                            disabled={isBusyElsewhere}
                          >
                            {t.fullName}
                            {t.defaultVehiclePlate ? ` · ${t.defaultVehiclePlate}` : ''}
                            {isBusyElsewhere ? ` · đang có chuyến ${busyCode}` : ''} ({t.email})
                          </option>
                        )
                      })}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      Chọn tài xế để tự điền biển số, SĐT, CCCD từ hồ sơ — có thể gán ngay khi duyệt
                      inbound. Tài xế đang có chuyến PENDING/APPROVED/IN_TRANSIT khác sẽ bị vô hiệu trong danh
                      sách.
                    </p>
                    {transporters.length === 0 && (
                      <p className="mt-1 text-xs text-amber-300">
                        Chưa có tài khoản WH_TRANSPORTER — WH Admin tạo trong Quản lý tài khoản.
                      </p>
                    )}
                  </div>
                )}
                {tenantDeliveryLocked ? (
                  <>
                    <p className="mb-3 text-xs text-amber-200/90">
                      Bạn đã chọn <strong>vận chuyển do kho đi lấy</strong> — thông tin xe, tài xế và
                      ghi chú cổng sẽ do kho / tài xế cập nhật. Tenant không cần (và không thể) nhập
                      tại đây.
                    </p>
                    <InboundDeliveryForm
                      deliveryMode="WAREHOUSE_TRANSPORT"
                      value={deliveryForm}
                      onChange={() => {}}
                      disabled
                      compact
                    />
                  </>
                ) : canEditDelivery || canAssignTransporter ? (
                  <>
                    {(canEditDelivery || canAssignTransporter) && (
                      <InboundDeliveryForm
                        deliveryMode={(inbound.deliveryMode as DeliveryMode) ?? 'TENANT_SELF'}
                        value={deliveryForm}
                        onChange={(next) => {
                          setDeliveryForm(next)
                          setDeliveryDirty(true)
                        }}
                        disabled={!canEditDelivery || deliveryFieldsLocked}
                        compact
                      />
                    )}
                    {(canEditDelivery || (canAssignTransporter && assignedDriverUserId)) &&
                      (deliveryDirty ? (
                        <button
                          type="button"
                          onClick={saveDelivery}
                          className="mt-3 rounded bg-cyan-600 px-3 py-1.5 text-sm hover:bg-cyan-500"
                        >
                          {canAssignTransporter && !canEditDelivery
                            ? 'Lưu gán tài xế'
                            : isTransporter
                              ? 'Lưu thông tin xe'
                              : 'Lưu vận chuyển'}
                        </button>
                      ) : hasSavedDispatch && deliveryFieldsLocked ? (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300">
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            Đã lưu thông tin vận chuyển
                          </span>
                          {(canEditDelivery || canAssignTransporter) && (
                            <button
                              type="button"
                              onClick={startDeliveryEdit}
                              className="rounded-lg border border-cyan-500/40 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10"
                            >
                              Sửa lại
                            </button>
                          )}
                          {isTransporter && inbound.status === 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() =>
                                setAlert({
                                  open: true,
                                  type: 'confirm',
                                  title: 'Đã lấy hàng tại tenant?',
                                  message: `Xác nhận đã lấy hàng cho ${inbound.inboundCode} tại điểm lấy.`,
                                  onConfirm: reportPickup,
                                })
                              }
                              className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium hover:bg-orange-500"
                            >
                              Đã lấy hàng
                            </button>
                          )}
                          {isTransporter && inbound.status === 'IN_TRANSIT' && (
                            <button
                              type="button"
                              onClick={() =>
                                setAlert({
                                  open: true,
                                  type: 'confirm',
                                  title: 'Xe đã đến kho?',
                                  message: `Xác nhận ${inbound.inboundCode} đã tới cổng kho.`,
                                  onConfirm: reportArrival,
                                })
                              }
                              className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium hover:bg-violet-500"
                            >
                              Xe đã đến kho
                            </button>
                          )}
                        </div>
                      ) : null)}
                  </>
                ) : inbound.delivery ? (
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Biển số</dt>
                      <dd className="font-mono text-cyan-300">{inbound.delivery.vehiclePlate}</dd>
                    </div>
                    {inbound.delivery.driverName && (
                      <div>
                        <dt className="text-slate-500">Tài xế</dt>
                        <dd>{inbound.delivery.driverName}</dd>
                      </div>
                    )}
                    {inbound.delivery.driverPhone && (
                      <div>
                        <dt className="text-slate-500">SĐT</dt>
                        <dd>{inbound.delivery.driverPhone}</dd>
                      </div>
                    )}
                    {inbound.delivery.assignedDriverUserId && (
                      <div>
                        <dt className="text-slate-500">Tài xế (account)</dt>
                        <dd className="font-mono text-xs text-slate-300">
                          {transporters.find(
                            (t) => t.userId === inbound.delivery?.assignedDriverUserId
                          )?.fullName ?? inbound.delivery.assignedDriverUserId}
                        </dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="text-sm text-slate-500">Chưa có thông tin xe.</p>
                )}
              </section>

              {isTenant &&
                inbound &&
                ['DRAFT', 'PENDING'].includes(inbound.status) && (
                  <OperationalInvoicePayPanel
                    contractId={inbound.contractId}
                    title="Phí inbound — thanh toán trước khi kho duyệt"
                    hint="Bao gồm phí LPN theo loại thùng và phí vận chuyển kho (nếu có)."
                    loadInvoice={() =>
                      inboundApi.getInboundOperationalInvoice(inboundRequestId)
                    }
                    onPaid={() => void load()}
                  />
                )}

              {isTenant && inbound && tenantId && (
                <TenantInboundWorkflow
                  inbound={inbound}
                  tenantId={tenantId}
                  deliveryMode={(inbound.deliveryMode as DeliveryMode) ?? 'TENANT_SELF'}
                  busy={busy}
                  onReload={load}
                  onPatchStatus={(status, extra) => patchStatus(status, extra)}
                  onCancel={() =>
                    setAlert({
                      open: true,
                      type: 'confirm',
                      title: 'Hủy yêu cầu nhập?',
                      message: `Chuyển ${inbound.inboundCode} sang trạng thái Đã hủy.`,
                      onConfirm: () => void handleCancel(),
                    })
                  }
                  inventoryLink={`/staff/inventory?inboundRequestId=${inbound.inboundRequestId}`}
                />
              )}

              {/* Warehouse workflow actions */}
              {isWarehouse && !isTransporter && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {isWhAdmin && inbound.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        onClick={confirmApprove}
                        className="rounded bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500"
                      >
                        Duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAlert({
                            open: true,
                            type: 'confirm',
                            title: 'Từ chối yêu cầu?',
                            message: `Từ chối (hủy) ${inbound.inboundCode}.`,
                            onConfirm: () => patchStatus('CANCELLED'),
                          })
                        }
                        className="rounded border border-red-500/40 px-3 py-1.5 text-sm text-red-400"
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {inbound.status === 'APPROVED' && !isWarehouseTransport && (isWhAdmin || user?.role === 'WH_STAFF') && (
                    <button
                      type="button"
                      onClick={() =>
                        patchStatus('ARRIVED', {
                          actualArrivalAt: new Date().toISOString(),
                        })
                      }
                      className="rounded bg-violet-600 px-3 py-1.5 text-sm"
                    >
                      Xe đã đến
                    </button>
                  )}
                  {isWhAdmin && inbound.status === 'APPROVED' && (
                    <>
                      {readiness?.canRevokeApproval && (
                        <button
                          type="button"
                          onClick={() =>
                            setAlert({
                              open: true,
                              type: 'confirm',
                              title: 'Thu hồi duyệt?',
                              message: 'Trả về PENDING để xem xét lại (chưa có batch nhận hàng).',
                              onConfirm: () =>
                                patchStatus('PENDING', { approvedBy: null }),
                            })
                          }
                          className="rounded border border-slate-500/50 px-3 py-1.5 text-sm text-slate-300"
                        >
                          Thu hồi duyệt
                        </button>
                      )}
                      {readiness?.canWarehouseCancel && (
                        <button
                          type="button"
                          onClick={confirmWarehouseCancel}
                          className="rounded border border-red-500/40 px-3 py-1.5 text-sm text-red-400"
                        >
                          Hủy yêu cầu
                        </button>
                      )}
                    </>
                  )}
                  {inbound.status === 'ARRIVED' && (
                    <>
                      {isWhAdmin && readiness?.canWarehouseCancel && (
                        <button
                          type="button"
                          onClick={confirmWarehouseCancel}
                          className="rounded border border-red-500/40 px-3 py-1.5 text-sm text-red-400"
                        >
                          Hủy yêu cầu
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            () =>
                              inboundApi.startReceiving(inboundRequestId, {
                                receivedBy: user?.userId,
                              }),
                            'Bắt đầu nhận hàng'
                          )
                        }
                        className="rounded bg-cyan-600 px-3 py-1.5 text-sm"
                      >
                        Bắt đầu nhận hàng
                      </button>
                    </>
                  )}
                  {inbound.status === 'RECEIVING' && (
                    <button
                      type="button"
                      onClick={() =>
                        runAction(async () => {
                          const result = await inboundApi.completeInbound(inboundRequestId)
                          setAlert({
                            open: true,
                            type: 'success',
                            title: result.commitmentWarnings?.length
                              ? 'Inbound hoàn tất (cảnh báo cam kết)'
                              : undefined,
                            message: result.commitmentWarnings?.length
                              ? `Inbound hoàn tất. ${result.commitmentWarnings.map((w) => w.message).join(' ')}`
                              : 'Inbound hoàn tất',
                          })
                        })
                      }
                      className="rounded bg-emerald-600 px-3 py-1.5 text-sm"
                    >
                      Hoàn tất inbound
                    </button>
                  )}
                </div>
              )}

              {commitmentApplies && (
                <section className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                  <p className="font-medium text-slate-200">Cam kết rental request</p>
                  {commitmentLoading ? (
                    <p className="mt-2 text-xs text-slate-500">Đang tải hạn mức...</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {(commitment?.productLines ?? [])
                        .filter((line) => !line.uncommitted)
                        .map((line) => (
                          <div
                            key={line.key}
                            className="rounded-lg border border-white/5 bg-white/3 px-3 py-2 text-xs text-slate-400"
                          >
                            <span className="font-medium text-slate-200">
                              {line.productKind}
                              {line.size ? ` · size ${line.size}` : ''}
                            </span>
                            {' — '}hiệu lực {line.effectiveCommittedPieces} · đang dùng{' '}
                            {line.usedPieces} · còn {line.remainingPieces}
                            {line.overagePieces > 0 && (
                              <span className="ml-1 text-amber-300">
                                (vượt {line.overagePieces})
                              </span>
                            )}
                            {line.isTailRemaining && (
                              <p className="mt-1 text-amber-300/90">
                                Còn rất ít ({line.remainingPieces} cái) — có thể tạo phiếu nhập
                                nốt hoặc tenant admin đóng cam kết.
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                  {storedCommitmentWarnings.length > 0 && (
                    <InlineAlert
                      compact
                      className="mt-3"
                      message={storedCommitmentWarnings.map((w) => w.message).join(' ')}
                    />
                  )}
                  {receivingOveragePreview.length > 0 && (
                    <InlineAlert
                      compact
                      className="mt-3"
                      message={receivingOveragePreview.join(' ')}
                    />
                  )}
                  {isTenant && isTenantAdmin && closableCommitmentLines.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {closableCommitmentLines.map((line) => (
                        <button
                          key={line.key}
                          type="button"
                          disabled={busy}
                          onClick={() => handleCloseCommitmentLine(line)}
                          className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/10"
                        >
                          Đóng cam kết {line.productKind}
                          {line.size ? ` ${line.size}` : ''} (còn {line.remainingPieces})
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Items */}
              <section className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-semibold">Dòng hàng</h2>
                  {isWarehouse &&
                    !isTransporter &&
                    inbound.status === 'RECEIVING' &&
                    (showCompleteReceivingBtn ? (
                      <button
                        type="button"
                        onClick={handleCompleteReceiving}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium hover:bg-amber-500"
                      >
                        Hoàn tất kiểm đếm
                      </button>
                    ) : receivingFieldsLocked ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          Đã hoàn tất kiểm đếm
                        </span>
                        <button
                          type="button"
                          onClick={startReceivingEdit}
                          className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/10"
                        >
                          Sửa lại
                        </button>
                      </div>
                    ) : null)}
                </div>
                {isWarehouse && inbound.status === 'ARRIVED' && (
                  <p className="mb-3 text-xs text-slate-500">
                    Bấm <strong className="text-cyan-400/90">Bắt đầu nhận hàng</strong> phía trên để
                    nhập số thực nhận.
                  </p>
                )}
                {isWarehouse && inbound.status === 'RECEIVING' && receivingEditing && (
                  <p className="mb-3 text-xs text-slate-500">
                    Nhập số thực nhận, sau đó bấm{' '}
                    <strong className="text-amber-400/90">Hoàn tất kiểm đếm</strong> để lưu (không cần
                    nút Lưu từng dòng).
                  </p>
                )}
                <table className="w-full text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="py-2 text-left">SKU</th>
                      <th className="py-2 text-right">Mong đợi</th>
                      <th className="py-2 text-right">Đã nhận</th>
                      <th className="py-2 text-right">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: ApiInboundRequestItem) => {
                      const canEditReceived =
                        isWarehouse &&
                        inbound.status === 'RECEIVING' &&
                        receivingEditing &&
                        !receivingFieldsLocked
                      const received = canEditReceived
                        ? (receivedDraft[item.inboundRequestItemId] ?? 0)
                        : (item.receivedQuantity ?? 0)
                      const discrepancy = item.expectedQuantity - received

                      return (
                      <tr key={item.inboundRequestItemId} className="border-t border-white/5">
                        <td className="py-2">
                          {item.sku?.skuCode ?? item.skuId.slice(0, 8)}
                          <span className="block text-xs text-slate-500">
                            {item.sku?.productName}
                          </span>
                        </td>
                        <td className="py-2 text-right">{item.expectedQuantity}</td>
                        <td className="py-2 text-right">
                          {canEditReceived ? (
                            <input
                              type="number"
                              min={0}
                              aria-label="Số đã nhận"
                              placeholder="0"
                              className="w-20 rounded border border-white/10 bg-[#0f172a] px-2 py-1 text-right"
                              value={receivedDraft[item.inboundRequestItemId] ?? 0}
                              onChange={(e) => {
                                setReceivedDraft((d) => ({
                                  ...d,
                                  [item.inboundRequestItemId]: Number(e.target.value),
                                }))
                                setReceivingDirty(true)
                              }}
                            />
                          ) : (
                            received
                          )}
                        </td>
                        <td
                          className={`py-2 text-right ${
                            discrepancy === 0
                              ? 'text-emerald-400'
                              : discrepancy > 0
                                ? 'text-amber-300'
                                : 'text-violet-300'
                          }`}
                          title={
                            discrepancy > 0
                              ? 'Thiếu so với tenant khai báo'
                              : discrepancy < 0
                                ? 'Thừa so với tenant khai báo'
                                : 'Khớp'
                          }
                        >
                          {discrepancy}
                          {canEditReceived && discrepancy !== 0 && (
                            <span className="block text-[10px] font-normal text-slate-500">
                              {discrepancy > 0 ? 'thiếu' : 'thừa'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </section>

              {isWarehouse && ['ARRIVED', 'RECEIVING'].includes(inbound.status) && (
                <InboundLpnReceivingSection
                  inboundCode={inbound.inboundCode}
                  items={items}
                  batches={batches}
                  lpns={lpns}
                  lpnDetails={lpnDetails}
                  receivedDraft={receivedDraft}
                  readiness={readiness}
                  productCatalogByKind={productCatalogByKind}
                  sizeFactors={sizeFactors}
                  batchCode={batchCode}
                  onBatchCodeChange={setBatchCode}
                  onCreateBatch={handleCreateBatch}
                  selectedBatchId={selectedBatchId}
                  onSelectedBatchIdChange={setSelectedBatchId}
                  lpnCode={lpnCode}
                  onLpnCodeChange={setLpnCode}
                  boxType={boxType}
                  onBoxTypeChange={(v) => {
                    setBoxType(v)
                    setBoxTypeTouched(true)
                  }}
                  onApplySuggestedBoxType={() => {
                    if (readiness?.boxTypeSuggestion?.recommendedBoxType) {
                      setBoxType(readiness.boxTypeSuggestion.recommendedBoxType as BoxType)
                      setBoxTypeTouched(true)
                    }
                  }}
                  detailSkuId={detailSkuId}
                  onDetailSkuIdChange={setDetailSkuId}
                  detailQty={detailQty}
                  onDetailQtyChange={setDetailQty}
                  selectedLpnId={selectedLpnId}
                  onSelectedLpnIdChange={(id) => {
                    setSelectedLpnId(id)
                    setPutawayBinId('')
                    setAiRecommendationId(undefined)
                  }}
                  onCreateNextLpn={handleCreateNextLpn}
                  onFillSkuLpns={handleFillSkuLpns}
                  onAddLpnDetail={handleAddLpnDetail}
                  putawaySlot={
                    <>
                      <AiPutawayPanel
                        lpnId={selectedLpnId}
                        lpnCode={selectedLpnCode}
                        warehouseId={inbound.warehouseId}
                        inboundRequestId={inbound.inboundRequestId}
                        hasLpnDetails={selectedLpnHasDetails}
                        onSelectRecommendedBin={(binId, recommendationId) => {
                          setPutawayBinId(binId)
                          setAiRecommendationId(recommendationId)
                        }}
                      />
                      <PutawayBinPicker
                        warehouseId={inbound.warehouseId}
                        contractId={inbound.contractId}
                        inboundRequestId={inbound.inboundRequestId}
                        movedBy={user?.userId}
                        value={putawayBinId}
                        onChange={(binId) => {
                          setPutawayBinId(binId)
                          setAiRecommendationId(undefined)
                        }}
                        pendingPutawayCount={pendingPutawayCount}
                        boxType={putawayBoxType}
                        onBulkPutawayDone={(result) => {
                          void load()
                          const lines = result.assignments
                            .slice(0, 8)
                            .map((a) => `${a.lpnCode} → ${a.binCode}`)
                          const more =
                            result.assignments.length > 8
                              ? `\n... +${result.assignments.length - 8} LPN`
                              : ''
                          setAlert({
                            open: true,
                            message: `Đã putaway ${result.putawayCount} LPN.\n${lines.join('\n')}${more}`,
                          })
                        }}
                      />
                      <button
                        type="button"
                        onClick={handlePutaway}
                        disabled={!putawayBinId || !selectedLpnId}
                        className="mt-2 w-full rounded border border-white/10 bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600 disabled:opacity-40"
                      >
                        Putaway 1 LPN (thủ công)
                      </button>
                      <p className="mt-2 text-xs text-slate-500">
                        LPN phải có SKU trong thùng. Ưu tiên nút{' '}
                        <strong className="text-emerald-400">Putaway tự động</strong> phía trên khi còn
                        nhiều LPN.
                      </p>
                    </>
                  }
                />
              )}

              {inbound.status === 'COMPLETED' && isWarehouse && (
                <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
                  <p className="mb-3">Inbound đã hoàn tất. Hàng đã putaway có thể xem trong tồn kho.</p>
                  <Link
                    to={
                      basePath.startsWith('/staff/inbound-ops')
                        ? `/staff/inventory-ops?inboundRequestId=${inbound.inboundRequestId}`
                        : `/admin/inventory?inboundRequestId=${inbound.inboundRequestId}`
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                  >
                    Xem tồn kho đợt này (LPN / batch)
                  </Link>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {alert.open && (
        <AlertModal
          title={alert.title ?? 'Thông báo'}
          type={alert.type}
          message={alert.message}
          onConfirm={alert.onConfirm}
          onClose={() => setAlert({ open: false, message: '' })}
        />
      )}
    </div>
  )
}
