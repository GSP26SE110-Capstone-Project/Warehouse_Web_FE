import type { WarehouseLayerId } from './types'
import { DEMO_ZONES, describeZoneLpnCapacity, type DemoZone3D } from './demoZones'

const FOCUS_ZONE = DEMO_ZONES[0]

type Props = {
  layer: WarehouseLayerId
  selectedZoneId?: string | null
  onZoneSelect?: (zone: DemoZone3D) => void
  reason?: 'unsupported' | 'error'
  onRetry3D?: () => void
}

export default function WarehouseScene2DFallback({
  layer,
  selectedZoneId,
  onZoneSelect,
  reason = 'unsupported',
  onRetry3D,
}: Props) {
  const zoneHighlight = layer === 'zone' || layer === 'warehouse'
  const focusRack = layer === 'rack' || layer === 'bin'
  const clickable = zoneHighlight

  return (
    <div className="relative flex h-full min-h-[280px] w-full flex-col sm:min-h-[360px]">
      <div className="absolute left-3 top-3 z-10 max-w-[260px] rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 text-[10px] leading-snug text-amber-100/90">
        {reason === 'error'
          ? 'Không tạo được WebGL — đang dùng sơ đồ 2D. Mở bằng Chrome/Edge, bật tăng tốc phần cứng, hoặc nhấn Thử lại 3D / F5.'
          : 'Trình duyệt không hỗ trợ WebGL — hiển thị sơ đồ 2D thay thế.'}
        {onRetry3D ? (
          <button
            type="button"
            onClick={onRetry3D}
            className="mt-1.5 block rounded border border-amber-300/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-50 hover:bg-amber-400/25"
          >
            Thử lại 3D
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 items-center justify-center p-6 pt-12">
        <div className="relative aspect-[10/7] w-full max-w-md rounded-xl border border-white/10 bg-[#0a1819]/80 p-3 shadow-inner">
          <div className="absolute inset-3 rounded-lg border border-[#3a5455]/60" aria-hidden />

          <div className="relative grid h-full grid-cols-2 grid-rows-2 gap-2">
            {DEMO_ZONES.map((zone) => {
              const isFocus = zone.id === FOCUS_ZONE.id
              const dimOthers = focusRack && !isFocus
              const isSelected = selectedZoneId === zone.id
              const capacity = describeZoneLpnCapacity(zone.zoneType)
              const showLabel = zoneHighlight && (isSelected || layer === 'zone')

              return (
                <button
                  key={zone.id}
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onZoneSelect?.(zone)}
                  className={`relative flex flex-col items-center justify-center rounded-lg border transition-all ${
                    clickable ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    isSelected
                      ? 'border-white/50 ring-1 ring-white/30'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                  style={{
                    backgroundColor: zone.color,
                    opacity: dimOthers ? 0.15 : isSelected ? 0.75 : zoneHighlight ? 0.45 : 0.25,
                  }}
                >
                  <span className="text-[11px] font-semibold text-white drop-shadow-sm">
                    Khu {zone.id}
                  </span>
                  {showLabel && (
                    <span className="mt-0.5 text-[10px] text-white/90">{capacity.maxBoxTypeLabel}</span>
                  )}

                  {focusRack && isFocus && (
                    <div className="absolute inset-x-2 bottom-2 flex justify-center gap-1">
                      {[0, 1, 2].map((rack) => (
                        <div
                          key={rack}
                          className="flex h-8 w-5 flex-col justify-end rounded-sm border border-[#526769] bg-[#1a2a2b]/90"
                        >
                          {layer === 'bin' &&
                            [0, 1, 2].map((level) => (
                              <div
                                key={level}
                                className="mx-0.5 mb-0.5 h-1 rounded-[1px] bg-[#06edf9]/80"
                              />
                            ))}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
