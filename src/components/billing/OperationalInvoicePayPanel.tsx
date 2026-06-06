import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import * as contractsApi from '../../api/contracts'
import type { ApiContractInvoice, InvoiceCategory } from '../../api/types'

const PAYOS_WINDOW_NAME = 'payos-checkout'

const CATEGORY_LABELS: Partial<Record<InvoiceCategory, string>> = {
  OPERATIONAL: 'Phụ phí vận hành',
  RECURRING_RENT: 'Tiền thuê tháng',
  INITIAL: 'Invoice đầu',
}

function formatVnd(amount: number | string | null | undefined) {
  const n = Number(amount ?? 0)
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

type Props = {
  contractId: string
  title?: string
  hint?: string
  loadInvoice: () => Promise<ApiContractInvoice | null>
  onPaid?: () => void
}

export function OperationalInvoicePayPanel({
  contractId,
  title = 'Thanh toán phụ phí',
  hint,
  loadInvoice,
  onPaid,
}: Props) {
  const [invoice, setInvoice] = useState<ApiContractInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const payOsInFlightRef = useRef(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const inv = await loadInvoice()
      setInvoice(inv)
    } catch (e) {
      setInvoice(null)
      if (e instanceof ApiError && e.status !== 404) {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }, [loadInvoice])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handlePay = async () => {
    if (!invoice || payOsInFlightRef.current) return
    if (invoice.paymentStatus === 'PAID') return

    payOsInFlightRef.current = true
    setPaying(true)
    setError('')

    const payTab = window.open('about:blank', PAYOS_WINDOW_NAME)
    if (!payTab) {
      payOsInFlightRef.current = false
      setPaying(false)
      setError('Trình duyệt chặn cửa sổ mới — cho phép popup rồi thử lại.')
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
      const msg = e instanceof ApiError ? e.message : 'Không tạo được link PayOS'
      setError(msg)
      if (e instanceof ApiError && e.code === 'INVOICE_ALREADY_PAID') {
        void refresh()
        onPaid?.()
      }
    } finally {
      payOsInFlightRef.current = false
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <section className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm text-slate-400">
        Đang tải thông tin thanh toán…
      </section>
    )
  }

  if (!invoice) return null

  const isPaid = invoice.paymentStatus === 'PAID'
  const categoryLabel =
    (invoice.invoiceCategory && CATEGORY_LABELS[invoice.invoiceCategory]) ??
    'Invoice'

  return (
    <section className="mb-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
      <p className="text-sm font-semibold text-orange-200">{title}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-200">
          <span className="text-slate-400">{categoryLabel}:</span>{' '}
          <strong className="text-white">{formatVnd(invoice.totalAmount)}</strong>
          {invoice.dueDate ? (
            <span className="ml-2 text-xs text-slate-500">
              Hạn: {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
            </span>
          ) : null}
        </div>
        {isPaid ? (
          <span className="rounded-md bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            Đã thanh toán
          </span>
        ) : (
          <button
            type="button"
            disabled={paying}
            onClick={() => void handlePay()}
            className="rounded-md bg-orange-500 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-orange-400 disabled:opacity-50"
          >
            {paying ? 'Đang mở PayOS…' : 'Thanh toán PayOS'}
          </button>
        )}
      </div>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      {!isPaid ? (
        <p className="mt-2 text-xs text-amber-200/90">
          Thanh toán trong 3 ngày. Quá hạn có thể bị chấm dứt hợp đồng.
        </p>
      ) : null}
    </section>
  )
}
