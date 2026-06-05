import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
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
import {
  InboundPickupForm,
  emptyPickupForm,
  type PickupFormState,
} from '../../components/inbound/InboundPickupForm'
import { DELIVERY_MODE_OPTIONS, type DeliveryMode } from '../../data/deliveryMode'
import * as tenantsApi from '../../api/tenants'
import { DateTimePickerField } from '../../components/ui/DateTimePickerField'
import {
  contractStartDatetimeLocal,
  formatContractDateLabel,
  isArrivalBeforeContractStart,
} from '../../utils/contractDates'

type LineDraft = { skuId: string; expectedQuantity: number }

export function InboundCreatePage({ basePath }: { basePath: string }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''
  const isTenantAdmin = user?.role === 'TENANT_ADMIN'

  const [contracts, setContracts] = useState<
    Awaited<ReturnType<typeof contractsApi.listContracts>>['items']
  >([])
  const [warehouseCodes, setWarehouseCodes] = useState<Map<string, string>>(new Map())
  const [skus, setSkus] = useState<ApiSku[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const submitLockRef = useRef(false)
  const [error, setError] = useState('')

  const [contractId, setContractId] = useState('')
  const [expectedArrivalDate, setExpectedArrivalDate] = useState('')
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('TENANT_SELF')
  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormState>(emptyDeliveryForm())
  const [pickupForm, setPickupForm] = useState<PickupFormState>(emptyPickupForm())
  const [lines, setLines] = useState<LineDraft[]>([{ skuId: '', expectedQuantity: 1 }])

  const [alert, setAlert] = useState<{
    open: boolean
    type?: 'success' | 'error' | 'warning'
    message: string
  }>({
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

  useEffect(() => {
    if (deliveryMode !== 'WAREHOUSE_TRANSPORT' || !tenantId) return
    let cancelled = false
    tenantsApi
      .getTenant(tenantId)
      .then((tenant) => {
        if (cancelled) return
        setPickupForm((prev) => ({
          pickupAddress: prev.pickupAddress || tenant.address || '',
          pickupContactName: prev.pickupContactName || tenant.contactName || '',
          pickupContactPhone: prev.pickupContactPhone || tenant.contactPhone || '',
          pickupNotes: prev.pickupNotes ?? '',
        }))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [deliveryMode, tenantId])

  const selectedContract = contracts.find((c) => c.contractId === contractId)
  const contractStartMin = contractStartDatetimeLocal(selectedContract?.startDate)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId || !contractId || !selectedContract) {
      setAlert({ open: true, type: 'warning', message: 'Chọn hợp đồng ACTIVE' })
      return
    }
    const validLines = lines.filter((l) => l.skuId && l.expectedQuantity > 0)
    if (validLines.length === 0) {
      setAlert({ open: true, type: 'warning', message: 'Thêm ít nhất một dòng SKU' })
      return
    }

    if (deliveryMode === 'WAREHOUSE_TRANSPORT') {
      if (!pickupForm.pickupAddress.trim()) {
        setAlert({ open: true, type: 'warning', message: 'Nhập địa chỉ lấy hàng' })
        return
      }
      if (!pickupForm.pickupContactName.trim() || !pickupForm.pickupContactPhone.trim()) {
        setAlert({
          open: true,
          type: 'warning',
          message: 'Nhập người liên hệ và SĐT tại điểm lấy hàng',
        })
        return
      }
    }

    if (
      expectedArrivalDate &&
      isArrivalBeforeContractStart(expectedArrivalDate, selectedContract.startDate)
    ) {
      setAlert({
        open: true,
        type: 'warning',
        message: `Ngày dự kiến đến kho không được trước ngày bắt đầu hợp đồng (${formatContractDateLabel(selectedContract.startDate)}).`,
      })
      return
    }

    if (submitLockRef.current) return
    submitLockRef.current = true
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
        items: validLines.map((line) => ({
          skuId: line.skuId,
          expectedQuantity: line.expectedQuantity,
        })),
      })

      if (deliveryMode === 'TENANT_SELF' && deliveryForm.vehiclePlate?.trim()) {
        await deliveryApi.upsertInboundDelivery(inbound.inboundRequestId, {
          vehiclePlate: deliveryForm.vehiclePlate?.trim(),
          driverName: deliveryForm.driverName?.trim() || undefined,
          driverPhone: deliveryForm.driverPhone?.trim() || undefined,
          driverIdNumber: deliveryForm.driverIdNumber?.trim() || undefined,
          carrierName: deliveryForm.carrierName?.trim() || undefined,
          notes: deliveryForm.notes?.trim() || undefined,
        })
      }

      if (deliveryMode === 'WAREHOUSE_TRANSPORT') {
        await deliveryApi.upsertInboundDelivery(inbound.inboundRequestId, {
          pickupAddress: pickupForm.pickupAddress.trim(),
          pickupContactName: pickupForm.pickupContactName.trim(),
          pickupContactPhone: pickupForm.pickupContactPhone.trim(),
          pickupNotes: pickupForm.pickupNotes?.trim() || undefined,
        })
      }

      navigate(`${basePath}/${inbound.inboundRequestId}`)
    } catch (err) {
      setAlert({
        open: true,
        type: 'error',
        message: err instanceof ApiError ? err.message : 'Tạo yêu cầu thất bại',
      })
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }

  if (!isTenantAdmin) {
    return <Navigate to={basePath} replace />
  }

  return (
    <div className="flex max-w-screen overflow-hidden bg-slate-50 text-slate-800">
      <LoadingOverlay show={loading || submitting} text={submitting ? 'Đang tạo...' : 'Đang tải...'} />
      <main className="relative flex flex-1 flex-col overflow-hidden bg-slate-50">
        <div className="relative z-10 mx-auto w-full max-w-3xl p-8">
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="mb-4 text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:underline"
          >
            ← Quay lại danh sách
          </button>

          <h1 className="mb-6 text-2xl font-bold text-slate-900">Tạo yêu cầu nhập kho</h1>

          {error && (
            <InlineAlert
              variant="error"
              message={error}
              onDismiss={() => setError('')}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              <span className="font-normal text-slate-500">Hợp đồng (ACTIVE)</span>
              <select
                required
                value={contractId}
                onChange={(e) => {
                  const nextId = e.target.value
                  setContractId(nextId)
                  const next = contracts.find((c) => c.contractId === nextId)
                  if (
                    next?.startDate &&
                    expectedArrivalDate &&
                    isArrivalBeforeContractStart(expectedArrivalDate, next.startDate)
                  ) {
                    setExpectedArrivalDate('')
                  }
                }}
                className="font-normal rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
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

            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-slate-700">Ngày dự kiến đến kho</span>
              <DateTimePickerField
                id="expected-arrival"
                value={expectedArrivalDate}
                onChange={setExpectedArrivalDate}
                min={contractStartMin || undefined}
                disabled={!contractId}
                placeholder="Chọn ngày và giờ dự kiến"
              />
              {selectedContract?.startDate && (
                <p className="flex items-start gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-slate-600">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-base text-cyan-600">
                    info
                  </span>
                  <span>
                    Không được chọn trước ngày bắt đầu hợp đồng{' '}
                    <strong className="text-cyan-700 font-semibold">
                      {formatContractDateLabel(selectedContract.startDate)}
                    </strong>
                    . Chọn ngày trên lịch, giờ bên phải, rồi bấm <strong className="text-slate-800 font-semibold">Xác nhận</strong>.
                  </span>
                </p>
              )}
            </div>

            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              <span className="font-normal text-slate-500">Hình thức vận chuyển</span>
              <select
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
                className="font-normal rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
              >
                {DELIVERY_MODE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="font-normal text-xs text-slate-400 mt-0.5">
                {DELIVERY_MODE_OPTIONS.find((o) => o.value === deliveryMode)?.hint}
              </span>
            </label>

            {deliveryMode === 'TENANT_SELF' && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">
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

            {deliveryMode === 'WAREHOUSE_TRANSPORT' && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                <p className="mb-3 text-sm font-semibold text-emerald-800">Điểm lấy hàng</p>
                <InboundPickupForm value={pickupForm} onChange={setPickupForm} />
              </div>
            )}

            <div>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Dòng hàng (SKU)</p>
                  <p className="mt-1 max-w-xl text-xs text-slate-400">
                    Mỗi dòng là một mã hàng kèm{' '}
                    <strong className="font-semibold text-slate-500">
                      số lượng dự kiến nhập kho
                    </strong>{' '}
                    — số đơn vị bạn khai báo trước khi hàng tới; kho sẽ đối chiếu khi kiểm đếm.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLines((prev) => [...prev, { skuId: '', expectedQuantity: 1 }])}
                  className="shrink-0 text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
                >
                  + Thêm dòng
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div
                  className="hidden gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[minmax(0,1fr)_10.5rem_2.5rem]"
                  aria-hidden
                >
                  <span>Mã hàng (SKU)</span>
                  <span>Số lượng dự kiến nhập kho</span>
                  <span />
                </div>

                <div className="divide-y divide-slate-100">
                  {lines.map((line, idx) => {
                    const skuSelectId = `inbound-line-sku-${idx}`
                    const qtyInputId = `inbound-line-qty-${idx}`
                    return (
                      <div
                        key={idx}
                        className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_10.5rem_2.5rem] sm:items-start"
                      >
                        {lines.length > 1 && (
                          <p className="col-span-full text-xs font-bold text-slate-400 sm:hidden">
                            Dòng {idx + 1}
                          </p>
                        )}

                        <label htmlFor={skuSelectId} className="flex min-w-0 flex-col gap-1.5">
                          <span className="text-xs text-slate-500 sm:sr-only">Mã hàng (SKU)</span>
                          <span className="text-xs font-bold text-slate-500 sm:hidden">
                            Mã hàng (SKU)
                          </span>
                          <select
                            id={skuSelectId}
                            required
                            title="Chọn mã hàng SKU"
                            value={line.skuId}
                            onChange={(e) => {
                              const skuId = e.target.value
                              setLines((prev) =>
                                prev.map((l, i) => (i === idx ? { ...l, skuId } : l))
                              )
                            }}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                          >
                            <option value="">— Chọn mã hàng —</option>
                            {skus.map((s) => (
                              <option key={s.skuId} value={s.skuId}>
                                {s.skuCode} — {s.productName}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label htmlFor={qtyInputId} className="flex flex-col gap-1.5">
                          <span className="text-xs font-bold text-slate-500">
                            Số lượng dự kiến nhập kho
                          </span>
                          <div className="relative">
                            <input
                              id={qtyInputId}
                              type="number"
                              min={1}
                              step={1}
                              required
                              inputMode="numeric"
                              aria-describedby={`${qtyInputId}-hint`}
                              value={line.expectedQuantity}
                              onChange={(e) => {
                                const n = Number(e.target.value)
                                setLines((prev) =>
                                  prev.map((l, i) =>
                                    i === idx ? { ...l, expectedQuantity: n } : l
                                  )
                                )
                              }}
                              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-14 text-sm text-slate-800 tabular-nums focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                              placeholder="VD: 100"
                            />
                            <span
                              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400"
                              aria-hidden
                            >
                              đơn vị
                            </span>
                          </div>
                          <span id={`${qtyInputId}-hint`} className="text-[11px] leading-snug text-slate-400">
                            Tổng số cái/thùng/kiện bạn dự kiến giao cho mã này.
                          </span>
                        </label>

                        <div className="flex items-end justify-end sm:justify-center sm:pt-7">
                          {lines.length > 1 && (
                            <button
                              type="button"
                              title="Xóa dòng hàng"
                              onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                              className="rounded-lg px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-cyan-600 py-2.5 font-semibold text-white shadow-sm hover:bg-cyan-700 transition-colors disabled:opacity-50"
            >
              Gửi yêu cầu nhập
            </button>
          </form>
        </div>
      </main>

      {alert.open && (
        <AlertModal
          title={alert.type === 'error' ? 'Có lỗi xảy ra' : alert.type === 'warning' ? 'Lưu ý' : 'Thông báo'}
          message={alert.message}
          type={alert.type ?? 'success'}
          onClose={() => setAlert({ open: false, message: '' })}
        />
      )}
    </div>
  )
}