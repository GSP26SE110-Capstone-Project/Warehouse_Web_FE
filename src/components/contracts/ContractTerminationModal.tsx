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
      <div
        className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b101a] shadow-2xl">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Yêu cầu chấm dứt hợp đồng</h2>
          <p className="mt-1 font-mono text-sm text-cyan-300">{contractCode}</p>
        </div>

        <div className="dark-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
          {loading && <p className="text-sm text-slate-400">Đang tải...</p>}
          {error && <InlineAlert message={error} onDismiss={() => setError('')} />}

          {!loading && pending && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
              <p className="font-medium text-amber-200">
                {TERMINATION_REQUEST_STATUS_LABELS[pending.status] ?? pending.status}
              </p>
              <p className="mt-1 text-slate-400">
                Yêu cầu đã gửi
                {pending.createdAt
                  ? ` lúc ${new Date(pending.createdAt).toLocaleString('vi-VN')}`
                  : ''}
                . Chờ kho duyệt hoặc từ chối.
              </p>
              {pending.reason && (
                <p className="mt-2 text-slate-300">
                  <span className="text-slate-500">Lý do: </span>
                  {pending.reason}
                </p>
              )}
              {preview && <ContractTerminationSettlementView preview={preview} compact />}
            </div>
          )}

          {!loading && !pending && preview && (
            <>
              <ContractTerminationSettlementView preview={preview} />
              <div>
                <label
                  htmlFor="termination-reason"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Lý do (tuỳ chọn)
                </label>
                <textarea
                  id="termination-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="VD: Thu gọn hoạt động, chuyển kho khác..."
                  className="w-full rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm text-white placeholder:text-slate-600"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">
            Đóng
          </button>
          {!loading && !pending && preview && (
            <button
              type="button"
              disabled={submitting || preview.canRequestNow === false}
              onClick={() => void handleSubmit()}
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {submitting ? 'Đang gửi…' : 'Gửi yêu cầu chấm dứt'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
