import { ZONE_AISLE_RATIO } from '../../utils/warehouseCapacity'
import type { CinemaSeat } from './CinemaSeatGrid'

export type FloorPlanAisleVariant = 'margin' | 'cross' | 'entry'

export type FloorPlanSlot =
  | { type: 'aisle'; variant: FloorPlanAisleVariant; label?: string; colSpan?: number }
  | { type: 'rack'; seat: CinemaSeat; rackRow: number; rackCol: number }

/** Cạnh lối đi viền để diện tích lối đi ≈ 30% (margin tuyến tính = (1-√0.7)/2). */
export function zoneMarginPercent(aisleRatio = ZONE_AISLE_RATIO): number {
  return ((1 - Math.sqrt(1 - aisleRatio)) / 2) * 100
}

function centralAisleIndex(span: number): number | null {
  if (span < 4) return null
  return Math.floor((span - 1) / 2)
}

function buildAisleRow(
  colCount: number,
  variant: FloorPlanAisleVariant,
  label?: string
): FloorPlanSlot[] {
  return [{ type: 'aisle', variant, label, colSpan: colCount }]
}

/** Mở rộng lưới rack compact thành sơ đồ zone có lối đi viền + lối đi giữa block rack. */
export function expandRackGridWithAisles(
  rackGrid: CinemaSeat[][],
  options: {
    maxRacks: number
    areaM2?: number | null
    aisleRatio?: number
  }
): FloorPlanSlot[][] {
  const aisleRatio = options.aisleRatio ?? ZONE_AISLE_RATIO
  const rackRows = rackGrid.length
  const rackCols = rackGrid[0]?.length ?? 0
  if (!rackRows || !rackCols) return []

  const vAisleAfter = centralAisleIndex(rackCols)
  const hAisleAfter = centralAisleIndex(rackRows)

  /** Chỉ rack + lối đi picking dọc; viền trái/phải do khung ngoài ZoneFloorPlanGrid vẽ. */
  const innerCols = rackCols + (vAisleAfter != null ? 1 : 0)

  const visual: FloorPlanSlot[][] = []

  const aisleAreaM2 =
    options.areaM2 != null && options.areaM2 > 0
      ? (options.areaM2 * aisleRatio).toFixed(1)
      : null

  visual.push(
    buildAisleRow(innerCols, 'entry', 'Lối đi / cửa kho — hướng vào zone')
  )

  for (let r = 0; r < rackRows; r += 1) {
    const row: FloorPlanSlot[] = []
    for (let c = 0; c < rackCols; c += 1) {
      row.push({
        type: 'rack',
        seat: rackGrid[r][c],
        rackRow: r,
        rackCol: c,
      })
      if (vAisleAfter === c) {
        row.push({ type: 'aisle', variant: 'cross', label: 'Lối đi picking' })
      }
    }
    visual.push(row)

    if (hAisleAfter === r) {
      visual.push(
        buildAisleRow(
          innerCols,
          'cross',
          aisleAreaM2
            ? `Lối đi xe · ~${aisleAreaM2} m² (${Math.round(aisleRatio * 100)}% zone)`
            : 'Lối đi xe giữa block rack'
        )
      )
    }
  }

  visual.push(
    buildAisleRow(
      innerCols,
      'margin',
      aisleAreaM2 ? `Viền lối đi · ${Math.round(aisleRatio * 100)}% diện tích zone` : undefined
    )
  )

  return visual
}

/** Tỷ lệ fr: rack vs lối đi trong vùng 70% (aisleTrack/rackTrack ≈ 0.7 → ~30% diện tích lối đi nội bộ). */
export const FLOOR_PLAN_RACK_FR = 10
export const FLOOR_PLAN_AISLE_FR = 7
