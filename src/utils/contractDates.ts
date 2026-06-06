/** `datetime-local` min/max from ISO date or datetime string. */
export function toDatetimeLocalMin(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function contractStartDatetimeLocal(startDate?: string | null): string {
  if (!startDate) return ''
  const trimmed = startDate.trim()
  if (trimmed.includes('T')) return toDatetimeLocalMin(trimmed)
  return `${trimmed.slice(0, 10)}T00:00`
}

export function isArrivalBeforeContractStart(
  expectedArrivalLocal: string,
  contractStartDate?: string | null
): boolean {
  if (!expectedArrivalLocal || !contractStartDate) return false
  const arrival = new Date(expectedArrivalLocal)
  const start = new Date(contractStartDate)
  if (Number.isNaN(arrival.getTime()) || Number.isNaN(start.getTime())) return false
  const arrivalDay = Date.UTC(
    arrival.getFullYear(),
    arrival.getMonth(),
    arrival.getDate()
  )
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  return arrivalDay < startDay
}

import { formatDisplayDate, rentalRequestDateOnly } from './datePicker'

export function formatContractDateLabel(iso?: string | null): string {
  if (!iso) return '—'
  const dateOnly = rentalRequestDateOnly(iso)
  return dateOnly ? formatDisplayDate(dateOnly) : '—'
}
