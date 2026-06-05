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
  // Trống (Chưa cấu hình / Thêm mới) - Nền tối sâu, viền nét đứt mảnh màu sáng hơn
  empty:
    'border-dashed border-white/20 bg-white/[0.03] text-slate-500 hover:border-cyan-400 hover:bg-cyan-500/15 hover:text-cyan-400',
  
  // Đang hoạt động / Có dữ liệu - Màu xanh Cyan đổ bóng neon rực rỡ
  active:
    'border-cyan-400 bg-gradient-to-b from-cyan-500/40 to-cyan-900/60 text-cyan-50 shadow-[0_0_15px_rgba(6,237,249,0.35)]',
  
  // Rack chưa có cấu hình bin bên trong
  'rack-no-bin':
    'border-dashed border-cyan-500/50 bg-cyan-950/60 text-cyan-300 font-medium',
  
  // Mức độ chứa hàng thấp (Xanh lá lục bảo đậm nét, rực màu)
  'rack-low':
    'border-emerald-400 bg-gradient-to-b from-emerald-500/40 to-emerald-900/50 text-emerald-50 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
  
  // Mức độ chứa hàng vừa phải (Vàng hổ phách sẫm, tương phản cao)
  'rack-partial':
    'border-amber-400 bg-gradient-to-b from-amber-500/45 to-amber-900/55 text-amber-50 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
  
  // Mức độ chứa hàng cao (Cam cháy đậm đặc, nổi bật)
  'rack-heavy':
    'border-orange-500 bg-gradient-to-b from-orange-500/50 to-orange-950/60 text-orange-50 shadow-[0_0_12px_rgba(249,115,22,0.25)]',
  
  // Bị khóa / Chặn sử dụng - Viền đỏ thẫm nguy hiểm
  blocked: 
    'border-red-500 bg-gradient-to-b from-red-600/40 to-red-950/60 text-red-100 font-bold',
  
  // Đang được nhấn chọn - Đường viền dày màu vàng chanh, hiệu ứng nổi bật mạnh mẽ
  selected:
    'border-yellow-400 bg-gradient-to-b from-yellow-500/50 to-amber-700/50 text-white ring-4 ring-yellow-400/40 scale-105 z-10 shadow-[0_0_20px_rgba(234,179,8,0.5)]',
  
  // Ô bin trống hoàn toàn
  'empty-bin':
    'border-white/15 bg-slate-800 text-slate-400 hover:border-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-400',
  
  // Ô bin có hàng một phần (Vàng cam sẫm)
  partial: 
    'border-amber-400 bg-amber-500/40 text-amber-100 font-semibold',
  
  // Ô bin đã đầy hàng (Màu đỏ cam đậm)
  full: 
    'border-orange-500 bg-orange-600/40 text-orange-100 font-bold',
  
  // Ô bin đang được giữ chỗ trước (Tím đậm đà)
  reserved: 
    'border-violet-400 bg-violet-600/45 text-violet-100 font-semibold',
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
    <div className="mx-auto max-w-full">
      {screenLabel && (
        <div className="mb-6 flex flex-col items-center">
          <div className="cinema-screen mb-2 w-full max-w-2xl rounded-t-[50%] border border-cyan-500/30 bg-gradient-to-b from-cyan-500/25 to-transparent px-8 py-3 text-center text-xs font-bold uppercase tracking-[0.35em] text-cyan-300 shadow-[0_8px_32px_rgba(6,237,249,0.2)]">
            {screenLabel}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Hướng lối đi / cửa kho</p>
        </div>
      )}

      <div className={perspective ? 'cinema-floor' : ''}>
        <div className="cinema-grid inline-block rounded-xl border border-white/10 bg-[#0b0f17] p-4 sm:p-6 shadow-2xl">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {cells.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-center text-xs font-bold text-cyan-400/90">
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
                        className={`cinema-seat flex ${seatSize} flex-col items-center justify-center rounded-md border font-mono font-bold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-30 ${STATUS_CLASS[status]}`}
                      >
                        <span className="leading-none">{seat.label}</span>
                        {seat.subLabel && (
                          <span className="mt-0.5 text-[8px] font-normal leading-none text-slate-300 opacity-90">
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
              <span key={i} className="w-9 text-center text-[10px] font-bold text-slate-800 sm:w-12">
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      {legend && (
        <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-4 rounded-lg border border-white/10 bg-[#0b0f17]/90 px-4 py-3 text-xs shadow-xl">
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
    <span className="flex items-center gap-1.5 font-medium text-slate-300 ">
      <span className={`inline-block h-3 w-3 rounded border ${STATUS_CLASS[status].split(' ').slice(0, 3).join(' ')}`} />
      {label}
    </span>
  )
}