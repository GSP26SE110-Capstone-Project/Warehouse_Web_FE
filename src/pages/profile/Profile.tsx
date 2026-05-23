import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/Axios'
import type { UserResponse } from '../../types/Account'

interface UserProfileResponse {
  success: boolean
  message: string
  data: UserResponse
}

export const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    userId: '',
    fullName: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    createdAt: '',
    updatedAt: '',
  })

  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Lấy thông tin user
  const fetchUserProfile = async () => {
    setLoading(true)
    try {
      const endpoint = id ? `/users/${id}` : '/users/me'
      const response = await api.get<UserProfileResponse>(endpoint)

      if (response.data?.success && response.data?.data) {
        const userData = response.data.data
        setForm({
          userId: userData.userId || '',
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          role: userData.role || '',
          status: userData.status || '',
          createdAt: userData.createdAt || '',
          updatedAt: userData.updatedAt || '',
        })
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin profile:', error)
      setAlert({ type: 'error', message: 'Không thể tải thông tin profile' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [id])

  // Lưu cập nhật profile
  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const updateData = {
        fullName: form.fullName,
        phone: form.phone,
        status: form.status,
      }

      const response = await api.patch<UserProfileResponse>(
        `/users/${form.userId}`,
        updateData
      )

      if (response.data?.success) {
        setAlert({ type: 'success', message: 'Cập nhật thành công!' })
        setEditing(false)
        fetchUserProfile()
      }
    } catch (error: any) {
      console.error('Lỗi cập nhật profile:', error)
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Lỗi cập nhật thông tin',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
  const inputStyle = 'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Đang tải thông tin...</div>
      </div>
    )
  }

  return (
    <div className="relative z-10 p-8 max-w-4xl mx-auto">
      {/* Button Quay về */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        Quay về
      </button>

      {/* Alert */}
      {alert && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            alert.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Header Card */}
      <div className="glass-panel rounded-xl border border-white/5 p-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-3xl font-bold uppercase text-cyan-400">
              {form.fullName ? form.fullName.charAt(0) : '?'}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{form.fullName || 'N/A'}</h2>
            <p className="text-slate-400">{form.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-3 py-1 bg-cyan-400/10 text-cyan-400 rounded uppercase font-bold">
                {form.role}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded uppercase font-bold ${
                  form.status === 'ACTIVE'
                    ? 'bg-emerald-400/10 text-emerald-400'
                    : 'bg-red-400/10 text-red-400'
                }`}
              >
                {form.status}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setEditing(!editing)}
          className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
        >
          <span className="material-symbols-outlined">{editing ? 'close' : 'edit'}</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="glass-panel rounded-xl border border-white/5 p-6 space-y-6">
        {/* Thông tin cơ bản */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-cyan-500 tracking-[2px]">THÔNG TIN CƠ BẢN</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Họ và tên</label>
              <input
                disabled={!editing}
                className={inputStyle}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className={labelStyle}>Email</label>
              <input
                disabled
                type="email"
                className={inputStyle}
                value={form.email}
              />
            </div>

            <div>
              <label className={labelStyle}>Số điện thoại</label>
              <input
                disabled={!editing}
                type="tel"
                className={inputStyle}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className={labelStyle}>Vai trò</label>
              <input
                disabled
                className={inputStyle}
                value={form.role}
              />
            </div>
          </div>
        </div>

        {/* Trạng thái và thời gian */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-emerald-500 tracking-[2px]">THÔNG TIN HỆ THỐNG</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Trạng thái</label>
              <select
                disabled={!editing}
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

            <div>
              <label className={labelStyle}>ID người dùng</label>
              <input
                disabled
                className={inputStyle}
                value={form.userId}
              />
            </div>

            <div>
              <label className={labelStyle}>Ngày tạo</label>
              <input
                disabled
                className={inputStyle}
                value={form.createdAt ? new Date(form.createdAt).toLocaleString('vi-VN') : '---'}
              />
            </div>

            <div>
              <label className={labelStyle}>Cập nhật lần cuối</label>
              <input
                disabled
                className={inputStyle}
                value={form.updatedAt ? new Date(form.updatedAt).toLocaleString('vi-VN') : '---'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {editing && (
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setEditing(false)
              fetchUserProfile()
            }}
            className="px-6 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-black flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      )}
    </div>
  )
}