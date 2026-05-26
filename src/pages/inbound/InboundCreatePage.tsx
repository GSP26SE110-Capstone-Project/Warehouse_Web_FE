import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as inboundApi from '../../api/inboundRequests'
import * as contractsApi from '../../api/contracts'
import * as skusApi from '../../api/skus'
import * as warehousesApi from '../../api/warehouses'
import type { ApiSku } from '../../api/skus'
import * as deliveryApi from '../../api/inboundDeliveries'
import {
  InboundDeliveryForm,
  emptyDeliveryForm,
  type DeliveryFormState,
} from '../../components/inbound/InboundDeliveryForm'
import { DELIVERY_MODE_OPTIONS, type DeliveryMode } from '../../data/deliveryMode'

type LineDraft = { skuId: string; expectedQuantity: number }

export function InboundCreatePage({ basePath }: { basePath: string }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''

  const [contracts, setContracts] = useState<
    Awaited<ReturnType<typeof contractsApi.listContracts>>['items']
  >([])
  const [warehouseCodes, setWarehouseCodes] = useState<Map<string, string>>(new Map())
  const [skus, setSkus] = useState<ApiSku[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [contractId, setContractId] = useState('')
  const [expectedArrivalDate, setExpectedArrivalDate] = useState('')
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('TENANT_SELF')
  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormState>(emptyDeliveryForm())
  const [lines, setLines] = useState<LineDraft[]>([{ skuId: '', expectedQuantity: 1 }])

  const [alert, setAlert] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [cRes, sRes, whRes] = await Promise.all([
        contractsApi.listContracts({ tenantId, status: 'ACTIVE', limit: 100 }),
        skusApi.listSkus({ tenantId, status: 'ACTIVE', limit: 200 }),
        warehousesApi.listWarehouses({ limit: 200 }),
      ])
      setContracts(cRes.items)
      setSkus(sRes.items)
      setWarehouseCodes(
        new Map(whRes.items.map((w) => [w.warehouseId, w.warehouseCode]))
      )
      if (cRes.items.length === 1) setContractId(cRes.items[0].contractId)
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
      setAlert({ open: true, message: 'Chọn hợp đồng ACTIVE' })
      return
    }
    const validLines = lines.filter((l) => l.skuId && l.expectedQuantity > 0)
    if (validLines.length === 0) {
      setAlert({ open: true, message: 'Thêm ít nhất một dòng SKU' })
      return
    }

    setSubmitting(true)
    try {
      const inbound = await inboundApi.createInboundRequest({
        tenantId,
        contractId,
        warehouseId: selectedContract.warehouseId,
        deliveryMode,
        expectedArrivalDate: expectedArrivalDate
          ? new Date(expectedArrivalDate).toISOString()
          : undefined,
        status: 'PENDING',
        createdBy: user?.userId,
      })

      if (deliveryMode === 'TENANT_SELF' && deliveryForm.vehiclePlate.trim()) {
        await deliveryApi.upsertInboundDelivery(inbound.inboundRequestId, {
          vehiclePlate: deliveryForm.vehiclePlate.trim(),
          driverName: deliveryForm.driverName?.trim() || undefined,
          driverPhone: deliveryForm.driverPhone?.trim() || undefined,
          driverIdNumber: deliveryForm.driverIdNumber?.trim() || undefined,
          carrierName: deliveryForm.carrierName?.trim() || undefined,
          notes: deliveryForm.notes?.trim() || undefined,
        })
      }

      for (const line of validLines) {
        await inboundApi.createInboundItem(inbound.inboundRequestId, {
          skuId: line.skuId,
          expectedQuantity: line.expectedQuantity,
        })
      }

      navigate(`${basePath}/${inbound.inboundRequestId}`)
    } catch (err) {
      setAlert({
        open: true,
        message: err instanceof ApiError ? err.message : 'Tạo yêu cầu thất bại',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading || submitting} text={submitting ? 'Đang tạo...' : 'Đang tải...'} />
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[#0b101a]">
        <div className="relative z-10 mx-auto w-full max-w-3xl p-8">
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="mb-4 text-sm text-cyan-400 hover:underline"
          >
            ← Quay lại danh sách
          </button>

          <h1 className="mb-6 text-2xl font-bold">Tạo yêu cầu nhập kho</h1>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-xl border border-white/10 bg-white/5 p-6">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Hợp đồng (ACTIVE)</span>
              <select
                required
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2"
              >
                <option value="">— Chọn hợp đồng —</option>
                {contracts.map((c) => {
                  const whCode = warehouseCodes.get(c.warehouseId) ?? '—'
                  return (
                    <option key={c.contractId} value={c.contractId}>
                      {c.contractCode} — {whCode}
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Ngày dự kiến đến kho</span>
              <input
                type="datetime-local"
                value={expectedArrivalDate}
                onChange={(e) => setExpectedArrivalDate(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Hình thức vận chuyển</span>
              <select
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
                className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2"
              >
                {DELIVERY_MODE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500">
                {DELIVERY_MODE_OPTIONS.find((o) => o.value === deliveryMode)?.hint}
              </span>
            </label>

            {deliveryMode === 'TENANT_SELF' && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="mb-3 text-sm font-medium text-slate-300">
                  Thông tin xe (khuyến nghị trước khi xe vào cổng)
                </p>
                <InboundDeliveryForm
                  deliveryMode={deliveryMode}
                  value={deliveryForm}
                  onChange={setDeliveryForm}
                  compact
                />
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-400">Dòng hàng (SKU)</span>
                <button
                  type="button"
                  onClick={() => setLines((prev) => [...prev, { skuId: '', expectedQuantity: 1 }])}
                  className="text-xs text-cyan-400"
                >
                  + Thêm dòng
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2">
                    <select
                      required
                      value={line.skuId}
                      onChange={(e) => {
                        const skuId = e.target.value
                        setLines((prev) =>
                          prev.map((l, i) => (i === idx ? { ...l, skuId } : l))
                        )
                      }}
                      className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
                    >
                      <option value="">— SKU —</option>
                      {skus.map((s) => (
                        <option key={s.skuId} value={s.skuId}>
                          {s.skuCode} — {s.productName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      required
                      value={line.expectedQuantity}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx ? { ...l, expectedQuantity: n } : l
                          )
                        )
                      }}
                      className="w-28 rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
                      placeholder="SL"
                    />
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 text-sm"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-cyan-500 py-2 font-semibold text-slate-900 hover:bg-cyan-400 disabled:opacity-50"
            >
              Gửi yêu cầu nhập
            </button>
          </form>
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
