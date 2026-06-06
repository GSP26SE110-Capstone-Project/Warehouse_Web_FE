import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { OutboundStatusBadge } from '../../components/outbound/OutboundStatusBadge'
import { FifoAllocationTable } from '../../components/outbound/FifoAllocationTable'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as outboundApi from '../../api/outboundRequests'
import * as deliveryApi from '../../api/outboundDeliveries'
import type { ApiOutboundDelivery } from '../../api/outboundDeliveries'
import * as usersApi from '../../api/users'
import type { ApiUser } from '../../api/types'
import type {
  ApiOutboundRequestWithItems,
  OutboundFifoPreviewResponse,
  OutboundPickingTasksResponse,
  OutboundStatus,
} from '../../api/outboundRequests'
import { OUTBOUND_DELIVERY_MODE_OPTIONS } from '../../data/deliveryMode'
import { getWhOutboundNextAction } from '../../data/outboundStatus'
import { formatDate } from '../../mappers'
import { OperationalInvoicePayPanel } from '../../components/billing/OperationalInvoicePayPanel'
import * as warehousesApi from '../../api/warehouses'
import type { ApiWarehouse } from '../../api/types'

type Mode = 'tenant' | 'warehouse' | 'transporter'

type Props = {
  mode: Mode
  basePath: string
}

export function OutboundDetailPage({ mode, basePath }: Props) {
  const { outboundRequestId = '' } = useParams()
  const { user } = useAuth()
  const isWarehouse = mode === 'warehouse'
  const isTransporter = mode === 'transporter'
  const isTenant = mode === 'tenant'

  const [outbound, setOutbound] = useState<ApiOutboundRequestWithItems | null>(null)
  const [delivery, setDelivery] = useState<ApiOutboundDelivery | null>(null)
  const [picking, setPicking] = useState<OutboundPickingTasksResponse | null>(null)
  const [fifoPreview, setFifoPreview] = useState<OutboundFifoPreviewResponse | null>(null)
  const [staffList, setStaffList] = useState<ApiUser[]>([])
  const [transporters, setTransporters] = useState<ApiUser[]>([])
  const [assignedPickerUserId, setAssignedPickerUserId] = useState('')
  const [assignedDriverUserId, setAssignedDriverUserId] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [shipToAddress, setShipToAddress] = useState('')
  const [shipToContactName, setShipToContactName] = useState('')
  const [shipToContactPhone, setShipToContactPhone] = useState('')
  const [warehouse, setWarehouse] = useState<ApiWarehouse | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [alert, setAlert] = useState<{ open: boolean; message: string; type?: 'success' | 'error' }>({
    open: false,
    message: '',
  })

  const isWhAdmin =
    isWarehouse && (user?.role === 'WH_ADMIN' || user?.role === 'SYSTEM_ADMIN')
  const isWhStaff = isWarehouse && user?.role === 'WH_STAFF'

  const load = useCallback(async () => {
    if (!outboundRequestId) return
    setLoading(true)
    setError('')
    try {
      const loadPreview =
        isWhAdmin && !isTransporter
          ? outboundApi.previewOutboundFifoAllocation(outboundRequestId).catch(() => null)
          : Promise.resolve(null)

      const [ob, pick, preview] = await Promise.all([
        outboundApi.getOutboundRequest(outboundRequestId, {
          includeItems: true,
          includeDelivery: true,
        }),
        isTransporter
          ? Promise.resolve(null)
          : outboundApi.listOutboundPickingTasks(outboundRequestId).catch(() => null),
        loadPreview,
      ])
      setOutbound(ob)
      setDelivery(ob.delivery ?? null)
      setPicking(pick)
      setFifoPreview(
        preview && ['PENDING', 'APPROVED'].includes(ob.status) ? preview : null
      )
      if (ob.delivery) {
        setAssignedDriverUserId(ob.delivery.assignedDriverUserId ?? '')
        setVehiclePlate(ob.delivery.vehiclePlate ?? '')
        setShipToAddress(ob.delivery.shipToAddress ?? '')
        setShipToContactName(ob.delivery.shipToContactName ?? '')
        setShipToContactPhone(ob.delivery.shipToContactPhone ?? '')
      }
      if (ob.deliveryMode === 'WAREHOUSE_TRANSPORT' && ob.warehouseId) {
        warehousesApi
          .getWarehouse(ob.warehouseId)
          .then(setWarehouse)
          .catch(() => setWarehouse(null))
      } else {
        setWarehouse(null)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được phiếu xuất')
    } finally {
      setLoading(false)
    }
  }, [outboundRequestId, isTransporter, isWhAdmin])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!isWhAdmin) return
    void Promise.all([
      usersApi.listUsers({ role: 'WH_STAFF', status: 'ACTIVE', limit: 100 }),
      usersApi.listUsers({ role: 'WH_TRANSPORTER', status: 'ACTIVE', limit: 100 }),
    ])
      .then(([staff, trans]) => {
        setStaffList(staff.items)
        setTransporters(trans.items)
      })
      .catch(() => {
        setStaffList([])
        setTransporters([])
      })
  }, [isWhAdmin])

  useEffect(() => {
    const assigned = picking?.tasks[0]?.assignedTo
    if (assigned) setAssignedPickerUserId(assigned)
  }, [picking?.tasks])

  const patchStatus = async (status: OutboundStatus) => {
    if (!outboundRequestId) return
    if (
      status === 'APPROVED' &&
      isWhAdmin &&
      outbound?.status === 'PENDING' &&
      !assignedPickerUserId.trim()
    ) {
      setError('Chọn nhân viên pick trước khi duyệt')
      return
    }
    setBusy(true)
    setError('')
    try {
      await outboundApi.updateOutboundRequest(outboundRequestId, {
        status,
        ...(status === 'APPROVED' && assignedPickerUserId.trim()
          ? { assignedPickerUserId: assignedPickerUserId.trim() }
          : {}),
      })
      await load()
      setAlert({ open: true, type: 'success', message: 'Cập nhật trạng thái thành công' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cập nhật thất bại')
    } finally {
      setBusy(false)
    }
  }

  const savePickerAssignment = async () => {
    if (!outboundRequestId || !assignedPickerUserId.trim()) {
      setError('Chọn nhân viên pick')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await outboundApi.assignOutboundPicker(outboundRequestId, {
        assignedPickerUserId: assignedPickerUserId.trim(),
      })
      setPicking(result)
      setAlert({ open: true, type: 'success', message: 'Đã gán nhân viên pick' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gán nhân viên thất bại')
    } finally {
      setBusy(false)
    }
  }

  const assignedPickerId = picking?.tasks[0]?.assignedTo
  const assignedPickerName =
    staffList.find((s) => s.userId === assignedPickerId)?.fullName ?? assignedPickerId

  const reservedFifoRows =
    picking?.tasks.flatMap((task) => task.items) ?? []

  const nextAction = (() => {
    if (!outbound || isTransporter) return undefined
    const action = getWhOutboundNextAction(outbound.status, user?.role)
    if (isWhStaff && assignedPickerId && assignedPickerId !== user?.userId) {
      return undefined
    }
    return action
  })()

  const saveDelivery = async (body: Parameters<typeof deliveryApi.upsertOutboundDelivery>[1]) => {
    if (!outboundRequestId) return
    setBusy(true)
    setError('')
    try {
      const saved = await deliveryApi.upsertOutboundDelivery(outboundRequestId, body)
      setDelivery(saved)
      setAlert({ open: true, type: 'success', message: 'Đã lưu thông tin giao hàng' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lưu thất bại')
    } finally {
      setBusy(false)
    }
  }

  const saveTenantDelivery = () => {
    if (outbound?.deliveryMode === 'WAREHOUSE_TRANSPORT') {
      const city = warehouse?.city?.trim()
      const district = warehouse?.district?.trim()
      if (!city || !district) {
        setError('Kho chưa có thông tin thành phố/quận — liên hệ WH Admin')
        return Promise.resolve()
      }
      return saveDelivery({
        shipToAddress,
        shipToCity: city,
        shipToDistrict: district,
        shipToContactName,
        shipToContactPhone,
      })
    }
    return saveDelivery({
      vehiclePlate,
    })
  }

  const saveAdminDriver = () =>
    saveDelivery({
      assignedDriverUserId: assignedDriverUserId.trim() || null,
      vehiclePlate: vehiclePlate.trim() || undefined,
    })

  const reportPickup = async () => {
    setBusy(true)
    try {
      await deliveryApi.reportOutboundPickup(outboundRequestId)
      await load()
      setAlert({ open: true, type: 'success', message: 'Đã báo lấy hàng khỏi kho' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Thất bại')
    } finally {
      setBusy(false)
    }
  }

  const reportDelivered = async () => {
    setBusy(true)
    try {
      await deliveryApi.reportOutboundDelivery(outboundRequestId)
      await load()
      setAlert({ open: true, type: 'success', message: 'Đã báo giao hàng thành công' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Thất bại')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = () => patchStatus('CANCELLED')
  const canWhAct = isWhAdmin || isWhStaff
  const canWhCancel =
    canWhAct && !['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(outbound?.status ?? '')
  const canTenantCancel =
    mode === 'tenant' &&
    outbound &&
    ['DRAFT', 'PENDING'].includes(outbound.status)

  return (
    <div className="min-h-screen bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading} text="Đang tải phiếu xuất..." />
      <div className="mx-auto max-w-4xl p-8">
        <Link to={basePath} className="text-sm text-slate-400 hover:text-white">
          ← Danh sách xuất kho
        </Link>

        {error && (
          <div className="mt-4">
            <InlineAlert message={error} onDismiss={() => setError('')} />
          </div>
        )}

        {outbound && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-mono text-2xl font-bold text-orange-300">
                  {outbound.outboundCode}
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Ngày xuất dự kiến: {formatDate(outbound.requestedShipDate)}
                  {outbound.actualShippedAt && (
                    <> · Thực xuất: {formatDate(outbound.actualShippedAt)}</>
                  )}
                  {outbound.deliveryMode && (
                    <>
                      {' · '}
                      {OUTBOUND_DELIVERY_MODE_OPTIONS.find((o) => o.value === outbound.deliveryMode)
                        ?.label ?? outbound.deliveryMode}
                    </>
                  )}
                </p>
                {delivery?.deliveryStatus && outbound.deliveryMode === 'WAREHOUSE_TRANSPORT' && (
                  <p className="mt-1 text-xs text-cyan-300/90">
                    Giao hàng: {delivery.deliveryStatus}
                  </p>
                )}
              </div>
              <OutboundStatusBadge status={outbound.status} />
            </div>

            {isWhAdmin && fifoPreview && ['PENDING', 'APPROVED'].includes(outbound.status) && (
              <section className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-cyan-200">
                      Xem trước phân bổ FIFO
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Danh sách LPN sẽ được reserve theo thứ tự nhập kho (
                      {fifoPreview.fifoPolicy}) — gồm batch tương ứng.
                    </p>
                  </div>
                  {!fifoPreview.sufficient && (
                    <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300 ring-1 ring-red-400/30">
                      Thiếu tồn
                    </span>
                  )}
                </div>
                <FifoAllocationTable rows={fifoPreview.allocations} />
              </section>
            )}

            {isWhAdmin && outbound.status === 'PENDING' && (
              <section className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                <p className="text-sm font-medium text-violet-200">Gán nhân viên pick</p>
                <p className="mt-1 text-xs text-slate-400">
                  Bắt buộc trước khi duyệt — nhân viên sẽ nhận email và thấy phiếu trong danh sách
                  pick.
                </p>
                <select
                  aria-label="Chọn nhân viên pick"
                  value={assignedPickerUserId}
                  onChange={(e) => setAssignedPickerUserId(e.target.value)}
                  className="mt-3 w-full max-w-md rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                >
                  <option value="">— Chọn WH Staff —</option>
                  {staffList.map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.fullName} · {s.email}
                    </option>
                  ))}
                </select>
                {staffList.length === 0 && (
                  <p className="mt-2 text-xs text-amber-300/90">
                    Chưa có WH_STAFF — tạo trong Quản lý tài khoản.
                  </p>
                )}
              </section>
            )}

            {isWhAdmin && outbound.status === 'RESERVED' && (picking?.tasks?.length ?? 0) > 0 && (
              <section className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                <p className="text-sm font-medium text-violet-200">Đổi nhân viên pick</p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <select
                    aria-label="Nhân viên pick"
                    value={assignedPickerUserId}
                    onChange={(e) => setAssignedPickerUserId(e.target.value)}
                    className="min-w-[240px] rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  >
                    <option value="">— Chọn WH Staff —</option>
                    {staffList.map((s) => (
                      <option key={s.userId} value={s.userId}>
                        {s.fullName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy || !assignedPickerUserId.trim()}
                    onClick={() => void savePickerAssignment()}
                    className="rounded-lg border border-violet-400/40 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-400/10 disabled:opacity-50"
                  >
                    Lưu gán picker
                  </button>
                </div>
              </section>
            )}

            {isTenant && ['DRAFT', 'PENDING'].includes(outbound.status) && (
              <OperationalInvoicePayPanel
                contractId={outbound.contractId}
                title="Phí outbound — thanh toán trước khi kho duyệt / pick"
                hint="Bao gồm phí LPN xuất và phí vận chuyển kho (250.000 ₫/chuyến nếu có)."
                loadInvoice={() =>
                  outboundApi.getOutboundOperationalInvoice(outboundRequestId)
                }
                onPaid={() => void load()}
              />
            )}

            {isTenant &&
              outbound.deliveryMode === 'WAREHOUSE_TRANSPORT' &&
              ['PENDING', 'DRAFT'].includes(outbound.status) && (
                <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="text-sm font-medium text-emerald-200">Địa chỉ giao hàng</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Chỉ giao trong cùng thành phố và quận với kho (
                    {warehouse?.city && warehouse?.district
                      ? `${warehouse.city} · ${warehouse.district}`
                      : 'đang tải…'}
                    ).
                  </p>
                  <div className="mt-3 space-y-2">
                    <input
                      aria-label="Địa chỉ giao"
                      value={shipToAddress}
                      onChange={(e) => setShipToAddress(e.target.value)}
                      placeholder="Địa chỉ nhận hàng *"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    />
                    <input
                      aria-label="Người nhận"
                      value={shipToContactName}
                      onChange={(e) => setShipToContactName(e.target.value)}
                      placeholder="Tên người nhận *"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    />
                    <input
                      aria-label="SĐT người nhận"
                      value={shipToContactPhone}
                      onChange={(e) => setShipToContactPhone(e.target.value)}
                      placeholder="SĐT người nhận *"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveTenantDelivery()}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      Lưu địa chỉ giao
                    </button>
                  </div>
                </section>
              )}

            {isTenant &&
              outbound.deliveryMode === 'TENANT_SELF' &&
              ['PENDING', 'DRAFT'].includes(outbound.status) && (
                <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="text-sm font-medium text-emerald-200">Xe lấy hàng tại kho</p>
                  <input
                    aria-label="Biển số xe"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="Biển số xe *"
                    className="mt-3 w-full max-w-xs rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-mono uppercase"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveTenantDelivery()}
                    className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Lưu thông tin xe
                  </button>
                </section>
              )}

            {isWhAdmin &&
              outbound.status === 'SHIPPED' &&
              outbound.deliveryMode === 'WAREHOUSE_TRANSPORT' && (
                <section className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                  <p className="text-sm font-medium text-cyan-200">Gán tài xế giao hàng</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Sau khi trừ tồn (SHIPPED) — tài xế sẽ lấy hàng tại kho và giao theo địa chỉ tenant.
                  </p>
                  {delivery?.shipToAddress && (
                    <p className="mt-2 text-xs text-emerald-300/90">
                      Giao đến: {delivery.shipToAddress}
                    </p>
                  )}
                  <select
                    aria-label="Chọn tài xế"
                    value={assignedDriverUserId}
                    onChange={(e) => setAssignedDriverUserId(e.target.value)}
                    className="mt-3 w-full max-w-md rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  >
                    <option value="">— Chọn WH_TRANSPORTER —</option>
                    {transporters.map((t) => (
                      <option key={t.userId} value={t.userId}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy || !assignedDriverUserId.trim()}
                    onClick={() => void saveAdminDriver()}
                    className="mt-3 rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/10 disabled:opacity-50"
                  >
                    Lưu gán tài xế
                  </button>
                </section>
              )}

            {isTransporter && delivery && (
              <section className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 space-y-3">
                <p className="text-sm font-medium text-cyan-200">Chuyến giao xuất kho</p>
                {delivery.shipToAddress && (
                  <p className="text-sm text-slate-300">Giao đến: {delivery.shipToAddress}</p>
                )}
                <input
                  aria-label="Biển số xe"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="Biển số xe"
                  className="w-full max-w-xs rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-mono uppercase"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void saveDelivery({ vehiclePlate: vehiclePlate.trim() || undefined })
                    }
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                  >
                    Lưu thông tin xe
                  </button>
                  {delivery.deliveryStatus === 'ASSIGNED' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void reportPickup()}
                      className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
                    >
                      Đã lấy hàng khỏi kho
                    </button>
                  )}
                  {delivery.deliveryStatus === 'IN_TRANSIT' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void reportDelivered()}
                      className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
                    >
                      Đã giao hàng
                    </button>
                  )}
                </div>
              </section>
            )}

            {canWhAct && !isTransporter && nextAction && (
              <section className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
                <p className="text-sm font-medium text-orange-200">Bước tiếp theo (kho)</p>
                {nextAction.hint && (
                  <p className="mt-1 text-xs text-slate-400">{nextAction.hint}</p>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void patchStatus(nextAction.status)}
                  className="mt-3 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-orange-400 disabled:opacity-50"
                >
                  {busy ? 'Đang xử lý…' : nextAction.label}
                </button>
              </section>
            )}

            {(canTenantCancel || canWhCancel) && (
              <div className="flex flex-wrap gap-2">
                {canTenantCancel && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleCancel()}
                    className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Hủy phiếu
                  </button>
                )}
                {canWhCancel &&
                  outbound &&
                  ['RESERVED', 'PICKING', 'PACKING'].includes(outbound.status) &&
                  (isWhAdmin || (isWhStaff && assignedPickerId === user?.userId)) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleCancel()}
                      className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Hủy & giải phóng reserve
                    </button>
                  )}
              </div>
            )}

            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h2 className="text-sm font-semibold text-white">Dòng SKU</h2>
              {outbound.items?.length ? (
                <table className="mt-3 w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-2">SKU</th>
                      <th className="py-2">Sản phẩm</th>
                      <th className="py-2 text-right">Yêu cầu</th>
                      <th className="py-2 text-right">Allocate</th>
                      <th className="py-2 text-right">Đã pick</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {outbound.items.map((line) => (
                      <tr key={line.outboundRequestItemId}>
                        <td className="py-2 font-mono text-cyan-300">
                          {line.sku?.skuCode ?? line.skuId}
                        </td>
                        <td className="py-2 text-slate-300">
                          {line.sku?.productName ?? '—'}
                          {line.sku?.size ? ` · ${line.sku.size}` : ''}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {line.requestedQuantity}
                        </td>
                        <td className="py-2 text-right tabular-nums text-violet-300">
                          {line.allocatedQuantity ?? 0}
                        </td>
                        <td className="py-2 text-right tabular-nums text-emerald-300">
                          {line.pickedQuantity ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Chưa có dòng SKU</p>
              )}
            </section>

            {(picking || reservedFifoRows.length > 0) && (
              <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h2 className="text-sm font-semibold text-white">Lệnh pick (FIFO đã reserve)</h2>
                {picking?.hint && picking.tasks.length === 0 && (
                  <p className="mt-2 text-xs text-amber-300/90">{picking.hint}</p>
                )}
                {reservedFifoRows.length === 0 && !picking?.hint && (
                  <p className="mt-2 text-sm text-slate-500">Chưa có picking task</p>
                )}
                {picking?.tasks.map((task) => (
                  <div key={task.pickingTaskId} className="mt-3">
                    <p className="text-xs text-slate-400">
                      Task {task.pickingTaskId.slice(0, 8)}… · {task.status}
                      {task.assignedTo && (
                        <>
                          {' · '}
                          Picker:{' '}
                          <span className="text-violet-300">
                            {staffList.find((s) => s.userId === task.assignedTo)?.fullName ??
                              assignedPickerName ??
                              `${task.assignedTo.slice(0, 8)}…`}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                ))}
                {reservedFifoRows.length > 0 && (
                  <FifoAllocationTable rows={reservedFifoRows} showPicked />
                )}
              </section>
            )}
          </div>
        )}
      </div>

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
