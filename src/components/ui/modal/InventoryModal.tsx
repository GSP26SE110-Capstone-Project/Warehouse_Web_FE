import { useState, useEffect } from 'react'
import type { InventoryItem } from '../../../types/Warehouse'
import { MODAL_BODY_SCROLL_SPACE } from '../../../styles/scrollClasses'

type Mode = 'create' | 'edit' | 'view'

type Props = {
  mode: Mode
  data?: InventoryItem
  onClose: () => void
  onSubmit?: (data: any) => void
}

export const InventoryModal: React.FC<Props> = ({
  mode,
  data,
  onClose,
  onSubmit,
}) => {
  const isView = mode === 'view'

  const [form, setForm] = useState<InventoryItem>({
    sku: '',
    name: '',
    category: '',
    warehouse: '',
    location: '',
    importDate: '',
    stock: 0,
    total: 0,
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
                inventory_2
              </span>
              {mode === 'create'
                ? 'Thêm mặt hàng'
                : mode === 'edit'
                ? 'Chỉnh sửa mặt hàng'
                : 'Chi tiết mặt hàng'}
            </h2>
          </div>

          <button onClick={onClose} className="p-2 rounded hover:bg-white/10">
            <span className="material-symbols-outlined text-slate-400">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className={MODAL_BODY_SCROLL_SPACE}>

          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-cyan-400">
              THÔNG TIN HÀNG HÓA
            </h3>

            {/* SKU */}
            <div>
              <label className={labelStyle}>SKU</label>
              <input
                disabled={mode !== 'create'}
                className={inputStyle}
                value={form.sku}
                onChange={(e) =>
                  setForm({ ...form, sku: e.target.value })
                }
              />
            </div>

            {/* NAME */}
            <div>
              <label className={labelStyle}>Tên sản phẩm</label>
              <input
                disabled={isView}
                className={inputStyle}
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            {/* CATEGORY + WAREHOUSE */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Danh mục</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>

              <div>
                <label className={labelStyle}>Nhà kho</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  value={form.warehouse}
                  onChange={(e) =>
                    setForm({ ...form, warehouse: e.target.value })
                  }
                />
              </div>
            </div>

            {/* LOCATION + DATE */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Vị trí</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />
              </div>

              <div>
                <label className={labelStyle}>Ngày nhập</label>
                <input
                  type="date"
                  disabled={isView}
                  className={inputStyle}
                  value={form.importDate}
                  onChange={(e) =>
                    setForm({ ...form, importDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* STOCK */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Số lượng hiện tại</label>
                <input
                  type="number"
                  disabled={isView}
                  className={inputStyle}
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: +e.target.value })
                  }
                />
              </div>

              <div>
                <label className={labelStyle}>Tổng sức chứa</label>
                <input
                  type="number"
                  disabled={isView}
                  className={inputStyle}
                  value={form.total}
                  onChange={(e) =>
                    setForm({ ...form, total: +e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-white/[0.02]">
          <span className="text-xs text-slate-500">
            Hệ thống quản lý kho
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
                {mode === 'create' ? 'Tạo' : 'Cập nhật'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}