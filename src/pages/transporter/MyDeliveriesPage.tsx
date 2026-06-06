import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { InboundStatusBadge } from '../../components/inbound/InboundStatusBadge'
import { OutboundStatusBadge } from '../../components/outbound/OutboundStatusBadge'
import * as inboundApi from '../../api/inboundRequests'
import * as outboundApi from '../../api/outboundRequests'
import type { ApiInboundRequestWithItems } from '../../api/inboundRequests'
import type { ApiOutboundRequest } from '../../api/outboundRequests'
import { ApiError } from '../../api/client'
import { formatDate } from '../../mappers'

export function MyDeliveriesPage() {
  const [inboundItems, setInboundItems] = useState<ApiInboundRequestWithItems[]>([])
  const [outboundItems, setOutboundItems] = useState<ApiOutboundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [inboundRes, outboundRes] = await Promise.all([
        inboundApi.listInboundRequests({
          assignedToMe: true,
          includeDelivery: true,
          limit: 50,
        }),
        outboundApi.listOutboundRequests({
          assignedToMe: true,
          limit: 50,
        }),
      ])
      setInboundItems(inboundRes.items)
      setOutboundItems(outboundRes.items)
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
        Inbound (kho đi lấy) và outbound (kho giao ra) được gán cho bạn.
      </p>

      {error && (
        <InlineAlert className="mb-4" message={error} onDismiss={() => setError('')} />
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Nhập kho — đi lấy hàng
      </h2>
      {!loading && inboundItems.length === 0 && (
        <p className="mb-6 text-slate-500">Chưa có chuyến inbound.</p>
      )}
      <ul className="mb-8 space-y-3">
        {inboundItems.map((row) => (
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
                </p>
              </div>
              <InboundStatusBadge status={row.status} />
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Xuất kho — giao hàng ra
      </h2>
      {!loading && outboundItems.length === 0 && (
        <p className="text-slate-500">Chưa có chuyến outbound.</p>
      )}
      <ul className="space-y-3">
        {outboundItems.map((row) => (
          <li
            key={row.outboundRequestId}
            className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-orange-500/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  to={`/staff/my-deliveries/outbound/${row.outboundRequestId}`}
                  className="font-mono text-lg font-semibold text-orange-300 hover:underline"
                >
                  {row.outboundCode}
                </Link>
                <p className="mt-1 text-sm text-slate-400">
                  Xuất dự kiến: {formatDate(row.requestedShipDate)}
                </p>
              </div>
              <OutboundStatusBadge status={row.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
