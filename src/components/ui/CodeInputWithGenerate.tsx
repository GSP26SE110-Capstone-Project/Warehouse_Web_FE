type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  onGenerate: () => string
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  inputClassName?: string
  generateLabel?: string
  generateTitle?: string
}

export function CodeInputWithGenerate({
  id,
  value,
  onChange,
  onGenerate,
  disabled = false,
  readOnly = false,
  placeholder,
  inputClassName = '',
  generateLabel = 'Tự sinh',
  generateTitle = 'Sinh mã tự động',
}: Props) {
  return (
    <div className="flex gap-2">
      <input
        id={id}
        value={value}
        disabled={disabled || readOnly}
        placeholder={placeholder}
        className={`min-w-0 flex-1 ${inputClassName}`}
        onChange={(e) => onChange(e.target.value)}
      />
      {!readOnly && (
        <button
          type="button"
          title={generateTitle}
          disabled={disabled}
          onClick={() => onChange(onGenerate())}
          className="shrink-0 flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-base">autorenew</span>
          {generateLabel}
        </button>
      )}
    </div>
  )
}
