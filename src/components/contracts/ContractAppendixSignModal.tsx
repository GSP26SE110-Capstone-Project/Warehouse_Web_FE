import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import * as contractAppendicesApi from '../../api/contractAppendices'
import { formatVnd } from '../../data/pricing'
import {
  appendixPaymentSummary,
  formatAppendixPeriod,
  STORAGE_LEVEL_LABELS,
} from '../../utils/contractAppendix'
import { InlineAlert } from '../ui/FeedbackAlert'
import { SignaturePad } from './SignaturePad'

type Props = {
  contractId: string
  appendix: contractAppendicesApi.ApiContractAppendix
  onClose: () => void
  onSigned: () => void
}

export function ContractAppendixSignModal({ contractId, appendix, onClose, onSigned }: Props) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<contractAppendicesApi.AppendixPaymentPreview | null>(
    null
  )
  const [signature, setSignature] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const p = await contractAppendicesApi.previewAppendixPayment(contractId, appendix.appendixId)
        if (!cancelled) setPreview(p)
      } catch {
        if (!cancelled) setPreview(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contractId, appendix.appendixId])

  const handleSign = useCallback(async () => {
    if (!signature?.trim()) {
      setError('Vui lòng ký trước khi xác nhận')
      return
    }
    if (!agreed) {
      setError('Vui lòng đồng ý với nội dung phụ lục')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await contractAppendicesApi.signContractAppendix(contractId, appendix.appendixId, {
        tenantSignature: signature,
      })
      onSigned()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không ký được phụ lục')
    } finally {
      setSubmitting(false)
    }
  }, [signature, agreed, contractId, appendix.appendixId, onSigned, onClose])

  const monthlyRate = Number(appendix.estimatedDeltaAmount) || preview?.monthlyRate || 0

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b101a] shadow-2xl">
        <div className="border-b border-white/5 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Ký phụ lục {appendix.appendixCode}</h3>
          <p className="mt-1 text-xs text-slate-400">
            {appendix.title || 'Phụ lục thuê thêm'} ·{' '}
            {formatAppendixPeriod(appendix.effectiveDate, appendix.endDate)}
          </p>
        </div>

        <div className="dark-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {error && <InlineAlert message={error} onDismiss={() => setError('')} />}

          <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            {appendix.requestedStorageLevel && (
              <p>
                Cấp yêu cầu:{' '}
                <strong className="text-cyan-300">
                  {STORAGE_LEVEL_LABELS[appendix.requestedStorageLevel]}
                </strong>
              </p>
            )}
            <p className="mt-2">
              Đơn giá: <strong className="text-emerald-300">{formatVnd(monthlyRate)}/tháng</strong>
            </p>
            {loading ? (
              <p className="mt-2 text-xs text-slate-500">Đang tính tiền thanh toán…</p>
            ) : preview ? (
              <p className="mt-2 text-emerald-200">{appendixPaymentSummary(preview)}</p>
            ) : null}
            {appendix.reviewNote && (
              <p className="mt-2 text-xs text-slate-500">Ghi chú kho: {appendix.reviewNote}</p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Chữ ký tenant
            </p>
            <SignaturePad onChange={setSignature} />
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 rounded border-white/20"
            />
            Tôi đồng ý với nội dung phụ lục và số tiền thanh toán ước tính ở trên.
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">
            Hủy
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSign()}
            className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            {submitting ? 'Đang ký…' : 'Ký & chờ thanh toán'}
          </button>
        </div>
      </div>
    </div>
  )
}
