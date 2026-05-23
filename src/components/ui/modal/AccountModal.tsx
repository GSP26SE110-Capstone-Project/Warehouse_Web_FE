import { useState, useEffect } from 'react'
import type { UserRequest, UserResponse } from '../../../types/Account'
import { warehouseApi } from '../../../service/warehouseApi' 
import { tenantCompanyApi,  } from '../../../service/tenantCompany'
import type { GetAllTenantsResponse } from '../../../types/TenantCompany'

type Mode = 'view' | 'edit' | 'create'

type Props = {
  mode: Mode
  data?: UserResponse
  onClose: () => void
  onSubmit?: (data: UserRequest) => void
}

interface WarehouseSelectOption {
  warehouseId: string
  warehouseName: string
}

interface TenantSelectOption {
  tenantId: string
  companyName: string
}

export const AccountModal: React.FC<Props> = ({
  mode,
  data,
  onClose,
  onSubmit,
}) => {
  const isView = mode === 'view'
  const isCreate = mode === 'create'

  // ================= LẤY THÔNG TIN AUTH USER =================
  const currentUserRole: UserResponse['role'] = (localStorage.getItem('user_role') as UserResponse['role']) || 'SYSTEM_ADMIN'
  // ===========================================================

  const [form, setForm] = useState({
    userId: '',
    tenantId: '',
    warehouseId: '',
    fullName: '',
    email: '',
    phone: '',
    role: '', 
    status: 'ACTIVE',
    createdAt: '',
    updatedAt: '',
    password: '',
  })

  const [warehouses, setWarehouses] = useState<WarehouseSelectOption[]>([])
  const [tenants, setTenants] = useState<TenantSelectOption[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Hàm tính toán danh sách Role được phép tạo dựa vào người đang đăng nhập
  const getAvailableRoles = () => {
    switch (currentUserRole) {
      case 'SYSTEM_ADMIN':
        return [
          { value: 'WH_ADMIN', label: 'Quản lý kho (Warehouse Admin)' },
          { value: 'TENANT_ADMIN', label: 'Người thuê (Tenant Admin)' },
        ]
      case 'WH_ADMIN':
        return [{ value: 'WH_STAFF', label: 'Nhân viên kho (Warehouse Staff)' }]
      case 'TENANT_ADMIN':
        return [{ value: 'TENANT_STAFF', label: 'Nhân viên thuê (Tenant Staff)' }]
      default:
        return []
    }
  }

  const availableRoles = getAvailableRoles()

  // Gọi API lấy danh sách Warehouse và Tenant khi mở modal tạo mới
  useEffect(() => {
    const fetchSelectData = async () => {
      if (!isCreate) return
      setLoadingData(true)
      try {
        // 1. Lấy danh sách Warehouse từ API nếu cần
        if (currentUserRole === 'SYSTEM_ADMIN' || currentUserRole === 'WH_ADMIN') {
          const whRes = await warehouseApi.getAll()
          setWarehouses(whRes.data?.data || whRes.data || [])
        }

        // 2. Lấy danh sách Tenant từ API và map chuẩn cấu trúc GetAllTenantsResponse
        if (currentUserRole === 'SYSTEM_ADMIN' || currentUserRole === 'TENANT_ADMIN') {
          // Ép kiểu cụ thể cho kết quả trả về của API để bảo đảm an toàn dữ liệu
          const tenantRes = await tenantCompanyApi.getAll() 
          
          if (tenantRes.data && tenantRes.data.success) {
            const rawCompanies = tenantRes.data.data || []
            
            // Map dữ liệu TenantCompany thành cấu trúc TenantSelectOption cho component Select
            const tenantOptions: TenantSelectOption[] = rawCompanies.map((company: any) => ({
              tenantId: company.tenantId ?? '', 
              companyName: company.companyName ?? company.tenantName ?? 'N/A' // Dự phòng trường tên công ty
            }))
            
            setTenants(tenantOptions)
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu cấu hình danh sách:', error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchSelectData()
  }, [isCreate, currentUserRole])

  // Thiết lập mặc định vai trò đầu tiên khả dụng khi tạo mới
  useEffect(() => {
    if (isCreate && availableRoles.length > 0) {
      setForm((prev) => ({ ...prev, role: availableRoles[0].value }))
    }
  }, [isCreate, availableRoles.length])

  // Cập nhật form dữ liệu cũ khi ở chế độ View / Edit
  useEffect(() => {
    if (data) {
      setForm((prev) => ({
        ...prev,
        ...data,
        tenantId: data.tenantId ?? '', // Tránh lỗi gán undefined vào string
        warehouseId: data.warehouseId ?? '', // Tránh lỗi gán undefined vào string
        password: '',
      }))
    }
  }, [data])

  const handleSubmit = () => {
    if (isView) return

    if (!form.fullName || !form.email) {
      alert('Vui lòng điền đầy đủ họ tên và email')
      return
    }

    let submitData: UserRequest

    if (isCreate) {
      if (!form.password || !form.password.trim()) {
        alert('Vui lòng nhập mật khẩu')
        return
      }

      if (!form.role) {
        alert('Vui lòng chọn vai trò tài khoản')
        return
      }

      if (currentUserRole === 'SYSTEM_ADMIN') {
        if (form.role === 'WH_ADMIN' && !form.warehouseId) {
          alert('Vui lòng chọn một Nhà kho quản lý')
          return
        }
        if (form.role === 'TENANT_ADMIN' && !form.tenantId) {
          alert('Vui lòng chọn một Đối tác thuê (Tenant)')
          return
        }
      }

      submitData = {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || '',
        role: form.role as UserRequest['role'],
        warehouseId: form.warehouseId ?? '', // Khắc phục lỗi 'string | undefined'
        tenantId: form.tenantId ?? '',       // Khắc phục lỗi 'string | undefined'
        status: form.status as UserRequest['status'],
      }
    } else {
      submitData = {
        fullName: form.fullName,
        phone: form.phone || '',
        status: form.status as UserRequest['status'],
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

          {/* Section: Thông tin cơ bản */}
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
                <label className={labelStyle}>Số điện thoại</label>
                <input
                  disabled={isView}
                  type="tel"
                  className={inputStyle}
                  placeholder="0901234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <label className={labelStyle}>Email *</label>
                <input
                  disabled={isView || !isCreate}
                  type="email"
                  className={inputStyle}
                  placeholder="example@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Vai trò *</label>
                <select
                  disabled={isView || !isCreate}
                  className={inputStyle}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {isCreate ? (
                    availableRoles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))
                  ) : (
                    <option value={form.role}>{form.role}</option>
                  )}
                </select>
              </div>

              <div>
                <label className={labelStyle}>Trạng thái</label>
                <select
                  disabled={isView}
                  className={inputStyle}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Không hoạt động</option>
                  <option value="SUSPENDED">Bị khóa tạm thời</option>
                  <option value="BLOCKED">Bị chặn</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Cấu hình định danh phân cấp bằng thẻ Select */}
          {isCreate && (
            <div className="p-4 rounded-lg bg-white/[0.01] border border-white/5 space-y-4">
              <h3 className="text-[10px] font-black text-cyan-500 tracking-[2px]">CẤU HÌNH ĐỊNH DANH</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* SELECT TENANT */}
                {(currentUserRole === 'TENANT_ADMIN' || (currentUserRole === 'SYSTEM_ADMIN' && form.role === 'TENANT_ADMIN')) && (
                  <div className={currentUserRole === 'TENANT_ADMIN' ? 'md:col-span-2' : ''}>
                    <label className={labelStyle}>Đối tác thuê (Tenant) *</label>
                    <select
                      className={inputStyle}
                      value={form.tenantId}
                      onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                      disabled={loadingData}
                    >
                      <option value="">-- Chọn một đối tác Tenant --</option>
                      {tenants.map((t) => (
                        <option key={t.tenantId} value={t.tenantId}>
                          {t.companyName} ({t.tenantId.substring(0, 8)}...)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* SELECT WAREHOUSE */}
                {(currentUserRole === 'WH_ADMIN' || (currentUserRole === 'SYSTEM_ADMIN' && form.role === 'WH_ADMIN')) && (
                  <div className={currentUserRole === 'WH_ADMIN' ? 'md:col-span-2' : ''}>
                    <label className={labelStyle}>Nhà kho (Warehouse) *</label>
                    <select
                      className={inputStyle}
                      value={form.warehouseId}
                      onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                      disabled={loadingData}
                    >
                      <option value="">-- Chọn một nhà kho --</option>
                      {warehouses.map((w) => (
                        <option key={w.warehouseId} value={w.warehouseId}>
                          {w.warehouseName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mật khẩu */}
          {isCreate && (
            <div className="p-4 rounded-lg bg-white/[0.01] border border-white/5">
              <label className={labelStyle}>Mật khẩu khởi tạo *</label>
              <input
                type="password"
                className={inputStyle}
                placeholder="Nhập mật khẩu bảo mật ban đầu"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          )}

          {/* Nhật ký thời gian */}
          {!isCreate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Ngày tạo hệ thống</label>
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
              disabled={loadingData}
              className="btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-black flex items-center gap-2 disabled:opacity-50"
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