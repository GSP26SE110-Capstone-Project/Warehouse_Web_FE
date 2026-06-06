import { useCallback, useEffect, useId, useState } from 'react'
import { ApiError } from '../../api/client'
import * as contractAppendicesApi from '../../api/contractAppendices'
import type { ApiContract } from '../../api/types'
import { InlineAlert } from '../ui/FeedbackAlert'
import { DatePickerField } from '../ui/DatePickerField'
import {
  appendixNeedNewContractMessage,
  selectableStorageLevels,
  STORAGE_LEVEL_LABELS,
} from '../../utils/contractAppendix'

type Props = {
  contract: ApiContract
  onClose: () => void
  onSubmitted: () => void
}

const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
const inputStyle =
  'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400'

function toDateInput(iso?: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export function ContractAppendixRequestModal({ contract, onClose, onSubmitted }: Props) {
  const effectiveDateId = useId()
  const endDateId = useId()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [ceiling, setCeiling] = useState<contractAppendicesApi.StorageLevel | null>(null)

  const [title, setTitle] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(toDateInput(contract.startDate))
  const [endDate, setEndDate] = useState(toDateInput(contract.endDate))
  const [requestedStorageLevel, setRequestedStorageLevel] =
    useState<contractAppendicesApi.StorageLevel>('BIN')
  const [quantity, setQuantity] = useState('1')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await contractAppendicesApi.getAppendixCeiling(contract.contractId)
        if (!cancelled) {
          setCeiling(res.ceilingLevel)
          const levels = selectableStorageLevels(res.ceilingLevel)
          setRequestedStorageLevel(levels[0] ?? res.ceilingLevel)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Không tải được trần cấp')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contract.contractId])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setError('')
    try {
      const qty = Number(quantity)
      await contractAppendicesApi.submitAppendixRequest(contract.contractId, {
        title: title.trim() || undefined,
        effectiveDate,
        endDate,
        requestedStorageLevel,
        items: [
          {
            itemType: 'STORAGE',
            storageLevel: requestedStorageLevel,
            billingUnit: requestedStorageLevel === 'BIN' ? 'BIN_DAY' : 'ZONE_DAY',
            quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
          },
        ],
      })
      onSubmitted()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'APPENDIX_NEED_NEW_CONTRACT') {
        setError(appendixNeedNewContractMessage())
      } else {
        setError(err instanceof ApiError ? err.message : 'Không gửi được yêu cầu phụ lục')
      }
    } finally {
      setSubmitting(false)
    }
  }, [
    contract.contractId,
    title,
    effectiveDate,
    endDate,
    requestedStorageLevel,
    quantity,
    onSubmitted,
    onClose,
  ])

  const levelOptions = ceiling ? selectableStorageLevels(ceiling) : []

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-white/10 bg-[#0b101a] shadow-2xl">
        <div className="border-b border-white/5 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Yêu cầu phụ lục hợp đồng</h3>
          <p className="mt-1 text-xs text-slate-400">
            {contract.contractCode} · HĐ đang hiệu lực
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {error && <InlineAlert message={error} onDismiss={() => setError('')} />}
          {loading ? (
            <p className="text-sm text-slate-400">Đang tải trần cấp không gian…</p>
          ) : (
            <>
              {ceiling && (
                <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-100">
                  Trần cấp HĐ gốc: <strong>{STORAGE_LEVEL_LABELS[ceiling]}</strong> — phụ lục chỉ
                  thêm cấp không gian ≤ trần này (vd. thuê thêm bin khi trần là Zone).
                </p>
              )}
              <div>
                <label className={labelStyle}>Tiêu đề (tùy chọn)</label>
                <input
                  className={inputStyle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Thuê thêm 2 bin"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle} htmlFor={effectiveDateId}>
                    Ngày hiệu lực
                  </label>
                  <DatePickerField
                    id={effectiveDateId}
                    compact
                    required
                    value={effectiveDate}
                    max={endDate || toDateInput(contract.endDate)}
                    onChange={setEffectiveDate}
                    placeholder="Chọn ngày"
                  />
                </div>
                <div>
                  <label className={labelStyle} htmlFor={endDateId}>
                    Ngày kết thúc
                  </label>
                  <DatePickerField
                    id={endDateId}
                    compact
                    required
                    value={endDate}
                    min={effectiveDate || undefined}
                    max={toDateInput(contract.endDate)}
                    onChange={setEndDate}
                    placeholder="Chọn ngày"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Cấp không gian yêu cầu</label>
                  <select
                    className={inputStyle}
                    value={requestedStorageLevel}
                    onChange={(e) =>
                      setRequestedStorageLevel(e.target.value as contractAppendicesApi.StorageLevel)
                    }
                  >
                    {levelOptions.map((l) => (
                      <option key={l} value={l}>
                        {STORAGE_LEVEL_LABELS[l]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Số lượng</label>
                  <input
                    type="number"
                    min={1}
                    className={inputStyle}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Giá do kho nhập khi duyệt. Sau khi kho duyệt, bạn ký và thanh toán để kích hoạt phụ
                lục.
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">
            Hủy
          </button>
          <button
            type="button"
            disabled={loading || submitting}
            onClick={() => void handleSubmit()}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            {submitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  )
}
