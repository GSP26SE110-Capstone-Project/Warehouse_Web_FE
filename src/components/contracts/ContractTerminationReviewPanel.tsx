import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import * as contractsApi from '../../api/contracts'
import type {
  ApiContractTerminationRequest,
  ContractStatus,
  ContractTerminationPreview,
} from '../../api/types'
import { InlineAlert } from '../ui/FeedbackAlert'
import { ContractTerminationSettlementView } from './ContractTerminationSettlementView'
import { TERMINATION_REQUEST_STATUS_LABELS } from '../../utils/contractTermination'

type Props = {
  contractId: string
  contractStatus: ContractStatus
  onUpdated?: () => void
}

export function ContractTerminationReviewPanel({
  contractId,
  contractStatus,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState<ApiContractTerminationRequest | null>(null)
  const [preview, setPreview] = useState<ContractTerminationPreview | null>(null)
  const [history, setHistory] = useState<ApiContractTerminationRequest[]>([])

  const load = useCallback(async () => {
    if (contractStatus !== 'ACTIVE' && contractStatus !== 'TERMINATED') {
      setPending(null)
      setPreview(null)
      setHistory([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const all = await contractsApi.listContractTerminationRequests(contractId)
      setHistory(all)
      const pend = all.find((r) => r.status === 'PENDING') ?? null
      setPending(pend)
      if (contractStatus === 'ACTIVE') {
        try {
          const p = await contractsApi.previewContractTermination(contractId)
          setPreview(p)
        } catch {
          setPreview(null)
        }
      } else if (pend) {
        setPreview({
          contractId,
          contractStatus,
          billingCycle: pend.billingCycle,
          hasInbound: pend.hasInbound,
          totalPaid: Number(pend.totalPaid) || 0,
          monthlyRate: Number(pend.monthlyRate) || 0,
          contractMonths: pend.contractMonths ?? 0,
          usedMonths: pend.usedMonths ?? 0,
          unusedMonths: pend.unusedMonths ?? 0,
          processingFee: Number(pend.processingFee) || 0,
          terminationFee: Number(pend.terminationFee) || 0,
          refundAmount: Number(pend.refundAmount) || 0,
        })
      } else {
        setPreview(null)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải yêu cầu chấm dứt')
    } finally {
      setLoading(false)
    }
  }, [contractId, contractStatus])

  useEffect(() => {
    void load()
  }, [load])

  const handleApprove = async () => {
    if (!pending) return
    setActing(true)
    setError('')
    setSuccess('')
    try {
      const result = await contractsApi.approveContractTerminationRequest(
        contractId,
        pending.terminationRequestId
      )
      setSuccess(result.nextSteps?.message ?? 'Đã duyệt chấm dứt hợp đồng.')
      onUpdated?.()
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Duyệt thất bại')
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!pending) return
    setActing(true)
    setError('')
    setSuccess('')
    try {
      await contractsApi.rejectContractTerminationRequest(
        contractId,
        pending.terminationRequestId
      )
      setSuccess('Đã từ chối yêu cầu chấm dứt.')
      onUpdated?.()
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Từ chối thất bại')
    } finally {
      setActing(false)
    }
  }

  if (contractStatus !== 'ACTIVE' && contractStatus !== 'TERMINATED' && history.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-amber-200">Chấm dứt hợp đồng sớm</h3>
      {loading && <p className="text-xs text-slate-500">Đang tải...</p>}
      {error && <InlineAlert message={error} onDismiss={() => setError('')} />}
      {success && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {success}
        </p>
      )}

      {!loading && pending && (
        <div className="space-y-3">
          <p className="text-sm text-white">
            Tenant yêu cầu chấm dứt —{' '}
            <span className="font-medium text-amber-300">
              {TERMINATION_REQUEST_STATUS_LABELS.PENDING}
            </span>
          </p>
          {pending.reason && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Lý do: </span>
              {pending.reason}
            </p>
          )}
          {preview && <ContractTerminationSettlementView preview={preview} />}
          {contractStatus === 'ACTIVE' && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={acting}
                onClick={() => void handleApprove()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {acting ? 'Đang xử lý…' : 'Duyệt chấm dứt'}
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={() => void handleReject()}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && !pending && contractStatus === 'ACTIVE' && (
        <p className="text-xs text-slate-500">Chưa có yêu cầu chấm dứt đang chờ.</p>
      )}

      {!loading && history.length > 0 && (
        <div className="border-t border-white/5 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Lịch sử yêu cầu</p>
          <ul className="space-y-1 text-xs text-slate-400">
            {history.slice(0, 5).map((r) => (
              <li key={r.terminationRequestId}>
                {TERMINATION_REQUEST_STATUS_LABELS[r.status] ?? r.status}
                {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleString('vi-VN')}` : ''}
                {r.refundAmount != null
                  ? ` · hoàn ${Number(r.refundAmount).toLocaleString('vi-VN')}₫`
                  : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
