import { useState } from 'react'
import logo from '../../assets/logo.png'
import { navigationService } from '../../utils/NavigationService'

export const ResetPassword: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (password.length < 6) {
      return setError('Mật khẩu phải >= 6 ký tự')
    }

    if (password !== confirmPassword) {
      return setError('Mật khẩu không khớp')
    }

    setError('')

    // TODO: call API reset password
    console.log('Reset password success')

    // chuyển về login
    navigationService.replace('/')
  }

  return (
    <div
      className="font-['Inter',sans-serif] relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: '#050b0b', color: '#fff' }}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          className="w-full h-full object-cover opacity-30 blur-sm scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXarldI6DEHoSyQKxf1Ij69kQAgFbbWOCmHHQXVURcOZC0E6a1dH6LEAyfUU_oE9ExY25IE5kjckyS_qB7w--6UAG7g3dUQqV0gb1mW1sT2HqUNdDtiNFeXbe4NVBgRxHURhim9jCe7WybzvyVwHF-E6tAOpEgfWGFtE5k5hoEHHfHpfW8pHvHQU1gJX3WzbgK3uatQp5u4GQKaAq0LnqXAyCntFjWf63OpUayjGo48M9ntC8x9RLq1Hoze4o28I_jQRyG1r9Ljck"
          alt="background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2223cc] via-[#0f222399] to-[#0f2223e6]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="glass-panel w-full max-w-[520px] rounded-2xl overflow-hidden relative">

          {/* Header */}
          <div className="p-8 pb-4 border-b border-white/5">
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <div className="flex items-center gap-2 justify-center">
                <img src={logo} alt="Logo" className="h-10 w-10" />
                <h1 className="text-3xl font-black tracking-[-0.02em] text-white m-0">
                  NEXSPACE
                </h1>
              </div>

              <p
                className="text-2xl font-medium tracking-widest uppercase"
                style={{ color: '#9bb9bb' }}
              >
                Reset Password
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 flex flex-col gap-6">

            {/* New Password */}
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
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-white transition"
                style={{ color: '#9bb9bb' }}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>

            {/* Confirm Password */}
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
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-white transition"
                style={{ color: '#9bb9bb' }}
              >
                <span className="material-symbols-outlined">
                  {showConfirm ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="py-4 bg-[#06edf9] text-black font-bold rounded-lg transition hover:bg-[#3fffff]"
            >
              Đặt lại mật khẩu
            </button>

            {/* Back */}
            <button
              onClick={() => navigationService.goTo('/login')}
              className="text-sm text-[#06edf9] hover:underline"
            >
              ← Quay lại đăng nhập
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}