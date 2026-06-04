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
                </p>
              </div>
              <OutboundStatusBadge status={outbound.status} />
            </div>

            {canWhAct && nextAction && (
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

            {(canTenantCancel || (canWhAct && !['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(outbound.status))) && (
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
                {canWhAct &&
                  ['RESERVED', 'PICKING', 'PACKING'].includes(outbound.status) && (
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

            {picking && (
              <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h2 className="text-sm font-semibold text-white">Lệnh pick (FIFO)</h2>
                {picking.hint && picking.tasks.length === 0 && (
                  <p className="mt-2 text-xs text-amber-300/90">{picking.hint}</p>
                )}
                {picking.tasks.length === 0 && !picking.hint && (
                  <p className="mt-2 text-sm text-slate-500">Chưa có picking task</p>
                )}
                {picking.tasks.map((task) => (
                  <div key={task.pickingTaskId} className="mt-4 space-y-2">
                    <p className="text-xs text-slate-400">
                      Task {task.pickingTaskId.slice(0, 8)}… · {task.status}
                    </p>
                    <ul className="space-y-1 text-sm">
                      {task.items.map((item) => (
                        <li
                          key={item.pickingTaskItemId}
                          className="rounded-lg border border-white/5 bg-black/20 px-3 py-2"
                        >
                          <span className="font-mono text-cyan-300">{item.lpnCode}</span>
                          {' · '}
                          bin <span className="font-mono">{item.binCode}</span>
                          {' · '}
                          pick {item.quantityToPick}
                          {item.pickedQuantity != null ? ` / picked ${item.pickedQuantity}` : ''}
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
