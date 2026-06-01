import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type DarkDropdownOption = { value: string; label: string; hint?: string }
export type DarkDropdownOptionGroup = { label: string; options: DarkDropdownOption[] }

type Theme = 'staff' | 'guest'

function normalizeSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

function themeStyles(theme: Theme) {
  if (theme === 'guest') {
    return {
      trigger:
        'border border-[#3a5455] bg-[#0b1617]/95 text-white hover:border-[#06edf9]/40 focus:border-[#06edf9]/50 focus:ring-1 focus:ring-[#06edf9]/25',
      menu: 'border-[#3a5455] bg-[#0f2223] shadow-xl shadow-black/40',
      group: 'text-[#06edf9]/80',
      active: 'bg-[#06edf9]/15 text-white',
      selected: 'bg-[#06edf9]/10 text-[#06edf9]',
      chevron: 'text-[#9bb9bb]',
    }
  }
  return {
    trigger:
      'border border-white/10 bg-[#0f1728]/95 text-white hover:border-cyan-500/35 focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/20',
    menu: 'border-white/10 bg-[#111827] shadow-xl shadow-black/50',
    group: 'text-cyan-400/90',
    active: 'bg-cyan-500/15 text-white',
    selected: 'bg-cyan-500/10 text-cyan-300',
    chevron: 'text-slate-500',
  }
}

export function DarkDropdownSelect({
  id,
  value,
  onChange,
  groups,
  options,
  placeholder = 'Chọn…',
  disabled = false,
  compact = true,
  theme = 'staff',
  emptyMessage = 'Không có lựa chọn',
  searchable = false,
  searchPlaceholder = 'Gõ để tìm…',
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  groups?: DarkDropdownOptionGroup[]
  options?: DarkDropdownOption[]
  placeholder?: string
  disabled?: boolean
  compact?: boolean
  theme?: Theme
  emptyMessage?: string
  searchable?: boolean
  searchPlaceholder?: string
}) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null
  )

  const t = themeStyles(theme)
  const py = compact ? 'py-2.5' : 'py-3'
  const text = compact ? 'text-sm' : 'text-base'

  const flatOptions = useMemo(() => {
    if (options?.length) return options
    if (!groups?.length) return []
    return groups.flatMap((g) => g.options)
  }, [groups, options])

  const selected = useMemo(
    () => flatOptions.find((opt) => opt.value === value),
    [flatOptions, value]
  )

  const menuEntries = useMemo(() => {
    if (groups?.length) {
      return groups.flatMap((group) => [
        { type: 'group' as const, key: `g-${group.label}`, label: group.label },
        ...group.options.map((opt) => ({
          type: 'option' as const,
          key: opt.value,
          option: opt,
        })),
      ])
    }
    return (options ?? []).map((opt) => ({
      type: 'option' as const,
      key: opt.value,
      option: opt,
    }))
  }, [groups, options])

  const filteredMenuEntries = useMemo(() => {
    if (!searchable || !query.trim()) return menuEntries

    const q = normalizeSearch(query)
    const matchOption = (opt: DarkDropdownOption) =>
      normalizeSearch(opt.label).includes(q) || normalizeSearch(opt.value).includes(q)

    if (groups?.length) {
      const filtered: typeof menuEntries = []
      for (const group of groups) {
        const matching = group.options.filter(matchOption)
        if (!matching.length) continue
        filtered.push({ type: 'group' as const, key: `g-${group.label}`, label: group.label })
        matching.forEach((opt) => {
          filtered.push({ type: 'option' as const, key: opt.value, option: opt })
        })
      }
      return filtered
    }

    return (options ?? []).filter(matchOption).map((opt) => ({
      type: 'option' as const,
      key: opt.value,
      option: opt,
    }))
  }, [groups, menuEntries, options, query, searchable])

  const selectableIndices = useMemo(
    () =>
      filteredMenuEntries
        .map((entry, index) => (entry.type === 'option' ? index : -1))
        .filter((index) => index >= 0),
    [filteredMenuEntries]
  )

  useEffect(() => {
    setActiveIndex(selectableIndices[0] ?? 0)
  }, [query, open, selectableIndices])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    if (searchable) {
      searchRef.current?.focus()
    }
  }, [open, searchable])

  useEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      setMenuStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 240),
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
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const pick = (opt: DarkDropdownOption) => {
    onChange(opt.value)
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const currentPos = selectableIndices.indexOf(activeIndex)
      const nextPos =
        e.key === 'ArrowDown'
          ? Math.min(currentPos + 1, selectableIndices.length - 1)
          : Math.max(currentPos - 1, 0)
      setActiveIndex(selectableIndices[nextPos] ?? selectableIndices[0] ?? 0)
      return
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const entry = filteredMenuEntries[activeIndex]
      if (entry?.type === 'option') pick(entry.option)
      return
    }

    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const menu =
    open && menuStyle && !disabled
      ? createPortal(
          <div
            ref={menuRef}
            className={`fixed z-[220] max-h-64 overflow-hidden rounded-xl border ${t.menu}`}
            style={{
              top: menuStyle.top,
              left: menuStyle.left,
              width: Math.max(menuStyle.width, 280),
            }}
          >
            {searchable && (
              <div
                className={`border-b border-white/5 p-2 ${
                  theme === 'guest' ? 'bg-[#0f2223]' : 'bg-[#111827]'
                }`}
              >
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className={`w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 ${text} text-white placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20`}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div
              id={listId}
              role="listbox"
              className="max-h-52 overflow-y-auto dark-scrollbar"
            >
            {filteredMenuEntries.length === 0 ? (
              <p className={`px-3 py-3 ${text} text-slate-400`}>{emptyMessage}</p>
            ) : (
              filteredMenuEntries.map((entry, index) => {
                if (entry.type === 'group') {
                  return (
                    <div
                      key={entry.key}
                      className={`sticky top-0 z-10 border-b border-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-sm ${t.group} ${
                        theme === 'guest' ? 'bg-[#0f2223]/95' : 'bg-[#111827]/95'
                      }`}
                    >
                      {entry.label}
                    </div>
                  )
                }

                const opt = entry.option
                const isSelected = opt.value === value
                const isActive = index === activeIndex

                return (
                  <button
                    key={entry.key}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => pick(opt)}
                    className={`flex w-full items-center justify-between gap-3 border-0 px-3 ${py} text-left ${text} transition-colors ${
                      isActive ? t.active : isSelected ? t.selected : 'bg-transparent text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <span className="min-w-0 truncate">{opt.label}</span>
                    {opt.hint && (
                      <span className="shrink-0 text-xs text-slate-500">{opt.hint}</span>
                    )}
                  </button>
                )
              })
            )}
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return
          setOpen((v) => {
            if (v) setQuery('')
            return !v
          })
        }}
        onKeyDown={onKeyDown}
        className={`input-glow flex w-full items-center justify-between gap-2 rounded-lg px-3 ${py} ${text} transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${t.trigger}`}
      >
        <span className={`min-w-0 truncate text-left ${selected ? 'text-white' : 'text-slate-500'}`}>
          {selected?.label ?? placeholder}
        </span>
        <span className={`material-symbols-outlined shrink-0 text-lg ${t.chevron}`}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {menu}
    </div>
  )
}
