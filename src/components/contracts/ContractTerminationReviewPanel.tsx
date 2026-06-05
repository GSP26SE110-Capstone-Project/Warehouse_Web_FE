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
    <section className="rounded-lg border border-amber-300 bg-amber-50 p-5 space-y-4 shadow-sm">
      <h3 className="text-base font-bold text-amber-900">Chấm dứt hợp đồng sớm</h3>
      
      {loading && <p className="text-sm font-medium text-slate-600">Đang tải...</p>}
      {error && <InlineAlert message={error} onDismiss={() => setError('')} />}
      {success && (
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-900">
          {success}
        </p>
      )}

      {!loading && pending && (
        <div className="space-y-4">
          {/* Tăng cỡ chữ lên text-sm và đổi sang màu slate-900 siêu rõ nét */}
          <p className="text-sm font-bold text-slate-900">
            Tenant yêu cầu chấm dứt —{' '}
            <span className="rounded bg-amber-200/80 px-2 py-0.5 text-amber-900">
              {TERMINATION_REQUEST_STATUS_LABELS.PENDING}
            </span>
          </p>
          
          {pending.reason && (
            /* Đổi nền box lý do sang màu tương phản cao giúp chữ text-slate-800 nổi hẳn lên */
            <p className="text-sm text-slate-900 bg-amber-100/40 border border-amber-200 p-3 rounded-lg leading-relaxed">
              <span className="font-bold text-slate-600">Lý do: </span>
              {pending.reason}
            </p>
          )}
          
          {preview && <ContractTerminationSettlementView preview={preview} />}
          
          {contractStatus === 'ACTIVE' && (
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                disabled={acting}
                onClick={() => void handleApprove()}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors"
              >
                {acting ? 'Đang xử lý…' : 'Duyệt chấm dứt'}
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={() => void handleReject()}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors"
              >
                Từ chối
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && !pending && contractStatus === 'ACTIVE' && (
        <p className="text-sm font-semibold text-slate-600">Chưa có yêu cầu chấm dứt đang chờ.</p>
      )}

      {!loading && history.length > 0 && (
        <div className="border-t border-amber-200 pt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">Lịch sử yêu cầu</p>
          <ul className="space-y-2 text-sm text-slate-800 font-medium">
            {history.slice(0, 5).map((r) => (
              <li key={r.terminationRequestId} className="flex items-center gap-2 bg-white/60 border border-slate-100 p-2 rounded-md shadow-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-slate-500"></span>
                <span className="font-bold text-slate-900">
                  {TERMINATION_REQUEST_STATUS_LABELS[r.status] ?? r.status}
                </span>
                <span className="text-slate-600">
                  {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleString('vi-VN')}` : ''}
                </span>
                {r.refundAmount != null && (
                  <>
                    <span className="text-slate-400">·</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      hoàn {Number(r.refundAmount).toLocaleString('vi-VN')}₫
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}