/** Tham chiếu nội bộ khi guest chỉ nhập cái/tháng (kho quyết định cái/thùng thực tế). */
export const PLANNING_PIECES_PER_MEDIUM_BOX = 25

/** EXTRA = 4× volume MEDIUM → ~100 cái/thùng (tham khảo). */
export const PLANNING_PIECES_PER_EXTRA_BOX =
  PLANNING_PIECES_PER_MEDIUM_BOX * (8 / 2)

export const GUEST_BOX_TYPE_HINTS = [
  {
    type: 'MEDIUM' as const,
    title: 'MEDIUM',
    description: 'Thùng carton tiêu chuẩn — quần áo, phụ kiện, hàng nhỏ vừa.',
    icon: 'inventory_2',
    piecesPerBox: PLANNING_PIECES_PER_MEDIUM_BOX,
  },
  {
    type: 'EXTRA' as const,
    title: 'EXTRA',
    description: 'Kiện lớn / gần pallet — hàng cồng kềnh hoặc rất nhiều cái trong một đơn vị.',
    icon: 'pallet',
    piecesPerBox: PLANNING_PIECES_PER_EXTRA_BOX,
  },
] as const

export function estimateBoxesPerMonthFromPieces(totalPiecesPerMonth: number): number | null {
  if (!Number.isFinite(totalPiecesPerMonth) || totalPiecesPerMonth <= 0) return null
  return Math.ceil(totalPiecesPerMonth / PLANNING_PIECES_PER_MEDIUM_BOX)
}

export interface GuestBoxTypeSuggestion {
  piecesPerMonth: number
  mediumPerMonth: number
  extraPerMonth: number
}

/** Gợi ý số thùng MEDIUM / EXTRA từ tổng cái/tháng (hai kịch bản xếp hàng). */
export function suggestGuestBoxTypesFromPieces(
  totalPiecesPerMonth: number
): GuestBoxTypeSuggestion | null {
  if (!Number.isFinite(totalPiecesPerMonth) || totalPiecesPerMonth <= 0) return null
  return {
    piecesPerMonth: totalPiecesPerMonth,
    mediumPerMonth: Math.ceil(totalPiecesPerMonth / PLANNING_PIECES_PER_MEDIUM_BOX),
    extraPerMonth: Math.ceil(totalPiecesPerMonth / PLANNING_PIECES_PER_EXTRA_BOX),
  }
}
