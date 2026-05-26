/** Tính số thùng (≈ LPN) từ tổng cái và cái/thùng. */
export function computeEstimatedBoxCount(
  totalPieces: number,
  piecesPerBox: number
): number | null {
  if (!Number.isFinite(totalPieces) || totalPieces <= 0) return null
  if (!Number.isFinite(piecesPerBox) || piecesPerBox <= 0) return null
  return Math.ceil(totalPieces / piecesPerBox)
}

export function formatBoxEstimateSummary(
  totalPieces: number,
  piecesPerBox: number,
  boxCount: number
): string {
  return `${totalPieces.toLocaleString('vi-VN')} cái ÷ ${piecesPerBox.toLocaleString('vi-VN')} cái/thùng ≈ ${boxCount.toLocaleString('vi-VN')} thùng`
}

/** Gợi ý boxType khi kho tạo LPN (chỉ hiển thị cho guest). */
export function suggestBoxTypeLabel(piecesPerBox: number): string {
  if (!Number.isFinite(piecesPerBox) || piecesPerBox <= 0) {
    return 'MEDIUM — thùng carton tiêu chuẩn'
  }
  if (piecesPerBox <= 12) return 'SMALL — thùng nhỏ / ít cái'
  if (piecesPerBox <= 45) return 'MEDIUM — thùng carton quần áo thường gặp'
  if (piecesPerBox <= 90) return 'LARGE — thùng lớn'
  return 'EXTRA — kiện rất lớn / gần pallet'
}
