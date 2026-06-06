import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import * as inboundApi from '../../api/inboundRequests'
import type {
  ApiInboundRequestWithItems,
  ApiInboundRequestItem,
  InboundStatus,
} from '../../api/inboundRequests'
import * as skusApi from '../../api/skus'
import type { ApiSku } from '../../api/skus'
import * as contractsApi from '../../api/contracts'
import { INBOUND_STATUS_LABELS } from '../../data/inboundStatus'
import { getTenantInboundSteps, tenantInboundStepProgress } from '../../data/tenantInboundWorkflow'
import type { DeliveryMode } from '../../data/deliveryMode'

type Props = {
  inbound: ApiInboundRequestWithItems
  tenantId: string
  deliveryMode: DeliveryMode
  busy: boolean
  onReload: () => Promise<void>
  onPatchStatus: (
    status: InboundStatus,
    extra?: { actualArrivalAt?: string }
  ) => Promise<void>
  onCancel: () => void
  inventoryLink: string
}

function normalizeSize(size?: string | null) {
  return String(size ?? '').trim().toUpperCase()
}

function commitmentKey(productKind?: string | null, size?: string | null) {
  return `${String(productKind ?? '').trim()}|${normalizeSize(size)}`
}

export function TenantInboundWorkflow({
  inbound,
  tenantId,
  deliveryMode,
  busy,
  onReload,
  onPatchStatus,
  onCancel,
  inventoryLink,
}: Props) {
  const [skus, setSkus] = useState<ApiSku[]>([])
  const [itemError, setItemError] = useState('')
  const [newSkuId, setNewSkuId] = useState('')
  const [newQty, setNewQty] = useState(1)
  const [commitment, setCommitment] = useState<contractsApi.ApiContractInboundCommitment | null>(null)

  const isWarehouseTransport = deliveryMode === 'WAREHOUSE_TRANSPORT'
  const canEditItems = ['DRAFT', 'PENDING'].includes(inbound.status)
  const canCancel = ['DRAFT', 'PENDING'].includes(inbound.status)
  const canMarkArrived =
    !isWarehouseTransport &&
    inbound.status === 'APPROVED' &&
    Boolean(inbound.delivery?.vehiclePlate?.trim())

  const stepProgress = tenantInboundStepProgress(inbound.status, deliveryMode)
  const workflowSteps = getTenantInboundSteps(deliveryMode)
  const commitmentByKey = useMemo(() => {
    const map = new Map<string, contractsApi.ApiContractInboundCommitmentLine>()
    for (const line of commitment?.productLines ?? []) {
      if (!line.uncommitted && line.productKind) map.set(line.key, line)
    }
    return map
  }, [commitment])
  const commitmentApplies = Boolean(commitment?.applies && commitmentByKey.size > 0)
  const isSkuAllowed = useCallback(
    (sku: ApiSku) => !commitmentApplies || commitmentByKey.has(commitmentKey(sku.productKind, sku.size)),
    [commitmentApplies, commitmentByKey]
  )
  const newSku = useMemo(
    () => skus.find((sku) => sku.skuId === newSkuId),
    [newSkuId, skus]
  )
  const newSkuRemaining = useMemo(() => {
    if (!commitmentApplies || !newSku) return null
    const committedLine = commitmentByKey.get(commitmentKey(newSku.productKind, newSku.size))
    return committedLine?.remainingPieces ?? 0
  }, [commitmentApplies, commitmentByKey, newSku])

  useEffect(() => {
    if (!tenantId || !canEditItems) return
    let cancelled = false
    skusApi
      .listSkus({ tenantId, status: 'ACTIVE', limit: 200 })
      .then((res) => {
        if (!cancelled) setSkus(res.items)
      })
      .catch(() => {
        if (!cancelled) setSkus([])
      })
    return () => {
      cancelled = true
    }
  }, [tenantId, canEditItems])

  useEffect(() => {
    if (!canEditItems) return
    let cancelled = false
    contractsApi
      .getContractInboundCommitment(inbound.contractId)
      .then((data) => {
        if (!cancelled) setCommitment(data)
      })
      .catch(() => {
        if (!cancelled) setCommitment(null)
      })
    return () => {
      cancelled = true
    }
  }, [canEditItems, inbound.contractId])

  const handleAddLine = async () => {
    if (!newSkuId || newQty < 1) {
      setItemError('Chọn SKU và số lượng hợp lệ')
      return
    }
    if (commitmentApplies) {
      if (!newSku || !isSkuAllowed(newSku)) {
        setItemError('SKU này không thuộc hàng hóa đã đăng ký trong rental request')
        return
      }
      if (newSkuRemaining != null && newQty > newSkuRemaining) {
        setItemError(`Số lượng vượt hạn mức còn lại (${Math.max(0, newSkuRemaining)} cái)`)
        return
      }
    }
    setItemError('')
    try {
      await inboundApi.createInboundItem(inbound.inboundRequestId, {
        skuId: newSkuId,
        expectedQuantity: newQty,
      })
      setNewSkuId('')
      setNewQty(1)
      await onReload()
    } catch (err) {
      setItemError(err instanceof ApiError ? err.message : 'Không thêm được dòng')
    }
  }

  const handleUpdateQty = async (item: ApiInboundRequestItem, qty: number) => {
    if (qty < 1) return
    try {
      await inboundApi.updateInboundItem(item.inboundRequestItemId, {
        expectedQuantity: qty,
      })
      await onReload()
    } catch (err) {
      setItemError(err instanceof ApiError ? err.message : 'Không cập nhật được')
    }
  }

  const handleDeleteLine = async (itemId: string) => {
    try {
      await inboundApi.deleteInboundItem(itemId)
      await onReload()
    } catch (err) {
      setItemError(err instanceof ApiError ? err.message : 'Không xóa được dòng')
    }
  }

  if (inbound.status === 'CANCELLED') {
    return (
      <section className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        Phiếu nhập đã hủy.
      </section>
    )
  }

  return (
    <div className="mb-6 space-y-4">
      {inbound.status !== 'COMPLETED' && (
        <section className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tiến độ yêu cầu
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {workflowSteps.map((step, i) => {
              const done = i < stepProgress
              const current = step.status === inbound.status
              return (
                <span
                  key={step.status}
                  className={`rounded-full px-2.5 py-0.5 text-xs ${
                    current
                      ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40'
                      : done
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-white/5 text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              )
            })}
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Trạng thái hiện tại:{' '}
            <strong className="text-white">{INBOUND_STATUS_LABELS[inbound.status]}</strong>
          </p>
        </section>
      )}

      {inbound.status === 'PENDING' && (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Kho đang xem xét phiếu. Bạn có thể sửa dòng SKU hoặc hủy trước khi kho duyệt.
        </p>
      )}

      {inbound.status === 'APPROVED' && !isWarehouseTransport && (
        <section className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-4">
          <p className="text-sm font-medium text-violet-200">Tự vận chuyển đến kho</p>
          <p className="mt-1 text-xs text-slate-400">
            Sau khi lưu biển số xe ở mục Vận chuyển, bấm nút bên dưới khi xe tới cổng kho.
          </p>
          <button
            type="button"
            disabled={busy || !canMarkArrived}
            onClick={() =>
              void onPatchStatus('ARRIVED', { actualArrivalAt: new Date().toISOString() })
            }
            className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            {busy ? 'Đang gửi…' : 'Xe đã đến kho'}
          </button>
          {!inbound.delivery?.vehiclePlate?.trim() && (
            <p className="mt-2 text-xs text-amber-300">
              Cần lưu biển số xe trước (mục Vận chuyển đến kho).
            </p>
          )}
        </section>
      )}

      {inbound.status === 'APPROVED' && isWarehouseTransport && (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100">
          Kho đã gán tài xế — tài xế sẽ báo <strong>Đã lấy hàng</strong> khi tới điểm lấy của bạn,
          sau đó báo <strong>Xe đến kho</strong> khi về cổng kho.
        </p>
      )}

      {inbound.status === 'IN_TRANSIT' && isWarehouseTransport && (
        <p className="rounded-lg border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
          Tài xế đã lấy hàng
          {inbound.delivery?.actualPickupAt
            ? ` lúc ${new Date(inbound.delivery.actualPickupAt).toLocaleString('vi-VN')}`
            : ''}
          . Hàng đang được vận chuyển về kho — bạn sẽ được thông báo khi xe tới cổng.
        </p>
      )}

      {['ARRIVED', 'RECEIVING'].includes(inbound.status) && (
        <p className="text-sm text-slate-400">
          Kho đang nhận và kiểm đến hàng. Bạn theo dõi số thực nhận ở bảng dòng hàng bên dưới.
        </p>
      )}

      {inbound.status === 'COMPLETED' && (
        <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
          <p>Nhập kho hoàn tất. Hàng đã putaway có thể xem trong tồn kho.</p>
          <Link
            to={inventoryLink}
            className="mt-3 inline-flex rounded-lg bg-emerald-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Xem tồn kho đợt này
          </Link>
        </section>
      )}

      {canEditItems && (
        <section className="rounded-xl border border-white/10 bg-white/2 p-4">
          <h3 className="text-sm font-semibold text-white">Chỉnh sửa dòng hàng (SKU)</h3>
          {itemError && <p className="mt-2 text-xs text-red-300">{itemError}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              aria-label="Thêm SKU"
              value={newSkuId}
              onChange={(e) => setNewSkuId(e.target.value)}
              className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
            >
              <option value="">— Chọn SKU —</option>
              {skus.map((s) => (
                <option key={s.skuId} value={s.skuId} disabled={!isSkuAllowed(s)}>
                  {s.skuCode} — {s.productName}
                  {commitmentApplies && !isSkuAllowed(s) ? ' (không thuộc rental request)' : ''}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={newSkuRemaining ?? undefined}
              aria-label="Số lượng dự kiến"
              value={newQty}
              onChange={(e) => setNewQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleAddLine()}
              className="rounded-lg bg-cyan-600 px-3 py-2 text-sm hover:bg-cyan-500 disabled:opacity-50"
            >
              Thêm dòng
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {(inbound.items ?? []).map((item) => (
              <li
                key={item.inboundRequestItemId}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 font-mono text-cyan-300">
                  {item.sku?.skuCode ?? item.skuId}
                </span>
                <input
                  type="number"
                  min={1}
                  aria-label={`Số lượng ${item.sku?.skuCode}`}
                  defaultValue={item.expectedQuantity}
                  onBlur={(e) => {
                    const n = Number(e.target.value)
                    if (n !== item.expectedQuantity && n >= 1) {
                      void handleUpdateQty(item, n)
                    }
                  }}
                  className="w-20 rounded border border-white/10 bg-[#0f172a] px-2 py-1 text-right text-sm"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDeleteLine(item.inboundRequestItemId)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {canCancel && (
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
        >
          Hủy yêu cầu nhập
        </button>
      )}
    </div>
  )
}
