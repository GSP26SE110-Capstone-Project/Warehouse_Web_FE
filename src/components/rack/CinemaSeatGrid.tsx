import type { ReactNode } from 'react'
import { rowLabel } from './rackLayoutUtils'

export type SeatVisualStatus =
  | 'empty'
  | 'active'
  | 'blocked'
  | 'selected'
  | 'rack-no-bin'
  | 'rack-low'
  | 'rack-partial'
  | 'rack-heavy'
  | 'empty-bin'
  | 'partial'
  | 'full'
  | 'reserved'

export type CinemaSeat = {
  id: string | null
  label: string
  subLabel?: string
  hint?: string
  status: SeatVisualStatus
  disabled?: boolean
}

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
    'border-amber-400 bg-gradient-to-b from-amber-400/40 to-amber-700/30 text-amber-50 ring-2 ring-amber-300/60 scale-105 z-10',
  'empty-bin':
    'border-white/10 bg-slate-800/50 text-slate-500 hover:border-emerald-400/50 hover:bg-emerald-500/10',
  partial: 'border-amber-500/50 bg-amber-500/25 text-amber-100',
  full: 'border-orange-500/50 bg-orange-600/30 text-orange-100',
  reserved: 'border-violet-500/50 bg-violet-600/30 text-violet-100',
}

type Props = {
  screenLabel?: string
  rowLabels?: string[]
  cells: CinemaSeat[][]
  selectedId?: string | null
  perspective?: boolean
  compact?: boolean
  legend?: ReactNode
  onSeatClick?: (seat: CinemaSeat, row: number, col: number) => void
}

export function CinemaSeatGrid({
  screenLabel,
  rowLabels,
  cells,
  selectedId,
  perspective = true,
  compact = false,
  legend,
  onSeatClick,
}: Props) {
  const seatSize = compact
    ? 'w-9 h-9 text-[9px]'
    : 'min-w-11 min-h-11 w-11 h-auto sm:min-w-12 sm:min-h-12 sm:w-12 py-1 text-[9px] sm:text-[10px]'

  return (
    // Wrapper KHÔNG có perspective — chứa screen, floor, và legend ở các container riêng.
    // Lý do: `cinema-floor` dùng CSS perspective transform → mọi thứ bên trong bị tilt và
    // z-stack lung tung. Trước đây legend nằm trong cùng container → bị seat đè lên khi
    // có nhiều rack. Tách legend ra ngoài đảm bảo hiển thị phẳng phía dưới.
    <div className="mx-auto max-w-full">
      {screenLabel && (
        <div className="mb-6 flex flex-col items-center">
          <div className="cinema-screen mb-2 w-full max-w-2xl rounded-t-[50%] border border-cyan-500/20 bg-gradient-to-b from-cyan-500/20 to-transparent px-8 py-3 text-center text-xs font-bold uppercase tracking-[0.35em] text-cyan-300/90 shadow-[0_8px_32px_rgba(6,237,249,0.15)]">
            {screenLabel}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Hướng lối đi / cửa kho</p>
        </div>
      )}

      <div className={perspective ? 'cinema-floor' : ''}>
        <div className="cinema-grid inline-block rounded-xl border border-white/5 bg-[#0d1420]/80 p-4 sm:p-6">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {cells.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-center text-xs font-bold text-cyan-400/80">
                  {rowLabels?.[rowIndex] ?? rowLabel(rowIndex)}
                </span>
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  {row.map((seat, colIndex) => {
                    const isSelected = seat.id != null && seat.id === selectedId
                    const status = isSelected ? 'selected' : seat.status
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}-${seat.id ?? 'e'}`}
                        type="button"
                        disabled={seat.disabled}
                        title={seat.hint ?? seat.label}
                        onClick={() => onSeatClick?.(seat, rowIndex, colIndex)}
                        className={`cinema-seat flex ${seatSize} flex-col items-center justify-center rounded-md border font-mono font-bold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${STATUS_CLASS[status]}`}
                      >
                        <span className="leading-none">{seat.label}</span>
                        {seat.subLabel && (
                          <span className="mt-0.5 text-[8px] font-normal leading-none opacity-90">
                            {seat.subLabel}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center gap-1">
            {Array.from({ length: cells[0]?.length ?? 0 }).map((_, i) => (
              <span key={i} className="w-9 text-center text-[10px] text-slate-500 sm:w-12">
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      {legend && (
        <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3 rounded-lg border border-white/5 bg-[#0d1420]/70 px-4 py-3 text-xs">
          {legend}
        </div>
      )}
    </div>
  )
}

export function SeatLegendItem({
  status,
  label,
}: {
  status: SeatVisualStatus
  label: string
}) {
  return (
    <span className="flex items-center gap-1.5 text-slate-400">
      <span className={`inline-block h-3 w-3 rounded border ${STATUS_CLASS[status].split(' ').slice(0, 3).join(' ')}`} />
      {label}
    </span>
  )
}
