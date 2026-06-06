import { useMemo, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import { AlertModal } from './AlertModal'
import type { ApiBin } from '../../../api/bins'
import { MODAL_PANEL_SCROLL } from '../../../styles/scrollClasses'

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
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Đóng" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl">
        <div className="border-b border-white/5 px-6 py-5">
          <h2 className="text-lg font-bold text-white">Xóa bin hàng loạt</h2>
          <p className="mt-1 font-mono text-sm text-red-300/90">Rack {rackCode}</p>
          <p className="mt-2 text-xs text-slate-400">
            Chỉ xóa bin trống (không LPN, không hàng tồn). Bin đang dùng sẽ bỏ qua.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className={MODAL_PANEL_SCROLL}>
            {error && (
              <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
            )}

            {allDeletableBins.length === 0 ? (
              <p className="text-sm text-amber-300">
                {totalBinCount === 0
                  ? 'Rack chưa có bin nào.'
                  : 'Không có bin trống để xóa — cần dời hết LPN/hàng trước.'}
              </p>
            ) : (
              <>
                {skippedCount > 0 && (
                  <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
                    {skippedCount} bin đang chứa hàng/LPN — không xóa được trong thao tác này.
                  </p>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Phạm vi</p>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                    <input
                      type="radio"
                      name="bin-del-scope"
                      checked={scope === 'rack'}
                      onChange={() => setScope('rack')}
                    />
                    <span className="text-sm text-white">
                      Cả rack ({allDeletableBins.length} bin trống)
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                    <input
                      type="radio"
                      name="bin-del-scope"
                      checked={scope === 'level'}
                      onChange={() => setScope('level')}
                    />
                    <span className="text-sm text-white">Một tầng</span>
                  </label>
                  {scope === 'level' && (
                    <select
                      aria-label="Chọn tầng"
                      className="ml-8 w-[calc(100%-2rem)] rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm text-white"
                      value={levelId}
                      onChange={(e) => setLevelId(e.target.value)}
                    >
                      {levels.map((l) => (
                        <option key={l.rackLevelId} value={l.rackLevelId}>
                          Tầng {l.levelNumber} ({(deletableByLevel[l.rackLevelId] ?? []).length} bin
                          trống)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Số lượng</p>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                    <input
                      type="radio"
                      name="bin-del-mode"
                      checked={mode === 'all'}
                      onChange={() => setMode('all')}
                    />
                    <span className="text-sm text-white">Tất cả bin trống đã chọn ({pool.length})</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                    <input
                      type="radio"
                      name="bin-del-mode"
                      checked={mode === 'count'}
                      onChange={() => setMode('count')}
                    />
                    <span className="text-sm text-white">Số lượng cụ thể</span>
                  </label>
                  {mode === 'count' && (
                    <input
                      type="number"
                      min={1}
                      max={pool.length}
                      aria-label="Số bin xóa"
                      className="ml-8 w-32 rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm text-white"
                      value={countInput}
                      onChange={(e) => setCountInput(e.target.value)}
                    />
                  )}
                </div>

                {selectedBins.length > 0 && (
                  <div className="rounded-lg border border-red-500/25 bg-red-950/30 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Sẽ xóa ({selectedBins.length})
                    </p>
                    <p className="font-mono text-xs leading-relaxed text-red-200/90">
                      {preview.map((b) => b.binCode).join(', ')}
                      {previewRest > 0 ? ` … +${previewRest} mã` : ''}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || !selectedBins.length}
              className="rounded-lg border border-red-500/40 bg-red-600/90 px-6 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
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
