import { useState, useEffect } from 'react'
import type { AccountRequest, AccountResponse } from '../../../types/Account'

type Mode = 'view' | 'edit' | 'create'

type Props = {
  mode: Mode
  data?: AccountResponse // Dùng Response cho dữ liệu đầu vào khi edit/view
  onClose: () => void
  onSubmit?: (data: any) => void
}

export const AccountModal: React.FC<Props> = ({
  mode,
  data,
  onClose,
  onSubmit,
}) => {
  const isView = mode === 'view'
  const isCreate = mode === 'create'

  const [form, setForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    role: 'warehouse_staff' as AccountRequest['role'], // Mặc định là warehouse_staff
    status: 'active' as AccountRequest['status'], // Mặc định là active
    passwordHash: '',
    tenantId: '',
  })

  // Cập nhật form khi data từ props thay đổi
  useEffect(() => {
    if (data) {
      setForm((prev) => ({
        ...prev,
        ...data,
        password: '', // Không map password cũ vào state
        confirmPassword: '',
      }))
    }
  }, [data])

  const handleSubmit = () => {
    if (isView) return

    // Validate cơ bản
    if (!form.fullName || !form.email || (isCreate && !form.passwordHash)) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }


    onSubmit?.(form)
    onClose()
  }

  const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
  const inputStyle = 'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">
                {isCreate ? 'person_add' : isView ? 'account_circle' : 'manage_accounts'}
              </span>
              {isCreate ? 'Tạo tài khoản mới' : isView ? 'Chi tiết tài khoản' : 'Cập nhật tài khoản'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-white/10 text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section: Personal Info */}
          <div className="p-4 rounded-lg bg-white/[0.01] border border-white/5 space-y-4">
            <h3 className="text-[10px] font-black text-cyan-500 tracking-[2px]">THÔNG TIN CƠ BẢN</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelStyle}>Họ và tên *</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              <div>
                <label className={labelStyle}>Email *</label>
                <input
                  disabled={isView || !isCreate} // Không cho sửa email khi edit để tránh lỗi logic
                  type="email"
                  className={inputStyle}
                  placeholder="example@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className={labelStyle}>Số điện thoại</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  placeholder="0901234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Vai trò</label>
                <select
                  disabled={isView}
                  className={inputStyle}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as AccountRequest['role'] })}
                >
                  <option value="admin">Quản trị viên</option>
                  <option value="warehouse_staff">Nhân viên kho</option>
                  <option value="tenant_admin">Người thuê</option>
                </select>
              </div>

              <div>
                <label className={labelStyle}>Trạng thái</label>
                <select
                  disabled={isView}
                  className={inputStyle}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm ngưng</option>
                  <option value="suspended">Đã khóa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Password - Chỉ hiện khi Create hoặc Edit */}
          {!isView && (
            <div className="p-4 rounded-lg bg-white/[0.01] border border-white/5 space-y-4">
              <h3 className="text-[10px] font-black text-emerald-500 tracking-[2px]">
                {isCreate ? 'THIẾT LẬP MẬT KHẨU' : 'ĐỔI MẬT KHẨU (BỎ TRỐNG NẾU KHÔNG ĐỔI)'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Mật khẩu {isCreate && '*'}</label>
                  <input
                    type="password"
                    className={inputStyle}
                    value={form.passwordHash}
                    onChange={(e) => setForm({ ...form, passwordHash: e.target.value })}
                  />
                </div>
                
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
              {isCreate ? 'Tạo tài khoản' : 'Lưu thay đổi'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}