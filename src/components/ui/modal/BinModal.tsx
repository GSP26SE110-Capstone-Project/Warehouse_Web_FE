import { useEffect, useMemo, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import type { ApiBin } from '../../../api/bins'
import { listLpns, type ApiLpn, type BoxType } from '../../../api/lpns'
import { getDefaultBinCapacity } from '../../../data/binCapacityDefaults'
import { isBinAtCapacity, isBinEmpty } from '../../../utils/binOccupancy'
import { BIN_STATUS_LABELS, RESERVATION_TYPE_LABELS } from '../../../data/rackStructure'
import { zoneTypeLabel } from '../../../data/zoneTypes'

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
  onDelete?: () => void
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
  onDelete,
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

  /** LPN đang nằm trong bin (status=STORED) — chỉ load ở edit mode khi đã có binId. */
  const binId = (data as ApiBin | undefined)?.binId
  const [lpns, setLpns] = useState<ApiLpn[]>([])
  const [lpnsLoading, setLpnsLoading] = useState(false)
  useEffect(() => {
    if (mode !== 'edit' || !binId) return
    let cancelled = false
    setLpnsLoading(true)
    listLpns({ currentBinId: binId, status: 'STORED', limit: 100 })
      .then(({ items }) => {
        if (!cancelled) setLpns(items)
      })
      .catch(() => {
        if (!cancelled) setLpns([])
      })
      .finally(() => {
        if (!cancelled) setLpnsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [mode, binId])

  const lpnByBoxType = useMemo(() => {
    const groups: Record<BoxType, number> = { EXTRA: 0, LARGE: 0, MEDIUM: 0, SMALL: 0 }
    for (const lpn of lpns) {
      if (lpn.boxType in groups) groups[lpn.boxType] += 1
    }
    return groups
  }, [lpns])

  const totalActualVolume = useMemo(
    () => lpns.reduce((sum, lpn) => sum + Number(lpn.volumeUnits ?? 0), 0),
    [lpns]
  )

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

  const canDelete =
    mode === 'edit' &&
    !!data &&
    (data.usedVolumeUnits ?? 0) === 0 &&
    (data.currentLpnCount ?? 0) === 0 &&
    lpns.length === 0 &&
    !lpnsLoading

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

        {/* Volume usage bar — single source of truth (bin chỉ chặn bởi volume) */}
        <div className="mt-2">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-400">Sức chứa đã dùng</span>
            <span className="font-mono text-slate-200">
              {data.usedVolumeUnits ?? 0}/{data.maxVolumeUnits ?? '?'} vol
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full transition-all ${
                isBinAtCapacity(data)
                  ? 'bg-amber-400'
                  : isBinEmpty(data)
                  ? 'bg-emerald-400/30'
                  : 'bg-cyan-400'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  ((data.usedVolumeUnits ?? 0) / (data.maxVolumeUnits || 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* LPN đang chứa — group theo box type, ẩn dòng "LPN X/Y" */}
        <div className="mt-2">
          <p className="text-xs text-slate-500">
            {lpnsLoading
              ? 'Đang tải LPN…'
              : lpns.length === 0
              ? 'Đang chứa: chưa có LPN nào (bin trống)'
              : `Đang chứa ${lpns.length} LPN (${totalActualVolume} vol)`}
          </p>
          {!lpnsLoading && lpns.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(['EXTRA', 'LARGE', 'MEDIUM', 'SMALL'] as BoxType[]).map((bt) =>
                lpnByBoxType[bt] > 0 ? (
                  <span
                    key={bt}
                    className="inline-flex items-center gap-1 rounded border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-[11px] text-cyan-200"
                  >
                    {lpnByBoxType[bt]} × {bt}
                  </span>
                ) : null
              )}
            </div>
          )}
          {!lpnsLoading &&
            lpns.length > 0 &&
            (data.usedVolumeUnits ?? 0) !== totalActualVolume && (
              <p className="mt-1 text-[11px] text-amber-300/90">
                ⚠ Counter trên bin lệch với thực tế LPN ({data.usedVolumeUnits ?? 0} ≠{' '}
                {totalActualVolume} vol). Chạy migration{' '}
                <code className="rounded bg-white/10 px-1">
                  bins_resync_lpn_volume.sql
                </code>{' '}
                để sync lại.
              </p>
            )}
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Trạng thái: {BIN_STATUS_LABELS[data.status ?? ''] ?? data.status ?? '—'} ·{' '}
          {RESERVATION_TYPE_LABELS[data.reservationType ?? ''] ?? data.reservationType}
        </p>
      </div>
    ) : null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Đóng" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col dark-scrollbar overflow-y-auto rounded-xl border border-white/5 bg-[#0b101a] p-6 pr-5 shadow-2xl [scrollbar-gutter:stable]">
        <h2 className="text-lg font-bold text-white">
          {mode === 'create' ? 'Tạo bin' : 'Cấu hình bin'}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {zoneLabel} · Rack {rackCode} · {levelLabel}
        </p>
        <p className="mt-2 font-mono text-sm text-cyan-400">{binCode}</p>

        <p className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-violet-200/90">
          Gợi ý zone{' '}
          <strong>{zoneTypeLabel(zoneType)}</strong>:{' '}
          <strong>{preset.maxVolumeUnits}</strong> volume units (LPN cap ={' '}
          <strong>{preset.maxLpnCount}</strong>) — {preset.note}
        </p>

        {occupancy}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className={labelStyle} htmlFor="bin-max-vol">
              Sức chứa (volume units) · cố định theo zone
            </label>
            <div className="relative">
              <input
                id="bin-max-vol"
                type="number"
                className={`${inputStyle} cursor-not-allowed opacity-60`}
                value={maxVolumeUnits}
                disabled
                readOnly
                aria-describedby="bin-volume-help"
              />
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                lock
              </span>
            </div>
            <p id="bin-volume-help" className="mt-1 text-[11px] text-slate-500">
              Lock theo preset zone{' '}
              <strong className="text-slate-300">
                {zoneTypeLabel(zoneType)}
              </strong>{' '}
              ({preset.maxVolumeUnits} vol). Quy ước: 1 SMALL = 1, MEDIUM = 2, LARGE = 4,
              EXTRA = 8 volume unit. Đổi sức chứa = đổi physical shelf design → cần cập
              nhật ở binCapacityDefaults thay vì sửa từng bin.
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

          <div className="flex items-center justify-between gap-2 pt-2">
            {mode === 'edit' && onDelete ? (
              <button
                type="button"
                disabled={!canDelete}
                onClick={onDelete}
                title={
                  canDelete
                    ? 'Xóa bin trống'
                    : 'Chỉ xóa được bin trống (không có LPN/hàng tồn)'
                }
                className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Xóa bin
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
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
          </div>
        </form>
      </div>
    </div>
  )
}
