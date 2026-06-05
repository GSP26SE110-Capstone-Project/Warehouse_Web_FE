import { useMemo, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import { AlertModal } from './AlertModal'
import type { ApiBin } from '../../../api/bins'

type LevelOption = { rackLevelId: string; levelNumber: number }

type Props = {
  rackCode: string
  levels: LevelOption[]
  allDeletableBins: ApiBin[]
  deletableByLevel: Record<string, ApiBin[]>
  totalBinCount: number
  onClose: () => void
  onSubmit: (bins: ApiBin[]) => Promise<void>
}

export function BulkBinDeleteModal({
  rackCode,
  levels,
  allDeletableBins,
  deletableByLevel,
  totalBinCount,
  onClose,
  onSubmit,
}: Props) {
  const [scope, setScope] = useState<'rack' | 'level'>('rack')
  const [levelId, setLevelId] = useState(levels[0]?.rackLevelId ?? '')
  const [mode, setMode] = useState<'all' | 'count'>('all')
  const [countInput, setCountInput] = useState('1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const pool = useMemo(() => {
    if (scope === 'rack') return allDeletableBins
    return deletableByLevel[levelId] ?? []
  }, [scope, levelId, allDeletableBins, deletableByLevel])

  const count = useMemo(() => {
    if (mode === 'all') return pool.length
    const n = parseInt(countInput, 10)
    if (!Number.isFinite(n) || n < 1) return 0
    return Math.min(n, pool.length)
  }, [mode, countInput, pool.length])

  const selectedBins = useMemo(() => pool.slice(0, count), [pool, count])
  const preview = selectedBins.slice(0, 10)
  const previewRest = selectedBins.length - preview.length
  const skippedCount = totalBinCount - allDeletableBins.length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedBins.length) {
      setError('Không có bin trống để xóa')
      return
    }
    setConfirmOpen(true)
  }

  const executeDelete = async () => {
    setSaving(true)
    try {
      await onSubmit(selectedBins)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xóa bin thất bại')
    } finally {
      setSaving(false)
    }
  }

  const confirmMessage = useMemo(() => {
    const codes = preview.map((b) => b.binCode).join(', ')
    const suffix = previewRest > 0 ? ` … +${previewRest} mã` : ''
    return (
      `Bạn sắp xóa ${selectedBins.length} bin trống trên rack ${rackCode}. ` +
      `Thao tác không hoàn tác.${codes ? ` Mã: ${codes}${suffix}.` : ''}`
    )
  }, [selectedBins.length, rackCode, preview, previewRest])

  return (
    <>
      {confirmOpen && selectedBins.length > 0 && (
        <AlertModal
          type="confirm"
          title="Xác nhận xóa bin"
          message={confirmMessage}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            void executeDelete()
          }}
        />
      )}
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        {/* Backdrop mờ tối nhẹ phù hợp với Light Mode */}
        <button type="button" className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} aria-label="Đóng" />
        
        {/* Khung Modal chính: Nền trắng, shadow dày dặn, viền xám sáng mỏng */}
        <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">Xóa bin hàng loạt</h2>
            <p className="mt-1 font-mono text-sm font-bold text-red-600">Rack {rackCode}</p>
            <p className="mt-2 text-xs text-slate-500">
              Chỉ xóa bin trống (không LPN, không hàng tồn). Bin đang dùng sẽ bỏ qua.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {error && (
                <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
              )}

              {allDeletableBins.length === 0 ? (
                <p className="text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  {totalBinCount === 0
                    ? 'Rack chưa có bin nào.'
                    : 'Không có bin trống để xóa — cần dời hết LPN/hàng trước.'}
                </p>
              ) : (
                <>
                  {skippedCount > 0 && (
                    /* Khối thông báo bỏ qua bin có hàng dạng Amber Pastel */
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 leading-relaxed">
                      {skippedCount} bin đang chứa hàng/LPN — không xóa được trong thao tác này.
                    </p>
                  )}

                  {/* Section Phạm vi */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Phạm vi</p>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 hover:bg-slate-50 transition-colors select-none">
                      <input
                        type="radio"
                        name="bin-del-scope"
                        checked={scope === 'rack'}
                        onChange={() => setScope('rack')}
                        className="text-red-600 focus:ring-red-500 border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Cả rack ({allDeletableBins.length} bin trống)
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 hover:bg-slate-50 transition-colors select-none">
                      <input
                        type="radio"
                        name="bin-del-scope"
                        checked={scope === 'level'}
                        onChange={() => setScope('level')}
                        className="text-red-600 focus:ring-red-500 border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-800">Một tầng</span>
                    </label>
                    
                    {scope === 'level' && (
                      <select
                        aria-label="Chọn tầng"
                        className="ml-8 w-[calc(100%-2rem)] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                        value={levelId}
                        onChange={(e) => setLevelId(e.target.value)}
                      >
                        {levels.map((l) => (
                          <option key={l.rackLevelId} value={l.rackLevelId}>
                            Tầng {l.levelNumber} ({(deletableByLevel[l.rackLevelId] ?? []).length} bin trống)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Section Số lượng */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Số lượng</p>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 hover:bg-slate-50 transition-colors select-none">
                      <input
                        type="radio"
                        name="bin-del-mode"
                        checked={mode === 'all'}
                        onChange={() => setMode('all')}
                        className="text-red-600 focus:ring-red-500 border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-800">Tất cả bin trống đã chọn ({pool.length})</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 hover:bg-slate-50 transition-colors select-none">
                      <input
                        type="radio"
                        name="bin-del-mode"
                        checked={mode === 'count'}
                        onChange={() => setMode('count')}
                        className="text-red-600 focus:ring-red-500 border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-800">Số lượng cụ thể</span>
                    </label>
                    
                    {mode === 'count' && (
                      <input
                        type="number"
                        min={1}
                        max={pool.length}
                        aria-label="Số bin xóa"
                        className="ml-8 w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                        value={countInput}
                        onChange={(e) => setCountInput(e.target.value)}
                      />
                    )}
                  </div>

                  {/* Card xem trước danh sách mã bin sẽ xóa dạng Red/Pink Pastel cảnh báo rõ ràng */}
                  {selectedBins.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Sẽ xóa ({selectedBins.length})
                      </p>
                      <p className="font-mono text-xs font-semibold leading-relaxed text-red-700">
                        {preview.map((b) => b.binCode).join(', ')}
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
                disabled={saving || !selectedBins.length}
                className="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Đang xóa…' : `Xóa ${selectedBins.length} bin`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}