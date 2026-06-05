import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import * as contractsApi from '../../api/contracts'
import type { ApiContractTerminationRequest, ContractTerminationPreview } from '../../api/types'
import { InlineAlert } from '../ui/FeedbackAlert'
import { ContractTerminationSettlementView } from './ContractTerminationSettlementView'
import { TERMINATION_REQUEST_STATUS_LABELS } from '../../utils/contractTermination'

type Props = {
  contractId: string
  contractCode: string
  onClose: () => void
  onSubmitted: () => void
}

export function ContractTerminationModal({
  contractId,
  contractCode,
  onClose,
  onSubmitted,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<ContractTerminationPreview | null>(null)
  const [pending, setPending] = useState<ApiContractTerminationRequest | null>(null)
  const [reason, setReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [p, requests] = await Promise.all([
        contractsApi.previewContractTermination(contractId),
        contractsApi.listContractTerminationRequests(contractId, { status: 'PENDING' }),
      ])
      setPreview(p)
      setPending(requests[0] ?? null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được thông tin chấm dứt')
      setPreview(null)
      setPending(null)
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = async () => {
    if (pending) return
    setSubmitting(true)
    setError('')
    try {
      await contractsApi.requestContractTermination(contractId, {
        reason: reason.trim() || undefined,
      })
      onSubmitted()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gửi yêu cầu thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Lớp nền overlay mờ sáng dịu hơn */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      
      {/* Khung Modal Light Mode */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl text-slate-700">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Yêu cầu chấm dứt hợp đồng</h2>
          <p className="mt-1 font-mono text-sm font-medium text-sky-600">{contractCode}</p>
        </div>

        <div className="light-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
          {loading && <p className="text-sm text-slate-400">Đang tải...</p>}
          {error && <InlineAlert message={error} onDismiss={() => setError('')} />}

          {/* Trạng thái yêu cầu đang chờ xử lý */}
          {!loading && pending && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-amber-800">
                {TERMINATION_REQUEST_STATUS_LABELS[pending.status] ?? pending.status}
              </p>
              <p className="mt-1 text-slate-500">
                Yêu cầu đã gửi
                {pending.createdAt
                  ? ` lúc ${new Date(pending.createdAt).toLocaleString('vi-VN')}`
                  : ''}
                . Chờ kho duyệt hoặc từ chối.
              </p>
              {pending.reason && (
                <p className="mt-2 text-slate-600 bg-white/60 rounded p-2 border border-amber-100">
                  <span className="text-slate-400 font-medium">Lý do: </span>
                  {pending.reason}
                </p>
              )}
              {preview && (
                <div className="mt-3 pt-3 border-t border-amber-200/60">
                  <ContractTerminationSettlementView preview={preview} compact />
                </div>
              )}
            </div>
          )}

          {/* Form tạo yêu cầu mới */}
          {!loading && !pending && preview && (
            <>
              <ContractTerminationSettlementView preview={preview} />
              <div className="space-y-1.5">
                <label
                  htmlFor="termination-reason"
                  className="block text-xs font-bold uppercase tracking-wide text-slate-400"
                >
                  Lý do (tuỳ chọn)
                </label>
                <textarea
                  id="termination-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="VD: Thu gọn hoạt động, chuyển kho khác..."
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-colors"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="text-sm font-medium text-slate-500 hover:text-slate-800 rounded-lg px-4 py-2 transition-colors"
          >
            Đóng
          </button>
          {!loading && !pending && preview && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit()}
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang gửi…' : 'Gửi yêu cầu chấm dứt'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}