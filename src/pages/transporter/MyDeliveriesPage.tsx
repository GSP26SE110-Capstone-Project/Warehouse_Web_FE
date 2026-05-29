import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { InboundStatusBadge } from '../../components/inbound/InboundStatusBadge'
import * as inboundApi from '../../api/inboundRequests'
import type { ApiInboundRequestWithItems } from '../../api/inboundRequests'
import { ApiError } from '../../api/client'
import { formatDate } from '../../mappers'

export function MyDeliveriesPage() {
  const [items, setItems] = useState<ApiInboundRequestWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await inboundApi.listInboundRequests({
        assignedToMe: true,
        includeDelivery: true,
        limit: 50,
      })
      setItems(res.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải danh sách chuyến')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="p-8">
      <LoadingOverlay show={loading} text="Đang tải chuyến..." />
      <h1 className="mb-2 text-2xl font-bold text-cyan-300">Chuyến vận chuyển của tôi</h1>
      <p className="mb-6 text-sm text-slate-400">
        Các yêu cầu nhập kho (kho đi lấy hàng) đã được gán cho bạn.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-slate-500">Chưa có chuyến nào được gán.</p>
      )}

      <ul className="space-y-3">
        {items.map((row) => (
          <li
            key={row.inboundRequestId}
            className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-500/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  to={`/staff/my-deliveries/${row.inboundRequestId}`}
                  className="font-mono text-lg font-semibold text-cyan-300 hover:underline"
                >
                  {row.inboundCode}
                </Link>
                <p className="mt-1 text-sm text-slate-400">
                  Dự kiến: {formatDate(row.expectedArrivalDate)}
                  {row.delivery?.vehiclePlate && (
                    <span className="ml-2 font-mono text-slate-300">
                      · {row.delivery.vehiclePlate}
                    </span>
                  )}
                </p>
              </div>
              <InboundStatusBadge status={row.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
