import type { RegionWarehouseItem } from '../../api/locations'

function utilizationTone(percent: number) {
  if (percent >= 90) return { bar: 'bg-amber-400', text: 'text-amber-300' }
  if (percent >= 70) return { bar: 'bg-yellow-400', text: 'text-yellow-200' }
  return { bar: 'bg-emerald-400', text: 'text-emerald-300' }
}

function formatAreaM2(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null
  return `${value.toLocaleString('vi-VN')} m²`
}

export function WarehouseUtilizationBar({ item }: { item: RegionWarehouseItem }) {
  const areaLabel = formatAreaM2(item.capacityAreaM2 ?? item.totalAreaM2)
  const pct = item.utilizationPercent

  if (!areaLabel && pct == null) return null

  if (pct == null) {
    return <span className="text-[#9bb9bb] sm:text-right">{areaLabel}</span>
  }

  const tone = utilizationTone(pct)
  const freePct = Math.max(0, 100 - pct)
  const freeArea = formatAreaM2(item.availableAreaM2)

  return (
    <div className="flex flex-col gap-1.5 sm:items-end sm:min-w-[11rem]">
      <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-xs sm:text-sm">
        {areaLabel && <span className="text-[#9bb9bb]">{areaLabel}</span>}
        <span className={`font-medium ${tone.text}`}>~{pct}% đã quy hoạch</span>
      </div>
      <div
        className="h-1.5 w-full sm:w-44 rounded-full bg-white/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={String(pct)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`Kho ${item.warehouseName}: ${pct}% diện tích đã quy hoạch`}
      >
        <div
          className={`h-full rounded-full transition-all ${tone.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] sm:text-xs text-[#9bb9bb]/90 text-right leading-snug">
        Còn ~{freePct}%
        {freeArea ? ` (${freeArea})` : ''} chưa quy hoạch khu
      </p>
    </div>
  )
}
