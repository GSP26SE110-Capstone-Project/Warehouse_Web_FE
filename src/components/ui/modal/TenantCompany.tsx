import { useState, useEffect } from 'react'
import type { TenantCompanyResponse, TenantRequest, TenantStatus } from '../../../types/TenantCompany'

type Mode = 'view' | 'edit' | 'create'

type Props = {
  mode: Mode
  data?: TenantCompanyResponse
  onClose: () => void
  onSubmit?: (data: TenantRequest) => void
}

export const TenantCompanyModal: React.FC<Props> = ({
  mode,
  data,
  onClose,
  onSubmit,
}) => {
  const isView = mode === 'view'
  const isCreate = mode === 'create'
  const isEdit = mode === 'edit'

  const [form, setForm] = useState({
    tenantId: '',
    companyName: '',
    companyCode: '',
    taxCode: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    status: 'ACTIVE' as TenantStatus,
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
    if (!form.companyName || !form.companyCode || !form.taxCode) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (!form.contactName || !form.contactEmail || !form.contactPhone) {
      alert('Vui lòng điền đầy đủ thông tin liên hệ')
      return
    }

    if (!form.address) {
      alert('Vui lòng nhập địa chỉ')
      return
    }

    let submitData: TenantRequest

    if (isCreate) {
      submitData = {
        companyName: form.companyName,
        companyCode: form.companyCode,
        taxCode: form.taxCode,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        address: form.address,
        status: form.status,
      }
    } else {
      // Edit mode - gửi toàn bộ fields
      submitData = {
        companyName: form.companyName,
        companyCode: form.companyCode,
        taxCode: form.taxCode,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        address: form.address,
        status: form.status,
      }
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
                {isCreate ? 'apartment' : isView ? 'info' : 'edit'}
              </span>
              {isCreate ? 'Tạo công ty thuê mới' : isView ? 'Chi tiết công ty thuê' : 'Cập nhật công ty thuê'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-white/10 text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Section: Thông tin công ty */}
          <div className="p-4 rounded-lg bg-white/[0.01] border border-white/5 space-y-4">
            <h3 className="text-[10px] font-black text-cyan-500 tracking-[2px]">THÔNG TIN CÔNG TY</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Tên công ty *</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  placeholder="Brand A Fashion JSC"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </div>

              <div>
                <label className={labelStyle}>Mã công ty *</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  placeholder="BRAND-A"
                  value={form.companyCode}
                  onChange={(e) => setForm({ ...form, companyCode: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelStyle}>Mã số thuế *</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  placeholder="0312000001"
                  value={form.taxCode}
                  onChange={(e) => setForm({ ...form, taxCode: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelStyle}>Địa chỉ *</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  placeholder="Quận 1, TP.HCM"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section: Thông tin liên hệ */}
          <div className="p-4 rounded-lg bg-white/[0.01] border border-white/5 space-y-4">
            <h3 className="text-[10px] font-black text-emerald-500 tracking-[2px]">THÔNG TIN LIÊN HỆ</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Tên liên hệ *</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  placeholder="Tenant Admin A"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                />
              </div>

              <div>
                <label className={labelStyle}>Email liên hệ *</label>
                <input
                  disabled={isView}
                  type="email"
                  className={inputStyle}
                  placeholder="tenant@example.com"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                />
              </div>

              <div>
                <label className={labelStyle}>Số điện thoại *</label>
                <input
                  disabled={isView}
                  type="tel"
                  className={inputStyle}
                  placeholder="0901111111"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                />
              </div>

              <div>
                <label className={labelStyle}>Trạng thái</label>
                <select
                  disabled={isView}
                  className={inputStyle}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as TenantStatus })}
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="SUSPENDED">Bị khóa</option>
                </select>
              </div>
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
              {isCreate ? 'Tạo công ty' : 'Lưu thay đổi'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}