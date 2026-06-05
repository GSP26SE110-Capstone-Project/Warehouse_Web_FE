import { useMemo, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import { RACK_FIXED_LEVEL_COUNT } from '../../../data/rackStructure'

type Props = {
  zoneLabel: string
  emptySlotCodes: string[]
  maxCreatable: number
  onClose: () => void
  onSubmit: (rackCodes: string[]) => Promise<void>
}

export function BulkRackModal({
  zoneLabel,
  emptySlotCodes,
  maxCreatable,
  onClose,
  onSubmit,
}: Props) {
  const [mode, setMode] = useState<'all' | 'count'>('all')
  const [countInput, setCountInput] = useState(String(Math.min(emptySlotCodes.length, maxCreatable)))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const count = useMemo(() => {
    if (mode === 'all') return emptySlotCodes.length
    const n = parseInt(countInput, 10)
    if (!Number.isFinite(n) || n < 1) return 0
    return Math.min(n, emptySlotCodes.length, maxCreatable)
  }, [mode, countInput, emptySlotCodes.length, maxCreatable])

  const selectedCodes = useMemo(
    () => emptySlotCodes.slice(0, count),
    [emptySlotCodes, count]
  )

  const preview = selectedCodes.slice(0, 12)
  const previewRest = selectedCodes.length - preview.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedCodes.length) {
      setError('Không có ô trống để tạo rack')
      return
    }
    setSaving(true)
    try {
      await onSubmit(selectedCodes)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tạo rack thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop mờ tối nhẹ phù hợp với giao diện Light Mode */}
      <button type="button" className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} aria-label="Đóng" />
      
      {/* Khung Modal chính: Nền trắng, shadow dày dặn, viền xám sáng mỏng */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">Tạo rack hàng loạt</h2>
          <p className="mt-1 text-sm text-slate-500">Zone: {zoneLabel}</p>
          
          {/* Banner thông báo cấu hình dạng Cyan Pastel sáng sủa */}
          <p className="mt-2 text-xs font-medium text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-md px-2.5 py-1.5 leading-relaxed">
            STANDARD · {RACK_FIXED_LEVEL_COUNT} tầng/rack · mã theo lưới (A1, A2, B1…)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {error && (
              <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
            )}

            {emptySlotCodes.length === 0 ? (
              <p className="text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                {maxCreatable <= 0
                  ? 'Zone chưa có diện tích (m²) hoặc diện tích quá nhỏ — không tính được số rack. Cập nhật diện tích tại Quản lý Zone rồi thử lại.'
                  : 'Zone đã đủ rack theo diện tích — không còn ô trống trên lưới.'}
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  Còn <strong className="text-slate-900 font-semibold">{emptySlotCodes.length}</strong> ô trống / tối đa{' '}
                  <strong className="text-slate-900 font-semibold">{maxCreatable}</strong> rack theo diện tích zone.
                </p>

                {/* Các tùy chọn Radio Options chuyển sang nền sáng */}
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 hover:bg-slate-50 transition-colors select-none">
                    <input
                      type="radio"
                      name="bulk-mode"
                      checked={mode === 'all'}
                      onChange={() => setMode('all')}
                      className="text-cyan-600 focus:ring-cyan-500 border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-800">
                      Tạo tất cả ô trống ({emptySlotCodes.length} rack)
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 hover:bg-slate-50 transition-colors select-none">
                    <input
                      type="radio"
                      name="bulk-mode"
                      checked={mode === 'count'}
                      onChange={() => setMode('count')}
                      className="text-cyan-600 focus:ring-cyan-500 border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-800">Tạo số lượng cụ thể</span>
                  </label>
                </div>

                {mode === 'count' && (
                  <div className="animate-fadeIn">
                    <label
                      htmlFor="bulk-count"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                    >
                      Số rack
                    </label>
                    <input
                      id="bulk-count"
                      type="number"
                      min={1}
                      max={emptySlotCodes.length}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none placeholder-slate-400"
                      value={countInput}
                      onChange={(e) => setCountInput(e.target.value)}
                    />
                  </div>
                )}

                {selectedCodes.length > 0 && (
                  /* Card preview danh sách mã rack: Nền xám nhạt nhẹ, chữ tối đậm */
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Mã rack sẽ tạo ({selectedCodes.length})
                    </p>
                    <p className="font-mono text-xs font-semibold leading-relaxed text-cyan-700">
                      {preview.join(', ')}
                      {previewRest > 0 ? ` … +${previewRest} mã` : ''}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer nút hành động điều hướng */}
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || !selectedCodes.length}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Đang tạo…' : `Tạo ${selectedCodes.length} rack`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}