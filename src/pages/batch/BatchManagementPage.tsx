import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { BatchBarcodeModal } from '../../components/batch/BatchBarcodeModal'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as batchesApi from '../../api/batches'
import type { ApiBatch } from '../../api/batches'
import * as inboundApi from '../../api/inboundRequests'
import type { ApiInboundRequest, InboundStatus } from '../../api/inboundRequests'
import { formatDate } from '../../mappers'

const RECEIVING_STATUSES: InboundStatus[] = ['ARRIVED', 'RECEIVING']

type Mode = 'tenant' | 'warehouse'

type Props = {
  mode: Mode
  inboundBasePath: string
}

export function BatchManagementPage({ mode, inboundBasePath }: Props) {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tenantId = user?.tenantId ?? ''
  const warehouseId = user?.warehouseId ?? ''

  const [inbounds, setInbounds] = useState<ApiInboundRequest[]>([])
  const [selectedInboundId, setSelectedInboundId] = useState(
    () => searchParams.get('inboundRequestId') ?? ''
  )
  const [batches, setBatches] = useState<ApiBatch[]>([])
  const [batchCode, setBatchCode] = useState('')
  const [loadingInbounds, setLoadingInbounds] = useState(true)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [barcodeBatch, setBarcodeBatch] = useState<ApiBatch | null>(null)

  const loadInbounds = useCallback(async () => {
    setLoadingInbounds(true)
    setError('')
    try {
      const params: Parameters<typeof inboundApi.listInboundRequests>[0] = { limit: 200 }
      if (mode === 'tenant') {
        if (!tenantId) {
          setInbounds([])
          return
        }
        params.tenantId = tenantId
      } else if (warehouseId) {
        params.warehouseId = warehouseId
      }
      const res = await inboundApi.listInboundRequests(params)
      setInbounds(res.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được phiếu nhập kho')
    } finally {
      setLoadingInbounds(false)
    }
  }, [mode, tenantId, warehouseId])

  const loadBatches = useCallback(async (inboundRequestId: string) => {
    if (!inboundRequestId) {
      setBatches([])
      return
    }
    setLoadingBatches(true)
    setError('')
    try {
      const res = await batchesApi.listBatches({ inboundRequestId, limit: 100 })
      setBatches(res.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách batch')
      setBatches([])
    } finally {
      setLoadingBatches(false)
    }
  }, [])

  useEffect(() => {
    loadInbounds()
  }, [loadInbounds])

  useEffect(() => {
    const fromUrl = searchParams.get('inboundRequestId')
    if (fromUrl && fromUrl !== selectedInboundId) {
      setSelectedInboundId(fromUrl)
    }
  }, [searchParams, selectedInboundId])

  useEffect(() => {
    if (selectedInboundId) {
      loadBatches(selectedInboundId)
    } else {
      setBatches([])
    }
  }, [selectedInboundId, loadBatches])

  const selectedInbound = useMemo(
    () => inbounds.find((i) => i.inboundRequestId === selectedInboundId) ?? null,
    [inbounds, selectedInboundId]
  )

  const canCreateBatch =
    selectedInbound != null && RECEIVING_STATUSES.includes(selectedInbound.status)

  const handleInboundChange = (id: string) => {
    setSelectedInboundId(id)
    setSuccess('')
    if (id) {
      setSearchParams({ inboundRequestId: id }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  const suggestBatchCode = useMemo(() => {
    if (!selectedInbound) return ''
    const n = batches.length + 1
    const suffix = String(n).padStart(3, '0')
    return `${selectedInbound.inboundCode}-B${suffix}`
  }, [selectedInbound, batches.length])

  const handleCreate = async () => {
    if (!selectedInboundId || !batchCode.trim()) {
      setError('Chọn phiếu nhập và nhập mã batch.')
      return
    }
    setCreating(true)
    setError('')
    setSuccess('')
    try {
      await batchesApi.createBatch({
        inboundRequestId: selectedInboundId,
        batchCode: batchCode.trim(),
      })
      setBatchCode('')
      setSuccess('Đã tạo batch thành công.')
      await loadBatches(selectedInboundId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tạo được batch')
    } finally {
      setCreating(false)
    }
  }

  const busy = loadingInbounds || loadingBatches

  return (
    <div className="flex max-w-screen overflow-hidden bg-slate-50 text-slate-800 min-h-screen">
      <div className="relative flex flex-1 flex-col overflow-y-auto p-6 md:p-8">
        {busy && <LoadingOverlay show={true} text="Đang tải dữ liệu..." />}

        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Batch</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tạo lô nhận hàng theo phiếu nhập và in tem Code 128 từ{' '}
            <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-1 py-0.5 rounded border border-cyan-100">
              batchCode
            </span>
            .
          </p>
        </header>

        {error && (
          <div className="mb-4">
            <InlineAlert variant="error" message={error} onDismiss={() => setError('')} />
          </div>
        )}
        {success && (
          <div className="mb-4">
            <InlineAlert variant="success" message={success} onDismiss={() => setSuccess('')} />
          </div>
        )}

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="inbound-select" className="mb-2 block text-sm font-bold text-slate-700">
            Phiếu nhập kho
          </label>
          <select
            id="inbound-select"
            value={selectedInboundId}
            onChange={(e) => handleInboundChange(e.target.value)}
            className="w-full max-w-xl rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 focus:outline-none"
          >
            <option value="">— Chọn phiếu nhập —</option>
            {inbounds.map((inb) => (
              <option key={inb.inboundRequestId} value={inb.inboundRequestId}>
                {inb.inboundCode} · {inb.status}
              </option>
            ))}
          </select>
          {selectedInbound && (
            <p className="mt-2.5 text-xs font-medium text-slate-500 flex items-center gap-2">
              <Link
                to={`${inboundBasePath}/${selectedInbound.inboundRequestId}`}
                className="text-cyan-600 font-bold hover:text-cyan-700 hover:underline"
              >
                Mở chi tiết phiếu nhập
              </Link>
              {!canCreateBatch && (
                <span className="text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  ⚠️ Chỉ tạo batch khi phiếu ở trạng thái ARRIVED hoặc RECEIVING.
                </span>
              )}
            </p>
          )}
        </div>

        {selectedInboundId && (
          <>
            {canCreateBatch && (
              <div className="mb-6 flex flex-col gap-3 rounded-xl border border-cyan-200 bg-cyan-50/50 p-5 sm:flex-row sm:items-end shadow-sm">
                <div className="flex-1">
                  <label htmlFor="batch-code" className="mb-2 block text-sm font-bold text-slate-700">
                    Mã batch (batchCode)
                  </label>
                  <input
                    id="batch-code"
                    type="text"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    placeholder={suggestBatchCode || 'BATCH-001'}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 focus:outline-none placeholder:text-slate-400"
                  />
                  {suggestBatchCode && !batchCode && (
                    <button
                      type="button"
                      className="mt-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline"
                      onClick={() => setBatchCode(suggestBatchCode)}
                    >
                      Dùng gợi ý mặc định: {suggestBatchCode}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  disabled={creating || !batchCode.trim()}
                  onClick={handleCreate}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 shadow-sm transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg font-bold">add</span>
                  Tạo lô batch
                </button>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3.5">Mã batch</th>
                    <th className="px-4 py-3.5">Nhận tại kho</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {batches.length === 0 && !loadingBatches && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center font-semibold text-slate-400 bg-white">
                        Chưa có batch nào được tạo cho phiếu nhập này.
                      </td>
                    </tr>
                  )}
                  {batches.map((b) => (
                    <tr key={b.batchId} className="hover:bg-slate-50/80 transition-colors bg-white">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700 text-sm">{b.batchCode}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {b.warehouseReceivedAt
                          ? formatDate(b.warehouseReceivedAt)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setBarcodeBatch(b)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-cyan-600 hover:text-cyan-600 hover:bg-cyan-50/30 transition-all shadow-sm"
                        >
                          <span className="material-symbols-outlined text-base font-bold">qr_code_2</span>
                          Xem Code 128
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!selectedInboundId && !loadingInbounds && (
          <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-sm font-medium text-slate-500 bg-white shadow-sm">
            Vui lòng chọn một phiếu nhập kho từ danh sách phía trên để xem và quản lý cấu trúc các lô batch.
          </div>
        )}
      </div>

      <BatchBarcodeModal
        batch={barcodeBatch}
        open={barcodeBatch != null}
        onClose={() => setBarcodeBatch(null)}
      />
    </div>
  )
}