import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { DateTimePickerField } from '../../components/ui/DateTimePickerField'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as outboundApi from '../../api/outboundRequests'
import * as deliveryApi from '../../api/outboundDeliveries'
import { OUTBOUND_DELIVERY_MODE_OPTIONS, type DeliveryMode } from '../../data/deliveryMode'
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
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('TENANT_SELF')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [shipToAddress, setShipToAddress] = useState('')
  const [shipToContactName, setShipToContactName] = useState('')
  const [shipToContactPhone, setShipToContactPhone] = useState('')
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

    if (deliveryMode === 'WAREHOUSE_TRANSPORT') {
      if (!shipToAddress.trim() || !shipToContactName.trim() || !shipToContactPhone.trim()) {
        setAlert({ open: true, type: 'warning', message: 'Nhập đầy đủ địa chỉ giao hàng' })
        return
      }
    }
    if (deliveryMode === 'TENANT_SELF' && !vehiclePlate.trim()) {
      setAlert({ open: true, type: 'warning', message: 'Nhập biển số xe lấy hàng' })
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
        deliveryMode,
        status: 'PENDING',
        items: validLines,
      })
      if (deliveryMode === 'WAREHOUSE_TRANSPORT') {
        await deliveryApi.upsertOutboundDelivery(created.outboundRequestId, {
          shipToAddress: shipToAddress.trim(),
          shipToContactName: shipToContactName.trim(),
          shipToContactPhone: shipToContactPhone.trim(),
        })
      } else {
        await deliveryApi.upsertOutboundDelivery(created.outboundRequestId, {
          vehiclePlate: vehiclePlate.trim().toUpperCase(),
        })
      }
      navigate(`${basePath}/${created.outboundRequestId}`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Tạo phiếu xuất thất bại'
      setError(msg)
      setAlert({ open: true, type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading} text="Đang tải..." />
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-bold text-white">Tạo yêu cầu xuất kho</h1>
        <p className="mt-1 text-sm text-slate-400">
          Cần HĐ ACTIVE hoặc TERMINATED, đã có inbound hoàn tất và tồn khả dụng.
        </p>

        {error && (
          <div className="mt-4">
            <InlineAlert message={error} onDismiss={() => setError('')} />
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Hợp đồng *
            </label>
            <select
              required
              aria-label="Chọn hợp đồng"
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm"
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

          <DateTimePickerField
            id="requested-ship-date"
            value={requestedShipDate}
            onChange={setRequestedShipDate}
            placeholder="Ngày xuất dự kiến"
          />

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Hình thức giao hàng *
            </label>
            <select
              aria-label="Hình thức giao hàng"
              value={deliveryMode}
              onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
              className="w-full rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm"
            >
              {OUTBOUND_DELIVERY_MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {OUTBOUND_DELIVERY_MODE_OPTIONS.find((o) => o.value === deliveryMode)?.hint}
            </p>
          </div>

          {deliveryMode === 'TENANT_SELF' && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Biển số xe lấy hàng *
              </label>
              <input
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm font-mono uppercase"
                placeholder="51A-12345"
              />
            </div>
          )}

          {deliveryMode === 'WAREHOUSE_TRANSPORT' && (
            <div className="space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-400/90">Địa chỉ giao hàng</p>
              <input
                value={shipToAddress}
                onChange={(e) => setShipToAddress(e.target.value)}
                placeholder="Địa chỉ nhận hàng *"
                className="w-full rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm"
              />
              <input
                value={shipToContactName}
                onChange={(e) => setShipToContactName(e.target.value)}
                placeholder="Tên người nhận *"
                className="w-full rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm"
              />
              <input
                value={shipToContactPhone}
                onChange={(e) => setShipToContactPhone(e.target.value)}
                placeholder="SĐT người nhận *"
                className="w-full rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Dòng SKU *</span>
              <button
                type="button"
                onClick={() =>
                  setLines((prev) => [...prev, { skuId: '', requestedQuantity: 1 }])
                }
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                + Thêm dòng
              </button>
            </div>
            <div className="space-y-2">
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
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm"
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
                    className="w-24 rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm"
                  />
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded p-2 text-slate-500 hover:bg-white/5"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="text-sm text-slate-400 hover:text-white"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting || loading}
            className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-slate-900 hover:bg-orange-400 disabled:opacity-50"
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
