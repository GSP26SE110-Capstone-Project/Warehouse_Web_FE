import { useMemo, useState } from 'react'
import {
  buildActivitySeries,
  seriesTotals,
  type ActivityDayBucket,
} from '../../utils/dashboardActivitySeries'

type ItemWithDate = { createdAt?: string | null }

type Props = {
  rentalRequests: ItemWithDate[]
  inboundRequests: ItemWithDate[]
  contracts: ItemWithDate[]
}

// Cấu hình màu sắc tối ưu riêng cho Light Mode (tăng cường độ tương phản trên nền trắng/xám nhạt)
const SERIES = [
  { key: 'rentals' as const, label: 'Yêu cầu thuê', color: '#0284c7', dim: 'rgba(2,132,199,0.2)' },
  { key: 'inbounds' as const, label: 'Phiếu nhập', color: '#10b981', dim: 'rgba(16,185,129,0.2)' },
  { key: 'contracts' as const, label: 'Hợp đồng', color: '#f97316', dim: 'rgba(249,115,22,0.2)' },
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
        <div className="flex flex-wrap gap-4 text-xs font-medium">
          {SERIES.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              <span>{s.label}</span>
              <span className="font-mono text-slate-400 text-[11px]">
                ({totals[s.key]} / {days} ngày)
              </span>
            </div>
          ))}
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setDays(7)}
            className={`rounded-md px-2.5 py-1 font-bold transition-all ${
              days === 7 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            7 ngày
          </button>
          <button
            type="button"
            onClick={() => setDays(14)}
            className={`rounded-md px-2.5 py-1 font-bold transition-all ${
              days === 14 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            14 ngày
          </button>
        </div>
      </div>

      {hoverBucket && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-sm border-l-4 border-l-slate-400 transition-all">
          <span className="font-bold text-slate-900">{hoverBucket.label}</span>
          {' · '}
          Thuê <strong className="text-sky-700 font-bold">{hoverBucket.rentals}</strong>
          {' · '}
          Nhập <strong className="text-emerald-700 font-bold">{hoverBucket.inbounds}</strong>
          {' · '}
          HĐ <strong className="text-orange-700 font-bold">{hoverBucket.contracts}</strong>
        </div>
      )}

      <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-2">
        <svg
          viewBox={`0 0 100 ${CHART_H}`}
          className="h-[220px] w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Biểu đồ hoạt động kho theo ngày"
        >
          {/* Đường lưới ngang được chuyển sang màu xám mỏng mịn thay vì trắng mờ */}
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
                  stroke="rgba(0, 0, 0, 0.06)"
                  strokeWidth="0.15"
                />
                <text
                  x={PAD.left - 2}
                  y={y + 0.8}
                  textAnchor="end"
                  fill="rgba(71, 85, 105, 0.8)"
                  fontSize="2.2"
                  className="font-medium font-mono"
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
                {/* Vùng highlight khi hover được đổi từ cyan sang xám nhạt dịu mắt */}
                <rect
                  x={PAD.left + i * groupW}
                  y={PAD.top}
                  width={groupW}
                  height={plotH}
                  fill={hoverKey === b.key ? 'rgba(0, 0, 0, 0.03)' : 'transparent'}
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
                      opacity={hoverKey === b.key || !hoverKey ? 1 : 0.4}
                    />
                  )
                })}
                <text
                  x={gx}
                  y={CHART_H - 6}
                  textAnchor="middle"
                  fill={hoverKey === b.key ? '#0f172a' : 'rgba(71, 85, 105, 0.7)'}
                  fontSize="2.4"
                  className="font-medium"
                >
                  {b.label.split(',')[0]}
                </text>
              </g>
            )
          })}
        </svg>

        {totals.rentals + totals.inbounds + totals.contracts === 0 && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-400">
            Chưa có hoạt động trong {days} ngày gần đây.
          </p>
        )}
      </div>

      <p className="text-[10px] text-slate-400 font-medium tracking-wide">
        Đếm theo ngày tạo bản ghi — di chuột lên cột để xem chi tiết từng ngày.
      </p>
    </div>
  )
}