import { useState, useEffect } from 'react'

type Mode = 'create' | 'edit' | 'view'

type Props = {
  mode: Mode
  type: 'Import' | 'Export' // 👈 phân biệt nhập / xuất
  data?: any
  onClose: () => void
  onSubmit?: (data: any) => void
}

const warehouses = ['Kho A', 'Kho B', 'Kho C']

export const StockMovementModal: React.FC<Props> = ({
  mode,
  type,
  data,
  onClose,
  onSubmit,
}) => {
  const isView = mode === 'view'

  const [form, setForm] = useState({
    sku: '',
    productName: '',
    warehouse: warehouses[0],
    quantity: 0,
    status: 'Pending',
    date: '',
  })

  useEffect(() => {
    if (data) setForm({ ...form, ...data })
  }, [data])

  const handleSubmit = () => {
    if (!form.sku || !form.productName || !form.quantity) {
      alert('Vui lòng nhập đầy đủ thông tin')
      return
    }

    onSubmit?.({
      ...form,
      type, // 👈 gắn loại Import / Export
    })
    onClose()
  }

  const labelStyle =
    'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'

  const inputStyle =
    'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400'

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
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400">
              {type === 'Import' ? 'download' : 'upload'}
            </span>
            {type === 'Import'
              ? 'Nhập kho'
              : 'Xuất kho'}
          </h2>

          <button onClick={onClose}>
            <span className="material-symbols-outlined text-slate-400">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* SKU */}
          <div>
            <label className={labelStyle}>SKU</label>
            <input
              disabled={isView}
              className={inputStyle}
              value={form.sku}
              onChange={(e) =>
                setForm({ ...form, sku: e.target.value })
              }
            />
          </div>

          {/* Product */}
          <div>
            <label className={labelStyle}>Tên sản phẩm</label>
            <input
              disabled={isView}
              className={inputStyle}
              value={form.productName}
              onChange={(e) =>
                setForm({ ...form, productName: e.target.value })
              }
            />
          </div>

          {/* Warehouse dropdown */}
          <div>
            <label className={labelStyle}>Kho</label>
            <select
              disabled={isView}
              className={inputStyle}
              value={form.warehouse}
              onChange={(e) =>
                setForm({ ...form, warehouse: e.target.value })
              }
            >
              {warehouses.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Quantity + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Số lượng</label>
              <input
                type="number"
                disabled={isView}
                className={inputStyle}
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className={labelStyle}>Ngày</label>
              <input
                type="date"
                disabled={isView}
                className={inputStyle}
                value={form.date}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value })
                }
              />
            </div>
          </div>

          {/* Status */}
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
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-white"
          >
            Đóng
          </button>

          {!isView && (
            <button
              onClick={handleSubmit}
              className="btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-black font-bold flex items-center gap-2"
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