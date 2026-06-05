import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

// Thay đổi style viền và nền của ô input sang tông màu sáng (Light Mode)
const inputWrapStyle = { border: '1px solid #cbd5e1', background: '#f8fafc' } as const

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
  compact = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  min?: string
  max?: string
  placeholder?: string
  disabled?: boolean
  compact?: boolean
}) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number; width: number } | null>(
    null
  )
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
    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      setPopoverStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 280),
      })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth])
  const displayValue = value ? formatDisplayDate(value) : ''

  const openPicker = () => {
    if (disabled) return
    setViewMonth(selectedDate ?? today)
    const trigger = triggerRef.current
    if (trigger) {
      const rect = trigger.getBoundingClientRect()
      setPopoverStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 280),
      })
    }
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
    <div ref={rootRef} className={`relative ${open ? 'z-[120]' : ''}`}>
      <input type="hidden" id={id} name={id} value={value} required={required} readOnly />

      <div
        className={`relative rounded-lg transition-all ${
          open ? 'ring-2 ring-sky-500/20 border-sky-500 bg-white' : 'hover:border-slate-400'
        }`}
        style={inputWrapStyle}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open ? 'true' : 'false'}
          aria-controls={listId}
          disabled={disabled}
          onClick={openPicker}
          className={`flex w-full items-center gap-2 bg-transparent border-0 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
            compact ? 'px-3 py-2' : 'gap-3 px-4 py-3'
          }`}
        >
          <span
            className={`material-symbols-outlined text-sky-600 shrink-0 ${
              compact ? 'text-lg' : 'text-xl'
            }`}
          >
            calendar_month
          </span>
          <span
            className={`flex-1 truncate font-medium ${compact ? 'text-sm' : 'text-base'} ${
              displayValue ? 'text-slate-800' : 'text-slate-400'
            }`}
          >
            {displayValue || placeholder}
          </span>
          <span className="material-symbols-outlined text-slate-400 text-lg shrink-0">
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {open &&
        popoverStyle &&
        createPortal(
        <div
          ref={popoverRef}
          id={listId}
          role="dialog"
          aria-label="Chọn ngày"
          className="fixed z-[200] rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80"
          style={{
            top: popoverStyle.top,
            left: popoverStyle.left,
            width: popoverStyle.width,
            maxWidth: 320,
          }}
        >
          {/* Header bộ chọn tháng */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Tháng trước"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer bg-transparent"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <p className="text-sm font-bold text-slate-800 capitalize">{formatMonthYear(viewMonth)}</p>
            <button
              type="button"
              aria-label="Tháng sau"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer bg-transparent"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          {/* Nhãn thứ trong tuần */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Ô lưới các ngày */}
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
                    'relative flex h-9 w-full items-center justify-center rounded-lg text-sm font-semibold transition-all cursor-pointer border bg-transparent',
                    disabledDay
                      ? 'opacity-25 bg-slate-50/50 text-slate-300 border-transparent cursor-not-allowed'
                      : 'hover:bg-slate-100 hover:text-slate-900 hover:border-transparent',
                    selected
                      ? 'bg-sky-600 text-white font-bold border-sky-600 hover:bg-sky-700 hover:text-white shadow-sm'
                      : inMonth
                        ? 'text-slate-700 border-transparent'
                        : 'text-slate-300 border-transparent font-normal',
                    isToday && !selected ? 'ring-2 ring-sky-600/30 border-sky-600/50' : '',
                  ].join(' ')}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          {/* Footer nút hành động nhanh */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
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
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer bg-transparent border-0"
            >
              Hôm nay
            </button>
          </div>
        </div>,
        document.body
        )}
    </div>
  )
}

function startOfMonthSafe(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}