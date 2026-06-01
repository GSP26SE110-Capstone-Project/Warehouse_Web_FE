import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/client'
import {
  fetchGuestAccountAlerts,
  fetchWhPendingRentalAlerts,
  type GuestAccountAlerts,
  type WhPendingRentalAlerts,
} from '../../../api/adminNotifications'
import { useAuth } from '../../../auth/AuthContext'

function formatWhen(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabelVi(status: string) {
  if (status === 'PENDING') return 'Chờ duyệt'
  if (status === 'UNDER_REVIEW') return 'Đang xem xét'
  return status
}

export function AdminNotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [guestAlerts, setGuestAlerts] = useState<GuestAccountAlerts | null>(null)
  const [whAlerts, setWhAlerts] = useState<WhPendingRentalAlerts | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const isSa = user?.role === 'SYSTEM_ADMIN'
  const isWh = user?.role === 'WH_ADMIN'

  const load = useCallback(async () => {
    if (isSa) {
      try {
        const data = await fetchGuestAccountAlerts()
        setGuestAlerts(data)
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 403)) setGuestAlerts(null)
      }
    }
    if (isWh) {
      try {
        const data = await fetchWhPendingRentalAlerts()
        setWhAlerts(data)
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 403)) setWhAlerts(null)
      }
    }
  }, [isSa, isWh])

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

  if (!isSa && !isWh) return null

  const guestCount = guestAlerts?.guestWithoutAccountCount ?? 0
  const whPending = whAlerts?.pendingCount ?? 0
  const badgeCount = isSa ? guestCount : whPending

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) void load()
        }}
        className="relative p-2 text-slate-400 transition-colors hover:text-white"
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined">notifications</span>
        {badgeCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#06edf9] px-1 text-[10px] font-bold text-[#0b101a] shadow-[0_0_8px_rgba(6,237,249,0.8)]">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/50">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="text-sm font-semibold text-white">Thông báo</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {isSa ? 'Guest onboarding — cấp tài khoản' : 'Yêu cầu thuê chưa duyệt trong vùng kho'}
            </p>
          </div>

          {isWh && (
            <>
              {whPending === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  Không có yêu cầu thuê chờ duyệt trong vùng{' '}
                  {whAlerts?.district && whAlerts?.city
                    ? `${whAlerts.district}, ${whAlerts.city}`
                    : 'của bạn'}
                  .
                </p>
              ) : (
                <div className="px-4 py-3 space-y-2 text-xs text-slate-300">
                  <p>
                    Có{' '}
                    <span className="font-semibold text-amber-300">{whPending}</span> yêu cầu thuê
                    chưa duyệt
                    {whAlerts?.warehouseName ? (
                      <>
                        {' '}
                        tại khu vực <strong className="text-white">{whAlerts.warehouseName}</strong>
                      </>
                    ) : null}
                    . Duyệt = claim cho kho bạn.
                  </p>
                </div>
              )}

              {whAlerts && whAlerts.recent.length > 0 && (
                <ul className="max-h-52 overflow-y-auto dark-scrollbar border-t border-white/5 py-1">
                  {whAlerts.recent.map((item) => (
                    <li key={item.rentalRequestId} className="px-3 py-2 hover:bg-white/5">
                      <p className="truncate text-sm font-medium text-white">{item.companyName}</p>
                      <p className="font-mono text-xs text-cyan-400">{item.requestCode}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {item.district}, {item.city} · {statusLabelVi(item.status)} ·{' '}
                        {formatWhen(item.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-white/5 p-3">
                <Link
                  to="/admin/requests"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-center text-xs font-semibold text-cyan-300 no-underline hover:bg-cyan-500/15"
                >
                  Xem yêu cầu thuê
                </Link>
              </div>
            </>
          )}

          {isSa && (
            <>
              {guestCount === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  Không có guest đang chờ cấp tài khoản.
                </p>
              ) : (
                <div className="space-y-2 px-4 py-3 text-xs text-slate-300">
                  {(guestAlerts?.pendingGuestCount ?? 0) > 0 && (
                    <p>
                      <span className="font-semibold text-amber-300">
                        {guestAlerts?.pendingGuestCount}
                      </span>{' '}
                      yêu cầu mới từ guest (chưa có tài khoản đăng nhập).
                    </p>
                  )}
                  {(guestAlerts?.approvedAwaitingAccountCount ?? 0) > 0 && (
                    <p>
                      <span className="font-semibold text-emerald-300">
                        {guestAlerts?.approvedAwaitingAccountCount}
                      </span>{' '}
                      yêu cầu đã duyệt — sẵn sàng cấp{' '}
                      <strong className="text-white">Tenant Admin</strong>.
                    </p>
                  )}
                </div>
              )}

              {guestAlerts && guestAlerts.recent.length > 0 && (
                <ul className="max-h-52 overflow-y-auto dark-scrollbar border-t border-white/5 py-1">
                  {guestAlerts.recent.map((item) => (
                    <li key={item.rentalRequestId} className="px-3 py-2 hover:bg-white/5">
                      <p className="truncate text-sm font-medium text-white">{item.companyName}</p>
                      <p className="font-mono text-xs text-cyan-400">{item.requestCode}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {item.district}, {item.city} · {item.status} · {formatWhen(item.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2 border-t border-white/5 p-3">
                <Link
                  to="/admin/requests"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-center text-xs font-semibold text-cyan-300 no-underline hover:bg-cyan-500/15"
                >
                  Yêu cầu thuê
                </Link>
                <Link
                  to="/admin/accounts"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-white no-underline hover:bg-white/10"
                >
                  Cấp tài khoản
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
