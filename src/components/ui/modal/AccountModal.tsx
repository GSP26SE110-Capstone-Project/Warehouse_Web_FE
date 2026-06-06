import { InlineAlert } from '../FeedbackAlert'
import type { FeedbackVariant } from '../FeedbackAlert'
import { useState, useEffect } from 'react'
import type { ApiUser, UserRole } from '../../../api/types'
import * as warehousesApi from '../../../api/warehouses'
import * as tenantsApi from '../../../api/tenants'
import type { ApiTenant } from '../../../api/tenants'
import * as usersApi from '../../../api/users'
import {
  formatPhoneForSubmit,
  requireEmail,
  requireMinPassword,
  requireTrimmed,
  validatePhone,
} from '../../../utils/formValidation'
import { MODAL_BODY_SCROLL_SPACE } from '../../../styles/scrollClasses'

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
  { value: 'WH_TRANSPORTER', label: 'Tài xế kho (WH Transporter)' },
]

const ROLE_OPTIONS_TENANT_ADMIN: { value: UserRole; label: string }[] = [
  { value: 'TENANT_STAFF', label: 'Tenant Staff (Nhân viên tenant)' },
]

function statusBadgeClass(status: string) {
  if (status === 'Active') return 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20'
  if (status === 'Suspended') return 'text-orange-400 bg-orange-400/10 ring-orange-400/20'
  return 'text-gray-400 bg-gray-400/10 ring-gray-400/20'
}

function displayRole(role?: string) {
  const map: Record<string, string> = {
    WH_ADMIN: 'Warehouse Admin',
    TENANT_ADMIN: 'Tenant Admin',
    WH_STAFF: 'Warehouse Staff',
    WH_TRANSPORTER: 'Tài xế kho',
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
  const [tenants, setTenants] = useState<ApiTenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<ApiTenant | null>(null)
  const [whAdminByWarehouse, setWhAdminByWarehouse] = useState<Map<string, ApiUser>>(new Map())
  const [tenantAdminByTenant, setTenantAdminByTenant] = useState<Map<string, ApiUser>>(new Map())
  const [formError, setFormError] = useState<{
    variant: FeedbackVariant
    title: string
    message: string
    field?: 'password' | 'confirmPassword' | 'phone'
  } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const roleOptions =
    creatorRole === 'SYSTEM_ADMIN'
      ? ROLE_OPTIONS_SYSTEM_ADMIN
      : creatorRole === 'WH_ADMIN'
        ? ROLE_OPTIONS_WH_ADMIN
        : creatorRole === 'TENANT_ADMIN'
          ? ROLE_OPTIONS_TENANT_ADMIN
          : []

  useEffect(() => {
    setFormError(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
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
        const [{ items: wh }, { items: tn }, { items: whAdmins }, { items: tenantAdmins }] = await Promise.all([
          warehousesApi.listWarehouses({ limit: 100 }),
          tenantsApi.listTenants({ limit: 100 }),
          usersApi.listUsers({ role: 'WH_ADMIN', limit: 200 }),
          usersApi.listUsers({ role: 'TENANT_ADMIN', limit: 200 }),
        ])
        if (cancelled) return
        setWarehouses(wh.map((w) => ({ id: w.warehouseId, label: `${w.warehouseCode} — ${w.warehouseName}` })))
        setTenants(tn)
        const adminMap = new Map<string, ApiUser>()
        for (const u of whAdmins) {
          if (u.warehouseId) adminMap.set(u.warehouseId, u)
        }
        setWhAdminByWarehouse(adminMap)
        const tenantAdminMap = new Map<string, ApiUser>()
        for (const u of tenantAdmins) {
          if (u.tenantId) tenantAdminMap.set(u.tenantId, u)
        }
        setTenantAdminByTenant(tenantAdminMap)
      } catch {
        /* lists optional for UX */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isCreate, creatorRole])

  const applyTenantToForm = (tenant: ApiTenant | null) => {
    setSelectedTenant(tenant)
    if (!tenant) {
      setForm((prev) => ({ ...prev, tenantId: '' }))
      return
    }
    const status =
      tenant.status === 'ACTIVE'
        ? 'Active'
        : tenant.status === 'SUSPENDED'
          ? 'Suspended'
          : 'Active'
    setForm((prev) => ({
      ...prev,
      tenantId: tenant.tenantId,
      fullName: tenant.contactName?.trim() || prev.fullName,
      email: tenant.contactEmail?.trim() || prev.email,
      phone: tenant.contactPhone?.trim() || prev.phone,
      status,
    }))
  }

  const handleTenantChange = async (tenantId: string) => {
    if (!tenantId) {
      applyTenantToForm(null)
      return
    }
    let tenant = tenants.find((t) => t.tenantId === tenantId) ?? null
    try {
      tenant = await tenantsApi.getTenant(tenantId)
    } catch {
      /* dùng bản từ danh sách nếu GET lỗi */
    }
    applyTenantToForm(tenant)
  }

  const existingWhAdmin =
    form.role === 'WH_ADMIN' && form.warehouseId
      ? whAdminByWarehouse.get(form.warehouseId)
      : undefined
  const existingTenantAdmin =
    form.role === 'TENANT_ADMIN' && form.tenantId
      ? tenantAdminByTenant.get(form.tenantId)
      : undefined

  const handleSubmit = () => {
    setFormError(null)

    const fullNameError = requireTrimmed(form.fullName, 'Họ và tên')
    if (fullNameError) {
      setFormError({
        variant: 'warning',
        title: 'Thiếu họ tên',
        message: 'Vui lòng nhập họ tên người dùng.',
      })
      return
    }

    if (isCreate) {
      const emailError = requireEmail(form.email)
      if (emailError) {
        setFormError({
          variant: 'warning',
          title: emailError.includes('hợp lệ') ? 'Email không hợp lệ' : 'Thiếu email',
          message:
            emailError === 'Email là bắt buộc'
              ? 'Vui lòng nhập địa chỉ email để tạo tài khoản đăng nhập.'
              : 'Địa chỉ email không đúng định dạng (vd: user@example.com).',
        })
        return
      }
    }

    const phoneError = validatePhone(form.phone)
    if (phoneError) {
      setFormError({
        variant: 'warning',
        title: phoneError.includes('email') ? 'Số điện thoại không hợp lệ' : 'Số điện thoại không đúng',
        message: phoneError,
        field: 'phone',
      })
      return
    }

    if (isCreate) {
      const passwordError = requireMinPassword(form.password)
      if (passwordError) {
        setFormError({
          variant: 'warning',
          title: !form.password.trim() ? 'Thiếu mật khẩu' : 'Mật khẩu quá ngắn',
          message:
            passwordError === 'Mật khẩu là bắt buộc'
              ? 'Mật khẩu ban đầu là bắt buộc khi tạo tài khoản mới. Nhập mật khẩu tối thiểu 8 ký tự và xác nhận lại bên cạnh.'
              : passwordError,
          field: 'password',
        })
        return
      }
    }

    if (
      (isCreate || form.password.trim() || form.confirmPassword.trim()) &&
      form.password !== form.confirmPassword
    ) {
      setFormError({
        variant: 'warning',
        title: 'Mật khẩu không khớp',
        message: 'Hai ô mật khẩu phải giống nhau. Kiểm tra lại và thử lưu.',
        field: 'confirmPassword',
      })
      return
    }

    if (isCreate && creatorRole === 'SYSTEM_ADMIN') {
      if (form.role === 'WH_ADMIN' && !form.warehouseId) {
        setFormError({
          variant: 'warning',
          title: 'Chưa chọn kho',
          message: 'Warehouse Admin phải được gán với một kho cụ thể.',
        })
        return
      }
      if (form.role === 'WH_ADMIN' && existingWhAdmin) {
        setFormError({
          variant: 'warning',
          title: 'Kho đã có quản trị',
          message: `Kho này đã có Warehouse Admin: ${existingWhAdmin.fullName} (${existingWhAdmin.email}). Mỗi kho chỉ được một WH Admin.`,
        })
        return
      }
      if (form.role === 'TENANT_ADMIN' && !form.tenantId) {
        setFormError({
          variant: 'warning',
          title: 'Chưa chọn tenant',
          message: 'Tenant Admin phải được gán với một tenant cụ thể.',
        })
        return
      }
      if (form.role === 'TENANT_ADMIN' && existingTenantAdmin) {
        setFormError({
          variant: 'warning',
          title: 'Tenant đã có quản trị',
          message: `Tenant này đã có Tenant Admin: ${existingTenantAdmin.fullName} (${existingTenantAdmin.email}).`,
        })
        return
      }
    }

    onSubmit?.({
      fullName: form.fullName,
      email: form.email,
      phone: formatPhoneForSubmit(form.phone),
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

        <div className={MODAL_BODY_SCROLL_SPACE}>
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-cyan-400">THÔNG TIN CÁ NHÂN</h3>

            <div>
              <label className={labelStyle}>Họ và tên</label>
              <input
                title="Họ và tên"
                placeholder="Nguyễn Văn A"
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
                  title="Email"
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
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  title="Số điện thoại"
                  placeholder="0901234567"
                  disabled={isView}
                  className={`${inputStyle}${
                    formError?.field === 'phone'
                      ? ' border-amber-400/50 ring-1 ring-amber-400/30'
                      : ''
                  }`}
                  value={form.phone}
                  onChange={(e) => {
                    setFormError(null)
                    setForm({ ...form, phone: e.target.value })
                  }}
                />
                {!isView && (
                  <p className="mt-1 text-[10px] text-slate-500">
                    Tùy chọn — 10 số, bắt đầu bằng 03/05/07/08/09
                  </p>
                )}
                {formError?.field === 'phone' && (
                  <InlineAlert
                    compact
                    hideTitle
                    variant="warning"
                    className="mt-2"
                    message={formError.message}
                    onDismiss={() => setFormError(null)}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Vai trò</label>
                {isCreate && roleOptions.length > 0 ? (
                  <select
                    title="Vai trò"
                    className={inputStyle}
                    value={form.role}
                    onChange={(e) => {
                      setSelectedTenant(null)
                      setForm({
                        ...form,
                        role: e.target.value as UserRole,
                        warehouseId: '',
                        tenantId: '',
                      })
                    }}
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    title="Vai trò"
                    placeholder="Vai trò"
                    disabled
                    className={inputStyle}
                    value={displayRole(form.role)}
                  />
                )}
              </div>

              <div>
                <label className={labelStyle}>Trạng thái</label>
                {isView ? (
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ring-1 ${statusBadgeClass(form.status)}`}
                  >
                    {form.status === 'Active'
                      ? 'Đang hoạt động'
                      : form.status === 'Suspended'
                        ? 'Tạm ngưng'
                        : 'Vô hiệu hóa'}
                  </span>
                ) : (
                  <select
                    title="Trạng thái"
                    className={inputStyle}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="Active">Đang hoạt động</option>
                    <option value="Inactive">Vô hiệu hóa</option>
                    {creatorRole === 'SYSTEM_ADMIN' && (
                      <option value="Suspended">Tạm ngưng</option>
                    )}
                  </select>
                )}
                {!isView &&
                  !isCreate &&
                  creatorRole === 'SYSTEM_ADMIN' &&
                  ['WH_ADMIN', 'TENANT_ADMIN'].includes(form.role) &&
                  form.status !== 'Active' && (
                    <InlineAlert
                      compact
                      variant="info"
                      title="Vô hiệu hóa quản trị"
                      className="mt-2"
                      message={
                        form.role === 'TENANT_ADMIN'
                          ? 'Chỉ khóa Tenant Admin khi tenant không còn hợp đồng đang hiệu lực. Sau khi tenant chấm dứt HĐ (TERMINATED), System Admin có thể vô hiệu hóa tài khoản.'
                          : 'Chỉ khóa Warehouse Admin khi kho không còn hợp đồng đang hiệu lực — HĐ phải hết hạn hoặc được chấm dứt trước.'
                      }
                    />
                  )}
              </div>
            </div>

            {isCreate && creatorRole === 'SYSTEM_ADMIN' && form.role === 'WH_ADMIN' && (
              <div>
                <label className={labelStyle} htmlFor="account-warehouse">
                  Kho (bắt buộc)
                </label>
                <select
                  id="account-warehouse"
                    title="Kho"
                  className={inputStyle}
                  value={form.warehouseId}
                  onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                >
                  <option value="">— Chọn kho —</option>
                  {warehouses.map((w) => {
                    const taken = whAdminByWarehouse.has(w.id)
                    return (
                      <option key={w.id} value={w.id} disabled={taken}>
                        {w.label}
                        {taken ? ' — đã có WH Admin' : ''}
                      </option>
                    )
                  })}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">
                  Mỗi kho chỉ được gán một Warehouse Admin
                </p>
                {existingWhAdmin && (
                  <InlineAlert
                    compact
                    variant="warning"
                    hideTitle
                    className="mt-2"
                    message={
                      <>
                        Kho đã có WH Admin: <strong>{existingWhAdmin.fullName}</strong> (
                        {existingWhAdmin.email}). Chọn kho khác hoặc dùng tài khoản hiện có.
                      </>
                    }
                  />
                )}
              </div>
            )}

            {isCreate && creatorRole === 'SYSTEM_ADMIN' && form.role === 'TENANT_ADMIN' && (
              <>
                <div>
                  <label className={labelStyle} htmlFor="account-tenant">
                    Tenant (bắt buộc)
                  </label>
                  <select
                    id="account-tenant"
                    title="Tenant"
                    className={inputStyle}
                    value={form.tenantId}
                    onChange={(e) => handleTenantChange(e.target.value)}
                  >
                    <option value="">— Chọn tenant —</option>
                    {tenants
                      .filter((t) => !tenantAdminByTenant.has(t.tenantId))
                      .map((t) => (
                        <option key={t.tenantId} value={t.tenantId}>
                          {t.companyName}
                          {t.companyCode ? ` (${t.companyCode})` : ''}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Chỉ hiển thị tenant chưa có Tenant Admin
                  </p>
                </div>

                {selectedTenant && (
                  <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Thông tin tenant
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className={labelStyle}>Tên công ty</span>
                        <p className="text-white">{selectedTenant.companyName}</p>
                      </div>
                      <div>
                        <span className={labelStyle}>Mã công ty</span>
                        <p className="text-slate-300">{selectedTenant.companyCode || '—'}</p>
                      </div>
                      <div>
                        <span className={labelStyle}>Mã số thuế</span>
                        <p className="text-slate-300">{selectedTenant.taxCode || '—'}</p>
                      </div>
                      <div>
                        <span className={labelStyle}>Trạng thái tenant</span>
                        <p className="text-slate-300">{selectedTenant.status}</p>
                      </div>
                      <div className="col-span-2">
                        <span className={labelStyle}>Địa chỉ</span>
                        <p className="text-slate-300">{selectedTenant.address || '—'}</p>
                      </div>
                      <div>
                        <span className={labelStyle}>Người liên hệ</span>
                        <p className="text-slate-300">{selectedTenant.contactName || '—'}</p>
                      </div>
                      <div>
                        <span className={labelStyle}>Email liên hệ</span>
                        <p className="text-slate-300">{selectedTenant.contactEmail || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {!isView && (
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-4">
              <h3 className="text-sm font-semibold text-emerald-400">
                {isCreate ? 'MẬT KHẨU' : 'ĐỔI MẬT KHẨU'}
              </h3>
              {formError && (
                <InlineAlert
                  compact
                  variant={formError.variant}
                  title={formError.title}
                  message={formError.message}
                  onDismiss={() => setFormError(null)}
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>{isCreate ? 'Mật khẩu' : 'Mật khẩu mới'}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      title="Mật khẩu"
                      placeholder="Tối thiểu 8 ký tự"
                      className={`${inputStyle} pr-11${
                        formError?.field === 'password'
                          ? ' border-amber-400/50 ring-1 ring-amber-400/30'
                          : ''
                      }`}
                      value={form.password}
                      onChange={(e) => {
                        setFormError(null)
                        setForm({ ...form, password: e.target.value })
                      }}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                  {isCreate && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      Bắt buộc — dùng để đăng nhập lần đầu
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelStyle}>Xác nhận mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      title="Xác nhận mật khẩu"
                      placeholder="Nhập lại mật khẩu"
                      className={`${inputStyle} pr-11${
                        formError?.field === 'confirmPassword'
                          ? ' border-amber-400/50 ring-1 ring-amber-400/30'
                          : ''
                      }`}
                      value={form.confirmPassword}
                      onChange={(e) => {
                        setFormError(null)
                        setForm({ ...form, confirmPassword: e.target.value })
                      }}
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirmPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
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
