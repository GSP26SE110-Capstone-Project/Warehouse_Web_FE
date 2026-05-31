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
        className={`input-glow relative rounded-lg transition-colors ${
          open ? 'ring-1 ring-[#06edf9]/40 border-[#06edf9]/50' : ''
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
            className={`material-symbols-outlined text-[#06edf9] shrink-0 ${
              compact ? 'text-lg' : 'text-xl'
            }`}
          >
            calendar_month
          </span>
          <span
            className={`flex-1 truncate ${compact ? 'text-sm' : 'text-base'} ${
              displayValue ? 'text-white' : 'text-[#7a9496]'
            }`}
          >
            {displayValue || placeholder}
          </span>
          <span className="material-symbols-outlined text-[#9bb9bb] text-lg shrink-0">
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
          className="fixed z-[200] rounded-xl border border-[#06edf9]/25 bg-[#0b1617]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl"
          style={{
            top: popoverStyle.top,
            left: popoverStyle.left,
            width: popoverStyle.width,
            maxWidth: 320,
          }}
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
        </div>,
        document.body
        )}
    </div>
  )
}

function startOfMonthSafe(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
