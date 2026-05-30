import type { FeedbackVariant } from '../FeedbackAlert'

type AlertType = FeedbackVariant | 'confirm'

type Props = {
  title?: string
  message: string
  type?: AlertType
  onConfirm?: () => void
  onClose: () => void
}

const MODAL_CONFIG: Record<
  FeedbackVariant,
  {
    icon: string
    ring: string
    iconBg: string
    iconColor: string
    confirmBtn: string
  }
> = {
  error: {
    icon: 'error',
    ring: 'ring-red-400/20',
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    confirmBtn: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500',
  },
  warning: {
    icon: 'warning',
    ring: 'ring-amber-400/20',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    confirmBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 text-[#0b101a] hover:from-amber-400 hover:to-orange-500',
  },
  success: {
    icon: 'check_circle',
    ring: 'ring-emerald-400/20',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    confirmBtn: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-[#0b101a] hover:from-cyan-400 hover:to-blue-500',
  },
  info: {
    icon: 'info',
    ring: 'ring-cyan-400/20',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    confirmBtn: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-[#0b101a] hover:from-cyan-400 hover:to-blue-500',
  },
}

function resolveVariant(type: AlertType): FeedbackVariant {
  return type === 'confirm' ? 'warning' : type
}

function defaultTitle(type: AlertType): string {
  if (type === 'confirm') return 'Xác nhận'
  if (type === 'error') return 'Có lỗi xảy ra'
  if (type === 'warning') return 'Lưu ý'
  if (type === 'success') return 'Thành công'
  return 'Thông tin'
}

export const AlertModal: React.FC<Props> = ({
  title,
  message,
  type = 'success',
  onConfirm,
  onClose,
}) => {
  const variant = resolveVariant(type)
  const cfg = MODAL_CONFIG[variant]
  const isConfirm = type === 'confirm'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0b101a]/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="alertdialog"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-message"
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0f1728] shadow-2xl shadow-black/50 ring-1 ${cfg.ring}`}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg} ${cfg.iconColor}`}
            >
              <span className="material-symbols-outlined text-2xl">{cfg.icon}</span>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 id="alert-modal-title" className="text-lg font-bold text-white">
                {title ?? defaultTitle(type)}
              </h3>
              <p id="alert-modal-message" className="mt-2 text-sm leading-relaxed text-slate-300">
                {message}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="shrink-0 rounded-lg p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
            {isConfirm && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
              >
                Hủy
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onConfirm?.()
                onClose()
              }}
              className={`rounded-lg px-5 py-2 text-sm font-bold transition-all ${cfg.confirmBtn}`}
            >
              {isConfirm ? 'Xác nhận' : 'Đã hiểu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
