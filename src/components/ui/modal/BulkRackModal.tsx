import { useMemo, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import { RACK_FIXED_LEVEL_COUNT } from '../../../data/rackStructure'
import { MODAL_PANEL_SCROLL } from '../../../styles/scrollClasses'

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
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Đóng" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl">
        <div className="border-b border-white/5 px-6 py-5">
          <h2 className="text-lg font-bold text-white">Tạo rack hàng loạt</h2>
          <p className="mt-1 text-sm text-slate-400">Zone: {zoneLabel}</p>
          <p className="mt-2 text-xs text-cyan-200/80">
            STANDARD · {RACK_FIXED_LEVEL_COUNT} tầng/rack · mã theo lưới (A1, A2, B1…)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className={MODAL_PANEL_SCROLL}>
            {error && (
              <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
            )}

            {emptySlotCodes.length === 0 ? (
              <p className="text-sm text-amber-300">
                {maxCreatable <= 0
                  ? 'Zone chưa có diện tích (m²) hoặc diện tích quá nhỏ — không tính được số rack. Cập nhật diện tích tại Quản lý Zone rồi thử lại.'
                  : 'Zone đã đủ rack theo diện tích — không còn ô trống trên lưới.'}
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-300">
                  Còn <strong className="text-white">{emptySlotCodes.length}</strong> ô trống / tối đa{' '}
                  <strong className="text-white">{maxCreatable}</strong> rack theo diện tích zone.
                </p>

                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                    <input
                      type="radio"
                      name="bulk-mode"
                      checked={mode === 'all'}
                      onChange={() => setMode('all')}
                    />
                    <span className="text-sm text-white">
                      Tạo tất cả ô trống ({emptySlotCodes.length} rack)
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                    <input
                      type="radio"
                      name="bulk-mode"
                      checked={mode === 'count'}
                      onChange={() => setMode('count')}
                    />
                    <span className="text-sm text-white">Tạo số lượng cụ thể</span>
                  </label>
                </div>

                {mode === 'count' && (
                  <div>
                    <label
                      htmlFor="bulk-count"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      Số rack
                    </label>
                    <input
                      id="bulk-count"
                      type="number"
                      min={1}
                      max={emptySlotCodes.length}
                      className="w-full rounded-lg border border-white/10 bg-[#1a2333] px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      value={countInput}
                      onChange={(e) => setCountInput(e.target.value)}
                    />
                  </div>
                )}

                {selectedCodes.length > 0 && (
                  <div className="rounded-lg border border-white/10 bg-[#131b29] p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Mã rack sẽ tạo ({selectedCodes.length})
                    </p>
                    <p className="font-mono text-xs leading-relaxed text-cyan-300/90">
                      {preview.join(', ')}
                      {previewRest > 0 ? ` … +${previewRest} mã` : ''}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || !selectedCodes.length}
              className="btn-glow rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-black disabled:opacity-50"
            >
              {saving ? 'Đang tạo…' : `Tạo ${selectedCodes.length} rack`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
