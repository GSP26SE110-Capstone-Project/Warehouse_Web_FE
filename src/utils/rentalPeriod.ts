/** Số tháng ước tính từ khoảng ngày (làm tròn lên, tối thiểu 1 nếu end > start). */
export function estimateMonthCount(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const diffMs = end.getTime() - start.getTime()
  if (diffMs <= 0) return 0
  const days = Math.max(1, Math.ceil(diffMs / 86400000))
  return Math.max(1, Math.ceil(days / 30))
}

/** Ngày kết thúc tối thiểu = start + 30 ngày (hợp đồng ≥ 1 tháng). */
export function minRentalEndDate(startDate: string): string | undefined {
  if (!startDate) return undefined
  const start = new Date(startDate)
  if (Number.isNaN(start.getTime())) return undefined
  const end = new Date(start)
  end.setDate(end.getDate() + 30)
  return end.toISOString().slice(0, 10)
}

export function meetsMinimumRentalMonths(startDate: string, endDate: string): boolean {
  return estimateMonthCount(startDate, endDate) >= 1
}
