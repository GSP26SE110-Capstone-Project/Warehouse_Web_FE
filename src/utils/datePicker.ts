const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE_RE.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value)
  if (!date) return ''
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
}

/** Gửi API — giữ đúng ngày lịch, tránh lệch timezone khi parse ISO. */
export function toRentalRequestDateIso(dateOnly: string): string {
  return `${dateOnly}T12:00:00.000Z`
}

/** Lấy YYYY-MM-DD từ ISO/datetime API (theo lịch local, không slice UTC). */
export function rentalRequestDateOnly(value?: string | null): string {
  if (!value) return ''
  const s = String(value).trim()
  if (ISO_DATE_RE.test(s)) return s
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return toIsoDate(d)
  const prefix = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return prefix?.[1] ?? ''
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isBeforeDay(a: Date, b: Date): boolean {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return aa < bb
}

export function isAfterDay(a: Date, b: Date): boolean {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return aa > bb
}

export function buildCalendarDays(viewMonth: Date): Date[] {
  const first = startOfMonth(viewMonth)
  const startOffset = first.getDay()
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - startOffset)

  const days: Date[] = []
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + i)
    days.push(day)
  }
  return days
}

export const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const
