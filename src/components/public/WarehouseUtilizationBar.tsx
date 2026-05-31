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
  const leasedPct = item.leasedPercent != null && item.leasedPercent > 0 ? item.leasedPercent : null
  const plannedPct = item.utilizationPercent

  if (item.hasActiveTenantContract && leasedPct == null) {
    return (
      <div className="flex flex-col gap-1 sm:items-end sm:min-w-[11rem] text-right">
        {areaLabel && <span className="text-[#9bb9bb] text-xs sm:text-sm">{areaLabel}</span>}
        <span className="text-xs sm:text-sm text-rose-300 font-medium">Đang có khách thuê</span>
        {plannedPct != null && (
          <span className="text-[10px] text-[#9bb9bb]/70">Quy hoạch layout: ~{plannedPct}%</span>
        )}
      </div>
    )
  }

  if (!areaLabel && leasedPct == null && plannedPct == null) return null

  const displayPct = leasedPct ?? plannedPct
  if (displayPct == null) {
    return <span className="text-[#9bb9bb] sm:text-right">{areaLabel}</span>
  }

  const tone = utilizationTone(displayPct)
  const freePct = Math.max(0, 100 - displayPct)
  const freeArea = formatAreaM2(
    leasedPct != null ? item.unleasedAreaM2 : item.availableAreaM2
  )
  const metricLabel = leasedPct != null ? 'đã thuê' : 'đã quy hoạch'

  return (
    <div className="flex flex-col gap-1.5 sm:items-end sm:min-w-[11rem]">
      <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-xs sm:text-sm">
        {areaLabel && <span className="text-[#9bb9bb]">{areaLabel}</span>}
        <span className={`font-medium ${tone.text}`}>~{displayPct}% {metricLabel}</span>
      </div>
      <div
        className="h-1.5 w-full sm:w-44 rounded-full bg-white/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={displayPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Kho ${item.warehouseName}: ${displayPct}% diện tích ${metricLabel}`}
      >
        <div
          className={`h-full rounded-full transition-all ${tone.bar}`}
          style={{ width: `${displayPct}%` }}
        />
      </div>
      <p className="text-[10px] sm:text-xs text-[#9bb9bb]/90 text-right leading-snug">
        Còn ~{freePct}%
        {freeArea ? ` trong (${freeArea})` : ''}{' '}
        {leasedPct != null ? 'chưa thuê' : 'chưa quy hoạch khu'}
      </p>
      {leasedPct != null && plannedPct != null && plannedPct !== leasedPct && (
        <p className="text-[10px] text-[#9bb9bb]/70 text-right">
          Quy hoạch layout: ~{plannedPct}%
        </p>
      )}
    </div>
  )
}
