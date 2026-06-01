import { useEffect, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import type { ApiWarehouseZonePlanning } from '../../../api/warehouses'
import { ZONE_TYPE_OPTIONS } from '../../../data/zoneTypes'

type Props = {
  warehouseId: string
  warehouseLabel: string
  planning: ApiWarehouseZonePlanning | null
  onClose: () => void
  onSubmit: (payload: {
    count: number
    areaM2PerZone: number
    zoneCodePrefix: string
    zoneType: string
  }) => Promise<void>
}

const labelStyle =
  'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
const inputStyle =
  'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400'

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(n)
}

export function BulkZoneModal({
  warehouseId,
  warehouseLabel,
  planning,
  onClose,
  onSubmit,
}: Props) {
  const defaultCount = Math.max(1, planning?.missingZoneCount ?? 1)
  const defaultArea =
    planning?.suggestedAreaPerZoneForEvenSplit ??
    planning?.suggestedReferenceZoneAreaM2 ??
    50

  const [count, setCount] = useState(String(defaultCount))
  const [areaPerZone, setAreaPerZone] = useState(String(defaultArea))
  const [codePrefix, setCodePrefix] = useState('Z')
  const [zoneType, setZoneType] = useState('SHARED')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setCount(String(defaultCount))
    setAreaPerZone(String(defaultArea))
  }, [defaultCount, defaultArea, warehouseId])

  const countNum = Number(count)
  const areaNum = Number(areaPerZone)
  const totalNewArea =
    Number.isFinite(countNum) && Number.isFinite(areaNum) ? countNum * areaNum : 0
  const remaining = planning?.remainingZoneAreaM2 ?? null
  const exceedsRemaining =
    remaining != null && totalNewArea > remaining + 0.001

  const handleSubmit = async () => {
    setError('')
    if (!Number.isInteger(countNum) || countNum < 1 || countNum > 50) {
      setError('Số zone: từ 1 đến 50')
      return
    }
    if (!Number.isFinite(areaNum) || areaNum <= 0) {
      setError('Diện tích mỗi zone phải > 0')
      return
    }
    if (exceedsRemaining) {
      setError(
        `Tổng ${fmt(totalNewArea)} m² vượt diện tích còn lại (${fmt(remaining)} m²)`
      )
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({
        count: countNum,
        areaM2PerZone: areaNum,
        zoneCodePrefix: codePrefix.trim() || 'Z',
        zoneType,
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tạo zone thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl">
        <div className="border-b border-white/5 px-6 py-5">
          <h2 className="text-lg font-bold text-white">Tạo nhiều zone</h2>
          <p className="mt-1 text-xs text-slate-400">{warehouseLabel}</p>
        </div>

        <div className="space-y-4 p-6">
          {planning && (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-3 text-xs text-slate-300">
              <p>
                Diện tích sử dụng kho:{' '}
                <strong className="text-white">{fmt(planning.usableAreaM2)} m²</strong>
              </p>
              <p className="mt-1">
                Zone hiện có: {planning.zoneCount} · Đã dùng: {fmt(planning.usedZoneAreaM2)} m² ·
                Còn: <strong className="text-cyan-300">{fmt(planning.remainingZoneAreaM2)} m²</strong>
              </p>
              {planning.suggestedMinZoneCount != null && (
                <p className="mt-1 text-amber-200/90">
                  Gợi ý tối thiểu ~{planning.suggestedMinZoneCount} zone (≈{' '}
                  {planning.suggestedReferenceZoneAreaM2} m²/zone). Còn{' '}
                  {fmt(planning.remainingZoneAreaM2)} m² — có thể thêm tối đa ~
                  {planning.missingZoneCount ?? 0} zone.
                </p>
              )}
            </div>
          )}

          {error && (
            <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
          )}

          <div>
            <label className={labelStyle}>Số zone tạo</label>
            <input
              type="number"
              min={1}
              max={50}
              className={inputStyle}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>
          <div>
            <label className={labelStyle}>Diện tích mỗi zone (m²)</label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              className={inputStyle}
              value={areaPerZone}
              onChange={(e) => setAreaPerZone(e.target.value)}
            />
            {exceedsRemaining && (
              <p className="mt-1 text-xs text-amber-300">
                Tổng mới {fmt(totalNewArea)} m² &gt; còn lại {fmt(remaining)} m²
              </p>
            )}
          </div>
          <div>
            <label className={labelStyle}>Tiền tố mã zone</label>
            <input
              className={inputStyle}
              value={codePrefix}
              onChange={(e) => setCodePrefix(e.target.value)}
              placeholder="Z"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              VD: Z → Z-03, Z-04… (theo số zone hiện có)
            </p>
          </div>
          <div>
            <label className={labelStyle}>Loại zone</label>
            <select
              className={inputStyle}
              value={zoneType}
              onChange={(e) => setZoneType(e.target.value)}
            >
              {ZONE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
          <button type="button" onClick={onClose} className="text-sm text-slate-400">
            Hủy
          </button>
          <button
            type="button"
            disabled={submitting || exceedsRemaining}
            onClick={handleSubmit}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            {submitting ? 'Đang tạo...' : 'Tạo zone'}
          </button>
        </div>
      </div>
    </div>
  )
}
