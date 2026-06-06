import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import * as contractsApi from '../../api/contracts'
import type { ApiContractInvoice } from '../../api/types'
import { formatVnd } from '../../data/pricing'
import {
  invoiceCategoryLabel,
  invoicePaymentStatusClass,
  INVOICE_PAYMENT_STATUS_LABELS,
  isContractRentInvoice,
} from '../../utils/invoiceLabels'

const PAYOS_WINDOW_NAME = 'smartwarehouse_payos_checkout'

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

function formatPeriod(inv: ApiContractInvoice) {
  const start = formatDate(inv.billingStartDate)
  const end = formatDate(inv.billingEndDate)
  if (start === '—' && end === '—') return '—'
  return `${start} → ${end}`
}

function sortInvoices(items: ApiContractInvoice[]) {
  const rank = (inv: ApiContractInvoice) => {
    if (inv.paymentStatus === 'PENDING') return 0
    if (inv.paymentStatus === 'OVERDUE') return 1
    return 2
  }
  return [...items].sort((a, b) => {
    const r = rank(a) - rank(b)
    if (r !== 0) return r
    const aTime = a.issuedAt ? new Date(a.issuedAt).getTime() : 0
    const bTime = b.issuedAt ? new Date(b.issuedAt).getTime() : 0
    return bTime - aTime
  })
}

type Props = {
  contractId: string
  onPaid?: () => void
  className?: string
}

export function ContractInvoicesPanel({ contractId, onPaid, className = '' }: Props) {
  const [invoices, setInvoices] = useState<ApiContractInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null)
  const payOsInFlightRef = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await contractsApi.listContractInvoices(contractId)
      setInvoices(rows)
    } catch (e) {
      setInvoices([])
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách hóa đơn')
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    void load()
  }, [load])

  const rentInvoices = useMemo(
    () => invoices.filter((i) => isContractRentInvoice(i.invoiceCategory)),
    [invoices]
  )
  const sorted = useMemo(() => sortInvoices(rentInvoices), [rentInvoices])
  const pendingCount = useMemo(
    () =>
      rentInvoices.filter(
        (i) => i.paymentStatus === 'PENDING' && i.invoiceCategory === 'RECURRING_RENT'
      ).length,
    [rentInvoices]
  )

  const handlePay = async (invoice: ApiContractInvoice) => {
    if (payOsInFlightRef.current || invoice.paymentStatus !== 'PENDING') return
    payOsInFlightRef.current = true
    setPayingInvoiceId(invoice.invoiceId)
    setError('')

    const payTab = window.open('about:blank', PAYOS_WINDOW_NAME)
    if (!payTab) {
      payOsInFlightRef.current = false
      setPayingInvoiceId(null)
      setError('Trình duyệt chặn popup — cho phép cửa sổ mới rồi thử lại.')
      return
    }

    try {
      const link = await contractsApi.createContractInvoicePayOSLink(
        contractId,
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
        onPaid?.()
      }
    } finally {
      payOsInFlightRef.current = false
      setPayingInvoiceId(null)
    }
  }

  return (
    <section className={`rounded-xl border border-white/10 bg-white/[0.02] p-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Hóa đơn</h3>
        {pendingCount > 0 && (
          <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-orange-300 ring-1 ring-orange-500/30">
            {pendingCount} chưa trả
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Chỉ tiền thuê (invoice đầu + tiền thuê tháng). Phụ phí inbound/outbound/vận chuyển thanh
        toán tại phiếu nhập/xuất — hạn 3 ngày mỗi invoice.
      </p>

      {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}

      {loading ? (
        <p className="mt-3 text-sm text-slate-400">Đang tải hóa đơn…</p>
      ) : sorted.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Chưa có hóa đơn trên hợp đồng này.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-[#131b29] text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Loại</th>
                <th className="px-3 py-2">Mã</th>
                <th className="px-3 py-2">Kỳ</th>
                <th className="px-3 py-2 text-right">Số tiền</th>
                <th className="px-3 py-2">Hạn trả</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {sorted.map((inv) => {
                const amount = Number(inv.totalAmount ?? 0)
                const status = inv.paymentStatus ?? 'PENDING'
                const isPending = status === 'PENDING'
                return (
                  <tr key={inv.invoiceId} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5">
                      <span
                        className={
                          inv.invoiceCategory === 'RECURRING_RENT'
                            ? 'font-medium text-cyan-300'
                            : 'text-slate-200'
                        }
                      >
                        {invoiceCategoryLabel(inv.invoiceCategory)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">
                      {inv.invoiceCode}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-400">
                      {formatPeriod(inv)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium text-white">
                      {formatVnd(amount)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(inv.dueDate)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${invoicePaymentStatusClass(status)}`}
                      >
                        {INVOICE_PAYMENT_STATUS_LABELS[status] ?? status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {isPending && isContractRentInvoice(inv.invoiceCategory) ? (
                        <button
                          type="button"
                          disabled={payingInvoiceId === inv.invoiceId}
                          onClick={() => void handlePay(inv)}
                          className="rounded-md bg-orange-500 px-2.5 py-1 text-[11px] font-semibold text-slate-900 hover:bg-orange-400 disabled:opacity-50"
                        >
                          {payingInvoiceId === inv.invoiceId
                            ? 'PayOS…'
                            : inv.invoiceCategory === 'RECURRING_RENT'
                              ? 'Pay tiền thuê'
                              : 'PayOS'}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
