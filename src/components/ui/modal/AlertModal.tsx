type Props = {
  title: string
  message: string
  type?: 'success' | 'confirm' | 'error'
  onConfirm?: () => void
  onClose: () => void
}

export const AlertModal: React.FC<Props> = ({
  title,
  message,
  type = 'success',
  onConfirm,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 bg-[#0f172a] p-6 rounded-xl border border-white/10 w-[400px] flex flex-col gap-4">

        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-slate-400">{message}</p>

        <div className="flex justify-end gap-2">

          {type === 'confirm' && (
            <button onClick={onClose}>Hủy</button>
          )}

          <button
            onClick={() => {
              onConfirm?.()
              onClose()
            }}
            className="bg-cyan-500 px-4 py-2 rounded"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}