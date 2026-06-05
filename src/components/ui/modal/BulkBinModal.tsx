import { useMemo, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import type { BinSlotToCreate } from '../../rack/binLayoutUtils'
import { getDefaultBinCapacity } from '../../../data/binCapacityDefaults'

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
      {/* Backdrop mờ tối nhẹ cho Light Mode */}
      <button type="button" className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} aria-label="Đóng" />
      
      {/* Khung Modal chính: Nền trắng, shadow dày dặn, viền xám sáng mỏng */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">Tạo bin hàng loạt</h2>
          <p className="mt-1 font-mono text-sm font-bold text-cyan-600">Rack {rackCode}</p>
          
          {/* Banner thông báo cấu hình dạng Cyan Pastel sáng sủa */}
          {/* <p className="mt-2 text-xs font-medium text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-md px-2.5 py-1.5 leading-relaxed">
            Mặc định zone: {preset.maxLpnCount} LPN · {preset.maxVolumeUnits} volume · {preset.note}
          </p> */}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {error && (
              <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
            )}

            {allEmptySlots.length === 0 ? (
              <p className="text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Rack đã đủ bin trên các tầng (tối đa {binsPerLevel} bin/tầng).
              </p>
            ) : (
              <>
                {/* Section Phạm vi */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Phạm vi</p>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 hover:bg-slate-50 transition-colors select-none">
                    <input
                      type="radio"
                      name="bin-scope"
                      checked={scope === 'rack'}
                      onChange={() => setScope('rack')}
                      className="text-cyan-600 focus:ring-cyan-500 border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-800">
                      Cả rack ({allEmptySlots.length} ô trống)
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 hover:bg-slate-50 transition-colors select-none">
                    <input
                      type="radio"
                      name="bin-scope"
                      checked={scope === 'level'}
                      onChange={() => setScope('level')}
                      className="text-cyan-600 focus:ring-cyan-500 border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-800">Một tầng</span>
                  </label>
                  
                  {scope === 'level' && (
                    <select
                      aria-label="Chọn tầng"
                      className="ml-8 w-[calc(100%-2rem)] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
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

                {/* Section Số lượng */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Số lượng</p>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 hover:bg-slate-50 transition-colors select-none">
                    <input
                      type="radio"
                      name="bin-mode"
                      checked={mode === 'all'}
                      onChange={() => setMode('all')}
                      className="text-cyan-600 focus:ring-cyan-500 border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-800">Tất cả ô trống đã chọn ({pool.length})</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 hover:bg-slate-50 transition-colors select-none">
                    <input
                      type="radio"
                      name="bin-mode"
                      checked={mode === 'count'}
                      onChange={() => setMode('count')}
                      className="text-cyan-600 focus:ring-cyan-500 border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-800">Số lượng cụ thể</span>
                  </label>
                  
                  {mode === 'count' && (
                    <input
                      type="number"
                      min={1}
                      max={pool.length}
                      aria-label="Số bin"
                      className="ml-8 w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      value={countInput}
                      onChange={(e) => setCountInput(e.target.value)}
                    />
                  )}
                </div>

                {/* Card xem trước danh sách mã bin: Nền xám nhẹ, chữ màu xanh lá đậm (Emerald) sắc nét */}
                {selectedSlots.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Mã bin sẽ tạo ({selectedSlots.length})
                    </p>
                    <p className="font-mono text-xs font-semibold leading-relaxed text-emerald-700">
                      {preview.map((s) => s.binCode).join(', ')}
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
              disabled={saving || !selectedSlots.length}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Đang tạo…' : `Tạo ${selectedSlots.length} bin`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}