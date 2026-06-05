import { useCallback, useMemo, useRef, useState, type PointerEvent } from 'react'
import { ZONE_TYPE_LABELS } from '../../data/zoneTypes'

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

// Bảng cấu hình CSS tối ưu hóa riêng cho giao diện Light Mode
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
    tile: 'border-slate-200 bg-slate-50 hover:bg-slate-100/70',
    fill: 'bg-slate-300',
    glow: 'shadow-none',
    label: 'Chưa dựng / trống',
    pillar: 'from-slate-200 to-slate-300',
  },
  active: {
    tile: 'border-sky-200 bg-sky-50 shadow-sm',
    fill: 'bg-gradient-to-t from-sky-500 to-sky-400',
    glow: 'shadow-[0_2px_8px_rgba(14,165,233,0.15)]',
    label: 'Đang dùng',
    pillar: 'from-sky-500 to-sky-400',
  },
  stable: {
    tile: 'border-emerald-200 bg-emerald-50 shadow-sm',
    fill: 'bg-gradient-to-t from-emerald-500 to-emerald-400',
    glow: 'shadow-[0_2px_8px_rgba(16,185,129,0.15)]',
    label: 'Ổn định',
    pillar: 'from-emerald-500 to-emerald-400',
  },
  alert: {
    tile: 'border-orange-200 bg-orange-50 shadow-sm',
    fill: 'bg-gradient-to-t from-amber-500 to-orange-500',
    glow: 'shadow-[0_2px_8px_rgba(245,158,11,0.15)]',
    label: 'Gần đầy',
    pillar: 'from-amber-500 to-orange-500',
  },
}

function capacityTone(pct: number) {
  if (pct >= 90) return 'text-orange-600'
  if (pct >= 70) return 'text-amber-600'
  return 'text-emerald-600'
}

function capacityRingColor(pct: number) {
  if (pct >= 90) return '#ea580c'
  if (pct >= 70) return '#d97706'
  return '#16a34a'
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
    <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl bg-white p-6 border border-slate-200">
      {/* Vùng trang trí background mờ dịu mắt cho Light mode */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-slate-100 blur-3xl" />

      <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="material-symbols-outlined text-emerald-600">grid_view</span>
            Mức dùng zone
          </h3>
          <p className="mt-0.5 text-[10px] text-slate-400 font-medium">
            Kéo sàn để xoay · click ô zone để xem chi tiết
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewRot((v) => ({ ...v, z: v.z - 8 }))}
            className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Xoay trái"
          >
            <span className="material-symbols-outlined text-lg">rotate_left</span>
          </button>
          <button
            type="button"
            onClick={() => setViewRot((v) => ({ ...v, z: v.z + 8 }))}
            className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Xoay phải"
          >
            <span className="material-symbols-outlined text-lg">rotate_right</span>
          </button>
          <button
            type="button"
            onClick={resetView}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Reset
          </button>
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            <svg className="-rotate-90" width="64" height="64" viewBox="0 0 64 64" aria-hidden>
              <circle cx="32" cy="32" r={ringR} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="5" />
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

      {usableAreaM2 != null || usedAreaM2 != null}
      <p className="relative z-10 mb-3 text-center text-[10px] text-slate-500 font-medium">
        Phân bổ{' '}
        <strong className="text-slate-800 font-bold">{fmtM2(usedAreaM2)}</strong> /{' '}
        <strong className="text-sky-700 font-bold">{fmtM2(usableAreaM2)}</strong> m² · còn{' '}
        <strong className="text-emerald-700 font-bold">{fmtM2(remainingAreaM2)}</strong> m²
      </p>

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
            className="grid gap-2 p-3 bg-slate-50/60 rounded-xl border border-slate-100"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {cells.map((cell, index) => {
              if (!cell) {
                return (
                  <div
                    key={`pad-${index}`}
                    className="aspect-square rounded border border-dashed border-slate-200 bg-slate-100/50 opacity-50"
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
                  className={`zone-voxel-btn relative aspect-square overflow-hidden rounded border text-left transition-all ${style.tile} ${style.glow} ${isSelected ? 'is-selected ring-2 ring-slate-800' : ''} ${isHovered && !isSelected ? 'ring-2 ring-sky-400' : ''}`}
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-1 z-10">
                    <span className="font-mono text-[10px] font-bold leading-none text-slate-900 drop-shadow-sm">
                      {cell.zoneCode.replace(/^Z-?/i, '')}
                    </span>
                    <span className="text-[11px] font-black leading-none text-slate-900 drop-shadow-sm">
                      {util}%
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Khung mô tả chi tiết khi click/hover - Đã được làm trắng tinh, chữ tối màu rõ nét */}
        {focusZone && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 w-[min(100%,280px)] -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 text-center shadow-xl backdrop-blur-md transition-all">
            <p className="font-mono text-sm font-bold text-sky-700">{focusZone.zoneCode}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {focusZone.zoneName || ZONE_TYPE_LABELS[focusZone.zoneType ?? ''] || focusZone.zoneType}
              {focusZone.areaM2 != null ? ` · ${fmtM2(focusZone.areaM2)} m²` : ''}
            </p>
            <p className="mt-1 text-xs text-slate-800 font-medium">
              Rack <strong className="text-slate-900 font-bold">{focusZone.rackCount ?? 0}</strong>
              {focusZone.maxRacks ? ` / ${focusZone.maxRacks}` : ''} ·{' '}
              <strong className={`${capacityTone(focusZone.utilPct)} font-bold`}>{focusZone.utilPct}%</strong> đã dựng
            </p>
          </div>
        )}
      </div>

      {/* Đồ giải thích nhãn màu sắc dưới chân component */}
      <div className="relative z-10 mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {(Object.keys(STATUS_STYLES) as ZoneUtilStatus[]).map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-slate-500">
            <div
              className={`size-2.5 rounded-full ${
                key === 'empty'
                  ? 'bg-slate-300 border border-slate-400/20'
                  : key === 'active'
                    ? 'bg-sky-500 shadow-[0_0_4px_rgba(14,165,233,0.4)]'
                    : key === 'stable'
                      ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]'
                      : 'bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.4)]'
              }`}
            />
            {STATUS_STYLES[key].label}
          </div>
        ))}
      </div>
    </div>
  )
}