import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import logo from '../../assets/logo.png'
import { ApiError } from '../../api/client'
import { resetPasswordWithToken } from '../../api/auth'
import { navigationService } from '../../utils/NavigationService'

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams])

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!token) {
      setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.')
      return
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await resetPasswordWithToken({ token, newPassword: password })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể đặt lại mật khẩu.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="font-['Inter',sans-serif] relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: '#050b0b', color: '#fff' }}
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          className="w-full h-full object-cover opacity-30 blur-sm scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXarldI6DEHoSyQKxf1Ij69kQAgFbbWOCmHHQXVURcOZC0E6a1dH6LEAyfUU_oE9ExY25IE5kjckyS_qB7w--6UAG7g3dUQqV0gb1mW1sT2HqUNdDtiNFeXbe4NVBgRxHURhim9jCe7WybzvyVwHF-E6tAOpEgfWGFtE5k5hoEHHfHpfW8pHvHQU1gJX3WzbgK3uatQp5u4GQKaAq0LnqXAyCntFjWf63OpUayjGo48M9ntC8x9RLq1Hoze4o28I_jQRyG1r9Ljck"
          alt="background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2223cc] via-[#0f222399] to-[#0f2223e6]" />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="glass-panel w-full max-w-[520px] rounded-2xl overflow-hidden relative">
          <div className="p-8 pb-4 border-b border-white/5">
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <div className="flex items-center gap-2 justify-center">
                <img src={logo} alt="Logo" className="h-10 w-10" />
                <h1 className="text-3xl font-black tracking-[-0.02em] text-white m-0">NEXSPACE</h1>
              </div>
              <p className="text-2xl font-medium tracking-widest uppercase" style={{ color: '#9bb9bb' }}>
                Đặt lại mật khẩu
              </p>
            </div>
          </div>

          <div className="p-8 flex flex-col gap-6">
            {success ? (
              <>
                <p className="text-sm text-emerald-300 text-center">
                  Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.
                </p>
                <button
                  type="button"
                  onClick={() => navigationService.replace('/login')}
                  className="py-4 bg-[#06edf9] text-black font-bold rounded-lg transition hover:bg-[#3fffff]"
                >
                  Đăng nhập
                </button>
              </>
            ) : (
              <>
                {!token && (
                  <p className="text-sm text-amber-300 text-center">
                    Thiếu token trong link. Mở link từ email hoặc liên hệ System Admin.
                  </p>
                )}

                <div
                  className="relative rounded-lg"
                  style={{ border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' }}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu mới"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-12 py-4 bg-transparent text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-white transition"
                    style={{ color: '#9bb9bb' }}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>

                <div
                  className="relative rounded-lg"
                  style={{ border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' }}
                >
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-8 pr-12 py-4 bg-transparent text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-white transition"
                    style={{ color: '#9bb9bb' }}
                  >
                    <span className="material-symbols-outlined">
                      {showConfirm ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>

                {error && (
                  <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
                )}

                <button
                  type="button"
                  disabled={submitting || !token}
                  onClick={handleSubmit}
                  className="py-4 bg-[#06edf9] text-black font-bold rounded-lg transition hover:bg-[#3fffff] disabled:opacity-60"
                >
                  {submitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </button>

                <button
                  type="button"
                  onClick={() => navigationService.goTo('/login')}
                  className="text-sm text-[#06edf9] hover:underline"
                >
                  ← Quay lại đăng nhập
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
