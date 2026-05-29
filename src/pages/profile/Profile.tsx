import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import * as usersApi from '../../api/users'
import { useAuth } from '../../auth/AuthContext'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'

const ROLE_LABEL: Record<string, string> = {
  SYSTEM_ADMIN: 'System Admin',
  WH_ADMIN: 'Warehouse Admin',
  WH_STAFF: 'Warehouse Staff',
  WH_TRANSPORTER: 'Tài xế kho',
  TENANT_ADMIN: 'Tenant Admin',
  TENANT_STAFF: 'Tenant Staff',
}

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const me = user ?? (await usersApi.getMe())
        if (!cancelled) {
          setName(me.fullName)
          setEmail(me.email)
          setPhone(me.phone ?? '')
          setRole(ROLE_LABEL[me.role] ?? me.role)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Không tải được hồ sơ')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await usersApi.updateUser(user.userId, { fullName: name, phone })
      await refreshUser()
      setMessage('Đã cập nhật thông tin!')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 pb-15">
      <LoadingOverlay show={loading || saving} text={saving ? 'Đang lưu...' : 'Đang tải...'} />
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />
        <div className="relative z-10 p-8">
          <div className="max-w-[900px] mx-auto flex flex-col gap-8">
            <div className="glass-panel rounded-xl border border-white/5 p-6 flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold">
                {name.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-xl font-bold">{name}</h2>
                <p className="text-slate-400">{email}</p>
                <span className="text-xs px-2 py-1 bg-cyan-400/10 text-cyan-400 rounded mt-1 inline-block">
                  {role}
                </span>
              </div>
            </div>

            {(error || message) && (
              <p
                className={`text-sm rounded-lg px-4 py-2 ${
                  error
                    ? 'text-red-400 bg-red-400/10 border border-red-400/20'
                    : 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20'
                }`}
              >
                {error || message}
              </p>
            )}

            <section className="glass-panel rounded-xl border border-white/5 p-6 flex flex-col gap-6">
              <h3 className="text-lg font-semibold">Thông tin cá nhân</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-slate-400">Họ tên</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#1a2333] border border-white/10 focus:outline-none focus:border-cyan-400 text-white"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-slate-400">Email</label>
                  <input
                    value={email}
                    disabled
                    className="w-full p-3 rounded-lg bg-[#1a2333]/60 border border-white/10 text-slate-400"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm text-slate-400">Số điện thoại</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#1a2333] border border-white/10 focus:outline-none focus:border-cyan-400 text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="self-start px-6 py-2 rounded-lg bg-cyan-500 text-black font-bold disabled:opacity-50"
              >
                Lưu thay đổi
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
