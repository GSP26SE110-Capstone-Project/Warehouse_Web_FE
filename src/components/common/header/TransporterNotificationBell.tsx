import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/client'
import {
  fetchTransporterTripAlerts,
  type TransporterTripAlerts,
} from '../../../api/transporterNotifications'
import { useAuth } from '../../../auth/AuthContext'

function formatWhen(value: string | null | undefined) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TransporterNotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<TransporterTripAlerts | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const isTransporter = user?.role === 'WH_TRANSPORTER'
  const badgeCount = (alerts?.assignedCount ?? 0) + (alerts?.inTransitCount ?? 0)

  const load = useCallback(async () => {
    if (!isTransporter) return
    try {
      const data = await fetchTransporterTripAlerts()
      setAlerts(data)
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 403)) setAlerts(null)
    }
  }, [isTransporter])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), 60_000)
    return () => window.clearInterval(id)
  }, [load])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  if (!isTransporter) return null

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          void load()
        }}
        className="relative p-2 text-slate-400 transition-colors hover:text-white"
        aria-label="Thông báo chuyến vận chuyển"
      >
        <span className="material-symbols-outlined">notifications</span>
        {badgeCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#06edf9] px-1 text-[10px] font-bold text-slate-900">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-white/10 bg-[#0f172a] shadow-xl">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">Chuyến được gán</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {badgeCount > 0
                ? `${alerts?.assignedCount ?? 0} chờ lấy · ${alerts?.inTransitCount ?? 0} đang về kho`
                : 'Chưa có chuyến mới'}
            </p>
          </div>

          <ul className="max-h-72 overflow-y-auto">
            {(alerts?.recent ?? []).length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-slate-500">
                Chưa được gán chuyến nào.
              </li>
            ) : (
              alerts?.recent.map((trip) => (
                <li key={trip.inboundRequestId} className="border-b border-white/5 last:border-0">
                  <Link
                    to={`/staff/my-deliveries/${trip.inboundRequestId}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 transition-colors hover:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-sm font-medium text-cyan-300">
                        {trip.inboundCode}
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-500">
                        {formatWhen(trip.assignedAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{trip.companyName ?? '—'}</p>
                    {trip.vehiclePlate && (
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                        {trip.vehiclePlate}
                      </p>
                    )}
                    {trip.status === 'APPROVED' && (
                      <p className="mt-1 text-[11px] text-amber-300">Chờ đi lấy hàng</p>
                    )}
                    {trip.status === 'IN_TRANSIT' && (
                      <p className="mt-1 text-[11px] text-orange-300">Đã lấy hàng · báo xe đến kho</p>
                    )}
                  </Link>
                </li>
              ))
            )}
          </ul>

          <div className="border-t border-white/10 px-4 py-2">
            <Link
              to="/staff/my-deliveries"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              Xem tất cả chuyến →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
