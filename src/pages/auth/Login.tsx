import { useState } from 'react'
import logo from '../../assets/logo.png'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'

type User = {
  email: string
  password: string
  role: 'admin' | 'staff'
}

const mockUsers: User[] = [
  {
    email: 'admin@gmail.com',
    password: '123456',
    role: 'admin'
  },
  {
    email: 'staff@gmail.com',
    password: '123456',
    role: 'staff'
  }
]

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setError('')
    setLoading(true)

    setTimeout(() => {
      const user = mockUsers.find(
        u => u.email === email && u.password === password
      )

      if (!user) {
        setError('Sai email hoặc mật khẩu')
        setLoading(false)
        return
      }

      localStorage.setItem('user', JSON.stringify(user))

      window.location.href = user.role === 'admin' ? '/admin' : '/staff'
    }, 800) // tăng thời gian để thấy scan 😎
  }

  return (
    <>
      <div
        className="font-['Inter',sans-serif] relative min-h-screen flex flex-col overflow-hidden"
        style={{ background: '#050b0b', color: '#fff' }}
      >
        {/* Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            className="w-full h-full object-cover opacity-30 blur-sm scale-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXarldI6DEHoSyQKxf1Ij69kQAgFbbWOCmHHQXVURcOZC0E6a1dH6LEAyfUU_oE9ExY25IE5kjckyS_qB7w--6UAG7g3dUQqV0gb1mW1sT2HqUNdDtiNFeXbe4NVBgRxHURhim9jCe7WybzvyVwHF-E6tAOpEgfWGFtE5k5hoEHHfHpfW8pHvHQU1gJX3WzbgK3uatQp5u4GQKaAq0LnqXAyCntFjWf63OpUayjGo48M9ntC8x9RLq1Hoze4o28I_jQRyG1r9Ljck"
            alt="Futuristic server room"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2223cc] via-[#0f222399] to-[#0f2223e6]" />
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at center, transparent 0%, #050b0b 100%),
                linear-gradient(0deg, rgba(6,237,249,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6,237,249,0.03) 1px, transparent 1px)`,
              backgroundSize: 'auto, 40px 40px, 40px 40px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="glass-panel w-full max-w-[520px] rounded-2xl overflow-hidden relative transition-all duration-500 hover:border-[#06edf9]/30">
            <div className="scanline" />

            {/* Header */}
            <div className="p-8 pb-4 border-b border-white/5">
              <div className="flex flex-col items-center justify-center text-center gap-2 mb-2">
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <img src={logo} alt="Logo" className="h-10 w-10" />
                  <h1 className="text-3xl font-black tracking-[-0.02em] text-white m-0">
                    NEXSPACE
                  </h1>
                </div>

                <p className="text-sm font-medium tracking-widest uppercase" style={{ color: '#9bb9bb' }}>
                  Next-Gen Warehouse
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="p-8 pt-6 flex flex-col gap-6">
              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300 uppercase tracking-widest pl-1">
                  Email
                </label>
                <div className="input-glow relative rounded-lg" style={{ border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' }}>
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9bb9bb' }}>
                    email
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="@example.com"
                    className="w-full pl-12 pr-4 py-4 bg-transparent text-white outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300 uppercase tracking-widest pl-1">
                  Mật khẩu
                </label>
                <div className="input-glow relative rounded-lg" style={{ border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' }}>
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9bb9bb' }}>
                    key
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-12 pr-12 py-4 bg-transparent text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}
              </div>

              {/* Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-4 rounded-lg font-bold mt-2"
                style={{ background: '#06edf9', color: '#0f2223' }}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 p-4 text-center text-xs text-gray-500">
              UNAUTHORIZED ACCESS IS PROHIBITED
            </div>
          </div>
        </div>
      </div>
      <LoadingOverlay
        show={loading}
        text="AUTHENTICATING USER..."
      />
    </>
  )

}