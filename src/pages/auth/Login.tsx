import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { ApiError } from '../../api/client'
import { getHomePathForRole, useAuth } from '../../auth/AuthContext'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { InlineAlert } from '../../components/ui/FeedbackAlert'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getHomePathForRole(user.role), { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const loggedIn = await login({ email: email.trim(), password })
      navigate(getHomePathForRole(loggedIn.role), { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ message: err.message, code: err.code })
      } else {
        setError({ message: 'Đăng nhập thất bại' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <LoadingOverlay show={loading} text="Đang xác thực..." />
      <div
        className="font-['Inter',sans-serif] relative min-h-screen flex flex-col overflow-hidden"
        style={{ background: '#050b0b', color: '#fff' }}
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            className="w-full h-full object-cover opacity-30 blur-sm scale-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXarldI6DEHoSyQKxf1Ij69kQAgFbbWOCmHHQXVURcOZC0E6a1dH6LEAyfUU_oE9ExY25IE5kjckyS_qB7w--6UAG7g3dUQqV0gb1mW1sT2HqUNdDtiNFeXbe4NVBgRxHURhim9jCe7WybzvyVwHF-E6tAOpEgfWGFtE5k5hoEHHfHpfW8pHvHQU1gJX3WzbgK3uatQp5u4GQKaAq0LnqXAyCntFjWf63OpUayjGo48M9ntC8x9RLq1Hoze4o28I_jQRyG1r9Ljck"
            alt="Futuristic server room"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2223cc] via-[#0f222399] to-[#0f2223e6]" />
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <form
            onSubmit={handleSubmit}
            className="glass-panel w-full max-w-[520px] rounded-2xl overflow-hidden relative transition-all duration-500 hover:border-[#06edf9]/30"
          >
            <div className="p-8 pb-4 border-b border-white/5">
              <div className="flex flex-col items-center justify-center text-center gap-2 mb-2">
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <img src={logo} alt="Logo" className="h-10 w-10" />
                  <h1 className="text-3xl font-black tracking-[-0.02em] text-white m-0">NEXSPACE</h1>
                </div>
                <p className="text-sm font-medium tracking-widest uppercase" style={{ color: '#9bb9bb' }}>
                  Next-Gen Warehouse
                </p>
              </div>
            </div>

            <div className="p-8 pt-6 flex flex-col gap-6">
              {error && (
                <InlineAlert
                  variant={
                    error.code === 'TENANT_ACCOUNT_NOT_PROVISIONED' ||
                    error.code === 'ACCOUNT_INACTIVE'
                      ? 'warning'
                      : 'error'
                  }
                  title={
                    error.code === 'TENANT_ACCOUNT_NOT_PROVISIONED'
                      ? 'Chưa được cấp tài khoản'
                      : error.code === 'ACCOUNT_INACTIVE'
                        ? 'Tài khoản chưa kích hoạt'
                        : 'Đăng nhập thất bại'
                  }
                  message={error.message}
                  onDismiss={() => setError(null)}
                />
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300 uppercase tracking-widest pl-1">
                  Email
                </label>
                <div
                  className="input-glow relative rounded-lg"
                  style={{ border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' }}
                >
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9bb9bb]">
                    email
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@warehouse.local"
                    className="block w-full pl-12 pr-4 py-4 bg-transparent border-0 text-white focus:outline-none text-base"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300 uppercase tracking-widest pl-1">
                    Mật khẩu
                  </label>
                  <a href="/forgot-password" className="text-xs text-cyan-400/70 hover:text-cyan-400 hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>
                <div
                  className="input-glow relative rounded-lg"
                  style={{ border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' }}
                >
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9bb9bb]">
                    key
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-12 pr-12 py-4 bg-transparent border-0 text-white focus:outline-none text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9bb9bb] hover:text-white"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-btn relative w-full overflow-hidden rounded-lg font-bold py-4 px-6 mt-2 border-0 disabled:opacity-60"
                style={{
                  background: '#06edf9',
                  color: '#0f2223',
                  boxShadow: '0 0 10px rgba(6,237,249,0.3)',
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                <span className="relative flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">fingerprint</span>
                  Đăng nhập
                </span>
              </button>

              <p className="text-sm text-center text-[#9bb9bb]">
                <a href="/" className="text-cyan-400/70 hover:text-cyan-400 hover:underline">
                  ← Về trang chủ
                </a>
              </p>

              <p className="text-xs text-slate-500 text-center font-mono">
                Demo: admin@warehouse.local / admin12345
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
