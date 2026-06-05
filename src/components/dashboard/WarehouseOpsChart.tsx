import { useMemo, useState } from 'react'
import {
  buildActivitySeries,
  seriesTotals,
} from '../../utils/dashboardActivitySeries'

type ItemWithDate = { createdAt?: string | null }

type Props = {
  rentalRequests: ItemWithDate[]
  inboundRequests: ItemWithDate[]
  contracts: ItemWithDate[]
}

const SERIES = [
  { key: 'rentals' as const, label: 'Yêu cầu thuê', color: '#06edf9', dim: 'rgba(6,237,249,0.25)' },
  { key: 'inbounds' as const, label: 'Phiếu nhập', color: '#34d399', dim: 'rgba(52,211,153,0.25)' },
  { key: 'contracts' as const, label: 'Hợp đồng', color: '#fb923c', dim: 'rgba(251,146,60,0.25)' },
]

const CHART_H = 200
const PAD = { top: 12, right: 8, bottom: 28, left: 36 }

export function WarehouseOpsChart({ rentalRequests, inboundRequests, contracts }: Props) {
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const [days, setDays] = useState<7 | 14>(7)

  const buckets = useMemo(
    () => buildActivitySeries(rentalRequests, inboundRequests, contracts, days),
    [rentalRequests, inboundRequests, contracts, days]
  )

  const totals = useMemo(() => seriesTotals(buckets), [buckets])
  const maxY = useMemo(
    () => Math.max(1, ...buckets.map((b) => Math.max(b.rentals, b.inbounds, b.contracts))),
    [buckets]
  )

  const hoverBucket = buckets.find((b) => b.key === hoverKey) ?? null
  const plotW = 100
  const plotH = CHART_H - PAD.top - PAD.bottom
  const groupW = plotW / buckets.length
  const barW = Math.min(groupW * 0.22, 4.5)

  const yScale = (v: number) => PAD.top + plotH - (v / maxY) * plotH

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-xs">
          {SERIES.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}
              <span className="font-mono text-slate-500">
                ({totals[s.key]} / {days} ngày)
              </span>
            </div>
          ))}
        </div>
        <div className="flex rounded-lg border border-white/10 bg-black/20 p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setDays(7)}
            className={`rounded-md px-2.5 py-1 font-semibold ${
              days === 7 ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-white'
            }`}
          >
            7 ngày
          </button>
          <button
            type="button"
            onClick={() => setDays(14)}
            className={`rounded-md px-2.5 py-1 font-semibold ${
              days === 14 ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-white'
            }`}
          >
            14 ngày
          </button>
        </div>
      </div>

      {hoverBucket && (
        <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-2 text-xs text-slate-300">
          <span className="font-semibold text-white">{hoverBucket.label}</span>
          {' · '}
          Thuê <strong className="text-cyan-300">{hoverBucket.rentals}</strong>
          {' · '}
          Nhập <strong className="text-emerald-300">{hoverBucket.inbounds}</strong>
          {' · '}
          HĐ <strong className="text-orange-300">{hoverBucket.contracts}</strong>
        </div>
      )}

      <div className="relative rounded-xl border border-white/5 bg-black/25 px-2 py-3">
        <svg
          viewBox={`0 0 100 ${CHART_H}`}
          className="h-[220px] w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Biểu đồ hoạt động kho theo ngày"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = PAD.top + plotH * (1 - t)
            const val = Math.round(maxY * t)
            return (
              <g key={t}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={100 - PAD.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="0.15"
                />
                <text
                  x={PAD.left - 2}
                  y={y + 0.8}
                  textAnchor="end"
                  fill="rgba(148,163,184,0.7)"
                  fontSize="2.2"
                >
                  {val}
                </text>
              </g>
            )
          })}

          {buckets.map((b, i) => {
            const gx = PAD.left + i * groupW + groupW / 2
            const values = [
              { v: b.rentals, color: SERIES[0].color, offset: -barW },
              { v: b.inbounds, color: SERIES[1].color, offset: 0 },
              { v: b.contracts, color: SERIES[2].color, offset: barW },
            ]
            return (
              <g
                key={b.key}
                onMouseEnter={() => setHoverKey(b.key)}
                onMouseLeave={() => setHoverKey(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={PAD.left + i * groupW}
                  y={PAD.top}
                  width={groupW}
                  height={plotH}
                  fill={hoverKey === b.key ? 'rgba(6,237,249,0.06)' : 'transparent'}
                />
                {values.map(({ v, color, offset }) => {
                  if (v <= 0) return null
                  const yTop = yScale(v)
                  const h = PAD.top + plotH - yTop
                  return (
                    <rect
                      key={`${b.key}-${offset}`}
                      x={gx + offset - barW / 2}
                      y={yTop}
                      width={barW}
                      height={h}
                      rx={0.4}
                      fill={color}
                      opacity={hoverKey === b.key || !hoverKey ? 0.95 : 0.45}
                    />
                  )
                })}
                <text
                  x={gx}
                  y={CHART_H - 6}
                  textAnchor="middle"
                  fill={hoverKey === b.key ? '#e2e8f0' : 'rgba(148,163,184,0.65)'}
                  fontSize="2.4"
                >
                  {b.label.split(',')[0]}
                </text>
              </g>
            )
          })}
        </svg>

        {totals.rentals + totals.inbounds + totals.contracts === 0 && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-500">
            Chưa có hoạt động trong {days} ngày gần đây.
          </p>
        )}
      </div>

      <p className="text-[10px] text-slate-500">
        Đếm theo ngày tạo bản ghi — di chuột lên cột để xem chi tiết từng ngày.
      </p>
    </div>
  )
}
