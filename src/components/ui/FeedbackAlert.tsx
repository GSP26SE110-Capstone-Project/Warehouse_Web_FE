import type { ReactNode } from 'react'

export type FeedbackVariant = 'error' | 'warning' | 'success' | 'info'

const VARIANT_CONFIG: Record<
  FeedbackVariant,
  {
    icon: string
    wrap: string
    iconWrap: string
    title: string
    text: string
  }
> = {
  error: {
    icon: 'error',
    wrap: 'border-red-400/30 bg-gradient-to-r from-red-500/10 to-red-500/[0.04] shadow-[0_0_20px_rgba(248,113,113,0.08)]',
    iconWrap: 'bg-red-500/15 text-red-400 ring-red-400/25',
    title: 'text-red-200',
    text: 'text-red-100/90',
  },
  warning: {
    icon: 'warning',
    wrap: 'border-amber-400/30 bg-gradient-to-r from-amber-500/10 to-amber-500/[0.04] shadow-[0_0_20px_rgba(251,191,36,0.08)]',
    iconWrap: 'bg-amber-500/15 text-amber-400 ring-amber-400/25',
    title: 'text-amber-200',
    text: 'text-amber-100/90',
  },
  success: {
    icon: 'check_circle',
    wrap: 'border-emerald-400/30 bg-gradient-to-r from-emerald-500/10 to-emerald-500/[0.04] shadow-[0_0_20px_rgba(52,211,153,0.08)]',
    iconWrap: 'bg-emerald-500/15 text-emerald-400 ring-emerald-400/25',
    title: 'text-emerald-200',
    text: 'text-emerald-100/90',
  },
  info: {
    icon: 'info',
    wrap: 'border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-cyan-500/[0.04] shadow-[0_0_20px_rgba(34,211,238,0.08)]',
    iconWrap: 'bg-cyan-500/15 text-cyan-400 ring-cyan-400/25',
    title: 'text-cyan-200',
    text: 'text-cyan-100/90',
  },
}

type InlineAlertProps = {
  variant?: FeedbackVariant
  title?: string
  /** Ẩn tiêu đề (dùng trong form/modal) */
  hideTitle?: boolean
  /** Kích thước nhỏ gọn cho modal / field */
  compact?: boolean
  message: ReactNode
  onDismiss?: () => void
  className?: string
}

/** Banner cảnh báo / lỗi inline trong trang */
export function InlineAlert({
  variant = 'error',
  title,
  hideTitle = false,
  compact = false,
  message,
  onDismiss,
  className = '',
}: InlineAlertProps) {
  const cfg = VARIANT_CONFIG[variant]
  const defaultTitle =
    variant === 'error'
      ? 'Có lỗi xảy ra'
      : variant === 'warning'
        ? 'Lưu ý'
        : variant === 'success'
          ? 'Thành công'
          : 'Thông tin'

  return (
    <div
      role="alert"
      className={`flex items-start ${compact ? 'gap-2 rounded-lg px-3 py-2' : 'gap-3 rounded-xl px-4 py-3'} border ${cfg.wrap} ${className}`}
    >
      <span
        className={`${compact ? 'mt-0 h-7 w-7 rounded-md' : 'mt-0.5 h-9 w-9 rounded-lg'} flex shrink-0 items-center justify-center ring-1 ring-inset ${cfg.iconWrap}`}
      >
        <span className={`material-symbols-outlined ${compact ? 'text-base' : 'text-xl'}`}>
          {cfg.icon}
        </span>
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        {!hideTitle && (
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold ${cfg.title}`}>
            {title ?? defaultTitle}
          </p>
        )}
        <div
          className={`${hideTitle ? '' : compact ? 'mt-0.5' : 'mt-0.5'} ${compact ? 'text-xs' : 'text-sm'} leading-relaxed ${cfg.text}`}
        >
          {message}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  )
}
