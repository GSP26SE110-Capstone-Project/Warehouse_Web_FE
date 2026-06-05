import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import * as contractAppendicesApi from '../../api/contractAppendices'
import {
  APPENDIX_STATUS_LABELS,
  appendixStatusBadgeClass,
  canTenantDelete,
  canTenantPay,
  canTenantSign,
  formatAppendixPeriod,
} from '../../utils/contractAppendix'
import { InlineAlert } from '../ui/FeedbackAlert'
import { ContractAppendixSignModal } from './ContractAppendixSignModal'

type Props = {
  contractId: string
  isTenantAdmin: boolean
  onPayAppendix?: (appendix: contractAppendicesApi.ApiContractAppendix) => void
  payingAppendixId?: string | null
  onChanged?: () => void
}

export function ContractAppendixListPanel({
  contractId,
  isTenantAdmin,
  onPayAppendix,
  payingAppendixId,
  onChanged,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [appendices, setAppendices] = useState<contractAppendicesApi.ApiContractAppendix[]>([])
  const [signTarget, setSignTarget] = useState<contractAppendicesApi.ApiContractAppendix | null>(
    null
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await contractAppendicesApi.listContractAppendices(contractId, { limit: 50 })
      setAppendices(res.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách phụ lục')
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async (appendixId: string) => {
    if (!window.confirm('Xóa yêu cầu phụ lục này?')) return
    setDeletingId(appendixId)
    setError('')
    try {
      await contractAppendicesApi.deleteContractAppendix(contractId, appendixId)
      await load()
      onChanged?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không xóa được phụ lục')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading && appendices.length === 0) {
    return <p className="text-sm text-slate-500">Đang tải phụ lục…</p>
  }

  if (appendices.length === 0) {
    return (
      <p className="rounded-lg border border-white/5 bg-black/20 px-4 py-3 text-sm text-slate-500">
        Chưa có phụ lục nào trên hợp đồng này.
      </p>
    )
  }

  return (
    <>
      {error && <InlineAlert message={error} onDismiss={() => setError('')} className="mb-3" />}
      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#131b29] text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Mã PL</th>
              <th className="px-4 py-2">Tiêu đề</th>
              <th className="px-4 py-2">Thời hạn</th>
              <th className="px-4 py-2">Trạng thái</th>
              {isTenantAdmin && <th className="px-4 py-2 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {appendices.map((a) => (
              <tr key={a.appendixId} className="bg-black/10">
                <td className="px-4 py-3 font-mono text-cyan-300">{a.appendixCode}</td>
                <td className="px-4 py-3 text-slate-300">{a.title || '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {formatAppendixPeriod(a.effectiveDate, a.endDate)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${appendixStatusBadgeClass(a.status)}`}
                  >
                    {APPENDIX_STATUS_LABELS[a.status] ?? a.status}
                  </span>
                </td>
                {isTenantAdmin && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {canTenantSign(a) && (
                        <button
                          type="button"
                          onClick={() => setSignTarget(a)}
                          className="rounded bg-cyan-500/20 px-2 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30"
                        >
                          Ký
                        </button>
                      )}
                      {canTenantPay(a) && onPayAppendix && (
                        <button
                          type="button"
                          disabled={payingAppendixId === a.appendixId}
                          onClick={() => onPayAppendix(a)}
                          className="rounded bg-orange-500/20 px-2 py-1 text-xs font-semibold text-orange-300 hover:bg-orange-500/30 disabled:opacity-50"
                        >
                          {payingAppendixId === a.appendixId ? 'Đang mở PayOS…' : 'Thanh toán'}
                        </button>
                      )}
                      {canTenantDelete(a) && (
                        <button
                          type="button"
                          disabled={deletingId === a.appendixId}
                          onClick={() => void handleDelete(a.appendixId)}
                          className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {signTarget && (
        <ContractAppendixSignModal
          contractId={contractId}
          appendix={signTarget}
          onClose={() => setSignTarget(null)}
          onSigned={() => {
            void load()
            onChanged?.()
          }}
        />
      )}
    </>
  )
}
