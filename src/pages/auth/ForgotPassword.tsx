import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { ApiError } from '../../api/client'
import { requestForgotPassword, verifyForgotPassword } from '../../api/auth'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { InlineAlert } from '../../components/ui/FeedbackAlert'

type Step = 'email' | 'otp' | 'done'

const OTP_LENGTH = 6
const PASSWORD_MIN = 8
// Anti-spam: chỉ cho gửi lại OTP sau RESEND_COOLDOWN_SECONDS.
const RESEND_COOLDOWN_SECONDS = 60

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [expiresInMinutes, setExpiresInMinutes] = useState(10)
  const [resendIn, setResendIn] = useState(0)

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const cooldownTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (cooldownTimer.current) window.clearInterval(cooldownTimer.current)
  }, [])

  const startCooldown = () => {
    setResendIn(RESEND_COOLDOWN_SECONDS)
    if (cooldownTimer.current) window.clearInterval(cooldownTimer.current)
    cooldownTimer.current = window.setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) {
          if (cooldownTimer.current) window.clearInterval(cooldownTimer.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const sendOtp = async (trimmedEmail: string) => {
    const res = await requestForgotPassword({ email: trimmedEmail })
    setExpiresInMinutes(res.expiresInMinutes)
    startCooldown()
  }

  const handleSubmitEmail = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Vui lòng nhập email.')
      return
    }
    setLoading(true)
    try {
      await sendOtp(trimmedEmail)
      setEmail(trimmedEmail)
      setStep('otp')
      setInfo(
        `Nếu email tồn tại, một mã OTP đã được gửi tới ${trimmedEmail}. Mã có hiệu lực trong ${expiresInMinutes} phút.`,
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được OTP. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendIn > 0 || loading) return
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await sendOtp(email)
      setInfo(`Đã gửi lại mã OTP tới ${email}.`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được OTP. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReset = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    const trimmedOtp = otp.trim()
    if (trimmedOtp.length !== OTP_LENGTH) {
      setError(`OTP phải gồm đúng ${OTP_LENGTH} chữ số.`)
      return
    }
    if (newPassword.length < PASSWORD_MIN) {
      setError(`Mật khẩu mới phải có tối thiểu ${PASSWORD_MIN} ký tự.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setLoading(true)
    try {
      await verifyForgotPassword({ email, otp: trimmedOtp, newPassword })
      setStep('done')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đặt lại mật khẩu thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <LoadingOverlay show={loading} text="Đang xử lý..." />
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
                  <h1 className="text-3xl font-black tracking-[-0.02em] text-white m-0">
                    NEXSPACE
                  </h1>
                </div>
                <p
                  className="text-2xl font-medium tracking-widest uppercase"
                  style={{ color: '#9bb9bb' }}
                >
                  {step === 'done' ? 'Hoàn tất' : 'Quên mật khẩu'}
                </p>
                <StepIndicator step={step} />
              </div>
            </div>

            {/* ── Bước 1 — nhập email ─────────────────────────────────── */}
            {step === 'email' && (
              <form onSubmit={handleSubmitEmail} className="p-8 flex flex-col gap-5">
                <p className="text-sm text-[#9bb9bb] text-center">
                  Nhập email tài khoản — chúng tôi sẽ gửi mã OTP 6 số để xác nhận.
                </p>

                {error && (
                  <InlineAlert variant="error" message={error} onDismiss={() => setError('')} />
                )}

                <Field
                  label="Email"
                  icon="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                />

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
                    <span className="material-symbols-outlined text-xl">send</span>
                    Gửi mã OTP
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-[#06edf9] hover:underline"
                >
                  ← Quay lại đăng nhập
                </button>
              </form>
            )}

            {/* ── Bước 2 — nhập OTP & mật khẩu mới ────────────────────── */}
            {step === 'otp' && (
              <form onSubmit={handleSubmitReset} className="p-8 flex flex-col gap-5">
                <p className="text-sm text-[#9bb9bb] text-center">
                  Mã OTP đã được gửi tới <strong className="text-white">{email}</strong>.
                  Mã có hiệu lực trong {expiresInMinutes} phút.
                </p>

                {info && (
                  <InlineAlert variant="info" message={info} onDismiss={() => setInfo('')} />
                )}
                {error && (
                  <InlineAlert variant="error" message={error} onDismiss={() => setError('')} />
                )}

                <Field
                  label={`Mã OTP (${OTP_LENGTH} chữ số)`}
                  icon="pin"
                  type="text"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  autoComplete="one-time-code"
                  required
                  value={otp}
                  onChange={(v) => setOtp(v.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                  placeholder="••••••"
                  className="tracking-[0.5em] text-center text-lg font-semibold"
                />

                <Field
                  label="Mật khẩu mới"
                  icon="key"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={PASSWORD_MIN}
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder={`Tối thiểu ${PASSWORD_MIN} ký tự`}
                  rightAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-[#9bb9bb] hover:text-white"
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  }
                />

                <Field
                  label="Xác nhận mật khẩu"
                  icon="key"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={PASSWORD_MIN}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu"
                />

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
                    <span className="material-symbols-outlined text-xl">lock_reset</span>
                    Đặt lại mật khẩu
                  </span>
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email')
                      setOtp('')
                      setNewPassword('')
                      setConfirmPassword('')
                      setError('')
                      setInfo('')
                    }}
                    className="text-[#06edf9] hover:underline"
                  >
                    ← Đổi email
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendIn > 0 || loading}
                    className="text-[#9bb9bb] hover:text-[#06edf9] hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                  >
                    {resendIn > 0 ? `Gửi lại sau ${resendIn}s` : 'Gửi lại OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Bước 3 — thành công ─────────────────────────────────── */}
            {step === 'done' && (
              <div className="p-8 flex flex-col gap-5 items-center text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-emerald-400"
                    style={{ fontSize: 44 }}
                  >
                    check_circle
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-white">Đặt lại mật khẩu thành công</h2>
                <p className="text-sm text-[#9bb9bb]">
                  Mật khẩu của tài khoản <strong className="text-white">{email}</strong> đã được
                  cập nhật. Vui lòng đăng nhập với mật khẩu mới.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="auth-btn relative w-full overflow-hidden rounded-lg font-bold py-4 px-6 border-0"
                  style={{
                    background: '#06edf9',
                    color: '#0f2223',
                    boxShadow: '0 0 10px rgba(6,237,249,0.3)',
                  }}
                >
                  <span className="relative flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-xl">login</span>
                    Đăng nhập
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Helpers UI ───────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ step: Step }> = ({ step }) => {
  const items: { id: Step; label: string }[] = [
    { id: 'email', label: 'Email' },
    { id: 'otp', label: 'OTP & mật khẩu' },
    { id: 'done', label: 'Hoàn tất' },
  ]
  const activeIdx = items.findIndex((i) => i.id === step)
  return (
    <div className="flex items-center gap-2 mt-2">
      {items.map((it, idx) => {
        const isActive = idx === activeIdx
        const isDone = idx < activeIdx
        return (
          <div key={it.id} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                isDone
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : isActive
                    ? 'bg-[#06edf9]/20 border-[#06edf9] text-[#06edf9]'
                    : 'border-white/15 text-white/40'
              }`}
            >
              {isDone ? '✓' : idx + 1}
            </span>
            {idx < items.length - 1 && (
              <span
                className={`w-6 h-px ${idx < activeIdx ? 'bg-emerald-400/60' : 'bg-white/15'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

type FieldProps = {
  label: string
  icon: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'email'
  maxLength?: number
  minLength?: number
  className?: string
  rightAdornment?: React.ReactNode
}

const Field: React.FC<FieldProps> = ({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  inputMode,
  maxLength,
  minLength,
  className,
  rightAdornment,
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-gray-300 uppercase tracking-widest pl-1">
      {label}
    </label>
    <div
      className="input-glow relative rounded-lg"
      style={{ border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' }}
    >
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9bb9bb]">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        minLength={minLength}
        className={`block w-full pl-12 ${rightAdornment ? 'pr-12' : 'pr-4'} py-4 bg-transparent border-0 text-white focus:outline-none text-base ${className ?? ''}`}
      />
      {rightAdornment && (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">{rightAdornment}</div>
      )}
    </div>
  </div>
)
