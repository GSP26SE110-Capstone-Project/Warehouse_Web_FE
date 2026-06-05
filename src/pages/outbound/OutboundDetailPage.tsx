import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { OutboundStatusBadge } from '../../components/outbound/OutboundStatusBadge'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as outboundApi from '../../api/outboundRequests'
import type {
  ApiOutboundRequestWithItems,
  OutboundPickingTasksResponse,
  OutboundStatus,
} from '../../api/outboundRequests'
import { WH_OUTBOUND_NEXT_STATUS } from '../../data/outboundStatus'
import { formatDate } from '../../mappers'

type Mode = 'tenant' | 'warehouse'

type Props = {
  mode: Mode
  basePath: string
}

export function OutboundDetailPage({ mode, basePath }: Props) {
  const { outboundRequestId = '' } = useParams()
  const { user } = useAuth()
  const isWarehouse = mode === 'warehouse'

  const [outbound, setOutbound] = useState<ApiOutboundRequestWithItems | null>(null)
  const [picking, setPicking] = useState<OutboundPickingTasksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [alert, setAlert] = useState<{ open: boolean; message: string; type?: 'success' | 'error' }>({
    open: false,
    message: '',
  })

  const load = useCallback(async () => {
    if (!outboundRequestId) return
    setLoading(true)
    setError('')
    try {
      const [ob, pick] = await Promise.all([
        outboundApi.getOutboundRequest(outboundRequestId, { includeItems: true }),
        outboundApi.listOutboundPickingTasks(outboundRequestId).catch(() => null),
      ])
      setOutbound(ob)
      setPicking(pick)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được phiếu xuất')
    } finally {
      setLoading(false)
    }
  }, [outboundRequestId])

  useEffect(() => {
    void load()
  }, [load])

  const patchStatus = async (status: OutboundStatus) => {
    if (!outboundRequestId) return
    setBusy(true)
    setError('')
    try {
      await outboundApi.updateOutboundRequest(outboundRequestId, { status })
      await load()
      setAlert({ open: true, type: 'success', message: 'Cập nhật trạng thái thành công' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cập nhật thất bại')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = () => patchStatus('CANCELLED')

  const nextAction = outbound ? WH_OUTBOUND_NEXT_STATUS[outbound.status] : undefined
  const canWhAct =
    isWarehouse &&
    (user?.role === 'WH_ADMIN' || user?.role === 'WH_STAFF' || user?.role === 'SYSTEM_ADMIN')
  const canTenantCancel =
    mode === 'tenant' &&
    outbound &&
    ['DRAFT', 'PENDING'].includes(outbound.status)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      <LoadingOverlay show={loading} text="Đang tải phiếu xuất..." />
      <div className="mx-auto max-w-4xl">
        <Link to={basePath} className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors">
          ← Danh sách xuất kho
        </Link>

        {error && (
          <div className="mt-4">
            <InlineAlert message={error} onDismiss={() => setError('')} />
          </div>
        )}

        {outbound && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="font-mono text-2xl font-bold text-slate-900 tracking-tight">
                  {outbound.outboundCode}
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Ngày xuất dự kiến: <span className="text-slate-800">{formatDate(outbound.requestedShipDate)}</span>
                  {outbound.actualShippedAt && (
                    <> · Thực xuất: <span className="text-slate-800">{formatDate(outbound.actualShippedAt)}</span></>
                  )}
                </p>
              </div>
              <OutboundStatusBadge status={outbound.status} />
            </div>

            {canWhAct && nextAction && (
              <section className="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-orange-950 uppercase tracking-wide">Bước tiếp theo (Kho vận hành)</h3>
                {nextAction.hint && (
                  <p className="mt-1 text-sm text-orange-800/90 font-medium">{nextAction.hint}</p>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void patchStatus(nextAction.status)}
                  className="mt-4 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-500 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {busy ? 'Đang xử lý…' : nextAction.label}
                </button>
              </section>
            )}

            {(canTenantCancel || (canWhAct && !['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(outbound.status))) && (
              <div className="flex flex-wrap gap-2">
                {canTenantCancel && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleCancel()}
                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    Hủy phiếu yêu cầu
                  </button>
                )}
                {canWhAct &&
                  ['RESERVED', 'PICKING', 'PACKING'].includes(outbound.status) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleCancel()}
                      className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      Hủy & giải phóng tồn kho đã giữ (Reserve)
                    </button>
                  )}
              </div>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Danh sách dòng SKU</h2>
              {outbound.items?.length ? (
                <div className="overflow-x-auto">
                  <table className="mt-3 w-full text-left text-sm">
                    <thead className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                      <tr>
                        <th className="py-2.5 px-2">SKU</th>
                        <th className="py-2.5 px-2">Sản phẩm</th>
                        <th className="py-2.5 px-2 text-right">Yêu cầu</th>
                        <th className="py-2.5 px-2 text-right">Đã giữ hàng (Allocated)</th>
                        <th className="py-2.5 px-2 text-right">Đã lấy hàng (Picked)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {outbound.items.map((line) => (
                        <tr key={line.outboundRequestItemId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-2 font-mono font-bold text-cyan-700">
                            {line.sku?.skuCode ?? line.skuId}
                          </td>
                          <td className="py-3 px-2 text-slate-800 font-semibold">
                            {line.sku?.productName ?? '—'}
                            {line.sku?.size ? ` · ${line.sku.size}` : ''}
                          </td>
                          <td className="py-3 px-2 text-right tabular-nums text-slate-900 font-bold">
                            {line.requestedQuantity}
                          </td>
                          <td className="py-3 px-2 text-right tabular-nums text-indigo-700 font-semibold">
                            {line.allocatedQuantity ?? 0}
                          </td>
                          <td className="py-3 px-2 text-right tabular-nums text-emerald-700 font-bold">
                            {line.pickedQuantity ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 text-sm font-semibold text-slate-400 text-center py-4">Chưa có thông tin dòng hàng SKU</p>
              )}
            </section>

            {picking && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Lệnh lấy hàng thực tế (Mô hình FIFO)</h2>
                {picking.hint && picking.tasks.length === 0 && (
                  <p className="mt-3 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">{picking.hint}</p>
                )}
                {picking.tasks.length === 0 && !picking.hint && (
                  <p className="mt-4 text-sm font-semibold text-slate-400 text-center py-4">Chưa có tác vụ picking task nào được tạo</p>
                )}
                {picking.tasks.map((task) => (
                  <div key={task.pickingTaskId} className="mt-4 space-y-2 border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Mã lệnh Task: <span className="font-mono text-slate-700">{task.pickingTaskId.slice(0, 8)}…</span> · Trạng thái: <span className="text-slate-800">{task.status}</span>
                    </p>
                    <ul className="space-y-2 text-sm">
                      {task.items.map((item) => (
                        <li
                          key={item.pickingTaskItemId}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 flex flex-wrap gap-2 justify-between items-center shadow-xs font-medium"
                        >
                          <div>
                            Mã kiện LPN: <span className="font-mono text-cyan-700 font-bold">{item.lpnCode}</span>
                            <span className="mx-2 text-slate-300">|</span>
                            Vị trí ô kệ (Bin): <span className="font-mono text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{item.binCode}</span>
                          </div>
                          <div className="text-slate-800 font-semibold">
                            Số lượng cần lấy: <span className="text-slate-900 font-bold tabular-nums">{item.quantityToPick}</span>
                            {item.pickedQuantity != null ? (
                              <> / Đã lấy: <span className="text-emerald-600 font-bold tabular-nums">{item.pickedQuantity}</span></>
                            ) : ''}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
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