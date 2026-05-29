import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  addMonths,
  buildCalendarDays,
  formatDisplayDate,
  formatMonthYear,
  isAfterDay,
  isBeforeDay,
  parseIsoDate,
  sameDay,
  toIsoDate,
  WEEKDAY_LABELS,
} from '../../utils/datePicker'

const inputWrapStyle = { border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' } as const

function isDisabledDay(day: Date, min?: string, max?: string): boolean {
  const minDate = min ? parseIsoDate(min) : null
  const maxDate = max ? parseIsoDate(max) : null
  if (minDate && isBeforeDay(day, minDate)) return true
  if (maxDate && isAfterDay(day, maxDate)) return true
  return false
}

export function DatePickerField({
  id,
  value,
  onChange,
  required,
  min,
  max,
  placeholder = 'Chọn ngày',
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
  const selectedDate = useMemo(() => parseIsoDate(value), [value])
  const today = useMemo(() => new Date(), [])

  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => selectedDate ?? today)

  useEffect(() => {
    if (selectedDate) {
      setViewMonth(startOfMonthSafe(selectedDate))
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
  const displayValue = value ? formatDisplayDate(value) : ''

  const openPicker = () => {
    if (disabled) return
    setViewMonth(selectedDate ?? today)
    setOpen(true)
  }

  const selectDay = (day: Date) => {
    if (isDisabledDay(day, min, max)) return
    onChange(toIsoDate(day))
    setOpen(false)
  }

  const selectToday = () => {
    const iso = toIsoDate(today)
    if (isDisabledDay(today, min, max)) return
    onChange(iso)
    setViewMonth(startOfMonthSafe(today))
    setOpen(false)
  }

  const clearValue = () => {
    onChange('')
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" id={id} name={id} value={value} required={required} readOnly />

      <div
        className={`input-glow relative rounded-lg transition-colors ${
          open ? 'ring-1 ring-[#06edf9]/40 border-[#06edf9]/50' : ''
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
          className="flex w-full items-center gap-3 px-4 py-3 bg-transparent border-0 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[#06edf9] text-xl shrink-0">calendar_month</span>
          <span className={`flex-1 text-base ${displayValue ? 'text-white' : 'text-[#7a9496]'}`}>
            {displayValue || placeholder}
          </span>
          <span className="material-symbols-outlined text-[#9bb9bb] text-lg shrink-0">
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {open && (
        <div
          id={listId}
          role="dialog"
          aria-label="Chọn ngày"
          className="absolute z-50 mt-2 w-full min-w-[280px] max-w-[320px] rounded-xl border border-[#06edf9]/25 bg-[#0b1617]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Tháng trước"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#9bb9bb] hover:border-[#06edf9]/40 hover:text-[#06edf9] transition-colors cursor-pointer bg-transparent"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <p className="text-sm font-semibold text-white capitalize">{formatMonthYear(viewMonth)}</p>
            <button
              type="button"
              aria-label="Tháng sau"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#9bb9bb] hover:border-[#06edf9]/40 hover:text-[#06edf9] transition-colors cursor-pointer bg-transparent"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[#7a9496]"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const inMonth = day.getMonth() === viewMonth.getMonth()
              const selected = selectedDate ? sameDay(day, selectedDate) : false
              const isToday = sameDay(day, today)
              const disabledDay = isDisabledDay(day, min, max)

              return (
                <button
                  key={toIsoDate(day)}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => selectDay(day)}
                  className={[
                    'relative flex h-9 w-full items-center justify-center rounded-lg text-sm transition-all cursor-pointer border bg-transparent',
                    disabledDay
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-[#06edf9]/10 hover:border-[#06edf9]/30',
                    selected
                      ? 'bg-[#06edf9] text-[#0f2223] font-bold border-[#06edf9] shadow-[0_0_12px_rgba(6,237,249,0.35)]'
                      : inMonth
                        ? 'text-white border-transparent'
                        : 'text-[#5f7577] border-transparent',
                    isToday && !selected ? 'ring-1 ring-[#06edf9]/50' : '',
                  ].join(' ')}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={clearValue}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#9bb9bb] hover:text-white hover:bg-white/5 transition-colors cursor-pointer bg-transparent border-0"
            >
              Xóa
            </button>
            <button
              type="button"
              onClick={selectToday}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#06edf9] hover:bg-[#06edf9]/10 transition-colors cursor-pointer bg-transparent border-0"
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function startOfMonthSafe(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
