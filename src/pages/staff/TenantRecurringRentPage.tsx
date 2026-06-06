import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import * as contractsApi from '../../api/contracts'
import {
  fetchRecurringRentOverview,
  type RecurringRentOverviewItem,
  type RecurringRentPaymentStatus,
} from '../../api/recurringRent'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { useAuth } from '../../auth/AuthContext'
import { formatVnd } from '../../data/pricing'

const PAYOS_WINDOW_NAME = 'smartwarehouse_payos_checkout'

const PAYMENT_STATUS_LABEL: Record<RecurringRentPaymentStatus, string> = {
  UPCOMING: 'Sắp tới',
  DUE_SOON: 'Sắp đến hạn',
  PENDING_INVOICE: 'Chờ thanh toán',
  UNKNOWN: '—',
}

function statusBadgeClass(status: RecurringRentPaymentStatus) {
  if (status === 'PENDING_INVOICE') return 'bg-orange-400/10 text-orange-300 ring-orange-400/20'
  if (status === 'DUE_SOON') return 'bg-amber-400/10 text-amber-300 ring-amber-400/20'
  if (status === 'UPCOMING') return 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20'
  return 'bg-white/5 text-slate-400 ring-white/10'
}

function daysLabel(days: number | null | undefined) {
  if (days === null || days === undefined) return '—'
  if (days === 0) return 'Hôm nay'
  if (days === 1) return '1 ngày nữa'
  return `${days} ngày nữa`
}

export function TenantRecurringRentPage() {
  const { user } = useAuth()
  const isTenantAdmin = user?.role === 'TENANT_ADMIN'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState<RecurringRentOverviewItem[]>([])
  const [reminderDays, setReminderDays] = useState(3)
  const [dueSoonCount, setDueSoonCount] = useState(0)
  const [pendingInvoiceCount, setPendingInvoiceCount] = useState(0)
  const [payingKey, setPayingKey] = useState<string | null>(null)
  const payOsInFlightRef = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchRecurringRentOverview()
      setItems(data.items)
      setReminderDays(data.reminderDays)
      setDueSoonCount(data.dueSoonCount)
      setPendingInvoiceCount(data.pendingInvoiceCount)
    } catch (e) {
      setItems([])
      setError(e instanceof ApiError ? e.message : 'Không tải được tiền thuê định kỳ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const sortedItems = useMemo(() => {
    const rank = (row: RecurringRentOverviewItem) => {
      if (row.paymentStatus === 'PENDING_INVOICE') return 0
      if (row.paymentStatus === 'DUE_SOON') return 1
      return 2
    }
    return [...items].sort((a, b) => {
      const r = rank(a) - rank(b)
      if (r !== 0) return r
      return (a.daysUntilNextBilling ?? 999) - (b.daysUntilNextBilling ?? 999)
    })
  }, [items])

  const handlePay = async (row: RecurringRentOverviewItem) => {
    const invoice = row.pendingInvoice
    if (!invoice || !isTenantAdmin || payOsInFlightRef.current) return

    payOsInFlightRef.current = true
    setPayingKey(`${row.contractId}:${invoice.invoiceId}`)
    setError('')

    const payTab = window.open('about:blank', PAYOS_WINDOW_NAME)
    if (!payTab) {
      payOsInFlightRef.current = false
      setPayingKey(null)
      setError('Trình duyệt chặn popup — cho phép cửa sổ mới rồi thử lại.')
      return
    }

    try {
      const link = await contractsApi.createContractInvoicePayOSLink(
        row.contractId,
        invoice.invoiceId
      )
      if (!link.checkoutUrl) {
        payTab.close()
        setError('PayOS không trả checkout URL')
        return
      }
      payTab.location.href = link.checkoutUrl
      payTab.focus()
    } catch (e) {
      payTab.close()
      setError(e instanceof ApiError ? e.message : 'Không tạo được link PayOS')
      if (e instanceof ApiError && e.code === 'INVOICE_ALREADY_PAID') {
        await load()
      }
    } finally {
      payOsInFlightRef.current = false
      setPayingKey(null)
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-6 p-6">
      <LoadingOverlay show={loading} text="Đang tải tiền thuê định kỳ…" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tiền thuê định kỳ</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Quản lý kỳ thanh toán tiền thuê hàng tháng (RECURRING_RENT) cho hợp đồng đang
            ACTIVE. Hệ thống nhắc qua email và chuông thông báo trước {reminderDays} ngày đến
            ngày thanh toán.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
        >
          Làm mới
        </button>
      </div>

      {error && <InlineAlert variant="error" message={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Hợp đồng ACTIVE</p>
          <p className="mt-1 text-2xl font-bold text-white">{items.length}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-400/80">Sắp đến hạn</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{dueSoonCount}</p>
          <p className="mt-1 text-xs text-slate-400">Trong vòng {reminderDays} ngày tới</p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-orange-400/80">Chờ thanh toán</p>
          <p className="mt-1 text-2xl font-bold text-orange-300">{pendingInvoiceCount}</p>
        </div>
      </div>

      {sortedItems.length === 0 && !loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-400">
          Chưa có hợp đồng ACTIVE nào có tiền thuê định kỳ.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Hợp đồng</th>
                <th className="px-4 py-3">Kho</th>
                <th className="px-4 py-3">Tiền thuê / tháng</th>
                <th className="px-4 py-3">Kỳ thanh toán tiếp</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {sortedItems.map((row) => {
                const pending = row.pendingInvoice
                const payKey = pending ? `${row.contractId}:${pending.invoiceId}` : null
                const isPaying = payKey !== null && payingKey === payKey

                return (
                  <tr key={row.contractId} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-mono text-cyan-300">{row.contractCode}</p>
                      {row.contractName ? (
                        <p className="mt-0.5 text-xs text-slate-500">{row.contractName}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.warehouseName ?? '—'}
                      {row.warehouseCode ? (
                        <span className="text-slate-500"> ({row.warehouseCode})</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {formatVnd(row.monthlyRent)}
                    </td>
                    <td className="px-4 py-3">
                      <p>{row.nextBillingDateLabel ?? '—'}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {daysLabel(row.daysUntilNextBilling)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(row.paymentStatus)}`}
                      >
                        {PAYMENT_STATUS_LABEL[row.paymentStatus]}
                      </span>
                      {pending ? (
                        <p className="mt-1 font-mono text-[10px] text-slate-500">
                          {pending.invoiceCode}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {pending && isTenantAdmin ? (
                          <button
                            type="button"
                            disabled={isPaying}
                            onClick={() => void handlePay(row)}
                            className="rounded-lg bg-[#06edf9] px-3 py-1.5 text-xs font-bold text-[#0b101a] hover:brightness-110 disabled:opacity-60"
                          >
                            {isPaying ? 'Đang mở PayOS…' : 'Thanh toán'}
                          </button>
                        ) : null}
                        <Link
                          to="/staff/contracts"
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 no-underline hover:bg-white/5"
                        >
                          Hợp đồng
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
