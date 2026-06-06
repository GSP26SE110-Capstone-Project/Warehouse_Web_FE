import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import * as scanApi from '../../api/scan'
import type { BarcodeScanResult } from '../../api/scan'
import { InlineAlert } from '../ui/FeedbackAlert'

type Props = {
  warehouseId?: string
  compact?: boolean
  className?: string
}

const ENTITY_LABELS: Record<string, string> = {
  INBOUND_REQUEST: 'Phiếu nhập',
  OUTBOUND_REQUEST: 'Phiếu xuất',
  LPN: 'LPN',
  SKU: 'SKU',
  BIN: 'Bin',
  BATCH: 'Batch',
}

function navigateForScan(
  navigate: ReturnType<typeof useNavigate>,
  result: BarcodeScanResult
) {
  const id = result.entityId
  if (!id) return false

  switch (result.entityType) {
    case 'INBOUND_REQUEST':
      navigate(`/staff/inbound-ops/${id}`)
      return true
    case 'OUTBOUND_REQUEST':
      navigate(`/staff/outbound-ops/${id}`)
      return true
    case 'LPN': {
      const inboundId = (result.entity as { inboundRequestId?: string } | undefined)
        ?.inboundRequestId
      if (inboundId) {
        navigate(`/staff/inbound-ops/${inboundId}`)
      } else {
        navigate('/staff/ai-putaway')
      }
      return true
    }
    case 'BATCH': {
      const inboundId = (result.entity as { inboundRequestId?: string } | undefined)
        ?.inboundRequestId
      if (inboundId) {
        navigate(`/staff/inbound-ops/${inboundId}`)
      }
      return true
    }
    case 'BIN':
      navigate(`/staff/inventory-ops?search=${encodeURIComponent(result.displayCode ?? result.value)}`)
      return true
    case 'SKU':
      navigate(`/staff/inventory-ops?search=${encodeURIComponent(result.displayCode ?? result.value)}`)
      return true
    default:
      return false
  }
}

export function BarcodeScanPanel({ warehouseId, compact, className = '' }: Props) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState<BarcodeScanResult | null>(null)

  const runScan = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) return
      setBusy(true)
      setError('')
      setLastResult(null)
      try {
        const result = await scanApi.resolveScan(trimmed, warehouseId)
        setLastResult(result)
        const navigated = navigateForScan(navigate, result)
        if (!navigated) {
          setError('Đã nhận diện mã nhưng chưa có liên kết màn hình phù hợp.')
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Không đọc được mã quét')
      } finally {
        setBusy(false)
        setValue('')
        inputRef.current?.focus()
      }
    },
    [navigate, warehouseId]
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void runScan(value)
  }

  return (
    <div
      className={`rounded-xl border border-cyan-500/25 bg-cyan-500/5 ${compact ? 'p-3' : 'p-4'} ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-cyan-400">barcode_scanner</span>
        <div>
          <p className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>
            Quét mã Code128
          </p>
          {!compact && (
            <p className="text-xs text-slate-400">
              INB-*, OUT-*, LPN, batch, bin, SKU — gọi API scan/resolve
            </p>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} className={`flex gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Quét hoặc nhập mã…"
          disabled={busy}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="shrink-0 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          {busy ? '…' : 'Tra cứu'}
        </button>
      </form>

      {error && (
        <div className="mt-2">
          <InlineAlert message={error} onDismiss={() => setError('')} />
        </div>
      )}

      {lastResult && !error && (
        <p className="mt-2 text-xs text-emerald-300">
          {ENTITY_LABELS[lastResult.entityType] ?? lastResult.entityType}:{' '}
          <span className="font-mono">{lastResult.displayCode ?? lastResult.value}</span>
        </p>
      )}
    </div>
  )
}
