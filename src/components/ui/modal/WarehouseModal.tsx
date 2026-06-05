import { useState, useEffect, useMemo } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import { fetchLocationTree, type LocationCity } from '../../../api/locations'
import { listUsers } from '../../../api/users'
import type { ApiUser, WarehouseStatus } from '../../../api/types'
import type { WarehouseWhAdmin } from '../../../types/Warehouse'
import { SearchableSelect } from '../SearchableSelect'
import { useAuth } from '../../../auth/AuthContext'

type Mode = 'create' | 'edit' | 'view'

export type WarehouseAdminAssignment =
  | { mode: 'skip' }
  | {
      mode: 'create'
      fullName: string
      email: string
      password: string
      phone: string
    }
  | { mode: 'existing'; userId: string }

export type WarehouseFormPayload = {
  warehouseCode: string
  warehouseName: string
  address: string
  city: string
  district: string
  totalAreaM2: number | null
  usableAreaM2: number | null
  status: WarehouseStatus
  warehouseAdmin: WarehouseAdminAssignment
}

type WarehouseModalData = Partial<WarehouseFormPayload> & {
  warehouseId?: string
  whAdmin?: WarehouseWhAdmin | null
}

type Props = {
  mode: Mode
  data?: WarehouseModalData
  isDarkMode: boolean // Nhận trạng thái dark mode từ parent component dựa trên role
  onClose: () => void
  onSubmit?: (data: WarehouseFormPayload) => void | Promise<void>
}

const STATUS_OPTIONS: { value: WarehouseStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Ngưng hoạt động' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
  { value: 'CLOSED', label: 'Đóng cửa' },
]

const emptyForm: WarehouseFormPayload = {
  warehouseCode: '',
  warehouseName: '',
  address: '',
  city: '',
  district: '',
  totalAreaM2: null,
  usableAreaM2: null,
  status: 'ACTIVE',
  warehouseAdmin: { mode: 'skip' },
}

function parseArea(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) && n >= 0 ? n : null
}

function dataToForm(data?: WarehouseModalData): WarehouseFormPayload {
  if (!data) return { ...emptyForm }
  return {
    warehouseCode: data.warehouseCode ?? '',
    warehouseName: data.warehouseName ?? '',
    address: data.address ?? '',
    city: data.city ?? '',
    district: data.district ?? '',
    totalAreaM2: data.totalAreaM2 ?? null,
    usableAreaM2: data.usableAreaM2 ?? null,
    status: (data.status as WarehouseStatus) ?? 'ACTIVE',
    warehouseAdmin: { mode: 'skip' },
  }
}

export const WarehouseModal: React.FC<Props> = ({ mode, data, isDarkMode, onClose, onSubmit }) => {
  const isView = mode === 'view'
  const [form, setForm] = useState<WarehouseFormPayload>(() => dataToForm(data))
  const [totalAreaInput, setTotalAreaInput] = useState('')
  const [usableAreaInput, setUsableAreaInput] = useState('')
  const [validationError, setValidationError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [cities, setCities] = useState<LocationCity[]>([])
  const [locationsLoading, setLocationsLoading] = useState(true)

  const currentWhAdmin = data?.whAdmin ?? null
  const [assignWhAdmin, setAssignWhAdmin] = useState(
    mode === 'create' || (mode === 'edit' && !currentWhAdmin)
  )
  const [whAdminMode, setWhAdminMode] = useState<'create' | 'existing'>('create')
  const [whAdminUserId, setWhAdminUserId] = useState('')
  const [whAdminFullName, setWhAdminFullName] = useState('')
  const [whAdminEmail, setWhAdminEmail] = useState('')
  const [whAdminPassword, setWhAdminPassword] = useState('')
  const [whAdminPasswordConfirm, setWhAdminPasswordConfirm] = useState('')
  const [whAdminPhone, setWhAdminPhone] = useState('')
  const [unassignedWhAdmins, setUnassignedWhAdmins] = useState<ApiUser[]>([])
  const [whAdminsLoading, setWhAdminsLoading] = useState(false)

  useEffect(() => {
    setForm(dataToForm(data))
    setTotalAreaInput(data?.totalAreaM2 != null ? String(data.totalAreaM2) : '')
    setUsableAreaInput(data?.usableAreaM2 != null ? String(data.usableAreaM2) : '')
  }, [data])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLocationsLoading(true)
      try {
        const tree = await fetchLocationTree()
        if (!cancelled) setCities(tree.cities ?? [])
      } catch {
        if (!cancelled) setCities([])
      } finally {
        if (!cancelled) setLocationsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setAssignWhAdmin(mode === 'create' || (mode === 'edit' && !currentWhAdmin))
    setWhAdminUserId('')
    setWhAdminFullName('')
    setWhAdminEmail('')
    setWhAdminPassword('')
    setWhAdminPasswordConfirm('')
    setWhAdminPhone('')
    setWhAdminMode('create')
  }, [data?.warehouseId, mode, data?.whAdmin?.userId])

  useEffect(() => {
    const needsList =
      (mode === 'create' || mode === 'edit') && assignWhAdmin && whAdminMode === 'existing'
    if (!needsList) return
    let cancelled = false
    ;(async () => {
      setWhAdminsLoading(true)
      try {
        const { items } = await listUsers({ role: 'WH_ADMIN', limit: 100 })
        if (!cancelled) {
          setUnassignedWhAdmins(items.filter((u) => !u.warehouseId))
        }
      } catch {
        if (!cancelled) setUnassignedWhAdmins([])
      } finally {
        if (!cancelled) setWhAdminsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mode, assignWhAdmin, whAdminMode])

  const cityOptions = useMemo(
    () => [
      { value: '', label: '— Chọn tỉnh / thành phố —' },
      ...cities.map((c) => ({ value: c.cityName, label: c.cityName })),
    ],
    [cities]
  )

  const districtOptions = useMemo(() => {
    const city = cities.find((c) => c.cityName === form.city)
    const districts = city?.districts ?? []
    return [
      { value: '', label: '— Chọn quận / huyện —' },
      ...districts.map((d) => ({ value: d.districtName, label: d.districtName })),
    ]
  }, [cities, form.city])

  const handleSubmit = async () => {
    setValidationError('')
    if (!form.warehouseCode.trim() && mode === 'create') {
      setValidationError('Mã kho là bắt buộc')
      return
    }
    if (!form.warehouseName.trim()) {
      setValidationError('Tên kho là bắt buộc')
      return
    }
    if (!form.city.trim() || !form.district.trim()) {
      setValidationError('Thành phố và quận/huyện là bắt buộc để kho nhận yêu cầu thuê theo vùng')
      return
    }

    let warehouseAdmin: WarehouseAdminAssignment = { mode: 'skip' }
    if ((mode === 'create' || mode === 'edit') && assignWhAdmin) {
      if (whAdminMode === 'existing') {
        if (!whAdminUserId) {
          setValidationError('Chọn Warehouse Admin để gán vào kho')
          return
        }
        warehouseAdmin = { mode: 'existing', userId: whAdminUserId }
      } else {
        if (!whAdminFullName.trim() || !whAdminEmail.trim() || !whAdminPassword) {
          setValidationError('Nhập đủ họ tên, email và mật khẩu cho Warehouse Admin')
          return
        }
        if (whAdminPassword !== whAdminPasswordConfirm) {
          setValidationError('Mật khẩu xác nhận không khớp')
          return
        }
        warehouseAdmin = {
          mode: 'create',
          fullName: whAdminFullName.trim(),
          email: whAdminEmail.trim().toLowerCase(),
          password: whAdminPassword,
          phone: whAdminPhone.trim(),
        }
      }
    }

    const payload: WarehouseFormPayload = {
      ...form,
      warehouseCode: form.warehouseCode.trim(),
      warehouseName: form.warehouseName.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      totalAreaM2: parseArea(totalAreaInput),
      usableAreaM2: parseArea(usableAreaInput),
      warehouseAdmin,
    }

    if (payload.usableAreaM2 != null && payload.totalAreaM2 != null) {
      if (payload.usableAreaM2 > payload.totalAreaM2) {
        setValidationError('Diện tích sử dụng không được lớn hơn tổng diện tích')
        return
      }
    }

    setSubmitting(true)
    try {
      await onSubmit?.(payload)
      onClose()
    } catch {
      // Bắt lỗi nếu có từ API
    } finally {
      setSubmitting(false)
    }
  }

  // Quản lý biến Style động dựa trên prop isDarkMode
  const labelStyle = `text-[11px] font-bold uppercase tracking-wider mb-1.5 block ${
    isDarkMode ? 'text-slate-500' : 'text-slate-600'
  }`

  const inputStyle = `w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${
    isDarkMode
      ? 'bg-[#1a2333] border border-white/10 text-white focus:border-cyan-400 focus:ring-cyan-400/30'
      : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500/30'
  }`

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === form.status)?.label ?? form.status

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div
        className={`absolute inset-0 backdrop-blur-sm transition-opacity ${
          isDarkMode ? 'bg-[#0b101a]/90' : 'bg-slate-900/40'
        }`}
        onClick={onClose}
      />

      {/* Main Container */}
      <div
        className={`relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl shadow-2xl transition-all border ${
          isDarkMode ? 'border-white/5 bg-[#0b101a]' : 'border-slate-200 bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-6 py-5 ${
            isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <h2 className={`flex items-center gap-2 text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <span className={`material-symbols-outlined ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
              warehouse
            </span>
            {mode === 'create' ? 'Tạo kho' : mode === 'edit' ? 'Chỉnh sửa kho' : 'Chi tiết kho'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded p-2 transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-200/60'}`}
          >
            <span className={`material-symbols-outlined ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              close
            </span>
          </button>
        </div>

        {/* Form Body Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {validationError && (
            <InlineAlert compact hideTitle message={validationError} onDismiss={() => setValidationError('')} />
          )}

          <div
            className={`space-y-4 rounded-lg border p-4 ${
              isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'
            }`}
          >
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
              THÔNG TIN KHO
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelStyle} htmlFor="wh-code">Mã kho</label>
                <input
                  id="wh-code"
                  disabled={mode !== 'create'}
                  className={inputStyle}
                  value={form.warehouseCode}
                  placeholder="WH-HCM-02"
                  onChange={(e) => setForm({ ...form, warehouseCode: e.target.value })}
                />
              </div>
              <div>
                <label className={labelStyle} htmlFor="wh-name">Tên kho</label>
                <input
                  id="wh-name"
                  disabled={isView}
                  className={inputStyle}
                  value={form.warehouseName}
                  onChange={(e) => setForm({ ...form, warehouseName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className={labelStyle} htmlFor="wh-address">Địa chỉ</label>
              <input
                id="wh-address"
                disabled={isView}
                className={inputStyle}
                value={form.address}
                placeholder="Số nhà, đường..."
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelStyle} htmlFor="wh-city">Tỉnh / thành phố</label>
                <SearchableSelect
                  id="wh-city"
                  required
                  disabled={isView}
                  loading={locationsLoading}
                  value={form.city}
                  onChange={(city) => setForm({ ...form, city, district: '' })}
                  options={cityOptions}
                  placeholder="Chọn thành phố..."
                  isDarkMode={isDarkMode} // Đã sửa: Truyền prop đồng bộ theme
                />
              </div>
              <div>
                <label className={labelStyle} htmlFor="wh-district">Quận / huyện</label>
                <SearchableSelect
                  id="wh-district"
                  required
                  disabled={isView || !form.city}
                  loading={locationsLoading}
                  value={form.district}
                  onChange={(district) => setForm({ ...form, district })}
                  options={districtOptions}
                  placeholder={form.city ? 'Chọn quận/huyện...' : 'Chọn thành phố trước'}
                  isDarkMode={isDarkMode} // Đã sửa: Truyền prop đồng bộ theme
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelStyle} htmlFor="wh-total-area">Tổng diện tích (m²)</label>
                <input
                  id="wh-total-area"
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={isView}
                  className={inputStyle}
                  value={totalAreaInput}
                  placeholder="VD: 5000"
                  onChange={(e) => setTotalAreaInput(e.target.value)}
                />
              </div>
              <div>
                <label className={labelStyle} htmlFor="wh-usable-area">Diện tích sử dụng (m²)</label>
                <input
                  id="wh-usable-area"
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={isView}
                  className={inputStyle}
                  value={usableAreaInput}
                  placeholder="VD: 4200"
                  onChange={(e) => setUsableAreaInput(e.target.value)}
                />
                <p className={`mt-1 text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Hiển thị cho guest khi xem kho theo vùng
                </p>
              </div>
            </div>

            {/* Warehouse Admin Subsection */}
            {(mode === 'view' || mode === 'create' || mode === 'edit') && (
              <div
                className={`space-y-4 rounded-lg border p-4 ${
                  isDarkMode ? 'border-cyan-400/20 bg-cyan-400/5' : 'border-blue-200 bg-blue-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-cyan-300' : 'text-blue-700'}`}>
                      Warehouse Admin
                    </h3>
                    <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Tài khoản <strong>WH_ADMIN</strong> quản lý kho này.
                    </p>
                  </div>
                  {(mode === 'create' || mode === 'edit') && (
                    <label className={`flex cursor-pointer items-center gap-2 text-sm select-none font-medium ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={assignWhAdmin}
                        onChange={(e) => setAssignWhAdmin(e.target.checked)}
                        className={`rounded ${
                          isDarkMode ? 'border-white/20 bg-slate-900 text-cyan-500 focus:ring-cyan-400/30' : 'border-slate-300 text-blue-600 focus:ring-blue-500/30'
                        }`}
                      />
                      {currentWhAdmin ? 'Đổi admin' : 'Gán admin'}
                    </label>
                  )}
                </div>

                {mode === 'view' && (
                  <div className={`rounded-lg border p-4 ${isDarkMode ? 'border-white/10 bg-[#1a2333]/80' : 'border-slate-200 bg-white'}`}>
                    {currentWhAdmin ? (
                      <div className="space-y-1 text-sm">
                        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{currentWhAdmin.fullName}</p>
                        <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{currentWhAdmin.email}</p>
                        {currentWhAdmin.phone && (
                          <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{currentWhAdmin.phone}</p>
                        )}
                      </div>
                    ) : (
                      <p className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                        <span className="material-symbols-outlined text-lg">warning</span>
                        Kho chưa có Warehouse Admin
                      </p>
                    )}
                  </div>
                )}

                {mode === 'edit' && currentWhAdmin && !assignWhAdmin && (
                  <div className={`rounded-lg border p-4 text-sm ${isDarkMode ? 'border-white/10 bg-[#1a2333]/80' : 'border-slate-200 bg-white'}`}>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{currentWhAdmin.fullName}</p>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{currentWhAdmin.email}</p>
                  </div>
                )}

                {(mode === 'create' || mode === 'edit') && assignWhAdmin && (
                  <>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setWhAdminMode('create')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          whAdminMode === 'create'
                            ? isDarkMode ? 'bg-cyan-500 text-black shadow-md' : 'bg-blue-600 text-white shadow-sm'
                            : isDarkMode ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        Tạo tài khoản mới
                      </button>
                      <button
                        type="button"
                        onClick={() => setWhAdminMode('existing')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          whAdminMode === 'existing'
                            ? isDarkMode ? 'bg-cyan-500 text-black shadow-md' : 'bg-blue-600 text-white shadow-sm'
                            : isDarkMode ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        Gán user có sẵn
                      </button>
                    </div>

                    {whAdminMode === 'create' ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className={labelStyle} htmlFor="wh-admin-name">Họ tên</label>
                          <input
                            id="wh-admin-name"
                            className={inputStyle}
                            value={whAdminFullName}
                            onChange={(e) => setWhAdminFullName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                          />
                        </div>
                        <div>
                          <label className={labelStyle} htmlFor="wh-admin-email">Email đăng nhập</label>
                          <input
                            id="wh-admin-email"
                            type="email"
                            className={inputStyle}
                            value={whAdminEmail}
                            onChange={(e) => setWhAdminEmail(e.target.value)}
                            placeholder="example@gmail.com"
                          />
                        </div>
                        <div>
                          <label className={labelStyle} htmlFor="wh-admin-phone">Số điện thoại</label>
                          <input
                            id="wh-admin-phone"
                            className={inputStyle}
                            value={whAdminPhone}
                            onChange={(e) => setWhAdminPhone(e.target.value)}
                            placeholder="090xxxxxxx"
                          />
                        </div>
                        <div>
                          <label className={labelStyle} htmlFor="wh-admin-pw">Mật khẩu</label>
                          <input
                            id="wh-admin-pw"
                            type="password"
                            className={inputStyle}
                            value={whAdminPassword}
                            onChange={(e) => setWhAdminPassword(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={labelStyle} htmlFor="wh-admin-pw2">Xác nhận mật khẩu</label>
                          <input
                            id="wh-admin-pw2"
                            type="password"
                            className={inputStyle}
                            value={whAdminPasswordConfirm}
                            onChange={(e) => setWhAdminPasswordConfirm(e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className={labelStyle} htmlFor="wh-admin-existing">WH Admin chưa gán kho</label>
                        {whAdminsLoading ? (
                          <p className={`text-xs italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Đang tải danh sách...</p>
                        ) : unassignedWhAdmins.length === 0 ? (
                          <p className={`text-xs p-2.5 rounded-lg border font-medium ${
                            isDarkMode ? 'text-amber-300 bg-amber-950/20 border-amber-900/50' : 'text-amber-800 bg-amber-50 border-amber-200'
                          }`}>
                            Không có WH Admin trống — chọn "Tạo tài khoản mới" hoặc tạo user tại Quản lý tài khoản.
                          </p>
                        ) : (
                          <select
                            id="wh-admin-existing"
                            className={`w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${
                              isDarkMode
                                ? 'bg-[#1a2333] border border-white/10 text-white focus:border-cyan-400 focus:ring-cyan-400/30'
                                : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500/30'
                            }`}
                            value={whAdminUserId}
                            onChange={(e) => setWhAdminUserId(e.target.value)}
                          >
                            <option value="" className={isDarkMode ? 'bg-[#1a2333]' : 'bg-white'}>— Chọn user —</option>
                            {unassignedWhAdmins.map((u) => (
                              <option key={u.userId} value={u.userId} className={isDarkMode ? 'bg-[#1a2333]' : 'bg-white'}>
                                {u.fullName} ({u.email})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div>
              <label className={labelStyle} htmlFor="wh-status">Trạng thái</label>
              {isView ? (
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                  isDarkMode
                    ? 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                }`}>
                  {statusLabel}
                </span>
              ) : (
                <select
                  id="wh-status"
                  className={`w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${
                    isDarkMode
                      ? 'bg-[#1a2333] border border-white/10 text-white focus:border-cyan-400 focus:ring-cyan-400/30'
                      : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500/30'
                  }`}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as WarehouseStatus })}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className={isDarkMode ? 'bg-[#1a2333]' : 'bg-white'}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={`flex items-center justify-between border-t px-6 py-4 ${
            isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {isDarkMode ? 'System Admin · Toàn quyền tối cao' : 'Warehouse Admin · Quản lý khu vực'}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Đóng
            </button>
            {!isView && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {submitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo kho' : 'Cập nhật'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}