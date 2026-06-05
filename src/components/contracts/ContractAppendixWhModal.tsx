import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import * as contractsApi from '../../api/contracts'
import { ContractAppendixReviewPanel } from './ContractAppendixReviewPanel'

type Props = {
  contractId: string
  onClose: () => void
  onUpdated?: () => void
}

export function ContractAppendixWhModal({ contractId, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(true)
  const [contractCode, setContractCode] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const c = await contractsApi.getContract(contractId)
      setContractCode(c.contractCode)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được hợp đồng')
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-violet-500/30 bg-[#0b101a] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">Duyệt phụ lục hợp đồng</h2>
            {contractCode && (
              <p className="mt-1 font-mono text-sm text-violet-300">{contractCode}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Xem xét yêu cầu tenant, cấp zone/bin và ký kho.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-2 hover:bg-white/10">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="dark-scrollbar flex-1 overflow-y-auto px-6 py-5">
          {loading && <p className="text-sm text-slate-400">Đang tải…</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}
          {!loading && !error && (
            <ContractAppendixReviewPanel
              contractId={contractId}
              contractStatus="ACTIVE"
              onUpdated={() => {
                onUpdated?.()
              }}
            />
          )}
        </div>

        <div className="flex justify-end border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
