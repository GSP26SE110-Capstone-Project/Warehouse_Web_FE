import { useState } from 'react'
import logo from '../../assets/logo.png'

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)

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
          <div
            className="glass-panel w-full max-w-[520px] rounded-2xl overflow-hidden relative transition-all duration-500 hover:border-[#06edf9]/30"
          >
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

                <p
                  className="text-sm font-medium tracking-widest uppercase"
                  style={{ color: '#9bb9bb' }}
                >
                  Next-Gen Warehouse
                </p>

              </div>
            </div>

            {/* Form */}
            <div className="p-8 pt-6 flex flex-col gap-6">
              {/* Operative ID */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="operative-id"
                  className="text-sm font-medium text-gray-300 uppercase tracking-widest pl-1"
                >
                  Email
                </label>
                <div
                  className="input-glow relative transition-all duration-300 rounded-lg"
                  style={{ border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' }}
                >
                  <span className="input-icon material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" style={{ color: '#9bb9bb' }}>
                    email
                  </span>
                  <input
                    id="operative-id"
                    type="text"
                    placeholder="@example.com"
                    className="block w-full pl-12 pr-4 py-4 bg-transparent border-0 text-white focus:outline-none text-base"
                    style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.2em', color: '#fff' }}
                  />
                </div>
              </div>

              {/* Access Key */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="access-key"
                    className="text-sm font-medium text-gray-300 uppercase tracking-widest pl-1"
                  >
                    Mật khẩu
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-xs transition-colors hover:underline"
                    style={{ color: 'rgba(6,237,249,0.7)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#06edf9')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(6,237,249,0.7)')}
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <div
                  className="input-glow relative transition-all duration-300 rounded-lg"
                  style={{ border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' }}
                >
                  <span className="input-icon material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" style={{ color: '#9bb9bb' }}>
                    key
                  </span>
                  <input
                    id="access-key"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className="block w-full pl-12 pr-12 py-4 bg-transparent border-0 text-white focus:outline-none text-base"
                    style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.28em' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9bb9bb' }}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Authenticate */}
              <button
                type="button"
                className="auth-btn relative w-full overflow-hidden rounded-lg font-bold py-4 px-6 mt-2 transition-all duration-200 cursor-pointer border-0"
                style={{
                  background: '#06edf9',
                  color: '#0f2223',
                  boxShadow: '0 0 10px rgba(6,237,249,0.3), 0 0 20px rgba(6,237,249,0.1)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = '#3fffff'
                  el.style.boxShadow = '0 0 15px rgba(6,237,249,0.5), 0 0 30px rgba(6,237,249,0.2)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = '#06edf9'
                  el.style.boxShadow = '0 0 10px rgba(6,237,249,0.3), 0 0 20px rgba(6,237,249,0.1)'
                }}
              >
                <div className="shimmer" />
                <span className="relative flex items-center justify-center gap-2" style={{ letterSpacing: '0.1em' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>fingerprint</span>
                  Đăng nhập
                </span>
              </button>
            </div>

            {/* Footer */}
            <div
              className="border-t border-white/5 p-4 text-center"
              style={{ background: 'rgba(5,11,11,0.5)' }}
            >
              <p
                className="text-gray-500 m-0 leading-relaxed"
                style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              >
                UNAUTHORIZED ACCESS IS PROHIBITED. ALL ACTIVITY IS LOGGED.
                <br />
                SERVER NODE: US-EAST-ALFA-9
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}