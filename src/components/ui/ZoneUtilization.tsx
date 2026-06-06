import { useCallback, useMemo, useRef, useState, type PointerEvent } from 'react'
import { zoneTypeLabel } from '../../data/zoneTypes'

export type ZoneUtilStatus = 'empty' | 'active' | 'stable' | 'alert'

export type ZoneUtilItem = {
  zoneId: string
  zoneCode: string
  zoneName?: string | null
  zoneType?: string | null
  areaM2?: number | null
  status?: string | null
  rackCount?: number
  maxRacks?: number
  utilPct: number
}

type ZoneUtilizationProps = {
  capacityPct: number
  zones: ZoneUtilItem[]
  usedAreaM2?: number | null
  usableAreaM2?: number | null
  remainingAreaM2?: number | null
}

type GridCell = ZoneUtilItem | null

function fmtM2(n?: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n)
}

export function statusFromUtil(util: number, zoneStatus?: string | null): ZoneUtilStatus {
  if (zoneStatus === 'BLOCKED') return 'alert'
  if (util <= 0) return 'empty'
  if (util >= 85) return 'alert'
  if (util >= 50) return 'stable'
  return 'active'
}

const STATUS_STYLES: Record<
  ZoneUtilStatus,
  {
    tile: string
    fill: string
    glow: string
    label: string
    pillar: string
  }
> = {
  empty: {
    tile: 'border-white/10 bg-primary/5',
    fill: 'bg-slate-600/50',
    glow: 'shadow-none',
    label: 'Chưa dựng / trống',
    pillar: 'from-slate-600/60 to-slate-700/40',
  },
  active: {
    tile: 'border-primary/40 bg-primary/10 shadow-[0_0_12px_rgba(6,237,249,0.15)]',
    fill: 'bg-gradient-to-t from-cyan-600/80 to-cyan-400/90',
    glow: 'shadow-[0_0_14px_rgba(6,237,249,0.35)]',
    label: 'Đang dùng',
    pillar: 'from-cyan-600 to-cyan-400',
  },
  stable: {
    tile: 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_12px_rgba(52,211,153,0.15)]',
    fill: 'bg-gradient-to-t from-emerald-600/80 to-emerald-400/90',
    glow: 'shadow-[0_0_14px_rgba(52,211,153,0.3)]',
    label: 'Ổn định',
    pillar: 'from-emerald-600 to-emerald-400',
  },
  alert: {
    tile: 'border-neon-orange/50 bg-neon-orange/10 shadow-[0_0_14px_rgba(255,107,0,0.2)]',
    fill: 'bg-gradient-to-t from-orange-600/90 to-amber-400/90',
    glow: 'shadow-[0_0_16px_rgba(255,107,0,0.4)]',
    label: 'Gần đầy',
    pillar: 'from-orange-600 to-amber-400',
  },
}

function capacityTone(pct: number) {
  if (pct >= 90) return 'text-orange-400'
  if (pct >= 70) return 'text-amber-300'
  return 'text-emerald-400'
}

function capacityRingColor(pct: number) {
  if (pct >= 90) return '#fb923c'
  if (pct >= 70) return '#fbbf24'
  return '#34d399'
}

export function computeZoneLayoutUtil(zone: {
  rackCount?: number
  maxRacks?: number
  areaM2?: number | null
}): number {
  const max = zone.maxRacks ?? 0
  const actual = zone.rackCount ?? 0
  if (max > 0) return Math.min(100, Math.round((actual / max) * 100))
  return 0
}

function buildFloorGrid(zones: ZoneUtilItem[]): { cols: number; cells: GridCell[] } {
  const n = zones.length
  if (n === 0) {
    return { cols: 4, cells: Array(12).fill(null) }
  }
  const cols = n <= 4 ? n : n <= 9 ? 3 : 4
  const rows = Math.ceil(n / cols)
  const total = cols * rows
  const cells: GridCell[] = [...zones]
  while (cells.length < total) cells.push(null)
  return { cols, cells }
}

export function ZoneUtilization({
  capacityPct,
  zones,
  usedAreaM2,
  usableAreaM2,
  remainingAreaM2,
}: ZoneUtilizationProps) {
  const pct = Math.max(0, Math.min(100, capacityPct))
  const ringR = 32
  const ringC = 2 * Math.PI * ringR
  const ringOffset = ringC - (pct / 100) * ringC

  const { cols, cells } = useMemo(() => buildFloorGrid(zones), [zones])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [viewRot, setViewRot] = useState({ x: 52, z: -10 })
  const dragRef = useRef<{ x: number; z: number } | null>(null)

  const selected = zones.find((z) => z.zoneId === selectedId) ?? null
  const hovered = zones.find((z) => z.zoneId === hoveredId) ?? null
  const focusZone = selected ?? hovered

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: e.clientX, z: viewRot.z }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [viewRot.z])

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    setViewRot((v) => ({
      ...v,
      z: dragRef.current!.z + dx * 0.15,
    }))
  }, [])

  const onPointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  const resetView = () => setViewRot({ x: 52, z: -10 })

  return (
    <div className="glass-panel relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="material-symbols-outlined text-emerald-400">grid_view</span>
            Mức dùng zone
          </h3>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Kéo sàn để xoay · click ô zone để xem chi tiết
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewRot((v) => ({ ...v, z: v.z - 8 }))}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white"
            title="Xoay trái"
          >
            <span className="material-symbols-outlined text-lg">rotate_left</span>
          </button>
          <button
            type="button"
            onClick={() => setViewRot((v) => ({ ...v, z: v.z + 8 }))}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white"
            title="Xoay phải"
          >
            <span className="material-symbols-outlined text-lg">rotate_right</span>
          </button>
          <button
            type="button"
            onClick={resetView}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-slate-400 hover:text-white"
          >
            Reset
          </button>
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            <svg className="-rotate-90" width="64" height="64" viewBox="0 0 64 64" aria-hidden>
              <circle cx="32" cy="32" r={ringR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle
                cx="32"
                cy="32"
                r={ringR}
                fill="none"
                stroke={capacityRingColor(pct)}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ringC}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <span className={`absolute text-xs font-bold font-mono ${capacityTone(pct)}`}>{pct}%</span>
          </div>
        </div>
      </div>

      {(usableAreaM2 != null || usedAreaM2 != null) && (
        <p className="relative z-10 mb-3 text-center text-[10px] text-slate-400">
          Phân bổ{' '}
          <strong className="text-white">{fmtM2(usedAreaM2)}</strong> /{' '}
          <strong className="text-cyan-300">{fmtM2(usableAreaM2)}</strong> m² · còn{' '}
          <strong className="text-emerald-300">{fmtM2(remainingAreaM2)}</strong> m²
        </p>
      )}

      <div
        className="zone-floor-scene relative z-10 flex flex-1 cursor-grab touch-none select-none items-center justify-center py-2 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="zone-floor-grid w-full max-w-[320px]"
          style={{
            transform: `rotateX(${viewRot.x}deg) rotateZ(${viewRot.z}deg)`,
          }}
        >
          <div
            className="grid gap-2 p-3"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {cells.map((cell, index) => {
              if (!cell) {
                return (
                  <div
                    key={`pad-${index}`}
                    className="aspect-square rounded border border-dashed border-white/5 bg-white/[0.02] opacity-40"
                  />
                )
              }

              const util = cell.utilPct
              const st = statusFromUtil(util, cell.status)
              const style = STATUS_STYLES[st]
              const isSelected = selectedId === cell.zoneId
              const isHovered = hoveredId === cell.zoneId
              const fillH = Math.max(util > 0 ? 12 : 4, util)

              return (
                <button
                  key={cell.zoneId}
                  type="button"
                  className={`zone-voxel-btn relative aspect-square overflow-hidden rounded border text-left ${style.tile} ${style.glow} ${isSelected ? 'is-selected ring-2 ring-white/50' : ''} ${isHovered && !isSelected ? 'ring-1 ring-cyan-300/60' : ''}`}
                  onClick={() =>
                    setSelectedId((id) => (id === cell.zoneId ? null : cell.zoneId))
                  }
                  onMouseEnter={() => setHoveredId(cell.zoneId)}
                  onMouseLeave={() => setHoveredId((id) => (id === cell.zoneId ? null : id))}
                  title={`${cell.zoneCode} · ${util}%`}
                >
                  <div
                    className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${style.pillar} transition-all duration-500`}
                    style={{ height: `${fillH}%` }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-1">
                    <span className="font-mono text-[9px] font-bold leading-none text-white drop-shadow-md">
                      {cell.zoneCode.replace(/^Z-?/i, '')}
                    </span>
                    <span className="text-[11px] font-bold leading-none text-white drop-shadow-md">
                      {util}%
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {focusZone && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 w-[min(100%,280px)] -translate-x-1/2 rounded-xl border border-cyan-500/30 bg-[#0b101a]/95 px-3 py-2 text-center shadow-xl backdrop-blur-md">
            <p className="font-mono text-sm font-bold text-cyan-300">{focusZone.zoneCode}</p>
            <p className="text-[10px] text-slate-400">
              {focusZone.zoneName || zoneTypeLabel(focusZone.zoneType) || focusZone.zoneType}
              {focusZone.areaM2 != null ? ` · ${fmtM2(focusZone.areaM2)} m²` : ''}
            </p>
            <p className="mt-1 text-xs text-white">
              Rack <strong>{focusZone.rackCount ?? 0}</strong>
              {focusZone.maxRacks ? ` / ${focusZone.maxRacks}` : ''} ·{' '}
              <strong className={capacityTone(focusZone.utilPct)}>{focusZone.utilPct}%</strong> đã dựng
            </p>
          </div>
        )}
      </div>

      <div className="relative z-10 mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5 border-t border-white/5 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {(Object.keys(STATUS_STYLES) as ZoneUtilStatus[]).map((key) => (
          <div key={key} className="flex items-center gap-1">
            <div
              className={`size-2 rounded-full ${
                key === 'empty'
                  ? 'bg-white/15'
                  : key === 'active'
                    ? 'bg-primary shadow-[0_0_5px_cyan]'
                    : key === 'stable'
                      ? 'bg-emerald-500 shadow-[0_0_5px_emerald]'
                      : 'bg-neon-orange shadow-[0_0_5px_orange]'
              }`}
            />
            {STATUS_STYLES[key].label}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b101a] via-transparent to-transparent" />
    </div>
  )
}
