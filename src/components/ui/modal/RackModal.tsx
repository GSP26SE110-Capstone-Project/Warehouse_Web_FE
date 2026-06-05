import { useEffect, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import type { ApiRack } from '../../../api/racks'
import { RACK_FIXED_LEVEL_COUNT, RACK_STATUS_OPTIONS } from '../../../data/rackStructure'

type Mode = 'create' | 'edit'

export type RackFormPayload = {
  rackCode: string
  status: string
}

type Props = {
  mode: Mode
  zoneLabel: string
  suggestedCode?: string
  data?: ApiRack
  onClose: () => void
  onSubmit: (payload: RackFormPayload) => void | Promise<void>
}

// Cập nhật class label và input sang Light Mode (Nền sáng, chữ và viền rõ ràng)
const labelStyle =
  'text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block'
const inputStyle =
  'w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-500'

export function RackModal({ mode, zoneLabel, suggestedCode, data, onClose, onSubmit }: Props) {
  const [rackCode, setRackCode] = useState(suggestedCode ?? data?.rackCode ?? '')
  const [status, setStatus] = useState(data?.status ?? 'ACTIVE')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (suggestedCode && mode === 'create') setRackCode(suggestedCode)
  }, [suggestedCode, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'create' && !rackCode.trim()) {
      setError('Mã rack là bắt buộc')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        rackCode: rackCode.trim(),
        status,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop mờ tối nhẹ phù hợp với Light Mode */}
      <button type="button" className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} aria-label="Đóng" />
      
      {/* Khung Modal nền trắng shadow dày dặn */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900">
          {mode === 'create' ? 'Thêm rack' : 'Trạng thái rack'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">Zone: {zoneLabel}</p>
        
        {/* Banner thông tin rack dạng pastel sáng nhã nhặn */}
        <p className="mt-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800 font-medium leading-relaxed">
          Rack STANDARD · {RACK_FIXED_LEVEL_COUNT} tầng/rack · số rack & bin/tầng tính từ diện
          tích zone (3 m²/rack)
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'create' && (
            <div>
              <label className={labelStyle} htmlFor="rack-code">
                Mã rack
              </label>
              <input
                id="rack-code"
                className={inputStyle}
                value={rackCode}
                onChange={(e) => setRackCode(e.target.value.toUpperCase())}
                placeholder="VD: A1, B3"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Gợi ý: chữ hàng + số cột (A1, A2…) để khớp sơ đồ ghế
              </p>
            </div>
          )}

          {mode === 'edit' && (
            <div>
              <label className={labelStyle}>Mã rack</label>
              <p className="font-mono text-cyan-700 font-bold text-base">{data?.rackCode}</p>
            </div>
          )}

          <div>
            <label className={labelStyle} htmlFor="rack-status">
              Trạng thái
            </label>
            <select
              id="rack-status"
              className={inputStyle}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {RACK_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
          )}

          {/* Footer nút hành động */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Đang lưu…' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}