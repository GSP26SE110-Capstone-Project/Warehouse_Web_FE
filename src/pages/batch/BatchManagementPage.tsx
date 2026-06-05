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
      setSuccess('Đã tạo batch.')
      await loadBatches(selectedInboundId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tạo được batch')
    } finally {
      setCreating(false)
    }
  }

  const busy = loadingInbounds || loadingBatches

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">
      <div className="relative flex flex-1 flex-col overflow-y-auto p-6 md:p-8">
        <LoadingOverlay show={busy} />

        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Quản lý Batch</h1>
          <p className="mt-1 text-sm text-slate-400">
            Tạo lô nhận hàng theo phiếu nhập và in tem Code 128 từ{' '}
            <span className="font-mono text-cyan-300/90">batchCode</span>.
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

        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <label htmlFor="inbound-select" className="mb-2 block text-sm font-medium text-slate-300">
            Phiếu nhập kho
          </label>
          <select
            id="inbound-select"
            value={selectedInboundId}
            onChange={(e) => handleInboundChange(e.target.value)}
            className="w-full max-w-xl rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
          >
            <option value="">— Chọn phiếu nhập —</option>
            {inbounds.map((inb) => (
              <option key={inb.inboundRequestId} value={inb.inboundRequestId}>
                {inb.inboundCode} · {inb.status}
              </option>
            ))}
          </select>
          {selectedInbound && (
            <p className="mt-2 text-xs text-slate-500">
              <Link
                to={`${inboundBasePath}/${selectedInbound.inboundRequestId}`}
                className="text-cyan-400 hover:underline"
              >
                Mở chi tiết phiếu nhập
              </Link>
              {!canCreateBatch && (
                <span className="ml-2 text-amber-400/90">
                  Chỉ tạo batch khi phiếu ở trạng thái ARRIVED hoặc RECEIVING.
                </span>
              )}
            </p>
          )}
        </div>

        {selectedInboundId && (
          <>
            {canCreateBatch && (
              <div className="mb-6 flex flex-col gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label htmlFor="batch-code" className="mb-2 block text-sm font-medium text-slate-300">
                    Mã batch (batchCode)
                  </label>
                  <input
                    id="batch-code"
                    type="text"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    placeholder={suggestBatchCode || 'BATCH-001'}
                    className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2.5 font-mono text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                  />
                  {suggestBatchCode && !batchCode && (
                    <button
                      type="button"
                      className="mt-1 text-xs text-cyan-400 hover:underline"
                      onClick={() => setBatchCode(suggestBatchCode)}
                    >
                      Dùng gợi ý: {suggestBatchCode}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  disabled={creating || !batchCode.trim()}
                  onClick={handleCreate}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Tạo batch
                </button>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 bg-white/[0.04] text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Mã batch</th>
                    <th className="px-4 py-3">Nhận tại kho</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 && !loadingBatches && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        Chưa có batch cho phiếu này.
                      </td>
                    </tr>
                  )}
                  {batches.map((b) => (
                    <tr key={b.batchId} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-cyan-200">{b.batchCode}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {b.warehouseReceivedAt
                          ? formatDate(b.warehouseReceivedAt)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setBarcodeBatch(b)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/40 hover:text-cyan-300"
                        >
                          <span className="material-symbols-outlined text-base">qr_code_2</span>
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
          <p className="text-sm text-slate-500">Chọn phiếu nhập kho để xem và quản lý batch.</p>
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
