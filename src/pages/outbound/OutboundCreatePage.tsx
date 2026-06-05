import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { DateTimePickerField } from '../../components/ui/DateTimePickerField'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as outboundApi from '../../api/outboundRequests'
import * as contractsApi from '../../api/contracts'
import * as skusApi from '../../api/skus'
import * as warehousesApi from '../../api/warehouses'
import type { ApiSku } from '../../api/skus'

type LineDraft = { skuId: string; requestedQuantity: number }

export function OutboundCreatePage({ basePath }: { basePath: string }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''

  const [contracts, setContracts] = useState<
    Awaited<ReturnType<typeof contractsApi.listContracts>>['items']
  >([])
  const [warehouseNames, setWarehouseNames] = useState<Map<string, string>>(new Map())
  const [skus, setSkus] = useState<ApiSku[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [contractId, setContractId] = useState('')
  const [requestedShipDate, setRequestedShipDate] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([{ skuId: '', requestedQuantity: 1 }])

  const [alert, setAlert] = useState<{
    open: boolean
    type?: 'success' | 'error' | 'warning'
    message: string
  }>({ open: false, message: '' })

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [activeRes, terminatedRes, sRes, whRes] = await Promise.all([
        contractsApi.listContracts({ tenantId, status: 'ACTIVE', limit: 100 }),
        contractsApi.listContracts({ tenantId, status: 'TERMINATED', limit: 100 }),
        skusApi.listSkus({ tenantId, status: 'ACTIVE', limit: 200 }),
        warehousesApi.listWarehouses({ limit: 200 }),
      ])
      const merged = [...activeRes.items, ...terminatedRes.items]
      setContracts(merged)
      setSkus(sRes.items)
      setWarehouseNames(new Map(whRes.items.map((w) => [w.warehouseId, w.warehouseName])))
      if (merged.length === 1) setContractId(merged[0].contractId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load()
  }, [load])

  const selectedContract = contracts.find((c) => c.contractId === contractId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId || !contractId || !selectedContract) {
      setAlert({ open: true, type: 'warning', message: 'Chọn hợp đồng' })
      return
    }

    const validLines = lines.filter((l) => l.skuId && l.requestedQuantity > 0)
    if (validLines.length === 0) {
      setAlert({ open: true, type: 'warning', message: 'Thêm ít nhất một dòng SKU' })
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const created = await outboundApi.createOutboundRequest({
        tenantId,
        contractId,
        warehouseId: selectedContract.warehouseId,
        requestedShipDate: requestedShipDate || undefined,
        status: 'PENDING',
        items: validLines,
      })
      navigate(`${basePath}/${created.outboundRequestId}`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Tạo phiếu xuất thất bại'
      setError(msg)
      setAlert({ open: true, type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  // Định nghĩa style chung cho các ô select và input ở Light Mode
  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:bg-slate-50 transition-colors'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <LoadingOverlay show={loading} text="Đang tải..." />
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl p-8 bg-white my-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Tạo yêu cầu xuất kho</h1>

        {error && (
          <div className="mt-4">
            <InlineAlert message={error} onDismiss={() => setError('')} />
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
              Hợp đồng *
            </label>
            <select
              required
              aria-label="Chọn hợp đồng"
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Chọn HĐ —</option>
              {contracts.map((c) => (
                <option key={c.contractId} value={c.contractId}>
                  {c.contractCode} · {warehouseNames.get(c.warehouseId) ?? c.warehouseId} ·{' '}
                  {c.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
              Ngày xuất dự kiến
            </label>
            <DateTimePickerField
              id="requestedShipDate"
              value={requestedShipDate}
              onChange={setRequestedShipDate}
            />
          </div>

          <div className="">
            <div className="mb-2 items-center flex justify-between">
              <span className="text-xs font-bold uppercase text-slate-500">Dòng SKU *</span>
              <button
                type="button"
                onClick={() =>
                  setLines((prev) => [...prev, { skuId: '', requestedQuantity: 1 }])
                }
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                + Thêm dòng
              </button>
            </div>
            <div className="space-y-2 flex-[1]">
              {lines.map((line, idx) => (
                <div key={idx} className="flex gap-2">
                  <select
                    aria-label={`Chọn SKU dòng ${idx + 1}`}
                    value={line.skuId}
                    onChange={(e) => {
                      const v = e.target.value
                      setLines((prev) =>
                        prev.map((l, i) => (i === idx ? { ...l, skuId: v } : l))
                      )
                    }}
                    className={`${inputClass} min-w-0 flex-[1]`}
                  >
                    <option value="">SKU</option>
                    {skus.map((s) => (
                      <option key={s.skuId} value={s.skuId}>
                        {s.skuCode} — {s.productName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    aria-label={`Số lượng dòng ${idx + 1}`}
                    value={line.requestedQuantity}
                    onChange={(e) => {
                      const n = Math.max(1, Number(e.target.value) || 1)
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === idx ? { ...l, requestedQuantity: n } : l
                        )
                      )
                    }}
                    className={`${inputClass} w-24 flex-[1]`}
                  />
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors border border-transparent"
                    >
                      <span className="material-symbols-outlined text-lg block">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting || loading}
            className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm shadow-orange-600/10"
          >
            {submitting ? 'Đang gửi…' : 'Gửi phiếu (PENDING)'}
          </button>
        </div>
      </form>

      {alert.open && (
        <AlertModal
          title="Thông báo"
          message={alert.message}
          type={alert.type ?? 'success'}
          onClose={() => setAlert({ open: false, message: '' })}
        />
      )}
    </div>
  )
}