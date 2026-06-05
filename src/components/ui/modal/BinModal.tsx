import { useEffect, useMemo, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import type { ApiBin } from '../../../api/bins'
import { listLpns, type ApiLpn, type BoxType } from '../../../api/lpns'
import { getDefaultBinCapacity } from '../../../data/binCapacityDefaults'
import { isBinAtCapacity, isBinEmpty } from '../../../utils/binOccupancy'
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

// Cập nhật nhãn và ô input sang Light Mode (Nền sáng, chữ tối, viền rõ ràng)
const labelStyle =
  'text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block'
const inputStyle =
  'w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed'

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
  const [autoLpn, setAutoLpn] = useState(
    mode === 'create' || data?.maxLpnCount === suggestLpnCount(data?.maxVolumeUnits ?? 0, preset.maxLpnCount)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      /* Card thông tin sử dụng: Nền xám rất nhẹ, viền mỏng */
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        {/* <p className="font-mono text-cyan-700 font-semibold">{data.binCode}</p> */}

        {/* Volume usage bar */}
        <div className="mt-2">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-500">Sức chứa đã dùng</span>
            <span className="font-mono text-slate-800 font-bold">
              {data.usedVolumeUnits ?? 0}/{data.maxVolumeUnits ?? '?'} vol
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full transition-all ${
                isBinAtCapacity(data)
                  ? 'bg-amber-500'
                  : isBinEmpty(data)
                  ? 'bg-emerald-500/40'
                  : 'bg-cyan-500'
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

        {/* LPN Breakdown badges */}
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
                    className="inline-flex items-center gap-1 rounded border border-cyan-200 bg-cyan-50 px-2 py-0.5 font-mono text-[11px] text-cyan-800 font-medium"
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
              <p className="mt-1 text-[11px] text-amber-700 font-medium">
                ⚠ Counter trên bin lệch với thực tế LPN ({data.usedVolumeUnits ?? 0} ≠{' '}
                {totalActualVolume} vol). Chạy migration{' '}
                <code className="rounded bg-slate-200 px-1 text-slate-800">
                  bins_resync_lpn_volume.sql
                </code>{' '}
                để sync lại.
              </p>
            )}
        </div>

        <p className="mt-2 text-xs text-slate-500 border-t border-slate-200/60 pt-1.5">
          Trạng thái: <span className="text-slate-700 font-medium">{BIN_STATUS_LABELS[data.status ?? ''] ?? data.status ?? '—'}</span> ·{' '}
          <span className="text-slate-700 font-medium">{RESERVATION_TYPE_LABELS[data.reservationType ?? ''] ?? data.reservationType}</span>
        </p>
      </div>
    ) : null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop nền tối nhẹ mờ vừa phải */}
      <button type="button" className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} aria-label="Đóng" />
      
      {/* Khung Modal chính: Nền trắng shadow dày dặn */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900">
          {mode === 'create' ? 'Tạo bin' : 'Cấu hình bin'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {zoneLabel} · Rack {rackCode} · {levelLabel}
        </p>
        <p className="mt-2 font-mono text-sm text-cyan-600 font-semibold">{binCode}</p>

        {/* Banner Gợi ý Zone dạng màu Violet Pastel */}
        {/* <p className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800">
          Gợi ý zone{' '}
          <strong className="text-violet-950">{ZONE_TYPE_LABELS[zoneType ?? ''] ?? zoneType ?? 'SHARED'}</strong>:{' '}
          <strong>{preset.maxVolumeUnits}</strong> volume units (LPN cap ={' '}
          <strong>{preset.maxLpnCount}</strong>) — {preset.note}
        </p> */}

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
                className={`${inputStyle} opacity-60 bg-slate-50`}
                value={maxVolumeUnits}
                disabled
                readOnly
                aria-describedby="bin-volume-help"
              />
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                lock
              </span>
            </div>
            <p id="bin-volume-help" className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              {/* Lock theo preset zone{' '} */}
              {/* <strong className="text-slate-600">
                {ZONE_TYPE_LABELS[zoneType ?? ''] ?? zoneType ?? 'SHARED'}
              </strong>{' '} */}
              {/* ({preset.maxVolumeUnits} vol).  */}
              Quy ước: 1 SMALL = 1, MEDIUM = 2, LARGE = 4,
              EXTRA = 8 volume unit.
            </p>
          </div>

          {/* Khối Breakdown các loại Box: Nền Cyan nhạt pastel */}
          <div className="rounded-lg border border-cyan-200 bg-cyan-50/50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-800">
              Với {maxVolumeUnits} volume + tối đa {maxLpnCount} LPN, bin chứa được
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {breakdown.map((b) => (
                <div
                  key={b.type}
                  className={`rounded-md border px-2 py-1.5 transition-colors ${
                    b.fit > 0
                      ? 'border-cyan-300 bg-white shadow-sm'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    {b.label}
                  </p>
                  <p
                    className={`mt-0.5 text-sm font-bold ${
                      b.fit > 0 ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {b.fit} LPN
                  </p>
                  {b.fit > 0 && (
                    <p
                      className={`text-[10px] font-medium ${
                        b.limitedBy === 'lpn' ? 'text-amber-700' : 'text-slate-400'
                      }`}
                    >
                      {b.limitedBy === 'lpn' ? 'chặn bởi số LPN' : `${b.volume}×${b.fit} vol`}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {/* <p className="mt-2 text-[11px] text-slate-500">
              Ví dụ: <strong className="text-cyan-800">16 volume</strong> → 2 EXTRA, 4
              LARGE, 8 MEDIUM hoặc 16 SMALL — bin chỉ chặn bởi tổng volume.
            </p> */}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={applyZonePreset}
              className="text-xs font-medium text-cyan-600 hover:text-cyan-700 hover:underline"
            >
              Áp mặc định zone ({preset.maxLpnCount} LPN / {preset.maxVolumeUnits} vol)
            </button>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              {showAdvanced ? '▾ Ẩn ' : '▸ Tùy chọn giới hạn số LPN (maxLpnCount)'}
            </button>
          </div>

          {showAdvanced && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={autoLpn}
                  onChange={(e) => setAutoLpn(e.target.checked)}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                Tự động đề xuất maxLpnCount theo volume
              </label>
              <div>
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
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mặc định <strong className="text-slate-600">= maxVolumeUnits</strong> để LPN
                không phải là constraint. Chỉ override khi muốn ép bin chứa ít LPN hơn vì lý do thao
                tác. Auto-suggest hiện tại:{' '}
                <strong className="text-slate-600">
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
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={blocked}
                onChange={(e) => setBlocked(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              Khóa bin (BLOCKED) — không putaway
            </label>
          )}

          {error && (
            <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
          )}

          {/* Các nút điều khiển Footer */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-2">
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
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
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
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50 transition-colors shadow-sm"
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