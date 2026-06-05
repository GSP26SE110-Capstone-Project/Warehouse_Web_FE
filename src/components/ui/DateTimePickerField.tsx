import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  addMonths,
  buildCalendarDays,
  formatMonthYear,
  isAfterDay,
  isBeforeDay,
  parseIsoDate,
  sameDay,
  toIsoDate,
  WEEKDAY_LABELS,
} from '../../utils/datePicker'

// Cập nhật khung bọc ô input sang style Light Mode
const inputWrapStyle = { border: '1px solid #cbd5e1', background: '#ffffff' } as const

const TIME_PRESETS = ['08:00', '09:00', '13:00', '14:00', '16:00']

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function parseDatetimeLocal(value: string): { date: string; hour: number; minute: number } | null {
  if (!value?.trim()) return null
  const m = value.trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  const hour = Number(m[2])
  const minute = Number(m[3])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { date: m[1], hour, minute: minute }
}

function toDatetimeLocal(date: string, hour: number, minute: number): string {
  return `${date}T${pad2(hour)}:${pad2(minute)}`
}

function formatDisplayDateTime(value: string): string {
  const p = parseDatetimeLocal(value)
  if (!p) return ''
  const d = parseIsoDate(p.date)
  if (!d) return value
  const datePart = d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${datePart} · ${pad2(p.hour)}:${pad2(p.minute)}`
}

function splitMinMax(min?: string, max?: string) {
  const minP = min ? parseDatetimeLocal(min) : null
  const maxP = max ? parseDatetimeLocal(max) : null
  return { minP, maxP }
}

function isDisabledDay(day: Date, minDate?: string, maxDate?: string): boolean {
  const minD = minDate ? parseIsoDate(minDate) : null
  const maxD = maxDate ? parseIsoDate(maxDate) : null
  if (minD && isBeforeDay(day, minD)) return true
  if (maxD && isAfterDay(day, maxD)) return true
  return false
}

function isTimeBeforeMin(date: string, hour: number, minute: number, minP: ReturnType<typeof parseDatetimeLocal>) {
  if (!minP || minP.date !== date) return false
  if (hour < minP.hour) return true
  if (hour === minP.hour && minute < minP.minute) return true
  return false
}

function isTimeAfterMax(date: string, hour: number, minute: number, maxP: ReturnType<typeof parseDatetimeLocal>) {
  if (!maxP || maxP.date !== date) return false
  if (hour > maxP.hour) return true
  if (hour === maxP.hour && minute > maxP.minute) return true
  return false
}

function clampTime(date: string, hour: number, minute: number, minP: ReturnType<typeof parseDatetimeLocal>, maxP: ReturnType<typeof parseDatetimeLocal>) {
  let h = hour
  let m = minute
  if (minP && minP.date === date) {
    if (h < minP.hour || (h === minP.hour && m < minP.minute)) {
      h = minP.hour
      m = minP.minute
    }
  }
  if (maxP && maxP.date === date) {
    if (h > maxP.hour || (h === maxP.hour && m > maxP.minute)) {
      h = maxP.hour
      m = maxP.minute
    }
  }
  return { hour: h, minute: m }
}

export function DateTimePickerField({
  id,
  value,
  onChange,
  required,
  min,
  max,
  placeholder = 'Chọn ngày và giờ',
  disabled = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  min?: string
  max?: string
  placeholder?: string
  disabled?: boolean
}) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const { minP, maxP } = useMemo(() => splitMinMax(min, max), [min, max])
  const minDate = minP?.date ?? (min?.slice(0, 10) || undefined)
  const maxDate = maxP?.date ?? (max?.slice(0, 10) || undefined)

  const parsed = useMemo(() => parseDatetimeLocal(value), [value])
  const selectedDate = useMemo(
    () => (parsed?.date ? parseIsoDate(parsed.date) : null),
    [parsed?.date]
  )
  const today = useMemo(() => new Date(), [])

  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => selectedDate ?? today)
  const [draftDate, setDraftDate] = useState(parsed?.date ?? '')
  const [draftHour, setDraftHour] = useState(parsed?.hour ?? 9)
  const [draftMinute, setDraftMinute] = useState(parsed?.minute ?? 0)

  useEffect(() => {
    const p = parseDatetimeLocal(value)
    if (p) {
      setDraftDate(p.date)
      setDraftHour(p.hour)
      setDraftMinute(p.minute)
      const d = parseIsoDate(p.date)
      if (d) setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1))
    }
  }, [value])

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth])
  const displayValue = value ? formatDisplayDateTime(value) : ''

  const openPicker = () => {
    if (disabled) return
    const p = parseDatetimeLocal(value)
    if (p) {
      setDraftDate(p.date)
      setDraftHour(p.hour)
      setDraftMinute(p.minute)
      const d = parseIsoDate(p.date)
      if (d) setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1))
    } else {
      const fallback = minDate ?? toIsoDate(today)
      setDraftDate(fallback)
      setDraftHour(minP?.date === fallback ? (minP?.hour ?? 9) : 9)
      setDraftMinute(minP?.date === fallback ? (minP?.minute ?? 0) : 0)
      const d = parseIsoDate(fallback)
      if (d) setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1))
    }
    setOpen(true)
  }

  const applySelection = (date: string, hour: number, minute: number) => {
    const clamped = clampTime(date, hour, minute, minP, maxP)
    onChange(toDatetimeLocal(date, clamped.hour, clamped.minute))
    setOpen(false)
  }

  const selectDay = (day: Date) => {
    if (isDisabledDay(day, minDate, maxDate)) return
    const iso = toIsoDate(day)
    setDraftDate(iso)
    let h = draftHour
    let m = draftMinute
    const clamped = clampTime(iso, h, m, minP, maxP)
    setDraftHour(clamped.hour)
    setDraftMinute(clamped.minute)
  }

  const confirmSelection = () => {
    if (!draftDate) return
    applySelection(draftDate, draftHour, draftMinute)
  }

  const selectToday = () => {
    const iso = toIsoDate(today)
    if (isDisabledDay(today, minDate, maxDate)) return
    setDraftDate(iso)
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    const h = minP?.date === iso ? (minP.hour ?? 9) : 9
    const m = minP?.date === iso ? (minP.minute ?? 0) : 0
    setDraftHour(h)
    setDraftMinute(m)
  }

  const clearValue = () => {
    onChange('')
    setOpen(false)
  }

  const setPresetTime = (preset: string) => {
    const [h, m] = preset.split(':').map(Number)
    if (!draftDate) return
    const clamped = clampTime(draftDate, h, m, minP, maxP)
    setDraftHour(clamped.hour)
    setDraftMinute(clamped.minute)
  }

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), [])
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), [])

  const timeInvalid =
    draftDate &&
    (isTimeBeforeMin(draftDate, draftHour, draftMinute, minP) ||
      isTimeAfterMax(draftDate, draftHour, draftMinute, maxP))

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" id={id} name={id} value={value} required={required} readOnly />

      <div
        className={`relative rounded-lg transition-all ${
          open ? 'ring-1 ring-cyan-500 border-cyan-500 shadow-sm' : 'hover:border-slate-400'
        }`}
        style={inputWrapStyle}
      >
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open ? 'true' : 'false'}
          aria-controls={listId}
          disabled={disabled}
          onClick={openPicker}
          className="flex w-full items-center gap-3 px-4 py-3 bg-transparent border-0 text-left cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 rounded-lg"
        >
          <span className="material-symbols-outlined text-cyan-600 text-xl shrink-0">
            event
          </span>
          <span className={`flex-1 text-base ${displayValue ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
            {displayValue || placeholder}
          </span>
          <span className="material-symbols-outlined text-slate-400 text-lg shrink-0">
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {open && (
        <div
          id={listId}
          role="dialog"
          aria-label="Chọn ngày và giờ"
          className="absolute z-50 mt-2 w-full min-w-[min(100%,340px)] max-w-[400px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-label="Tháng trước"
                  onClick={() => setViewMonth((m) => addMonths(m, -1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer bg-transparent"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <p className="text-sm font-semibold text-slate-800 capitalize">
                  {formatMonthYear(viewMonth)}
                </p>
                <button
                  type="button"
                  aria-label="Tháng sau"
                  onClick={() => setViewMonth((m) => addMonths(m, 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer bg-transparent"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const inMonth = day.getMonth() === viewMonth.getMonth()
                  const iso = toIsoDate(day)
                  const selected = draftDate ? sameDay(day, parseIsoDate(draftDate)!) : false
                  const isToday = sameDay(day, today)
                  const disabledDay = isDisabledDay(day, minDate, maxDate)

                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={disabledDay}
                      onClick={() => selectDay(day)}
                      className={[
                        'relative flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer border bg-transparent',
                        disabledDay
                          ? 'text-slate-300 opacity-50 cursor-not-allowed border-transparent'
                          : 'hover:bg-slate-100 border-transparent text-slate-700',
                        selected
                          ? '!bg-cyan-600 !text-white font-bold border-cyan-600 shadow-md shadow-cyan-600/20'
                          : !inMonth && !disabledDay
                            ? 'text-slate-400'
                            : '',
                        isToday && !selected ? 'ring-1 ring-cyan-500/70' : '',
                      ].join(' ')}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="sm:w-36 sm:border-l sm:border-slate-200 sm:pl-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-700">
                <span className="material-symbols-outlined text-base">schedule</span>
                Giờ đến
              </p>

              <div className="flex gap-2">
                <label className="flex-1">
                  <span className="mb-1 block text-[10px] text-slate-400 font-medium">Giờ</span>
                  <select
                    value={draftHour}
                    disabled={!draftDate}
                    onChange={(e) => {
                      const h = Number(e.target.value)
                      const c = draftDate
                        ? clampTime(draftDate, h, draftMinute, minP, maxP)
                        : { hour: h, minute: draftMinute }
                      setDraftHour(c.hour)
                      setDraftMinute(c.minute)
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 font-medium focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:bg-slate-50"
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>
                        {pad2(h)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex-1">
                  <span className="mb-1 block text-[10px] text-slate-400 font-medium">Phút</span>
                  <select
                    value={draftMinute}
                    disabled={!draftDate}
                    onChange={(e) => {
                      const m = Number(e.target.value)
                      const c = draftDate
                        ? clampTime(draftDate, draftHour, m, minP, maxP)
                        : { hour: draftHour, minute: m }
                      setDraftHour(c.hour)
                      setDraftMinute(c.minute)
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 font-medium focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:bg-slate-50"
                  >
                    {minutes.map((m) => (
                      <option key={m} value={m}>
                        {pad2(m)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {TIME_PRESETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={!draftDate}
                    onClick={() => setPresetTime(t)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:border-cyan-500 hover:text-cyan-600 disabled:opacity-40 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>

              {timeInvalid && (
                <p className="mt-2 text-[10px] font-medium text-amber-600">Giờ không hợp lệ với ngày đã chọn</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearValue}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer bg-transparent border-0"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={selectToday}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-cyan-600 hover:bg-cyan-50 transition-colors cursor-pointer bg-transparent border-0"
              >
                Hôm nay
              </button>
            </div>
            <button
              type="button"
              disabled={!draftDate || Boolean(timeInvalid)}
              onClick={confirmSelection}
              className="rounded-lg bg-cyan-600 hover:bg-cyan-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-cyan-600/10 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  )
}