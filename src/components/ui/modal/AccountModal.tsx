import { useState, useEffect } from 'react'
import type { UserRole } from '../../../api/types'
import * as warehousesApi from '../../../api/warehouses'
import * as tenantsApi from '../../../api/tenants'

type Mode = 'view' | 'edit' | 'create'

type Props = {
  mode: Mode
  creatorRole?: UserRole
  data?: {
    fullName?: string
    name?: string
    email?: string
    phone?: string
    role?: string
    status?: string
  }
  onClose: () => void
  onSubmit?: (data: AccountFormValues) => void
}

export type AccountFormValues = {
  fullName: string
  email: string
  phone: string
  role: UserRole
  password: string
  status: string
  warehouseId?: string
  tenantId?: string
}

const EMPTY_FORM: AccountFormValues & { confirmPassword: string } = {
  fullName: '',
  email: '',
  phone: '',
  role: 'WH_ADMIN',
  password: '',
  confirmPassword: '',
  status: 'Active',
  warehouseId: '',
  tenantId: '',
}

const ROLE_OPTIONS_SYSTEM_ADMIN: { value: UserRole; label: string }[] = [
  { value: 'WH_ADMIN', label: 'Warehouse Admin (Quản trị kho)' },
  { value: 'TENANT_ADMIN', label: 'Tenant Admin (Quản trị tenant)' },
]

const ROLE_OPTIONS_WH_ADMIN: { value: UserRole; label: string }[] = [
  { value: 'WH_STAFF', label: 'Warehouse Staff (Nhân viên kho)' },
]

const ROLE_OPTIONS_TENANT_ADMIN: { value: UserRole; label: string }[] = [
  { value: 'TENANT_STAFF', label: 'Tenant Staff (Nhân viên tenant)' },
]

function displayRole(role?: string) {
  const map: Record<string, string> = {
    WH_ADMIN: 'Warehouse Admin',
    TENANT_ADMIN: 'Tenant Admin',
    WH_STAFF: 'Warehouse Staff',
    TENANT_STAFF: 'Tenant Staff',
    SYSTEM_ADMIN: 'System Admin',
    Admin: 'Admin',
    Manager: 'Manager',
    Staff: 'Staff',
  }
  return map[role ?? ''] ?? role ?? '—'
}

export const AccountModal: React.FC<Props> = ({
  mode,
  creatorRole = 'SYSTEM_ADMIN',
  data,
  onClose,
  onSubmit,
}) => {
  const isView = mode === 'view'
  const isCreate = mode === 'create'

  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [warehouses, setWarehouses] = useState<{ id: string; label: string }[]>([])
  const [tenants, setTenants] = useState<{ id: string; label: string }[]>([])

  const roleOptions =
    creatorRole === 'SYSTEM_ADMIN'
      ? ROLE_OPTIONS_SYSTEM_ADMIN
      : creatorRole === 'WH_ADMIN'
        ? ROLE_OPTIONS_WH_ADMIN
        : creatorRole === 'TENANT_ADMIN'
          ? ROLE_OPTIONS_TENANT_ADMIN
          : []

  useEffect(() => {
    if (isCreate) {
      const defaultRole = roleOptions[0]?.value ?? 'WH_ADMIN'
      setForm({ ...EMPTY_FORM, role: defaultRole })
      return
    }
    if (data) {
      setForm((prev) => ({
        ...prev,
        fullName: data.fullName || data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: (data.role as UserRole) || prev.role,
        status: data.status || 'Active',
        password: '',
        confirmPassword: '',
      }))
    }
  }, [mode, data, isCreate])

  useEffect(() => {
    if (!isCreate || creatorRole !== 'SYSTEM_ADMIN') return
    let cancelled = false
    ;(async () => {
      try {
        const [{ items: wh }, { items: tn }] = await Promise.all([
          warehousesApi.listWarehouses({ limit: 100 }),
          tenantsApi.listTenants({ limit: 100 }),
        ])
        if (cancelled) return
        setWarehouses(wh.map((w) => ({ id: w.warehouseId, label: `${w.warehouseCode} — ${w.warehouseName}` })))
        setTenants(tn.map((t) => ({ id: t.tenantId, label: t.companyName })))
      } catch {
        /* lists optional for UX */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isCreate, creatorRole])

  const handleSubmit = () => {
    if (isCreate && !form.email.trim()) {
      alert('Vui lòng nhập email')
      return
    }
    if (isCreate && form.password.length < 8) {
      alert('Mật khẩu tối thiểu 8 ký tự')
      return
    }
    if (!isView && form.password !== form.confirmPassword) {
      alert('Mật khẩu không khớp')
      return
    }
    if (isCreate && creatorRole === 'SYSTEM_ADMIN') {
      if (form.role === 'WH_ADMIN' && !form.warehouseId) {
        alert('Vui lòng chọn kho cho Warehouse Admin')
        return
      }
      if (form.role === 'TENANT_ADMIN' && !form.tenantId) {
        alert('Vui lòng chọn tenant cho Tenant Admin')
        return
      }
    }

    onSubmit?.({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      role: form.role,
      password: form.password,
      status: form.status,
      warehouseId: form.warehouseId || undefined,
      tenantId: form.tenantId || undefined,
    })
    onClose()
  }

  const labelStyle =
    'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'

  const inputStyle =
    'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed'

  const title =
    mode === 'create' ? 'Thêm tài khoản' : mode === 'view' ? 'Thông tin tài khoản' : 'Chỉnh sửa tài khoản'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">account_circle</span>
              {title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Quản lý thông tin người dùng</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded hover:bg-white/10">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-cyan-400">THÔNG TIN CÁ NHÂN</h3>

            <div>
              <label className={labelStyle}>Họ và tên</label>
              <input
                disabled={isView}
                className={inputStyle}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Email</label>
                <input
                  type="email"
                  disabled={!isCreate}
                  className={inputStyle}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className={labelStyle}>Số điện thoại</label>
                <input
                  disabled={isView}
                  className={inputStyle}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Vai trò</label>
                {isCreate && roleOptions.length > 0 ? (
                  <select
                    className={inputStyle}
                    value={form.role}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        role: e.target.value as UserRole,
                        warehouseId: '',
                        tenantId: '',
                      })
                    }
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input disabled className={inputStyle} value={displayRole(form.role)} />
                )}
              </div>

              <div>
                <label className={labelStyle}>Trạng thái</label>
                {isView ? (
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/20">
                    {form.status}
                  </span>
                ) : (
                  <select
                    className={inputStyle}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                )}
              </div>
            </div>

            {isCreate && creatorRole === 'SYSTEM_ADMIN' && form.role === 'WH_ADMIN' && (
              <div>
                <label className={labelStyle}>Kho (bắt buộc)</label>
                <select
                  className={inputStyle}
                  value={form.warehouseId}
                  onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                >
                  <option value="">— Chọn kho —</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isCreate && creatorRole === 'SYSTEM_ADMIN' && form.role === 'TENANT_ADMIN' && (
              <div>
                <label className={labelStyle}>Tenant (bắt buộc)</label>
                <select
                  className={inputStyle}
                  value={form.tenantId}
                  onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                >
                  <option value="">— Chọn tenant —</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!isView && (
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-4">
              <h3 className="text-sm font-semibold text-emerald-400">
                {isCreate ? 'MẬT KHẨU' : 'ĐỔI MẬT KHẨU'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>{isCreate ? 'Mật khẩu' : 'Mật khẩu mới'}</label>
                  <input
                    type="password"
                    className={inputStyle}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    className={inputStyle}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-white/[0.02]">
          <span className="text-xs text-slate-500">Hệ thống quản lý kho</span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">
              Đóng
            </button>
            {!isView && (
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-black flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-black text-[18px]">save</span>
                {isCreate ? 'Tạo tài khoản' : 'Lưu thay đổi'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
