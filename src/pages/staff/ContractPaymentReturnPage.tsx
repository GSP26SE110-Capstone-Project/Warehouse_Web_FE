import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import * as contractsApi from '../../api/contracts'
import { InlineAlert } from '../../components/ui/FeedbackAlert'

export function ContractPaymentReturnPage() {
  const [params] = useSearchParams()
  const contractId = params.get('contractId') ?? ''
  const invoiceId = params.get('invoiceId') ?? ''
  const appendixId = params.get('appendixId') ?? ''
  const isAppendixPayment = Boolean(appendixId)
  const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!contractId || !invoiceId) {
      setStatus('error')
      setMessage('Thiếu contractId hoặc invoiceId trên URL.')
      return
    }

    let cancelled = false
    let attempts = 0
    const maxAttempts = 12

    const poll = async () => {
      try {
        try {
          const sync = await contractsApi.syncContractInvoicePayOSPayment(contractId, invoiceId)
          if (cancelled) return
          if (sync.synced && (sync.alreadyPaid || sync.invoice?.paymentStatus === 'PAID')) {
            setStatus('paid')
            setMessage(
              isAppendixPayment
                ? 'Thanh toán PayOS đã được xác nhận. Phụ lục đã kích hoạt.'
                : 'Thanh toán PayOS đã được xác nhận. Hợp đồng đã kích hoạt.'
            )
            return
          }
        } catch {
          // Tiếp tục poll nếu sync lỗi tạm thời
        }

        const invoices = await contractsApi.listContractInvoices(contractId)
        const inv = invoices.find((i) => i.invoiceId === invoiceId)
        if (cancelled) return
        if (inv?.paymentStatus === 'PAID') {
          setStatus('paid')
          setMessage(
            isAppendixPayment
              ? 'Thanh toán PayOS đã được xác nhận. Phụ lục đã kích hoạt.'
              : 'Thanh toán PayOS đã được xác nhận. Hợp đồng đã kích hoạt.'
          )
          return
        }
        attempts += 1
        if (attempts >= maxAttempts) {
          setStatus('pending')
          setMessage(
            'PayOS đã chuyển hướng về — hệ thống đang chờ webhook xác nhận. Vui lòng làm mới trang Hợp đồng sau vài phút.'
          )
          return
        }
        setTimeout(poll, 2000)
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          setMessage(e instanceof ApiError ? e.message : 'Không kiểm tra được trạng thái thanh toán')
        }
      }
    }

    void poll()
    return () => {
      cancelled = true
    }
  }, [contractId, invoiceId, isAppendixPayment])

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-slate-100">
      <h1 className="text-xl font-bold text-white">Kết quả thanh toán PayOS</h1>
      {status === 'loading' && (
        <p className="mt-4 text-sm text-slate-400">Đang xác nhận thanh toán…</p>
      )}
      {status !== 'loading' && message && (
        <div className="mt-4">
          <InlineAlert
            message={message}
            variant={status === 'paid' ? 'success' : status === 'error' ? 'error' : 'info'}
          />
        </div>
      )}
      <Link
        to="/staff/contracts"
        className="mt-8 inline-flex rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
      >
        Về Hợp đồng
      </Link>
    </div>
  )
}
