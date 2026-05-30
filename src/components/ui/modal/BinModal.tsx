import { useEffect, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import type { ApiBin } from '../../../api/bins'
import { getDefaultBinCapacity } from '../../../data/binCapacityDefaults'
import { formatBinOccupancy, isBinAtCapacity, isBinEmpty } from '../../../utils/binOccupancy'
import { BIN_STATUS_LABELS, RESERVATION_TYPE_LABELS } from '../../../data/rackStructure'
import { ZONE_TYPE_LABELS } from '../../../data/zoneTypes'

type Mode = 'create' | 'edit'

export type BinFormPayload = {
  maxLpnCount: number
  maxVolumeUnits: number
  reservationType: string
  status?: string
}

type Props = {
  mode: Mode
  zoneType?: string | null
  zoneLabel: string
  rackCode: string
  levelLabel: string
  binCode: string
  data?: ApiBin
  onClose: () => void
  onSubmit: (payload: BinFormPayload) => void | Promise<void>
}

const labelStyle =
  'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
const inputStyle =
  'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400'

export function BinModal({
  mode,
  zoneType,
  zoneLabel,
  rackCode,
  levelLabel,
  binCode,
  data,
  onClose,
  onSubmit,
}: Props) {
  const preset = getDefaultBinCapacity(zoneType)

  const [maxLpnCount, setMaxLpnCount] = useState(data?.maxLpnCount ?? preset.maxLpnCount)
  const [maxVolumeUnits, setMaxVolumeUnits] = useState(data?.maxVolumeUnits ?? preset.maxVolumeUnits)
  const [reservationType, setReservationType] = useState(data?.reservationType ?? 'SHARED')
  const [blocked, setBlocked] = useState(data?.status === 'BLOCKED')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (mode === 'create') {
      setMaxLpnCount(preset.maxLpnCount)
      setMaxVolumeUnits(preset.maxVolumeUnits)
    }
  }, [mode, preset.maxLpnCount, preset.maxVolumeUnits])

  const applyZonePreset = () => {
    setMaxLpnCount(preset.maxLpnCount)
    setMaxVolumeUnits(preset.maxVolumeUnits)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (maxLpnCount < 1 || maxVolumeUnits < 1) {
      setError('maxLpnCount và maxVolumeUnits phải ≥ 1')
      return
    }
    setSaving(true)
    try {
      const payload: BinFormPayload = {
        maxLpnCount,
        maxVolumeUnits,
        reservationType,
      }
      if (mode === 'edit') {
        if (blocked) payload.status = 'BLOCKED'
        else if (data?.status === 'BLOCKED') payload.status = 'EMPTY'
      }
      await onSubmit(payload)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const occupancy =
    mode === 'edit' && data ? (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
        <p className="font-mono text-cyan-300">{data.binCode}</p>
        <p className="mt-1">{formatBinOccupancy(data)}</p>
        <p className="mt-1 text-xs text-slate-500">
          Trạng thái: {BIN_STATUS_LABELS[data.status ?? ''] ?? data.status ?? '—'} ·{' '}
          {RESERVATION_TYPE_LABELS[data.reservationType ?? ''] ?? data.reservationType}
        </p>
        <p className="mt-1 text-xs">
          {isBinEmpty(data) ? (
            <span className="text-emerald-400">Còn trống (chưa có LPN)</span>
          ) : isBinAtCapacity(data) ? (
            <span className="text-amber-300">Đã đầy theo LPN hoặc thể tích</span>
          ) : (
            <span className="text-cyan-300/90">Đang dùng một phần</span>
          )}
        </p>
      </div>
    ) : null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Đóng" />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-white/5 bg-[#0b101a] p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white">
          {mode === 'create' ? 'Tạo bin' : 'Cấu hình bin'}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {zoneLabel} · Rack {rackCode} · {levelLabel}
        </p>
        <p className="mt-2 font-mono text-sm text-cyan-400">{binCode}</p>

        <p className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-violet-200/90">
          Gợi ý zone{' '}
          <strong>{ZONE_TYPE_LABELS[zoneType ?? ''] ?? zoneType ?? 'SHARED'}</strong>: tối đa{' '}
          <strong>{preset.maxLpnCount}</strong> LPN, <strong>{preset.maxVolumeUnits}</strong> volume
          units — {preset.note}
        </p>

        {occupancy}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelStyle} htmlFor="bin-max-lpn">
                maxLpnCount
              </label>
              <input
                id="bin-max-lpn"
                type="number"
                min={1}
                className={inputStyle}
                value={maxLpnCount}
                onChange={(e) => setMaxLpnCount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelStyle} htmlFor="bin-max-vol">
                maxVolumeUnits
              </label>
              <input
                id="bin-max-vol"
                type="number"
                min={1}
                className={inputStyle}
                value={maxVolumeUnits}
                onChange={(e) => setMaxVolumeUnits(Number(e.target.value))}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={applyZonePreset}
            className="text-xs text-cyan-400 hover:underline"
          >
            Áp mặc định zone ({preset.maxLpnCount} / {preset.maxVolumeUnits})
          </button>

          <div>
            <label className={labelStyle} htmlFor="bin-reservation">
              reservationType
            </label>
            <select
              id="bin-reservation"
              className={inputStyle}
              value={reservationType}
              onChange={(e) => setReservationType(e.target.value)}
            >
              <option value="SHARED">SHARED — Chia sẻ</option>
              <option value="RESERVED">RESERVED — Giữ riêng</option>
              <option value="DEDICATED">DEDICATED</option>
            </select>
          </div>

          {mode === 'edit' && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={blocked}
                onChange={(e) => setBlocked(e.target.checked)}
                className="rounded border-white/20"
              />
              Khóa bin (BLOCKED) — không putaway
            </label>
          )}

          {error && (
            <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Đang lưu…' : mode === 'create' ? 'Tạo bin' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
