import type { ReactNode } from 'react'
import {
  expandRackGridWithAisles,
  FLOOR_PLAN_AISLE_FR,
  FLOOR_PLAN_RACK_FR,
  zoneMarginPercent,
  type FloorPlanSlot,
} from './zoneFloorPlan'
import {
  CinemaSeatGrid,
  SeatLegendItem,
  type CinemaSeat,
  type SeatVisualStatus,
} from './CinemaSeatGrid'
import { ZONE_AISLE_RATIO } from '../../utils/warehouseCapacity'

const STATUS_CLASS: Record<SeatVisualStatus, string> = {
  empty:
    'border-dashed border-white/15 bg-white/[0.02] text-white/30 hover:border-cyan-400/40 hover:bg-cyan-500/10',
  active:
    'border-cyan-500/50 bg-gradient-to-b from-cyan-500/30 to-cyan-900/40 text-cyan-100 shadow-[0_0_12px_rgba(6,237,249,0.25)]',
  'rack-no-bin':
    'border-cyan-500/35 bg-cyan-950/40 text-cyan-200/80 border-dashed',
  'rack-low':
    'border-emerald-500/45 bg-gradient-to-b from-emerald-500/25 to-emerald-900/35 text-emerald-100',
  'rack-partial':
    'border-amber-500/50 bg-gradient-to-b from-amber-500/30 to-amber-900/35 text-amber-100',
  'rack-heavy':
    'border-orange-500/55 bg-gradient-to-b from-orange-500/35 to-orange-900/40 text-orange-100',
  blocked: 'border-red-500/40 bg-red-900/30 text-red-200',
  selected:
    'border-amber-400 bg-gradient-to-b from-amber-400/40 to-amber-700/30 text-amber-50 ring-2 ring-amber-300/60 scale-[1.03] z-10',
  'empty-bin':
    'border-white/10 bg-slate-800/50 text-slate-500 hover:border-emerald-400/50 hover:bg-emerald-500/10',
  partial: 'border-amber-500/50 bg-amber-500/25 text-amber-100',
  full: 'border-orange-500/50 bg-orange-600/30 text-orange-100',
  reserved: 'border-violet-500/50 bg-violet-600/30 text-violet-100',
}

type Props = {
  screenLabel?: string
  cells: CinemaSeat[][]
  selectedId?: string | null
  legend?: ReactNode
  areaM2?: number | null
  maxRacks: number
  storageAreaM2?: number
  onSeatClick?: (seat: CinemaSeat, row: number, col: number) => void
}

function AisleCell({ slot }: { slot: Extract<FloorPlanSlot, { type: 'aisle' }> }) {
  const isCross = slot.variant === 'cross' || slot.variant === 'entry'
  return (
    <div
      className={`flex min-h-0 min-w-0 flex-col items-center justify-center rounded-md border border-dashed px-1 py-2 text-center ${
        isCross
          ? 'border-amber-400/25 bg-[repeating-linear-gradient(135deg,rgba(251,191,36,0.08)_0px,rgba(251,191,36,0.08)_8px,transparent_8px,transparent_16px)] text-amber-200/70'
          : 'border-slate-500/20 bg-slate-900/40 text-slate-500'
      }`}
      title={slot.label}
    >
      {slot.label && (
        <span className="text-[9px] font-medium uppercase leading-tight tracking-wide sm:text-[10px]">
          {slot.label}
        </span>
      )}
      {!slot.label && isCross && (
        <span className="text-[9px] uppercase tracking-widest text-amber-300/50">Lối đi</span>
      )}
    </div>
  )
}

function RackCell({
  seat,
  selectedId,
  onClick,
}: {
  seat: CinemaSeat
  selectedId?: string | null
  onClick?: () => void
}) {
  const isSelected = seat.id != null && seat.id === selectedId
  const status = isSelected ? 'selected' : seat.status
  return (
    <button
      type="button"
      disabled={seat.disabled}
      title={seat.hint ?? seat.label}
      onClick={onClick}
      className={`flex min-h-11 min-w-11 flex-col items-center justify-center rounded-md border px-0.5 py-1 font-mono text-[9px] font-bold transition-all sm:min-h-12 sm:min-w-12 sm:text-[10px] disabled:cursor-not-allowed disabled:opacity-40 ${STATUS_CLASS[status]}`}
    >
      <span className="leading-none">{seat.label}</span>
      {seat.subLabel && (
        <span className="mt-0.5 text-[8px] font-normal leading-none opacity-90">{seat.subLabel}</span>
      )}
    </button>
  )
}

export function ZoneFloorPlanGrid({
  screenLabel,
  cells,
  selectedId,
  legend,
  areaM2,
  maxRacks,
  storageAreaM2,
  onSeatClick,
}: Props) {
  const marginPct = zoneMarginPercent(ZONE_AISLE_RATIO)
  const plan = expandRackGridWithAisles(cells, { maxRacks, areaM2, aisleRatio: ZONE_AISLE_RATIO })

  if (!plan.length) {
    return (
      <CinemaSeatGrid
        screenLabel={screenLabel}
        cells={cells}
        selectedId={selectedId}
        legend={legend}
        onSeatClick={onSeatClick}
      />
    )
  }

  const rackFr = `${FLOOR_PLAN_RACK_FR}fr`
  const aisleFr = `${FLOOR_PLAN_AISLE_FR}fr`

  const storageRows = plan.slice(1, -1)
  const storageGridTemplateRows = storageRows
    .map((row) => (row.length === 1 && row[0].type === 'aisle' ? aisleFr : rackFr))
    .join(' ')

  return (
    <div className="mx-auto w-full max-w-5xl">
      {screenLabel && (
        <div className="mb-4 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-cyan-300">{screenLabel}</p>
          {storageAreaM2 != null && areaM2 != null && (
            <p className="mt-1 text-xs text-slate-400">
              Vùng rack (~{Math.round((1 - ZONE_AISLE_RATIO) * 100)}% ≈ {storageAreaM2.toFixed(1)} m²) ·
              Lối đi ~{Math.round(ZONE_AISLE_RATIO * 100)}% · Tổng zone {areaM2} m²
            </p>
          )}
        </div>
      )}

      <div
        className="zone-floor-plan flex aspect-square w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a1018]"
        style={{ maxHeight: 'min(72vh, 720px)' }}
      >
        {/* Lối đi trên — ~8% cạnh */}
        <div
          className="flex shrink-0 items-center justify-center border-b border-dashed border-amber-400/20 bg-[repeating-linear-gradient(90deg,rgba(251,191,36,0.06)_0px,rgba(251,191,36,0.06)_12px,transparent_12px,transparent_24px)] px-2"
          style={{ flex: `0 0 ${marginPct}%` }}
        >
          <span className="text-center text-[10px] font-medium uppercase tracking-wider text-amber-200/80 sm:text-xs">
            {plan[0]?.[0]?.type === 'aisle' ? plan[0][0].label : 'Lối đi / cửa kho'}
          </span>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Lối đi trái */}
          <div
            className="shrink-0 border-r border-dashed border-slate-600/30 bg-slate-900/50"
            style={{ flex: `0 0 ${marginPct}%` }}
            title="Lối đi viền"
          />

          {/* Vùng 70% — rack dàn trong storage grid */}
          <div
            className="grid min-h-0 min-w-0 flex-1 gap-1 p-2 sm:gap-1.5 sm:p-3"
            style={{ gridTemplateRows: storageGridTemplateRows }}
          >
            {storageRows.map((row, rowIndex) => {
              if (row.length === 1 && row[0].type === 'aisle') {
                return (
                  <AisleCell key={`cross-${rowIndex}`} slot={row[0]} />
                )
              }

              const colTemplate = row
                .map((slot) => (slot.type === 'aisle' ? aisleFr : rackFr))
                .join(' ')

              return (
                <div
                  key={`rack-row-${rowIndex}`}
                  className="grid min-h-0 items-stretch gap-1 sm:gap-1.5"
                  style={{ gridTemplateColumns: colTemplate }}
                >
                  {row.map((slot, colIndex) => {
                    if (slot.type === 'aisle') {
                      return <AisleCell key={`a-${rowIndex}-${colIndex}`} slot={slot} />
                    }
                    return (
                      <RackCell
                        key={`r-${rowIndex}-${colIndex}-${slot.seat.id ?? 'e'}`}
                        seat={slot.seat}
                        selectedId={selectedId}
                        onClick={() => onSeatClick?.(slot.seat, slot.rackRow, slot.rackCol)}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Lối đi phải */}
          <div
            className="shrink-0 border-l border-dashed border-slate-600/30 bg-slate-900/50"
            style={{ flex: `0 0 ${marginPct}%` }}
            title="Lối đi viền"
          />
        </div>

        {/* Lối đi dưới */}
        <div
          className="flex shrink-0 items-center justify-center border-t border-dashed border-slate-600/30 bg-slate-900/40 px-2"
          style={{ flex: `0 0 ${marginPct}%` }}
        >
          <span className="text-center text-[10px] text-slate-500 sm:text-xs">
            {plan[plan.length - 1]?.[0]?.type === 'aisle'
              ? (plan[plan.length - 1][0] as { type: 'aisle'; label: string }).label
              : `Viền lối đi · ~${Math.round(ZONE_AISLE_RATIO * 100)}% diện tích zone`}
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] text-slate-500">
        Mỗi ô rack ≈ 3 m² · Vùng giữa ≈ {Math.round((1 - ZONE_AISLE_RATIO) * 100)}% diện tích zone · Ô
        sọc vàng = lối đi picking / xe
      </p>

      {legend && (
        <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-3 rounded-lg border border-white/5 bg-[#0d1420]/70 px-4 py-3 text-xs">
          {legend}
        </div>
      )}
    </div>
  )
}

export { SeatLegendItem }
export type { CinemaSeat, SeatVisualStatus } from './CinemaSeatGrid'
