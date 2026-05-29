import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { InboundApprovalPanel } from '../../components/inbound/InboundApprovalPanel'
import { InboundStatusBadge } from '../../components/inbound/InboundStatusBadge'
import { PutawayBinPicker } from '../../components/inbound/PutawayBinPicker'
import { InboundLpnReceivingSection } from '../../components/inbound/InboundLpnReceivingSection'
import {
  InboundDeliveryForm,
  emptyDeliveryForm,
  type DeliveryFormState,
} from '../../components/inbound/InboundDeliveryForm'
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
import { BOX_TYPE_OPTIONS } from '../../data/inboundStatus'
import { formatDate } from '../../mappers'

type Mode = 'tenant' | 'warehouse'

type Props = {
  mode: Mode
  basePath: string
}

export function InboundDetailPage({ mode, basePath }: Props) {
  const { inboundRequestId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isWarehouse = mode === 'warehouse'

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

  const [receivedDraft, setReceivedDraft] = useState<Record<string, number>>({})

  const [readiness, setReadiness] = useState<ApiInboundApprovalReadiness | null>(null)
  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormState>(emptyDeliveryForm())
  const [deliveryDirty, setDeliveryDirty] = useState(false)

  const [alert, setAlert] = useState<{
    open: boolean
    message: string
    title?: string
    type?: 'success' | 'confirm'
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
      setDeliveryDirty(false)

      const draft: Record<string, number> = {}
      for (const item of data.items ?? []) {
        draft[item.inboundRequestItemId] = item.receivedQuantity ?? 0
      }
      setReceivedDraft(draft)

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
  }, [inboundRequestId, isWarehouse])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!readiness?.boxTypeSuggestion?.recommendedBoxType || boxTypeTouched) return
    const recommended = readiness.boxTypeSuggestion.recommendedBoxType as BoxType
    if (BOX_TYPE_OPTIONS.some((o) => o.value === recommended)) {
      setBoxType(recommended)
    }
  }, [readiness, boxTypeTouched])

  const runAction = async (fn: () => Promise<unknown>, successMsg?: string) => {
    setBusy(true)
    try {
      await fn()
      if (successMsg) setAlert({ open: true, message: successMsg })
      await load()
    } catch (err) {
      setAlert({
        open: true,
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
    setAlert({
      open: true,
      type: 'confirm',
      title: warn ? 'Duyệt dù thiếu chỗ?' : 'Duyệt inbound?',
      message: warn
        ? `Ước tính thiếu slot LPN hoặc volume. Bạn vẫn muốn duyệt yêu cầu ${inbound?.inboundCode}?`
        : `Xác nhận duyệt ${inbound?.inboundCode}?`,
      onConfirm: () => patchStatus('APPROVED'),
    })
  }

  const canEditDelivery =
    isWarehouse
      ? inbound && ['PENDING', 'APPROVED', 'ARRIVED'].includes(inbound.status)
      : inbound && ['DRAFT', 'PENDING', 'APPROVED'].includes(inbound.status)

  const saveDelivery = () =>
    runAction(async () => {
      if (!deliveryForm.vehiclePlate.trim()) {
        throw new ApiError('Nhập biển số xe', 400)
      }
      await deliveryApi.upsertInboundDelivery(inboundRequestId, {
        vehiclePlate: deliveryForm.vehiclePlate.trim(),
        driverName: deliveryForm.driverName?.trim() || undefined,
        driverPhone: deliveryForm.driverPhone?.trim() || undefined,
        driverIdNumber: deliveryForm.driverIdNumber?.trim() || undefined,
        carrierName: deliveryForm.carrierName?.trim() || undefined,
        notes: deliveryForm.notes?.trim() || undefined,
      })
      setDeliveryDirty(false)
    }, 'Đã lưu thông tin xe')

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

  const handleCreateBatch = () =>
    runAction(async () => {
      if (!batchCode.trim()) throw new ApiError('Nhập mã batch', 400)
      await batchesApi.createBatch({
        inboundRequestId,
        batchCode: batchCode.trim(),
      })
      setBatchCode('')
    }, 'Đã tạo batch')

  const piecesPerLpn = readiness?.assumptions.piecesPerLpn ?? 25

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

  const nextLpnCode = () => {
    const base = inbound?.inboundCode?.replace(/[^a-zA-Z0-9-]/g, '') ?? 'IN'
    const n = lpns.length + 1
    return `${base}-LPN-${String(n).padStart(3, '0')}`
  }

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

  const handleCreateNextLpn = () =>
    runAction(async () => {
      const qty = Math.min(piecesPerLpn, remainingForSku(detailSkuId))
      await createLpnWithSkuQty(qty)
    }, 'Đã tạo LPN và gán SKU')

  const handleFillSkuLpns = () =>
    runAction(async () => {
      if (!detailSkuId) throw new ApiError('Chọn SKU', 400)
      let created = 0
      let rem = remainingForSku(detailSkuId)
      const base = inbound?.inboundCode?.replace(/[^a-zA-Z0-9-]/g, '') ?? 'IN'
      let seq = lpns.length
      while (rem > 0 && created < 200) {
        seq += 1
        const qty = Math.min(piecesPerLpn, rem)
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

  const handlePutaway = () =>
    runAction(async () => {
      if (!selectedLpnId || !putawayBinId.trim()) {
        throw new ApiError('Chọn LPN và bin putaway', 400)
      }
      await lpnsApi.putawayLpn(selectedLpnId, {
        binId: putawayBinId.trim(),
        movedBy: user?.userId,
      })
      setPutawayBinId('')
    }, 'Putaway thành công')

  const handleCompleteReceiving = () =>
    runAction(async () => {
      const payload = items.map((item) => ({
        inboundRequestItemId: item.inboundRequestItemId,
        receivedQuantity: receivedDraft[item.inboundRequestItemId] ?? 0,
      }))
      await inboundApi.completeReceiving(inboundRequestId, { items: payload })
    }, 'Đã ghi nhận số lượng nhận')

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

  const canCancelTenant =
    !isWarehouse &&
    inbound &&
    ['DRAFT', 'PENDING'].includes(inbound.status)

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
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
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

              <section className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
                <h2 className="mb-2 font-semibold">Vận chuyển đến kho</h2>
                <p className="mb-3 text-xs text-slate-500">
                  {DELIVERY_MODE_OPTIONS.find((o) => o.value === inbound.deliveryMode)?.label ??
                    inbound.deliveryMode ??
                    '—'}
                  {inbound.status === 'APPROVED' && !inbound.delivery && isWarehouse && (
                    <span className="ml-2 text-amber-300">
                      · Cần lưu biển số trước khi &quot;Xe đã đến&quot;
                    </span>
                  )}
                </p>
                {canEditDelivery ? (
                  <>
                    <InboundDeliveryForm
                      deliveryMode={(inbound.deliveryMode as DeliveryMode) ?? 'TENANT_SELF'}
                      value={deliveryForm}
                      onChange={(next) => {
                        setDeliveryForm(next)
                        setDeliveryDirty(true)
                      }}
                      compact
                    />
                    <button
                      type="button"
                      disabled={!deliveryDirty}
                      onClick={saveDelivery}
                      className="mt-3 rounded bg-cyan-600 px-3 py-1.5 text-sm disabled:opacity-40"
                    >
                      Lưu thông tin xe
                    </button>
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
                  </dl>
                ) : (
                  <p className="text-sm text-slate-500">Chưa có thông tin xe.</p>
                )}
              </section>

              {/* Warehouse workflow actions */}
              {isWarehouse && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {inbound.status === 'PENDING' && (
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
                  {inbound.status === 'APPROVED' && (
                    <>
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
                      {readiness?.canWarehouseCancel && (
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
                  {['ARRIVED', 'RECEIVING'].includes(inbound.status) && (
                    <button
                      type="button"
                      onClick={handleCompleteReceiving}
                      className="rounded bg-amber-600 px-3 py-1.5 text-sm"
                    >
                      Hoàn tất kiểm đếm
                    </button>
                  )}
                  {inbound.status === 'RECEIVING' && (
                    <button
                      type="button"
                      onClick={() =>
                        runAction(
                          () => inboundApi.completeInbound(inboundRequestId),
                          'Inbound hoàn tất'
                        )
                      }
                      className="rounded bg-emerald-600 px-3 py-1.5 text-sm"
                    >
                      Hoàn tất inbound
                    </button>
                  )}
                </div>
              )}

              {canCancelTenant && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="mb-6 rounded border border-red-500/40 px-3 py-1.5 text-sm text-red-400"
                >
                  Hủy yêu cầu
                </button>
              )}

              {/* Items */}
              <section className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
                <h2 className="mb-3 font-semibold">Dòng hàng</h2>
                {isWarehouse && ['ARRIVED', 'RECEIVING'].includes(inbound.status) && (
                  <p className="mb-3 text-xs text-slate-500">
                    Nhập số thực nhận, sau đó bấm <strong className="text-amber-400/90">Hoàn tất kiểm đếm</strong>{' '}
                    để lưu (không cần nút Lưu từng dòng).
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
                        isWarehouse && ['ARRIVED', 'RECEIVING'].includes(inbound.status)
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
                              onChange={(e) =>
                                setReceivedDraft((d) => ({
                                  ...d,
                                  [item.inboundRequestItemId]: Number(e.target.value),
                                }))
                              }
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
                  onSelectedLpnIdChange={setSelectedLpnId}
                  onCreateNextLpn={handleCreateNextLpn}
                  onFillSkuLpns={handleFillSkuLpns}
                  onAddLpnDetail={handleAddLpnDetail}
                  putawaySlot={
                    <>
                      <PutawayBinPicker
                        warehouseId={inbound.warehouseId}
                        contractId={inbound.contractId}
                        inboundRequestId={inbound.inboundRequestId}
                        movedBy={user?.userId}
                        value={putawayBinId}
                        onChange={setPutawayBinId}
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

              {inbound.status === 'COMPLETED' && (
                <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
                  <p className="mb-3">Inbound đã hoàn tất. Hàng đã putaway có thể xem trong tồn kho.</p>
                  <Link
                    to={
                      basePath.startsWith('/staff/inbound-ops')
                        ? `/staff/inventory-ops?inboundRequestId=${inbound.inboundRequestId}`
                        : isWarehouse
                          ? `/admin/inventory?inboundRequestId=${inbound.inboundRequestId}`
                          : `/staff/inventory?inboundRequestId=${inbound.inboundRequestId}`
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
