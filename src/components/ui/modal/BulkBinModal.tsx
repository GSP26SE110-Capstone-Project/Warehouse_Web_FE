import { useMemo, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import type { BinSlotToCreate } from '../../rack/binLayoutUtils'
import { getDefaultBinCapacity } from '../../../data/binCapacityDefaults'
import { MODAL_PANEL_SCROLL } from '../../../styles/scrollClasses'

type LevelOption = { rackLevelId: string; levelNumber: number }

type Props = {
  rackCode: string
  zoneType?: string | null
  levels: LevelOption[]
  allEmptySlots: BinSlotToCreate[]
  slotsByLevel: Record<string, BinSlotToCreate[]>
  binsPerLevel: number
  onClose: () => void
  onSubmit: (slots: BinSlotToCreate[]) => Promise<void>
}

export function BulkBinModal({
  rackCode,
  zoneType,
  levels,
  allEmptySlots,
  slotsByLevel,
  binsPerLevel,
  onClose,
  onSubmit,
}: Props) {
  const preset = getDefaultBinCapacity(zoneType)

  const [scope, setScope] = useState<'rack' | 'level'>('rack')
  const [levelId, setLevelId] = useState(levels[0]?.rackLevelId ?? '')
  const [mode, setMode] = useState<'all' | 'count'>('all')
  const [countInput, setCountInput] = useState('1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const pool = useMemo(() => {
    if (scope === 'rack') return allEmptySlots
    return slotsByLevel[levelId] ?? []
  }, [scope, levelId, allEmptySlots, slotsByLevel])

  const count = useMemo(() => {
    if (mode === 'all') return pool.length
    const n = parseInt(countInput, 10)
    if (!Number.isFinite(n) || n < 1) return 0
    return Math.min(n, pool.length)
  }, [mode, countInput, pool.length])

  const selectedSlots = useMemo(() => pool.slice(0, count), [pool, count])
  const preview = selectedSlots.slice(0, 10)
  const previewRest = selectedSlots.length - preview.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedSlots.length) {
      setError('Không có ô bin trống để tạo')
      return
    }
    setSaving(true)
    try {
      await onSubmit(selectedSlots)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tạo bin thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Đóng" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl">
        <div className="border-b border-white/5 px-6 py-5">
          <h2 className="text-lg font-bold text-white">Tạo bin hàng loạt</h2>
          <p className="mt-1 font-mono text-sm text-cyan-400">Rack {rackCode}</p>
          <p className="mt-2 text-xs text-slate-400">
            Mặc định zone: {preset.maxLpnCount} LPN · {preset.maxVolumeUnits} volume · {preset.note}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className={MODAL_PANEL_SCROLL}>
            {error && (
              <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
            )}

            {allEmptySlots.length === 0 ? (
              <p className="text-sm text-amber-300">Rack đã đủ bin trên các tầng (tối đa {binsPerLevel} bin/tầng).</p>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Phạm vi</p>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                    <input
                      type="radio"
                      name="bin-scope"
                      checked={scope === 'rack'}
                      onChange={() => setScope('rack')}
                    />
                    <span className="text-sm text-white">
                      Cả rack ({allEmptySlots.length} ô trống)
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                    <input
                      type="radio"
                      name="bin-scope"
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
                          Tầng {l.levelNumber} ({(slotsByLevel[l.rackLevelId] ?? []).length} ô trống)
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
                      name="bin-mode"
                      checked={mode === 'all'}
                      onChange={() => setMode('all')}
                    />
                    <span className="text-sm text-white">Tất cả ô trống đã chọn ({pool.length})</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                    <input
                      type="radio"
                      name="bin-mode"
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
                      aria-label="Số bin"
                      className="ml-8 w-32 rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm text-white"
                      value={countInput}
                      onChange={(e) => setCountInput(e.target.value)}
                    />
                  )}
                </div>

                {selectedSlots.length > 0 && (
                  <div className="rounded-lg border border-white/10 bg-[#131b29] p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Mã bin ({selectedSlots.length})
                    </p>
                    <p className="font-mono text-xs leading-relaxed text-emerald-300/90">
                      {preview.map((s) => s.binCode).join(', ')}
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
              disabled={saving || !selectedSlots.length}
              className="btn-glow rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 px-6 py-2 text-sm font-bold text-black disabled:opacity-50"
            >
              {saving ? 'Đang tạo…' : `Tạo ${selectedSlots.length} bin`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
