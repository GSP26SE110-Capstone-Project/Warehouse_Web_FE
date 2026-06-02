import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { changePassword } from '../../api/auth'
import * as usersApi from '../../api/users'
import type { ApiUser } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'

const ROLE_LABEL: Record<string, string> = {
  SYSTEM_ADMIN: 'System Admin',
  WH_ADMIN: 'Warehouse Admin',
  WH_STAFF: 'Warehouse Staff',
  WH_TRANSPORTER: 'Tài xế kho',
  TENANT_ADMIN: 'Tenant Admin',
  TENANT_STAFF: 'Tenant Staff',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Ngưng hoạt động',
  SUSPENDED: 'Tạm khóa',
  BLOCKED: 'Bị chặn',
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('vi-VN')
}

function userInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const Profile: React.FC = () => {
  const { user, syncUser } = useAuth()
  const [profile, setProfile] = useState<ApiUser | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [defaultVehiclePlate, setDefaultVehiclePlate] = useState('')
  const [defaultDriverIdNumber, setDefaultDriverIdNumber] = useState('')
  const [defaultCarrierName, setDefaultCarrierName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [profileSuccessModal, setProfileSuccessModal] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordSuccessModal, setPasswordSuccessModal] = useState(false)
  const profileAlertRef = useRef<HTMLDivElement>(null)
  const passwordAlertRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const me = await usersApi.getMe()
        if (!cancelled) {
          setProfile(me)
          setName(me.fullName)
          setPhone(me.phone ?? '')
          setDefaultVehiclePlate(me.defaultVehiclePlate ?? '')
          setDefaultDriverIdNumber(me.defaultDriverIdNumber ?? '')
          setDefaultCarrierName(me.defaultCarrierName ?? '')
        }
      } catch (err) {
        if (!cancelled) {
          if (user) {
            setProfile(user)
            setName(user.fullName)
            setPhone(user.phone ?? '')
            setDefaultVehiclePlate(user.defaultVehiclePlate ?? '')
            setDefaultDriverIdNumber(user.defaultDriverIdNumber ?? '')
            setDefaultCarrierName(user.defaultCarrierName ?? '')
            setError(
              err instanceof ApiError
                ? `${err.message} — đang hiển thị dữ liệu cache.`
                : 'Không tải được hồ sơ từ server — đang hiển thị dữ liệu cache.',
            )
          } else {
            setError(err instanceof ApiError ? err.message : 'Không tải được hồ sơ')
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // Chỉ tải lại khi đổi tài khoản (userId), tránh ghi đè form sau khi lưu.
  }, [user?.userId])

  const handleSaveProfile = async () => {
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedName) {
      setProfileError('Họ tên không được để trống.')
      profileAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }

    if (!profile) {
      setProfileError('Chưa tải xong hồ sơ. Vui lòng đợi và thử lại.')
      profileAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }

    setSaving(true)
    setProfileError('')
    setProfileMessage('')
    try {
      const updated = await usersApi.updateMe({
        fullName: trimmedName,
        phone: trimmedPhone || undefined,
        ...(profile.role === 'WH_TRANSPORTER'
          ? {
              defaultVehiclePlate: defaultVehiclePlate.trim().toUpperCase() || null,
              defaultDriverIdNumber: defaultDriverIdNumber.trim() || null,
              defaultCarrierName: defaultCarrierName.trim() || null,
            }
          : {}),
      })
      setProfile(updated)
      setName(updated.fullName)
      setPhone(updated.phone ?? '')
      setDefaultVehiclePlate(updated.defaultVehiclePlate ?? '')
      setDefaultDriverIdNumber(updated.defaultDriverIdNumber ?? '')
      setDefaultCarrierName(updated.defaultCarrierName ?? '')
      syncUser(updated)
      setProfileMessage('Đã cập nhật thông tin cá nhân.')
      setProfileSuccessModal(true)
      profileAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : 'Cập nhật thất bại')
      profileAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    const trimmedCurrent = currentPassword.trim()
    const trimmedNew = newPassword.trim()
    const trimmedConfirm = confirmPassword.trim()

    if (!trimmedCurrent) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.')
      passwordAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }
    if (trimmedNew.length < 8) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 8 ký tự.')
      passwordAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }
    if (trimmedNew !== trimmedConfirm) {
      setPasswordError('Xác nhận mật khẩu mới không khớp.')
      passwordAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }

    setChangingPassword(true)
    try {
      await changePassword({ currentPassword: trimmedCurrent, newPassword: trimmedNew })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
      setPasswordSuccess('Đổi mật khẩu thành công. Lần đăng nhập sau hãy dùng mật khẩu mới.')
      setPasswordSuccessModal(true)
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Đổi mật khẩu thất bại')
      passwordAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } finally {
      setChangingPassword(false)
    }
  }

  const roleLabel = profile ? (ROLE_LABEL[profile.role] ?? profile.role) : ''
  const statusLabel = profile ? (STATUS_LABEL[profile.status] ?? profile.status) : ''
  const isTransporter = profile?.role === 'WH_TRANSPORTER'

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 text-slate-100 md:p-8">
      <LoadingOverlay
        show={loading || saving || changingPassword}
        text={changingPassword ? 'Đang đổi mật khẩu...' : saving ? 'Đang lưu...' : 'Đang tải...'}
      />

      <div className="mx-auto flex max-w-[900px] flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Hồ sơ cá nhân</h1>
          <p className="mt-1 text-sm text-slate-400">
            Xem và cập nhật thông tin tài khoản của bạn
          </p>
        </div>

        <div className="glass-panel flex items-center gap-6 rounded-xl border border-white/5 p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-2xl font-bold">
                {userInitials(name || profile?.fullName || '')}
              </div>
              <div>
                <h2 className="text-xl font-bold">{name || profile?.fullName}</h2>
                <p className="text-slate-400">{profile?.email}</p>
                <span className="mt-1 inline-block rounded bg-cyan-400/10 px-2 py-1 text-xs text-cyan-400">
                  {roleLabel}
                </span>
              </div>
            </div>

            {error && <InlineAlert variant="error" message={error} onDismiss={() => setError('')} />}

            <section className="glass-panel flex flex-col gap-6 rounded-xl border border-white/5 p-6">
              <div ref={profileAlertRef} className="flex flex-col gap-3">
                {profileError && (
                  <InlineAlert
                    variant="error"
                    message={profileError}
                    onDismiss={() => setProfileError('')}
                  />
                )}
                {!profileError && profileMessage && (
                  <InlineAlert
                    variant="success"
                    message={profileMessage}
                    onDismiss={() => setProfileMessage('')}
                  />
                )}
              </div>

              <h3 className="text-lg font-semibold">Thông tin cá nhân</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoField label="Họ tên">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#1a2333] p-3 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </InfoField>

                <InfoField label="Email">
                  <input
                    value={profile?.email ?? ''}
                    disabled
                    className="w-full rounded-lg border border-white/10 bg-[#1a2333]/60 p-3 text-slate-400"
                  />
                </InfoField>

                <InfoField label="Số điện thoại">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#1a2333] p-3 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </InfoField>

                <InfoField label="Vai trò">
                  <input
                    value={roleLabel}
                    disabled
                    className="w-full rounded-lg border border-white/10 bg-[#1a2333]/60 p-3 text-slate-400"
                  />
                </InfoField>

                <InfoField label="Trạng thái tài khoản">
                  <input
                    value={statusLabel}
                    disabled
                    className="w-full rounded-lg border border-white/10 bg-[#1a2333]/60 p-3 text-slate-400"
                  />
                </InfoField>

                <InfoField label="Ngày tạo tài khoản">
                  <input
                    value={formatDate(profile?.createdAt)}
                    disabled
                    className="w-full rounded-lg border border-white/10 bg-[#1a2333]/60 p-3 text-slate-400"
                  />
                </InfoField>

                {profile?.tenantId && (
                  <InfoField label="Tenant ID">
                    <input
                      value={profile.tenantId}
                      disabled
                      className="w-full rounded-lg border border-white/10 bg-[#1a2333]/60 p-3 font-mono text-xs text-slate-400"
                    />
                  </InfoField>
                )}

                {profile?.warehouseId && (
                  <InfoField label="Warehouse ID">
                    <input
                      value={profile.warehouseId}
                      disabled
                      className="w-full rounded-lg border border-white/10 bg-[#1a2333]/60 p-3 font-mono text-xs text-slate-400"
                    />
                  </InfoField>
                )}
              </div>

              {isTransporter && (
                <>
                  <h3 className="text-lg font-semibold">Thông tin xe / vận chuyển</h3>
                  <p className="text-xs text-slate-400">
                    WH Admin sẽ tự điền các trường này khi gán bạn vào chuyến lấy hàng.
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoField label="Biển số xe mặc định">
                      <input
                        value={defaultVehiclePlate}
                        onChange={(e) =>
                          setDefaultVehiclePlate(e.target.value.toUpperCase())
                        }
                        placeholder="51F-12345"
                        className="w-full rounded-lg border border-white/10 bg-[#1a2333] p-3 font-mono text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </InfoField>
                    <InfoField label="CCCD / GPLX">
                      <input
                        value={defaultDriverIdNumber}
                        onChange={(e) => setDefaultDriverIdNumber(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#1a2333] p-3 text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </InfoField>
                    <InfoField label="Đơn vị vận chuyển" className="md:col-span-2">
                      <input
                        value={defaultCarrierName}
                        onChange={(e) => setDefaultCarrierName(e.target.value)}
                        placeholder="Tên công ty / đội xe"
                        className="w-full rounded-lg border border-white/10 bg-[#1a2333] p-3 text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </InfoField>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving || loading || !profile}
                className="self-start rounded-lg bg-cyan-500 px-6 py-2 font-bold text-black disabled:opacity-50"
              >
                Lưu thay đổi
              </button>
            </section>

            <section className="glass-panel flex flex-col gap-6 rounded-xl border border-white/5 p-6">
              <div ref={passwordAlertRef} className="flex flex-col gap-3">
                {passwordError && (
                  <InlineAlert
                    variant="error"
                    message={passwordError}
                    onDismiss={() => setPasswordError('')}
                  />
                )}
                {!passwordError && passwordSuccess && (
                  <InlineAlert
                    variant="success"
                    message={passwordSuccess}
                    onDismiss={() => setPasswordSuccess('')}
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Đổi mật khẩu</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Nhập mật khẩu hiện tại và mật khẩu mới 
                  </p>
                </div>
                {!showPasswordForm && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(true)}
                    className="rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-400/10"
                  >
                    Đổi mật khẩu
                  </button>
                )}
              </div>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoField label="Mật khẩu hiện tại" className="md:col-span-2">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-white/10 bg-[#1a2333] p-3 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </InfoField>

                  <InfoField label="Mật khẩu mới">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-white/10 bg-[#1a2333] p-3 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </InfoField>

                  <InfoField label="Xác nhận mật khẩu mới">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-white/10 bg-[#1a2333] p-3 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </InfoField>

                  <label className="flex items-center gap-2 text-sm text-slate-400 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={showPasswords}
                      onChange={(e) => setShowPasswords(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    Hiển thị mật khẩu
                  </label>

                  <div className="flex flex-wrap gap-3 md:col-span-2">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="rounded-lg bg-cyan-500 px-6 py-2 font-bold text-black disabled:opacity-50"
                    >
                      Xác nhận đổi mật khẩu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                        setPasswordError('')
                      }}
                      className="rounded-lg border border-white/10 px-6 py-2 text-slate-300 hover:bg-white/5"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </section>
      </div>

      {profileSuccessModal && (
        <AlertModal
          type="success"
          title="Lưu thành công"
          message="Thông tin cá nhân đã được cập nhật."
          onClose={() => setProfileSuccessModal(false)}
        />
      )}

      {passwordSuccessModal && (
        <AlertModal
          type="success"
          title="Đổi mật khẩu thành công"
          message="Mật khẩu đã được cập nhật. Lần đăng nhập sau hãy dùng mật khẩu mới."
          onClose={() => setPasswordSuccessModal(false)}
        />
      )}
    </div>
  )
}

function InfoField({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm text-slate-400">{label}</label>
      {children}
    </div>
  )
}
