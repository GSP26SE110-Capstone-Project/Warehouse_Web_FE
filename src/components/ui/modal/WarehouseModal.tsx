import { useState, useEffect } from 'react'

type Mode = 'create' | 'edit' | 'view'

type Props = {
  mode: Mode
  data?: any
  onClose: () => void
  onSubmit?: (data: any) => void
}

export const WarehouseModal: React.FC<Props> = ({
  mode,
  data,
  onClose,
  onSubmit,
}) => {
  const isView = mode === 'view'

  const [form, setForm] = useState({
    warehouseId: '',
    warehouseName: '',
    address: '',
    numberOfPallets: 0,
    status: 'Active',
    note: '',
  })

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const handleSubmit = () => {
    onSubmit?.(form)
    onClose()
  }

  const labelStyle =
    'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'

  const inputStyle =
    'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all disabled:opacity-50'

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20'
      case 'Inactive':
        return 'text-slate-400 bg-slate-400/10 ring-slate-400/20'
      default:
        return 'text-red-400 bg-red-400/10 ring-red-400/20'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">
                warehouse
              </span>
              {mode === 'create'
                ? 'Tạo kho'
                : mode === 'edit'
                ? 'Chỉnh sửa kho'
                : 'Chi tiết kho'}
            </h2>
          </div>

          <button onClick={onClose} className="p-2 rounded hover:bg-white/10">
            <span className="material-symbols-outlined text-slate-400">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* BASIC INFO */}
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-cyan-400">
              THÔNG TIN KHO
            </h3>

            <div>
              <label className={labelStyle}>Mã kho</label>
              <input
                disabled={mode !== 'create'}
                className={inputStyle}
                value={form.warehouseId}
                onChange={(e) =>
                  setForm({ ...form, warehouseId: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelStyle}>Tên kho</label>
              <input
                disabled={isView}
                className={inputStyle}
                value={form.warehouseName}
                onChange={(e) =>
                  setForm({ ...form, warehouseName: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelStyle}>Địa chỉ</label>
              <input
                disabled={isView}
                className={inputStyle}
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Số pallet</label>
                <input
                  type="number"
                  disabled={isView}
                  className={inputStyle}
                  value={form.numberOfPallets}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      numberOfPallets: +e.target.value,
                    })
                  }
                />
              </div>

              {/* STATUS */}
              <div>
                <label className={labelStyle}>Trạng thái</label>

                {isView ? (
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${getStatusStyle(
                      form.status
                    )}`}
                  >
                    {form.status}
                  </span>
                ) : (
                  <select
                    className={inputStyle}
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className={labelStyle}>Ghi chú</label>
              <textarea
                disabled={isView}
                className={inputStyle}
                value={form.note}
                onChange={(e) =>
                  setForm({ ...form, note: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-white/[0.02]">
          <span className="text-xs text-slate-500">
           NEXSPACE
          </span>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
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
                {mode === 'create' ? 'Tạo kho' : 'Cập nhật'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}