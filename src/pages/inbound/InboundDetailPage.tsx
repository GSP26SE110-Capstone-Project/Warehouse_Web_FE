import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { InboundStatusBadge } from '../../components/inbound/InboundStatusBadge'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as inboundApi from '../../api/inboundRequests'
import type { ApiInboundRequestItem, ApiInboundRequestWithItems, InboundStatus } from '../../api/inboundRequests'
import * as batchesApi from '../../api/batches'
import type { ApiBatch } from '../../api/batches'
import * as lpnsApi from '../../api/lpns'
import type { ApiLpn, BoxType } from '../../api/lpns'
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
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [batchCode, setBatchCode] = useState('')
  const [lpnCode, setLpnCode] = useState('')
  const [boxType, setBoxType] = useState<BoxType>('MEDIUM')
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [selectedLpnId, setSelectedLpnId] = useState('')
  const [detailSkuId, setDetailSkuId] = useState('')
  const [detailQty, setDetailQty] = useState(1)
  const [putawayBinId, setPutawayBinId] = useState('')

  const [receivedDraft, setReceivedDraft] = useState<Record<string, number>>({})

  const [alert, setAlert] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })

  const load = useCallback(async () => {
    if (!inboundRequestId) return
    setLoading(true)
    setError('')
    try {
      const data = await inboundApi.getInboundRequest(inboundRequestId, true)
      setInbound(data)

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
        setLpns(lpnLists.flatMap((r) => r.items))
      } else {
        setLpns([])
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải chi tiết')
    } finally {
      setLoading(false)
    }
  }, [inboundRequestId])

  useEffect(() => {
    load()
  }, [load])

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
    }
  ) =>
    runAction(async () => {
      await inboundApi.updateInboundRequest(inboundRequestId, {
        status,
        actualArrivalAt: extra?.actualArrivalAt,
        approvedBy: status === 'APPROVED' ? user?.userId : undefined,
        receivedBy:
          status === 'ARRIVED' || status === 'RECEIVING' ? user?.userId : undefined,
      })
    }, `Cập nhật trạng thái: ${status}`)

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

  const handleCreateLpn = () =>
    runAction(async () => {
      if (!inbound || !selectedBatchId || !lpnCode.trim()) {
        throw new ApiError('Chọn batch và nhập mã LPN', 400)
      }
      const vol = BOX_TYPE_OPTIONS.find((b) => b.value === boxType)?.volumeUnits ?? 2
      await lpnsApi.createLpn({
        tenantId: inbound.tenantId,
        batchId: selectedBatchId,
        lpnCode: lpnCode.trim(),
        boxType,
        volumeUnits: vol,
        status: 'RECEIVING',
      })
      setLpnCode('')
    }, 'Đã tạo LPN')

  const handleAddLpnDetail = () =>
    runAction(async () => {
      if (!selectedLpnId || !detailSkuId || detailQty < 1) {
        throw new ApiError('Chọn LPN, SKU và số lượng', 400)
      }
      await lpnsApi.createLpnDetail({
        lpnId: selectedLpnId,
        skuId: detailSkuId,
        quantity: detailQty,
      })
    }, 'Đã thêm SKU vào LPN')

  const handlePutaway = () =>
    runAction(async () => {
      if (!selectedLpnId || !putawayBinId.trim()) {
        throw new ApiError('Chọn LPN và nhập binId', 400)
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

              {/* Warehouse workflow actions */}
              {isWarehouse && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {inbound.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => patchStatus('APPROVED')}
                      className="rounded bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500"
                    >
                      Duyệt
                    </button>
                  )}
                  {inbound.status === 'APPROVED' && (
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
                  {inbound.status === 'ARRIVED' && (
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
                    {items.map((item: ApiInboundRequestItem) => (
                      <tr key={item.inboundRequestItemId} className="border-t border-white/5">
                        <td className="py-2">
                          {item.sku?.skuCode ?? item.skuId.slice(0, 8)}
                          <span className="block text-xs text-slate-500">
                            {item.sku?.productName}
                          </span>
                        </td>
                        <td className="py-2 text-right">{item.expectedQuantity}</td>
                        <td className="py-2 text-right">
                          {isWarehouse && ['ARRIVED', 'RECEIVING'].includes(inbound.status) ? (
                            <input
                              type="number"
                              min={0}
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
                            (item.receivedQuantity ?? 0)
                          )}
                        </td>
                        <td className="py-2 text-right text-amber-300">
                          {item.discrepancyQuantity ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Receiving / LPN (warehouse) */}
              {isWarehouse && ['ARRIVED', 'RECEIVING'].includes(inbound.status) && (
                <section className="mb-8 grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h2 className="mb-3 font-semibold">Batch</h2>
                    <div className="mb-2 flex gap-2">
                      <input
                        value={batchCode}
                        onChange={(e) => setBatchCode(e.target.value)}
                        placeholder="BATCH-001"
                        className="flex-1 rounded border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleCreateBatch}
                        className="rounded bg-cyan-600 px-3 py-2 text-sm"
                      >
                        Tạo
                      </button>
                    </div>
                    <ul className="text-xs text-slate-400">
                      {batches.map((b) => (
                        <li key={b.batchId} className="py-1 font-mono">
                          {b.batchCode}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h2 className="mb-3 font-semibold">LPN</h2>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="mb-2 w-full rounded border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
                    >
                      <option value="">— Batch —</option>
                      {batches.map((b) => (
                        <option key={b.batchId} value={b.batchId}>
                          {b.batchCode}
                        </option>
                      ))}
                    </select>
                    <div className="mb-2 flex gap-2">
                      <input
                        value={lpnCode}
                        onChange={(e) => setLpnCode(e.target.value)}
                        placeholder="LPN-001"
                        className="flex-1 rounded border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
                      />
                      <select
                        value={boxType}
                        onChange={(e) => setBoxType(e.target.value as BoxType)}
                        className="rounded border border-white/10 bg-[#0f172a] px-2 text-sm"
                      >
                        {BOX_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateLpn}
                      className="mb-3 rounded bg-cyan-600 px-3 py-2 text-sm"
                    >
                      Tạo LPN
                    </button>

                    <select
                      value={selectedLpnId}
                      onChange={(e) => setSelectedLpnId(e.target.value)}
                      className="mb-2 w-full rounded border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
                    >
                      <option value="">— LPN —</option>
                      {lpns.map((l) => (
                        <option key={l.lpnId} value={l.lpnId}>
                          {l.lpnCode} ({l.status})
                        </option>
                      ))}
                    </select>
                    <div className="mb-2 flex gap-2">
                      <select
                        value={detailSkuId}
                        onChange={(e) => setDetailSkuId(e.target.value)}
                        className="flex-1 rounded border border-white/10 bg-[#0f172a] px-2 text-sm"
                      >
                        <option value="">— SKU —</option>
                        {items.map((item) => (
                          <option key={item.skuId} value={item.skuId}>
                            {item.sku?.skuCode}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={detailQty}
                        onChange={(e) => setDetailQty(Number(e.target.value))}
                        className="w-16 rounded border border-white/10 bg-[#0f172a] px-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddLpnDetail}
                        className="rounded bg-slate-600 px-2 text-sm"
                      >
                        +
                      </button>
                    </div>

                    <h3 className="mb-2 mt-4 text-sm font-medium text-slate-300">Putaway</h3>
                    <div className="flex gap-2">
                      <input
                        value={putawayBinId}
                        onChange={(e) => setPutawayBinId(e.target.value)}
                        placeholder="binId (UUID)"
                        className="flex-1 rounded border border-white/10 bg-[#0f172a] px-3 py-2 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handlePutaway}
                        className="rounded bg-emerald-600 px-3 py-2 text-sm"
                      >
                        Putaway
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      LPN phải có SKU trong thùng. Sau putaway status → STORED.
                    </p>
                  </div>
                </section>
              )}

              {inbound.status === 'COMPLETED' && (
                <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
                  Inbound đã hoàn tất. Xem tồn kho theo LPN/batch trong module Inventory (sắp tới).
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {alert.open && (
        <AlertModal
          title="Thông báo"
          message={alert.message}
          onClose={() => setAlert({ open: false, message: '' })}
        />
      )}
    </div>
  )
}
