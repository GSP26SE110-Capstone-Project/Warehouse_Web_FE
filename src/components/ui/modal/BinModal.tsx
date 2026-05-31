import { useEffect, useMemo, useState } from 'react'
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

/** Volume units per box type — đồng bộ với BOX_VOLUME_UNITS ở backend. */
const BOX_TYPE_VOLUME: { type: 'EXTRA' | 'LARGE' | 'MEDIUM' | 'SMALL'; volume: number; label: string }[] = [
  { type: 'EXTRA', volume: 8, label: 'EXTRA' },
  { type: 'LARGE', volume: 4, label: 'LARGE' },
  { type: 'MEDIUM', volume: 2, label: 'MEDIUM' },
  { type: 'SMALL', volume: 1, label: 'SMALL' },
]

/**
 * Đề xuất maxLpnCount mặc định = maxVolumeUnits.
 * Mỗi SMALL = 1 volume unit nên đây là upper bound vật lý của LPN.
 * Bin sẽ chỉ bị chặn bởi volume → tối ưu mọi tổ hợp box type tenant nhập vào.
 */
function suggestLpnCount(volume: number, presetLpn: number): number {
  if (volume <= 0) return presetLpn
  return Math.max(presetLpn, volume)
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
  const [showAdvanced, setShowAdvanced] = useState(false)
  /** Cho phép user bật chế độ chỉnh tay maxLpnCount; mặc định auto-suggest theo volume. */
  const [autoLpn, setAutoLpn] = useState(
    mode === 'create' || data?.maxLpnCount === suggestLpnCount(data?.maxVolumeUnits ?? 0, preset.maxLpnCount)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (mode === 'create') {
      setMaxLpnCount(preset.maxLpnCount)
      setMaxVolumeUnits(preset.maxVolumeUnits)
      setAutoLpn(true)
    }
  }, [mode, preset.maxLpnCount, preset.maxVolumeUnits])

  useEffect(() => {
    if (autoLpn) {
      setMaxLpnCount(suggestLpnCount(maxVolumeUnits, preset.maxLpnCount))
    }
  }, [autoLpn, maxVolumeUnits, preset.maxLpnCount])

  const applyZonePreset = () => {
    setMaxLpnCount(preset.maxLpnCount)
    setMaxVolumeUnits(preset.maxVolumeUnits)
    setAutoLpn(true)
  }

  /** Breakdown: với maxVolumeUnits hiện tại + maxLpnCount, mỗi loại box chứa được bao nhiêu LPN. */
  const breakdown = useMemo(
    () =>
      BOX_TYPE_VOLUME.map((b) => {
        const byVolume = Math.floor(maxVolumeUnits / b.volume)
        const fit = Math.min(byVolume, maxLpnCount)
        const limitedBy = byVolume <= maxLpnCount ? 'volume' : 'lpn'
        return { ...b, fit, limitedBy }
      }),
    [maxVolumeUnits, maxLpnCount]
  )

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
          <strong>{ZONE_TYPE_LABELS[zoneType ?? ''] ?? zoneType ?? 'SHARED'}</strong>:{' '}
          <strong>{preset.maxVolumeUnits}</strong> volume units (LPN cap ={' '}
          <strong>{preset.maxLpnCount}</strong>) — {preset.note}
        </p>

        {occupancy}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className={labelStyle} htmlFor="bin-max-vol">
              Sức chứa (volume units)
            </label>
            <input
              id="bin-max-vol"
              type="number"
              min={1}
              className={inputStyle}
              value={maxVolumeUnits}
              onChange={(e) => setMaxVolumeUnits(Number(e.target.value))}
              aria-describedby="bin-volume-help"
            />
            <p id="bin-volume-help" className="mt-1 text-[11px] text-slate-500">
              Quy ước: 1 SMALL = 1, MEDIUM = 2, LARGE = 4, EXTRA = 8 volume unit.
            </p>
          </div>

          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              Với {maxVolumeUnits} volume + tối đa {maxLpnCount} LPN, bin chứa được
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {breakdown.map((b) => (
                <div
                  key={b.type}
                  className={`rounded-md border px-2 py-1.5 ${
                    b.fit > 0
                      ? 'border-cyan-400/30 bg-cyan-400/5'
                      : 'border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    {b.label}
                  </p>
                  <p
                    className={`mt-0.5 text-sm font-semibold ${
                      b.fit > 0 ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {b.fit} LPN
                  </p>
                  {b.fit > 0 && (
                    <p
                      className={`text-[10px] ${
                        b.limitedBy === 'lpn' ? 'text-amber-300/80' : 'text-slate-500'
                      }`}
                    >
                      {b.limitedBy === 'lpn' ? 'chặn bởi số LPN' : `${b.volume}×${b.fit} vol`}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Ví dụ: <strong className="text-cyan-200">16 volume</strong> → 2 EXTRA, 4
              LARGE, 8 MEDIUM hoặc 16 SMALL — bin chỉ chặn bởi tổng volume.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={applyZonePreset}
              className="text-xs text-cyan-400 hover:underline"
            >
              Áp mặc định zone ({preset.maxLpnCount} LPN / {preset.maxVolumeUnits} vol)
            </button>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-xs text-slate-400 hover:text-white"
            >
              {showAdvanced ? '▾ Ẩn nâng cao' : '▸ Tùy chọn nâng cao (maxLpnCount)'}
            </button>
          </div>

          {showAdvanced && (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={autoLpn}
                  onChange={(e) => setAutoLpn(e.target.checked)}
                  className="rounded border-white/20"
                />
                Tự động đề xuất maxLpnCount theo volume
              </label>
              <label className={labelStyle} htmlFor="bin-max-lpn">
                maxLpnCount (giới hạn số LPN)
              </label>
              <input
                id="bin-max-lpn"
                type="number"
                min={1}
                className={inputStyle}
                value={maxLpnCount}
                disabled={autoLpn}
                onChange={(e) => setMaxLpnCount(Number(e.target.value))}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Mặc định <strong className="text-slate-300">= maxVolumeUnits</strong> để LPN
                không phải là constraint (mỗi SMALL = 1 volume nên upper bound vật lý của
                LPN = volume). Chỉ override khi muốn ép bin chứa ít LPN hơn vì lý do thao
                tác (ví dụ hàng cồng kềnh, khó pick chồng nhiều). Auto-suggest hiện tại:{' '}
                <strong className="text-slate-300">
                  {suggestLpnCount(maxVolumeUnits, preset.maxLpnCount)}
                </strong>
                .
              </p>
            </div>
          )}

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
