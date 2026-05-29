const MIN_RENTAL_DAYS = 30

function parseDateOnly(value: string): Date | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

/** Số tháng lịch ước tính từ khoảng ngày (ví dụ 28/05 -> 28/10 = 5 tháng). */
export function estimateMonthCount(startDate: string, endDate: string): number {
  const start = parseDateOnly(startDate)
  const end = parseDateOnly(endDate)
  if (!start || !end) return 0
  const diffMs = end.getTime() - start.getTime()
  if (diffMs <= 0) return 0

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  const anchor = new Date(start)
  anchor.setMonth(anchor.getMonth() + months)
  if (end.getTime() > anchor.getTime()) {
    months += 1
  }
  return Math.max(1, months)
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
  const start = parseDateOnly(startDate)
  const end = parseDateOnly(endDate)
  if (!start || !end) return false
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000)
  return diffDays >= MIN_RENTAL_DAYS
}

/** Số ngày thuê (làm tròn lên) từ khoảng ngày guest chọn. */
export function estimateRentalDays(startDate: string, endDate: string): number {
  const start = parseDateOnly(startDate)
  const end = parseDateOnly(endDate)
  if (!start || !end) return 0
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000)
  return diffDays > 0 ? diffDays : 0
}
