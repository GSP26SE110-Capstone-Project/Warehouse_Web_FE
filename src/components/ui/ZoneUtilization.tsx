import React from 'react'

type CellStatus = 'empty' | 'active' | 'stable' | 'alert'

interface ZoneUtilizationProps {
  capacity: number
  gridCells: CellStatus[]
}

export const ZoneUtilization: React.FC<ZoneUtilizationProps> = ({ capacity, gridCells }) => {
  const getStatusColor = (status: CellStatus) => {
    const colors: Record<CellStatus, string> = {
      active: 'bg-primary/20 border-primary/40 shadow-[0_0_10px_rgba(6,237,249,0.2)]',
      stable: 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,157,0.2)]',
      alert: 'bg-neon-orange/20 border-neon-orange/40 shadow-[0_0_10px_rgba(255,107,0,0.2)] animate-pulse',
      empty: 'bg-primary/5 border-white/5',
    }
    return colors[status]
  }

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 z-10">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400">grid_view</span>
          Zone Utilization
        </h3>
        <span className="text-xs font-mono text-emerald-400">{capacity}% CAPACITY</span>
      </div>

      <div className="flex-1 relative flex items-center justify-center" style={{ perspective: '1000px' }}>
        <div
          className="grid grid-cols-4 gap-2 w-full h-full p-4"
          style={{ transform: 'rotateX(45deg) rotateZ(-10deg)' }}
        >
          {gridCells.map((status, index) => (
            <div
              key={index}
              className={`rounded aspect-square hover:opacity-80 transition-opacity cursor-pointer border ${getStatusColor(
                status
              )}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-4 justify-center text-[10px] uppercase font-bold tracking-wider text-slate-400 z-10">
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-primary shadow-[0_0_5px_cyan]"></div>
          đang hoạt động
        </div>
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_5px_emerald]"></div>
          Ổn định
        </div>
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-neon-orange shadow-[0_0_5px_orange]"></div>
          Cảnh báo
        </div>
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-white/10"></div>
          Trống
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent pointer-events-none"></div>
    </div>
  )
}