import { useState, useEffect } from 'react'

type Mode = 'view' | 'edit' | 'create'

type Props = {
  mode: Mode
  data?: any
  onClose: () => void
  onSubmit?: (data: any) => void
}

export const TransportationModal: React.FC<Props> = ({
  mode,
  data,
  onClose,
  onSubmit,
}) => {
  const isView = mode === 'view'

  const [form, setForm] = useState({
    orderId: '',
    customer: '',
    destination: '',
    carrier: '',
    status: 'Pending',
    eta: '',
  })

  useEffect(() => {
    if (data) {
      setForm({ ...form, ...data })
    }
  }, [data])

  const handleSubmit = () => {
    onSubmit?.(form)
    onClose()
  }

  const labelStyle =
    'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'

  const inputStyle =
    'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all disabled:opacity-50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400">
              local_shipping
            </span>
            {mode === 'create'
              ? 'Tạo vận chuyển'
              : mode === 'edit'
              ? 'Chỉnh sửa vận chuyển'
              : 'Chi tiết vận chuyển'}
          </h2>

          <button onClick={onClose}>
            <span className="material-symbols-outlined text-slate-400">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Order */}
          <div>
            <label className={labelStyle}>Mã đơn hàng</label>
            <input
              disabled={isView}
              className={inputStyle}
              value={form.orderId}
              onChange={(e) =>
                setForm({ ...form, orderId: e.target.value })
              }
            />
          </div>

          {/* Customer */}
          <div>
            <label className={labelStyle}>Khách hàng</label>
            <input
              disabled={isView}
              className={inputStyle}
              value={form.customer}
              onChange={(e) =>
                setForm({ ...form, customer: e.target.value })
              }
            />
          </div>

          {/* Destination + Carrier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Điểm đến</label>
              <input
                disabled={isView}
                className={inputStyle}
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelStyle}>Đơn vị vận chuyển</label>
              <input
                disabled={isView}
                className={inputStyle}
                value={form.carrier}
                onChange={(e) =>
                  setForm({ ...form, carrier: e.target.value })
                }
              />
            </div>
          </div>

          {/* Status + ETA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Trạng thái</label>
              <select
                disabled={isView}
                className={inputStyle}
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
              >
                <option>Pending</option>
                <option>In Transit</option>
                <option>Delivered</option>
                <option>Delayed</option>
              </select>
            </div>

            <div>
              <label className={labelStyle}>ETA</label>
              <input
                disabled={isView}
                className={inputStyle}
                value={form.eta}
                onChange={(e) =>
                  setForm({ ...form, eta: e.target.value })
                }
                placeholder="VD: Today / Tomorrow"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-white/[0.02]">
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-white"
          >
            Đóng
          </button>

          {!isView && (
            <button
              onClick={handleSubmit}
              className="btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-black flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-black text-[18px]">
                save
              </span>
              Lưu
            </button>
          )}
        </div>
      </div>
    </div>
  )
}