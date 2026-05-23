import { useState, useEffect } from 'react'
import type { WarehouseResponse, WarehouseRequest, WarehouseStatus } from '../../../types/Warehouse'

type Mode = 'view' | 'edit' | 'create'

type Props = {
  mode: Mode
  data?: WarehouseResponse
  onClose: () => void
  onSubmit?: (data: WarehouseRequest) => void
}

export const WarehouseModal: React.FC<Props> = ({
  mode,
  data,
  onClose,
  onSubmit,
}) => {
  const isView = mode === 'view'
  const isCreate = mode === 'create'

  const [form, setForm] = useState({
    warehouseId: '',
    warehouseCode: '',
    warehouseName: '',
    address: '',
    totalAreaM2: 0,
    usableAreaM2: 0,
    status: 'ACTIVE' as WarehouseStatus,
    createdAt: '',
    updatedAt: '',
  })

  // Cập nhật form khi có dữ liệu (View/Edit mode)
  useEffect(() => {
    if (data) {
      setForm(data)
    }
  }, [data])

  const handleSubmit = () => {
    if (isView) return

    // Validation
    if (!form.warehouseCode || !form.warehouseName || !form.address) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (form.totalAreaM2 <= 0 || form.usableAreaM2 <= 0) {
      alert('Diện tích phải lớn hơn 0')
      return
    }

    if (form.usableAreaM2 > form.totalAreaM2) {
      alert('Diện tích sử dụng không thể lớn hơn diện tích tổng')
      return
    }

    const submitData: WarehouseRequest = {
      warehouseCode: form.warehouseCode,
      warehouseName: form.warehouseName,
      address: form.address,
      totalAreaM2: form.totalAreaM2,
      usableAreaM2: form.usableAreaM2,
      status: form.status,
    }

    onSubmit?.(submitData)
    onClose()
  }

  const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
  const inputStyle = 'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">
                {isCreate ? 'warehouse' : isView ? 'info' : 'edit'}
              </span>
              {isCreate ? 'Tạo kho hàng mới' : isView ? 'Chi tiết kho hàng' : 'Cập nhật kho hàng'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-white/10 text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Section: Thông tin cơ bản */}
          <div className="p-4 rounded-lg bg-white/[0.01] border border-white/5 space-y-4">
            <h3 className="text-[10px] font-black text-cyan-500 tracking-[2px]">THÔNG TIN CƠ BẢN</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Mã kho *</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  placeholder="WH-001"
                  value={form.warehouseCode}
                  onChange={(e) => setForm({ ...form, warehouseCode: e.target.value })}
                />
              </div>

              <div>
                <label className={labelStyle}>Tên kho *</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  placeholder="Kho hàng chính"
                  value={form.warehouseName}
                  onChange={(e) => setForm({ ...form, warehouseName: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelStyle}>Địa chỉ *</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  placeholder="123 Đường ABC, Quận 1, TP.HCM"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section: Diện tích */}
          <div className="p-4 rounded-lg bg-white/[0.01] border border-white/5 space-y-4">
            <h3 className="text-[10px] font-black text-emerald-500 tracking-[2px]">THÔNG TIN DIỆN TÍCH</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Diện tích tổng (m²) *</label>
                <input
                  disabled={isView}
                  type="number"
                  className={inputStyle}
                  placeholder="5000"
                  value={form.totalAreaM2}
                  onChange={(e) => setForm({ ...form, totalAreaM2: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className={labelStyle}>Diện tích sử dụng (m²) *</label>
                <input
                  disabled={isView}
                  type="number"
                  className={inputStyle}
                  placeholder="4500"
                  value={form.usableAreaM2}
                  onChange={(e) => setForm({ ...form, usableAreaM2: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {form.totalAreaM2 > 0 && (
                <div className="md:col-span-2">
                  <label className={labelStyle}>Tỉ lệ sử dụng</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                        style={{
                          width: `${(form.usableAreaM2 / form.totalAreaM2) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-cyan-400 font-bold w-12 text-right">
                      {((form.usableAreaM2 / form.totalAreaM2) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Trạng thái */}
          <div className="p-4 rounded-lg bg-white/[0.01] border border-white/5 space-y-4">
            <h3 className="text-[10px] font-black text-orange-500 tracking-[2px]">TRẠNG THÁI</h3>

            <div>
              <label className={labelStyle}>Trạng thái</label>
              <select
                disabled={isView}
                className={inputStyle}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as WarehouseStatus })}
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Không hoạt động</option>
                <option value="MAINTENANCE">Bảo trì</option>
                <option value="CLOSED">Đã đóng</option>
              </select>
            </div>
          </div>

          {/* Nhật ký thời gian */}
          {!isCreate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Ngày tạo</label>
                <input
                  disabled
                  className={inputStyle}
                  value={form.createdAt ? new Date(form.createdAt).toLocaleString('vi-VN') : '---'}
                />
              </div>
              <div>
                <label className={labelStyle}>Cập nhật cuối</label>
                <input
                  disabled
                  className={inputStyle}
                  value={form.updatedAt ? new Date(form.updatedAt).toLocaleString('vi-VN') : '---'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-white/5 bg-white/[0.02]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            Hủy bỏ
          </button>
          {!isView && (
            <button
              onClick={handleSubmit}
              className="btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-black flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {isCreate ? 'Tạo kho' : 'Lưu thay đổi'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}