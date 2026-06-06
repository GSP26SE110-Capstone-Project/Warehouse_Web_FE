import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/client'
import {
  fetchTenantInboundTransportAlerts,
  type TenantTransportAlerts,
} from '../../../api/tenantNotifications'
import { useAuth } from '../../../auth/AuthContext'

export function TenantTransportNotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<TenantTransportAlerts | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const isTenantAdmin = user?.role === 'TENANT_ADMIN'
  const badgeCount =
    (alerts?.assignedCount ?? 0) + (alerts?.inTransitCount ?? 0) + (alerts?.arrivedCount ?? 0)

  const load = useCallback(async () => {
    if (!isTenantAdmin) return
    try {
      setAlerts(await fetchTenantInboundTransportAlerts())
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 403)) setAlerts(null)
    }
  }, [isTenantAdmin])

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

  if (!isTenantAdmin) return null

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          void load()
        }}
        className="relative p-2 text-slate-400 transition-colors hover:text-white"
        aria-label="Thông báo vận chuyển inbound"
      >
        <span className="material-symbols-outlined">local_shipping</span>
        {badgeCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-bold text-slate-900">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-white/10 bg-[#0f172a] shadow-xl">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">Vận chuyển inbound</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {badgeCount > 0
                ? `${alerts?.arrivedCount ?? 0} đã tới kho · ${alerts?.inTransitCount ?? 0} đang về kho · ${alerts?.assignedCount ?? 0} chờ lấy hàng`
                : 'Chưa có thông báo mới'}
            </p>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {(alerts?.recent ?? []).length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-slate-500">Chưa có inbound nào.</li>
            ) : (
              alerts?.recent.map((row) => (
                <li key={row.inboundRequestId} className="border-b border-white/5 last:border-0">
                  <Link
                    to={`/staff/inbound/${row.inboundRequestId}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-white/5"
                  >
                    <span className="font-mono text-sm text-cyan-300">{row.inboundCode}</span>
                    <p className="mt-1 text-xs text-slate-400">
                      {row.status === 'ARRIVED' ? (
                        <span className="text-violet-300">Đã tới kho</span>
                      ) : row.status === 'IN_TRANSIT' ? (
                        <span className="text-orange-300">Đã lấy hàng · đang về kho</span>
                      ) : (
                        <>
                          {row.driverName ?? 'Tài xế'} · {row.vehiclePlate ?? '—'}
                        </>
                      )}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
