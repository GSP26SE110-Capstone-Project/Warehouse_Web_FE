const MIN_RENTAL_DAYS = 30

/** Ngày hôm nay (local) dạng YYYY-MM-DD — dùng làm min cho ngày bắt đầu thuê. */
export function minRentalStartDate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** So sánh theo chuỗi ISO date (YYYY-MM-DD). */
export function isRentalStartOnOrAfterToday(startDate: string): boolean {
  if (!startDate) return false
  return startDate >= minRentalStartDate()
}

function parseDateOnly(value: string): Date | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

/** Số ngày thuê (làm tròn lên) từ khoảng ngày guest chọn. */
export function estimateRentalDays(startDate: string, endDate: string): number {
  const start = parseDateOnly(startDate)
  const end = parseDateOnly(endDate)
  if (!start || !end) return 0
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000)
  return diffDays > 0 ? diffDays : 0
}

/** Số tháng ước tính: 30 ngày = 1 tháng (theo số ngày thực tế, không làm tròn lên theo lịch). */
export function estimateMonthCount(startDate: string, endDate: string): number {
  const days = estimateRentalDays(startDate, endDate)
  if (days <= 0) return 0
  return Math.max(1, Math.floor(days / MIN_RENTAL_DAYS))
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
  return estimateRentalDays(startDate, endDate) >= MIN_RENTAL_DAYS
}
