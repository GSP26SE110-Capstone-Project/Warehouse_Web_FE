import { useEffect, useId, useMemo, useRef, useState } from 'react'

function normalizeForSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

export type SearchableSelectOption = { value: string; label: string }

export function SearchableSelect({
  id,
  required,
  value,
  onChange,
  options,
  placeholder = 'Gõ để tìm...',
  disabled = false,
  emptyMessage = 'Không tìm thấy kết quả',
  loading = false,
  isDarkMode = false, // Mặc định là false (Light Mode)
}: {
  id: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  options: readonly SearchableSelectOption[]
  placeholder?: string
  disabled?: boolean
  emptyMessage?: string
  loading?: boolean
  isDarkMode?: boolean // Khai báo prop mới nhận diện theme
}) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  // Tính toán inline style cho khung bọc input linh hoạt theo theme
  const inputWrapStyle = useMemo(() => ({
    border: isDarkMode ? '1px solid #3a5455' : '1px solid #cbd5e1', // Viền slate-300 ở chế độ sáng
    background: isDarkMode ? 'rgba(11,22,23,0.8)' : '#ffffff',     // Nền trắng ở chế độ sáng
  }), [isDarkMode])

  // Chuẩn bị tập hợp các Class động tương ứng cho từng chế độ màu
  const textColor = isDarkMode ? 'text-white' : 'text-slate-900'
  const iconColor = isDarkMode ? 'text-[#9bb9bb]' : 'text-slate-400'
  const placeholderColor = isDarkMode ? 'placeholder:text-[#6b8586]' : 'placeholder:text-slate-400'
  const listBgBorder = isDarkMode ? 'bg-[#0f2223] border-[#3a5455]' : 'bg-white border-slate-200'

  const selectableOptions = useMemo(
    () => options.filter((opt) => opt.value !== ''),
    [options]
  )

  const selectedOption = useMemo(
    () => selectableOptions.find((opt) => opt.value === value),
    [selectableOptions, value]
  )

  const filteredOptions = useMemo(() => {
    const q = normalizeForSearch(query)
    if (!q) return selectableOptions
    return selectableOptions.filter(
      (opt) =>
        normalizeForSearch(opt.label).includes(q) || normalizeForSearch(opt.value).includes(q)
    )
  }, [selectableOptions, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  const pick = (opt: SearchableSelectOption) => {
    onChange(opt.value)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || loading) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      else setActiveIndex((i) => Math.min(i + 1, Math.max(0, filteredOptions.length - 1)))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      if (open && filteredOptions[activeIndex]) {
        e.preventDefault()
        pick(filteredOptions[activeIndex])
      }
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      return
    }
  }

  const displayValue = open ? query : (selectedOption?.label ?? '')

  return (
    <div ref={rootRef} className="relative">
      {required && (
        <input
          type="text"
          tabIndex={-1}
          aria-hidden
          value={value}
          required
          onChange={() => {}}
          className="absolute opacity-0 pointer-events-none h-0 w-0"
        />
      )}
      <div className={`relative rounded-lg ${isDarkMode ? 'input-glow' : 'shadow-sm'}`} style={inputWrapStyle}>
        <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none ${iconColor}`}>
          search
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled || loading}
          value={loading ? 'Đang tải...' : displayValue}
          placeholder={loading ? undefined : placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (!disabled && !loading) {
              setOpen(true)
              setQuery('')
            }
          }}
          onKeyDown={onKeyDown}
          className={`block w-full pl-10 pr-10 py-3 bg-transparent border-0 focus:outline-none text-base disabled:opacity-60 ${textColor} ${placeholderColor}`}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled || loading}
          aria-label={open ? 'Đóng danh sách' : 'Mở danh sách'}
          onClick={() => {
            if (disabled || loading) return
            if (open) {
              setOpen(false)
              setQuery('')
            } else {
              setOpen(true)
              setQuery('')
              inputRef.current?.focus()
            }
          }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 border-0 bg-transparent cursor-pointer disabled:cursor-not-allowed ${iconColor} ${isDarkMode ? 'hover:text-[#06edf9]' : 'hover:text-blue-600'}`}
        >
          <span className="material-symbols-outlined text-xl">
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {open && !loading && !disabled && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border shadow-lg py-1 ${isDarkMode ? 'dark-scrollbar' : 'scrollbar-thin'} ${listBgBorder}`}
        >
          {filteredOptions.length === 0 ? (
            <li className={`px-4 py-3 text-sm ${isDarkMode ? 'text-[#9bb9bb]' : 'text-slate-400'}`}>{emptyMessage}</li>
          ) : (
            filteredOptions.map((opt, index) => {
              const isSelected = opt.value === value
              const isActive = index === activeIndex
              
              // Thiết lập màu sắc riêng biệt cho item lúc hover (active) và lúc được chọn (selected)
              let itemThemeClasses = ''
              if (isDarkMode) {
                itemThemeClasses = isActive
                  ? 'bg-[#06edf9]/15 text-white'
                  : isSelected
                    ? 'bg-[#06edf9]/10 text-[#06edf9]'
                    : 'bg-transparent text-white hover:bg-white/5'
              } else {
                itemThemeClasses = isActive
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : isSelected
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
              }

              return (
                <li key={opt.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => pick(opt)}
                    className={`w-full text-left px-4 py-2.5 text-sm border-0 cursor-pointer transition-colors ${itemThemeClasses}`}
                  >
                    {opt.label}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}