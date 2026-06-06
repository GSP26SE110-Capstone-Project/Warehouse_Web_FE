import { parseIsoDate, toIsoDate } from './datePicker'

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

/** Số tháng lịch trong kỳ HĐ (cùng công thức BE `contractBillingMonths`). */
export function contractBillingMonths(startDate: string, endDate: string): number {
  const start = parseIsoDate(startDate) ?? parseDateOnly(startDate)
  const end = parseIsoDate(endDate) ?? parseDateOnly(endDate)
  if (!start || !end) return 1
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  if (end.getDate() < start.getDate()) {
    months -= 1
  }
  return Math.max(1, months)
}

export type EffectiveContractDates = {
  startDate: string
  endDate: string
  shifted: boolean
  billingMonths: number
  requestedStartDate?: string
  requestedEndDate?: string
}

/**
 * HĐ bắt đầu từ ngày WH approve — giữ số tháng thuê khách đã chọn.
 */
export function resolveContractDatesFromApproval(
  expectedStart: string,
  expectedEnd: string,
  approveDate: string = minRentalStartDate()
): EffectiveContractDates {
  const start = expectedStart.trim()
  const end = expectedEnd.trim()
  const approve = approveDate.trim() || minRentalStartDate()

  if (!start || !end) {
    return {
      startDate: approve,
      endDate: end,
      shifted: Boolean(start && start !== approve),
      billingMonths: 0,
      requestedStartDate: start || undefined,
      requestedEndDate: end || undefined,
    }
  }

  const billingMonths = contractBillingMonths(start, end)
  const effectiveEnd = addCalendarMonthsToDateOnly(approve, billingMonths)

  return {
    startDate: approve,
    endDate: effectiveEnd || end,
    shifted: approve !== start,
    billingMonths,
    requestedStartDate: start,
    requestedEndDate: end,
  }
}

/** @deprecated Dùng resolveContractDatesFromApproval */
export function resolveEffectiveContractDates(
  expectedStart: string,
  expectedEnd: string,
  effectiveFrom: string = minRentalStartDate()
): EffectiveContractDates {
  return resolveContractDatesFromApproval(expectedStart, expectedEnd, effectiveFrom)
}

/** Cộng số tháng lịch vào ngày bắt đầu (giữ nguyên ngày trong tháng). VD: 2026-06-05 + 2 → 2026-08-05 */
export function addCalendarMonthsToDateOnly(startDate: string, monthCount: number): string {
  if (!startDate || monthCount <= 0) return ''
  const start = parseIsoDate(startDate)
  if (!start) return ''
  const end = new Date(start.getFullYear(), start.getMonth() + monthCount, start.getDate())
  return toIsoDate(end)
}
