import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import * as contractAppendicesApi from '../../api/contractAppendices'
import * as contractsApi from '../../api/contracts'
import type { ApiContract } from '../../api/types'
import type { ContractStatus } from '../../api/types'
import {
  APPENDIX_STATUS_LABELS,
  appendixStatusBadgeClass,
  canWhApprove,
  canWhMarkUnderReview,
  canWhReject,
  canWhTerminate,
  formatAppendixPeriod,
} from '../../utils/contractAppendix'
import { InlineAlert } from '../ui/FeedbackAlert'
import { ContractAppendixApproveModal } from './ContractAppendixApproveModal'

type Props = {
  contractId: string
  contractStatus: ContractStatus
  onUpdated?: () => void
}

export function ContractAppendixReviewPanel({
  contractId,
  contractStatus,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [appendices, setAppendices] = useState<contractAppendicesApi.ApiContractAppendix[]>([])
  const [contract, setContract] = useState<ApiContract | null>(null)
  const [approveTarget, setApproveTarget] =
    useState<contractAppendicesApi.ApiContractAppendix | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    if (contractStatus !== 'ACTIVE') {
      setAppendices([])
      setContract(null)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [c, res] = await Promise.all([
        contractsApi.getContract(contractId),
        contractAppendicesApi.listContractAppendices(contractId, { limit: 50 }),
      ])
      setContract(c)
      setAppendices(res.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được phụ lục')
    } finally {
      setLoading(false)
    }
  }, [contractId, contractStatus])

  useEffect(() => {
    void load()
  }, [load])

  const handleUnderReview = async (appendixId: string) => {
    setActing(true)
    setError('')
    setSuccess('')
    try {
      await contractAppendicesApi.markAppendixUnderReview(contractId, appendixId)
      setSuccess('Đã đánh dấu đang xem xét')
      await load()
      onUpdated?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Thao tác thất bại')
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) {
      setError('Nhập lý do từ chối')
      return
    }
    setActing(true)
    setError('')
    try {
      await contractAppendicesApi.rejectContractAppendix(contractId, rejectId, {
        rejectionReason: rejectReason.trim(),
      })
      setRejectId(null)
      setRejectReason('')
      setSuccess('Đã từ chối phụ lục')
      await load()
      onUpdated?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không từ chối được')
    } finally {
      setActing(false)
    }
  }

  const handleTerminate = async (appendixId: string) => {
    const reason = window.prompt('Lý do chấm dứt phụ lục (tùy chọn):') ?? ''
    setActing(true)
    setError('')
    try {
      await contractAppendicesApi.terminateContractAppendix(contractId, appendixId, {
        reason: reason.trim() || undefined,
      })
      setSuccess('Đã chấm dứt phụ lục')
      await load()
      onUpdated?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không chấm dứt được phụ lục')
    } finally {
      setActing(false)
    }
  }

  if (contractStatus !== 'ACTIVE') return null

  const actionable = appendices.filter(
    (a) =>
      a.status === 'PENDING' ||
      a.status === 'UNDER_REVIEW' ||
      a.status === 'ACTIVE' ||
      a.status === 'PENDING_APPROVAL' ||
      a.status === 'PENDING_PAYMENT'
  )

  return (
    <div className="mt-6 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4">
      <h4 className="text-sm font-bold text-violet-200">Phụ lục hợp đồng</h4>
      <p className="mt-1 text-xs text-slate-500">
        Tenant yêu cầu thuê thêm — duyệt, cấp chỗ và ký kho trước khi tenant ký & thanh toán.
      </p>

      {!loading && actionable.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">
          Chưa có yêu cầu phụ lục trên HĐ này. Tenant gửi từ trang{' '}
          <strong className="text-slate-400">Hợp đồng → Chi tiết</strong> (HĐ ACTIVE).
        </p>
      )}

      {error && (
        <div className="mt-3">
          <InlineAlert message={error} onDismiss={() => setError('')} />
        </div>
      )}
      {success && (
        <div className="mt-3">
          <InlineAlert variant="success" message={success} onDismiss={() => setSuccess('')} />
        </div>
      )}

      {loading ? (
        <p className="mt-3 text-sm text-slate-500">Đang tải…</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {actionable.map((a) => (
            <li
              key={a.appendixId}
              className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-cyan-300">{a.appendixCode}</p>
                  <p className="text-slate-300">{a.title || '—'}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatAppendixPeriod(a.effectiveDate, a.endDate)}
                  </p>
                  {a.rejectionReason && (
                    <p className="mt-1 text-xs text-red-300">Lý do từ chối: {a.rejectionReason}</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${appendixStatusBadgeClass(a.status)}`}
                >
                  {APPENDIX_STATUS_LABELS[a.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {canWhMarkUnderReview(a) && (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => void handleUnderReview(a.appendixId)}
                    className="rounded bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 disabled:opacity-50"
                  >
                    Đang xem xét
                  </button>
                )}
                {canWhApprove(a) && contract && (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => setApproveTarget(a)}
                    className="rounded bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                  >
                    Duyệt & cấp chỗ
                  </button>
                )}
                {canWhReject(a) && (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => {
                      setRejectId(a.appendixId)
                      setRejectReason('')
                    }}
                    className="rounded bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                )}
                {canWhTerminate(a) && (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => void handleTerminate(a.appendixId)}
                    className="rounded bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Chấm dứt PL
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {rejectId && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
            Lý do từ chối
          </label>
          <textarea
            className="w-full rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm text-white"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={acting}
              onClick={() => void handleReject()}
              className="rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              Xác nhận từ chối
            </button>
            <button
              type="button"
              onClick={() => setRejectId(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {approveTarget && contract && (
        <ContractAppendixApproveModal
          contract={contract}
          appendix={approveTarget}
          onClose={() => setApproveTarget(null)}
          onApproved={() => {
            void load()
            onUpdated?.()
          }}
        />
      )}
    </div>
  )
}
