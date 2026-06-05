import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/client'
import {
  fetchGuestAccountAlerts,
  fetchWhArrivedInboundAlerts,
  fetchWhContractPaymentAlerts,
  fetchWhPendingInboundAlerts,
  fetchWhPendingRentalAlerts,
  type GuestAccountAlerts,
  type WhArrivedInboundAlerts,
  type WhContractPaymentAlerts,
  type WhPendingInboundAlerts,
  type WhPendingRentalAlerts,
} from '../../../api/adminNotifications'
import { formatVnd } from '../../../data/pricing'
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
  const [whRentalAlerts, setWhRentalAlerts] = useState<WhPendingRentalAlerts | null>(null)
  const [whInboundAlerts, setWhInboundAlerts] = useState<WhPendingInboundAlerts | null>(null)
  const [whArrivedAlerts, setWhArrivedAlerts] = useState<WhArrivedInboundAlerts | null>(null)
  const [whContractPayments, setWhContractPayments] = useState<WhContractPaymentAlerts | null>(
    null
  )
  const rootRef = useRef<HTMLDivElement>(null)

  const isSa = user?.role === 'SYSTEM_ADMIN'
  const isWh = user?.role === 'WH_ADMIN'

  // Quy ước Theme dựa trên vai trò SYSTEM_ADMIN
  const isDarkMode = isSa

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
        const [rentals, inbounds, arrived, contractPaid] = await Promise.all([
          fetchWhPendingRentalAlerts(),
          fetchWhPendingInboundAlerts(),
          fetchWhArrivedInboundAlerts(),
          fetchWhContractPaymentAlerts(),
        ])
        setWhRentalAlerts(rentals)
        setWhInboundAlerts(inbounds)
        setWhArrivedAlerts(arrived)
        setWhContractPayments(contractPaid)
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 403)) {
          setWhRentalAlerts(null)
          setWhInboundAlerts(null)
          setWhArrivedAlerts(null)
          setWhContractPayments(null)
        }
      }
    }
  }, [isSa, isWh])

  useEffect(() => {
    void load()
    const pollMs = isWh ? 15_000 : 60_000
    const id = window.setInterval(() => void load(), pollMs)
    return () => window.clearInterval(id)
  }, [load, isWh])

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
  const whRentalPending = whRentalAlerts?.pendingCount ?? 0
  const whInboundPending = whInboundAlerts?.pendingCount ?? 0
  const whInboundArrived = whArrivedAlerts?.arrivedCount ?? 0
  const whContractPaid = whContractPayments?.recentCount ?? 0
  const badgeCount = isSa
    ? guestCount
    : whRentalPending + whInboundPending + whInboundArrived + whContractPaid
  const whHasAny =
    whRentalPending > 0 ||
    whInboundPending > 0 ||
    whInboundArrived > 0 ||
    whContractPaid > 0

  return (
    <div ref={rootRef} className="relative">
      {/* Icon chuông thông báo */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) void load()
        }}
        className={`relative p-2 transition-colors ${
          isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
        }`}
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined">notifications</span>
        {badgeCount > 0 && (
          <span className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
            isDarkMode 
              ? 'bg-[#06edf9] text-[#0b101a] shadow-[0_0_8px_rgba(6,237,249,0.8)]' 
              : 'bg-red-500 text-white'
          }`}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        /* Thùng chứa dropdown danh sách thông báo */
        <div className={`absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border shadow-2xl ${
          isDarkMode 
            ? 'border-white/10 bg-[#111827] shadow-black/50' 
            : 'border-slate-200 bg-white shadow-slate-300/60'
        }`}>
          {/* Header Dropdown */}
          <div className={`border-b px-4 py-3 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Thông báo</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {isSa
                ? 'Guest onboarding — cấp tài khoản'
                : 'Yêu cầu thuê, nhập kho & thanh toán HĐ'}
            </p>
          </div>

          {/* KHU VỰC HIỂN THỊ CỦA WAREHOUSE ADMIN (Giao diện Sáng) */}
          {isWh && (
            <>
              {!whHasAny ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  Không có thông báo mới.
                </p>
              ) : (
                <div className={`space-y-3 px-4 py-3 text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {whRentalPending > 0 && (
                    <p>
                      <span className={`font-semibold ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`}>{whRentalPending}</span> yêu cầu thuê chưa duyệt
                      {whRentalAlerts?.warehouseName ? (
                        <>
                          {' '}tại khu vực{' '}
                          <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{whRentalAlerts.warehouseName}</strong>
                        </>
                      ) : null}.
                    </p>
                  )}
                  {whInboundPending > 0 && (
                    <p>
                      <span className={`font-semibold ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`}>{whInboundPending}</span> yêu cầu nhập kho chờ duyệt
                      {whInboundAlerts?.warehouseName ? (
                        <>
                          {' '}tại <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{whInboundAlerts.warehouseName}</strong>
                        </>
                      ) : null}.
                    </p>
                  )}
                  {whInboundArrived > 0 && (
                    <p>
                      <span className={`font-semibold ${isDarkMode ? 'text-violet-300' : 'text-violet-600'}`}>{whInboundArrived}</span> xe đã tới cổng kho — chờ nhận hàng
                      {whArrivedAlerts?.warehouseName ? (
                        <>
                          {' '}tại <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{whArrivedAlerts.warehouseName}</strong>
                        </>
                      ) : null}.
                    </p>
                  )}
                  {whContractPaid > 0 && (
                    <p>
                      <span className={`font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>{whContractPaid}</span> hợp đồng vừa thanh toán invoice đầu — đã{' '}
                      <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>ACTIVE</strong>
                      {whContractPayments?.warehouseName ? (
                        <>
                          {' '}tại <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{whContractPayments.warehouseName}</strong>
                        </>
                      ) : null}.
                    </p>
                  )}
                </div>
              )}

              {/* Danh sách hợp đồng thanh toán mới */}
              {whContractPayments && whContractPayments.recent.length > 0 && (
                <>
                  <p className={`border-t px-4 py-2 text-[10px] font-semibold uppercase tracking-wide ${
                    isDarkMode ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'
                  }`}>
                    Thanh toán HĐ
                  </p>
                  <ul className={`max-h-40 overflow-y-auto border-b py-1 ${
                    isDarkMode ? 'dark-scrollbar border-white/5' : 'border-slate-100'
                  }`}>
                    {whContractPayments.recent.map((item) => (
                      <li key={item.contractId} className={`px-3 py-2 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                        <Link to="/admin/contract" onClick={() => setOpen(false)} className="block no-underline">
                          <p className={`truncate text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                            {item.companyName}
                          </p>
                          <p className={`font-mono text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{item.contractCode}</p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {formatVnd(item.totalAmount)} · ACTIVE · {formatWhen(item.paidAt)}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Danh sách yêu cầu thuê mới */}
              {whRentalAlerts && whRentalAlerts.recent.length > 0 && (
                <>
                  <p className={`border-t px-4 py-2 text-[10px] font-semibold uppercase tracking-wide ${
                    isDarkMode ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'
                  }`}>
                    Yêu cầu thuê
                  </p>
                  <ul className={`max-h-40 overflow-y-auto border-b py-1 ${
                    isDarkMode ? 'dark-scrollbar border-white/5' : 'border-slate-100'
                  }`}>
                    {whRentalAlerts.recent.map((item) => (
                      <li key={item.rentalRequestId} className={`px-3 py-2 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                        <p className={`truncate text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{item.companyName}</p>
                        <p className={`font-mono text-xs ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{item.requestCode}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {item.district}, {item.city} · {statusLabelVi(item.status)} · {formatWhen(item.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Nhập kho */}
              {whInboundAlerts && whInboundAlerts.recent.length > 0 && (
                <>
                  <p className={`border-t px-4 py-2 text-[10px] font-semibold uppercase tracking-wide ${
                    isDarkMode ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'
                  }`}>
                    Nhập kho
                  </p>
                  <ul className={`max-h-40 overflow-y-auto border-b py-1 ${
                    isDarkMode ? 'dark-scrollbar border-white/5' : 'border-slate-100'
                  }`}>
                    {whInboundAlerts.recent.map((item) => (
                      <li key={item.inboundRequestId} className={`px-3 py-2 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                        <p className={`truncate text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{item.companyName}</p>
                        <p className={`font-mono text-xs ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{item.inboundCode}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Chờ duyệt · {formatWhen(item.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Xe đã đến cổng kho */}
              {whArrivedAlerts && whArrivedAlerts.recent.length > 0 && (
                <>
                  <p className={`border-t px-4 py-2 text-[10px] font-semibold uppercase tracking-wide ${
                    isDarkMode ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'
                  }`}>
                    Xe đã đến kho
                  </p>
                  <ul className={`max-h-40 overflow-y-auto border-b py-1 ${
                    isDarkMode ? 'dark-scrollbar border-white/5' : 'border-slate-100'
                  }`}>
                    {whArrivedAlerts.recent.map((item) => (
                      <li key={item.inboundRequestId} className={`px-3 py-2 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                        <Link to={`/admin/inbound/${item.inboundRequestId}`} onClick={() => setOpen(false)} className="block no-underline">
                          <p className={`truncate text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{item.companyName}</p>
                          <p className={`font-mono text-xs ${isDarkMode ? 'text-violet-300' : 'text-violet-600'}`}>{item.inboundCode}</p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {item.driverName ?? 'Tài xế'} · {item.vehiclePlate ?? '—'} · {formatWhen(item.actualArrivalAt ?? '')}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Footer điều hướng của Warehouse Admin */}
              <div className={`flex flex-wrap gap-2 border-t p-3 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <Link to="/admin/requests" onClick={() => setOpen(false)}
                  className={`flex-1 min-w-[7rem] rounded-lg border px-3 py-2 text-center text-xs font-semibold no-underline transition-colors ${
                    isDarkMode 
                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/15' 
                      : 'border-cyan-200 bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
                  }`}
                >
                  Yêu cầu thuê
                </Link>
                <Link to="/admin/inbound" onClick={() => setOpen(false)}
                  className={`flex-1 min-w-[7rem] rounded-lg border px-3 py-2 text-center text-xs font-semibold no-underline transition-colors ${
                    isDarkMode 
                      ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' 
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Nhập kho
                </Link>
                <Link to="/admin/contract" onClick={() => setOpen(false)}
                  className={`flex-1 min-w-[7rem] rounded-lg border px-3 py-2 text-center text-xs font-semibold no-underline transition-colors ${
                    isDarkMode 
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15' 
                      : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  Hợp đồng
                </Link>
              </div>
            </>
          )}

          {/* KHU VỰC HIỂN THỊ CỦA SYSTEM ADMIN (Giao diện Tối - Giữ nguyên gốc) */}
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
                <Link to="/admin/requests" onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-center text-xs font-semibold text-cyan-300 no-underline hover:bg-cyan-500/15"
                >
                  Yêu cầu thuê
                </Link>
                <Link to="/admin/accounts" onClick={() => setOpen(false)}
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