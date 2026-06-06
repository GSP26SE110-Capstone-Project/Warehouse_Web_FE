import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/client'
import {
  fetchTenantContractActionAlerts,
  fetchTenantRecurringRentAlerts,
  fetchTenantRentalStatusAlerts,
  type TenantContractAlerts,
  type TenantRecurringRentAlerts,
  type TenantRentalAlerts,
} from '../../../api/tenantNotifications'
import { formatVnd } from '../../../data/pricing'
import { rentalRequestStatusLabel } from '../../../data/rentalRequestStatus'
import { contractStatusLabel } from '../../../utils/contractSigning'
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

export function TenantNotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [rentalAlerts, setRentalAlerts] = useState<TenantRentalAlerts | null>(null)
  const [contractAlerts, setContractAlerts] = useState<TenantContractAlerts | null>(null)
  const [recurringAlerts, setRecurringAlerts] = useState<TenantRecurringRentAlerts | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const isTenantAdmin = user?.role === 'TENANT_ADMIN'
  const badgeCount =
    (rentalAlerts?.approvedCount ?? 0) +
    (rentalAlerts?.rejectedCount ?? 0) +
    (contractAlerts?.needsSignCount ?? 0) +
    (contractAlerts?.needsPaymentCount ?? 0) +
    (recurringAlerts?.dueSoonCount ?? 0) +
    (recurringAlerts?.pendingRecurringCount ?? 0)

  const load = useCallback(async () => {
    if (!isTenantAdmin) return
    try {
      const [rentals, contracts, recurring] = await Promise.all([
        fetchTenantRentalStatusAlerts(),
        fetchTenantContractActionAlerts(),
        fetchTenantRecurringRentAlerts(),
      ])
      setRentalAlerts(rentals)
      setContractAlerts(contracts)
      setRecurringAlerts(recurring)
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 403)) {
        setRentalAlerts(null)
        setContractAlerts(null)
        setRecurringAlerts(null)
      }
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
              Yêu cầu thuê · hợp đồng · tiền thuê định kỳ
            </p>
          </div>

          {badgeCount === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              Không có thông báo mới.
            </p>
          ) : (
            <div className="space-y-2 px-4 py-3 text-xs text-slate-300">
              {(contractAlerts?.needsSignCount ?? 0) > 0 && (
                <p>
                  <span className="font-semibold text-amber-300">
                    {contractAlerts?.needsSignCount}
                  </span>{' '}
                  hợp đồng chờ bạn ký.
                </p>
              )}
              {(contractAlerts?.needsPaymentCount ?? 0) > 0 && (
                <p>
                  <span className="font-semibold text-orange-300">
                    {contractAlerts?.needsPaymentCount}
                  </span>{' '}
                  hợp đồng chờ thanh toán invoice đầu.
                </p>
              )}
              {(rentalAlerts?.approvedCount ?? 0) > 0 && (
                <p>
                  <span className="font-semibold text-emerald-300">{rentalAlerts?.approvedCount}</span>{' '}
                  yêu cầu thuê đã được duyệt.
                </p>
              )}
              {(rentalAlerts?.rejectedCount ?? 0) > 0 && (
                <p>
                  <span className="font-semibold text-red-300">{rentalAlerts?.rejectedCount}</span> yêu
                  cầu thuê bị từ chối gần đây.
                </p>
              )}
              {(recurringAlerts?.dueSoonCount ?? 0) > 0 && (
                <p>
                  <span className="font-semibold text-amber-300">
                    {recurringAlerts?.dueSoonCount}
                  </span>{' '}
                  hợp đồng sắp đến kỳ tiền thuê định kỳ (trong{' '}
                  {recurringAlerts?.reminderDays ?? 3} ngày).
                </p>
              )}
              {(recurringAlerts?.pendingRecurringCount ?? 0) > 0 && (
                <p>
                  <span className="font-semibold text-orange-300">
                    {recurringAlerts?.pendingRecurringCount}
                  </span>{' '}
                  hóa đơn tiền thuê định kỳ chờ thanh toán.
                </p>
              )}
            </div>
          )}

          {(contractAlerts?.recent ?? []).length > 0 && (
            <>
              <p className="border-t border-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Hợp đồng
              </p>
              <ul className="max-h-40 overflow-y-auto dark-scrollbar border-b border-white/5 py-1">
                {contractAlerts?.recent.map((item) => (
                  <li key={item.contractId} className="px-3 py-2 hover:bg-white/5">
                    <Link
                      to="/staff/contracts"
                      onClick={() => setOpen(false)}
                      className="block no-underline"
                    >
                      <p className="font-mono text-sm text-cyan-300">{item.contractCode}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.status === 'PENDING_PAYMENT' ? (
                          <span className="text-orange-300">
                            {contractStatusLabel(item.status as 'PENDING_PAYMENT')}
                          </span>
                        ) : (
                          <span className="text-amber-300">
                            {contractStatusLabel(item.status as 'PENDING_APPROVAL')}
                          </span>
                        )}
                        {item.warehouseName ? ` · ${item.warehouseName}` : ''}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {formatWhen(item.updatedAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {(recurringAlerts?.recent ?? []).length > 0 && (
            <>
              <p className="border-t border-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Tiền thuê định kỳ
              </p>
              <ul className="max-h-40 overflow-y-auto dark-scrollbar border-b border-white/5 py-1">
                {recurringAlerts?.recent.map((item) => (
                  <li key={item.contractId} className="px-3 py-2 hover:bg-white/5">
                    <Link
                      to="/staff/recurring-rent"
                      onClick={() => setOpen(false)}
                      className="block no-underline"
                    >
                      <p className="font-mono text-sm text-cyan-300">{item.contractCode}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.paymentStatus === 'PENDING_INVOICE' ? (
                          <span className="text-orange-300">
                            Chờ thanh toán · {formatVnd(item.monthlyRent)}
                          </span>
                        ) : (
                          <span className="text-amber-300">
                            Sắp đến hạn · {item.nextBillingDateLabel ?? '—'}
                          </span>
                        )}
                        {item.warehouseName ? ` · ${item.warehouseName}` : ''}
                      </p>
                      {item.pendingInvoiceCode ? (
                        <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                          {item.pendingInvoiceCode}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {(rentalAlerts?.recent ?? []).length > 0 && (
            <>
              <p className="border-t border-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Yêu cầu thuê
              </p>
              <ul className="max-h-40 overflow-y-auto dark-scrollbar border-b border-white/5 py-1">
                {rentalAlerts?.recent.map((item) => (
                  <li key={item.rentalRequestId} className="px-3 py-2 hover:bg-white/5">
                    <Link
                      to="/staff/rental-requests"
                      onClick={() => setOpen(false)}
                      className="block no-underline"
                    >
                      <p className="font-mono text-sm text-cyan-300">{item.requestCode}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.status === 'APPROVED' ? (
                          <span className="text-emerald-300">
                            {rentalRequestStatusLabel(item.status)}
                            {item.warehouseName ? ` · ${item.warehouseName}` : ''}
                          </span>
                        ) : (
                          <span className="text-red-300">
                            {rentalRequestStatusLabel(item.status)}
                            {item.rejectionReason ? ` — ${item.rejectionReason}` : ''}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {item.district}, {item.city} · {formatWhen(item.reviewedAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="flex flex-wrap gap-2 border-t border-white/5 p-3">
            <Link
              to="/staff/recurring-rent"
              onClick={() => setOpen(false)}
              className="flex-1 min-w-[7rem] rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-center text-xs font-semibold text-orange-300 no-underline hover:bg-orange-500/15"
            >
              Tiền thuê định kỳ
            </Link>
            <Link
              to="/staff/contracts"
              onClick={() => setOpen(false)}
              className="flex-1 min-w-[7rem] rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-semibold text-amber-300 no-underline hover:bg-amber-500/15"
            >
              Hợp đồng
            </Link>
            <Link
              to="/staff/rental-requests"
              onClick={() => setOpen(false)}
              className="flex-1 min-w-[7rem] rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-center text-xs font-semibold text-cyan-300 no-underline hover:bg-cyan-500/15"
            >
              Yêu cầu thuê
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
