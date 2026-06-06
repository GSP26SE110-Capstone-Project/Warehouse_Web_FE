import { useState, useEffect, useMemo } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import { MODAL_BODY_SCROLL_SPACE } from '../../../styles/scrollClasses'
import { CodeInputWithGenerate } from '../CodeInputWithGenerate'
import { generateWarehouseCode } from '../../../utils/codeGenerators'
import { fetchLocationTree, type LocationCity } from '../../../api/locations'
import { listUsers } from '../../../api/users'
import type { ApiUser, WarehouseStatus } from '../../../api/types'
import type { WarehouseWhAdmin } from '../../../types/Warehouse'
import { SearchableSelect } from '../SearchableSelect'
import { formatPhoneForSubmit, validatePhone } from '../../../utils/formValidation'

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
  existingWarehouseCodes?: string[]
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

export const WarehouseModal: React.FC<Props> = ({
  mode,
  data,
  existingWarehouseCodes = [],
  onClose,
  onSubmit,
}) => {
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
        const whAdminPhoneError = validatePhone(whAdminPhone)
        if (whAdminPhoneError) {
          setValidationError(whAdminPhoneError)
          return
        }
        warehouseAdmin = {
          mode: 'create',
          fullName: whAdminFullName.trim(),
          email: whAdminEmail.trim().toLowerCase(),
          password: whAdminPassword,
          phone: formatPhoneForSubmit(whAdminPhone),
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
    } finally {
      setSubmitting(false)
    }
  }

  const labelStyle =
    'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'

  const inputStyle =
    'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all disabled:opacity-50'

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === form.status)?.label ?? form.status

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="material-symbols-outlined text-cyan-400">warehouse</span>
            {mode === 'create' ? 'Tạo kho' : mode === 'edit' ? 'Chỉnh sửa kho' : 'Chi tiết kho'}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-2 hover:bg-white/10">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className={MODAL_BODY_SCROLL_SPACE}>
          {validationError && (
            <InlineAlert compact hideTitle message={validationError} onDismiss={() => setValidationError('')} />
          )}

          <div className="space-y-4 rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold text-cyan-400">THÔNG TIN KHO</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelStyle} htmlFor="wh-code">
                  Mã kho
                </label>
                <CodeInputWithGenerate
                  id="wh-code"
                  readOnly={mode !== 'create'}
                  disabled={mode !== 'create'}
                  inputClassName={inputStyle}
                  value={form.warehouseCode}
                  placeholder="WH-HCM-02"
                  generateTitle="Sinh mã kho từ thành phố"
                  onChange={(warehouseCode) => setForm({ ...form, warehouseCode })}
                  onGenerate={() =>
                    generateWarehouseCode(form.city, [
                      ...existingWarehouseCodes,
                      form.warehouseCode,
                    ])
                  }
                />
              </div>
              <div>
                <label className={labelStyle} htmlFor="wh-name">
                  Tên kho
                </label>
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
              <label className={labelStyle} htmlFor="wh-address">
                Địa chỉ
              </label>
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
                <label className={labelStyle} htmlFor="wh-city">
                  Tỉnh / thành phố
                </label>
                <SearchableSelect
                  id="wh-city"
                  required
                  disabled={isView}
                  loading={locationsLoading}
                  value={form.city}
                  onChange={(city) => setForm({ ...form, city, district: '' })}
                  options={cityOptions}
                  placeholder="Chọn thành phố..."
                />
                <p className="mt-1 text-[10px] text-slate-500">Dùng để claim yêu cầu thuê regional</p>
              </div>
              <div>
                <label className={labelStyle} htmlFor="wh-district">
                  Quận / huyện
                </label>
                <SearchableSelect
                  id="wh-district"
                  required
                  disabled={isView || !form.city}
                  loading={locationsLoading}
                  value={form.district}
                  onChange={(district) => setForm({ ...form, district })}
                  options={districtOptions}
                  placeholder={form.city ? 'Chọn quận/huyện...' : 'Chọn thành phố trước'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelStyle} htmlFor="wh-total-area">
                  Tổng diện tích (m²)
                </label>
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
                <label className={labelStyle} htmlFor="wh-usable-area">
                  Diện tích sử dụng (m²)
                </label>
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
                <p className="mt-1 text-[10px] text-slate-500">Hiển thị cho guest khi xem kho theo vùng</p>
              </div>
            </div>

            {(mode === 'view' || mode === 'create' || mode === 'edit') && (
              <div className="space-y-4 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-cyan-300">Warehouse Admin</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Tài khoản <strong>WH_ADMIN</strong> quản lý kho này.
                    </p>
                  </div>
                  {(mode === 'create' || mode === 'edit') && (
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={assignWhAdmin}
                        onChange={(e) => setAssignWhAdmin(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      {currentWhAdmin ? 'Đổi admin' : 'Gán admin'}
                    </label>
                  )}
                </div>

                {mode === 'view' && (
                  <div className="rounded-lg border border-white/10 bg-[#1a2333]/80 p-4">
                    {currentWhAdmin ? (
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-white">{currentWhAdmin.fullName}</p>
                        <p className="text-slate-400">{currentWhAdmin.email}</p>
                        {currentWhAdmin.phone && (
                          <p className="text-slate-500">{currentWhAdmin.phone}</p>
                        )}
                      </div>
                    ) : (
                      <p className="flex items-center gap-2 text-sm text-amber-300">
                        <span className="material-symbols-outlined text-lg">warning</span>
                        Kho chưa có Warehouse Admin
                      </p>
                    )}
                  </div>
                )}

                {mode === 'edit' && currentWhAdmin && !assignWhAdmin && (
                  <div className="rounded-lg border border-white/10 bg-[#1a2333]/80 p-4 text-sm">
                    <p className="font-medium text-white">{currentWhAdmin.fullName}</p>
                    <p className="text-slate-400">{currentWhAdmin.email}</p>
                  </div>
                )}

                {(mode === 'create' || mode === 'edit') && assignWhAdmin && (
                  <>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setWhAdminMode('create')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                          whAdminMode === 'create'
                            ? 'bg-cyan-500 text-black'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        Tạo tài khoản mới
                      </button>
                      <button
                        type="button"
                        onClick={() => setWhAdminMode('existing')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                          whAdminMode === 'existing'
                            ? 'bg-cyan-500 text-black'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        Gán user có sẵn
                      </button>
                    </div>

                    {whAdminMode === 'create' ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className={labelStyle} htmlFor="wh-admin-name">
                            Họ tên
                          </label>
                          <input
                            id="wh-admin-name"
                            className={inputStyle}
                            value={whAdminFullName}
                            onChange={(e) => setWhAdminFullName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                          />
                        </div>
                        <div>
                          <label className={labelStyle} htmlFor="wh-admin-email">
                            Email đăng nhập
                          </label>
                          <input
                            id="wh-admin-email"
                            type="email"
                            className={inputStyle}
                            value={whAdminEmail}
                            onChange={(e) => setWhAdminEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={labelStyle} htmlFor="wh-admin-phone">
                            Số điện thoại
                          </label>
                          <input
                            id="wh-admin-phone"
                            type="tel"
                            inputMode="tel"
                            placeholder="0901234567"
                            className={inputStyle}
                            value={whAdminPhone}
                            onChange={(e) => setWhAdminPhone(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={labelStyle} htmlFor="wh-admin-pw">
                            Mật khẩu
                          </label>
                          <input
                            id="wh-admin-pw"
                            type="password"
                            className={inputStyle}
                            value={whAdminPassword}
                            onChange={(e) => setWhAdminPassword(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={labelStyle} htmlFor="wh-admin-pw2">
                            Xác nhận mật khẩu
                          </label>
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
                        <label className={labelStyle} htmlFor="wh-admin-existing">
                          WH Admin chưa gán kho
                        </label>
                        {whAdminsLoading ? (
                          <p className="text-xs text-slate-500">Đang tải...</p>
                        ) : unassignedWhAdmins.length === 0 ? (
                          <p className="text-xs text-amber-300">
                            Không có WH Admin trống — chọn &quot;Tạo tài khoản mới&quot; hoặc tạo user tại Quản lý tài khoản.
                          </p>
                        ) : (
                          <select
                            id="wh-admin-existing"
                            className={inputStyle}
                            value={whAdminUserId}
                            onChange={(e) => setWhAdminUserId(e.target.value)}
                          >
                            <option value="">— Chọn user —</option>
                            {unassignedWhAdmins.map((u) => (
                              <option key={u.userId} value={u.userId}>
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
              <label className={labelStyle} htmlFor="wh-status">
                Trạng thái
              </label>
              {isView ? (
                <span className="inline-flex rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-400/20 ring-inset">
                  {statusLabel}
                </span>
              ) : (
                <select
                  id="wh-status"
                  className={inputStyle}
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as WarehouseStatus })
                  }
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-6 py-4">
          <span className="text-xs text-slate-500">System Admin · quản lý kho</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Đóng
            </button>
            {!isView && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px] text-black">save</span>
                {submitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo kho' : 'Cập nhật'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
