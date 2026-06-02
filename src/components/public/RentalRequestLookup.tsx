import { InlineAlert } from '../ui/FeedbackAlert'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import {
  lookupRentalRequestByCode,
  type RentalRequestPublicLookup,
} from '../../api/rentalRequests'
import {
  BILLING_CYCLE_GUEST_LABELS,
  CONTRACT_TYPE_LABELS,
} from '../../data/contractTypes'
import { LoadingOverlay } from '../ui/LoadingOverlay'

const inputWrapStyle = { border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' } as const

const STATUS_LABELS: Record<RentalRequestPublicLookup['status'], string> = {
  PENDING: 'Chờ duyệt',
  UNDER_REVIEW: 'Đang chờ / tư vấn',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CONVERTED: 'Đã chuyển hợp đồng',
}

const STATUS_COLORS: Record<RentalRequestPublicLookup['status'], string> = {
  PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  UNDER_REVIEW: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  APPROVED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  REJECTED: 'text-red-400 bg-red-400/10 border-red-400/30',
  CONVERTED: 'text-[#06edf9] bg-[#06edf9]/10 border-[#06edf9]/30',
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 py-2 border-t border-white/5 first:border-0 first:pt-0">
      <span className="text-sm text-[#9bb9bb]">{label}</span>
      <span className="text-sm text-white text-right">{value}</span>
    </div>
  )
}

type Props = {
  initialCode?: string
  initialEmail?: string
  autoLookup?: boolean
}

const LOOKUP_NOT_FOUND_MSG =
  'Không tìm thấy yêu cầu với mã và email đã nhập. Kiểm tra lại thông tin.'

export function RentalRequestLookup({
  initialCode = '',
  initialEmail = '',
  autoLookup = false,
}: Props) {
  const [code, setCode] = useState(initialCode)
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<RentalRequestPublicLookup | null>(null)

  useEffect(() => {
    if (initialCode) setCode(initialCode)
    if (initialEmail) setEmail(initialEmail)
  }, [initialCode, initialEmail])

  const runLookup = useCallback(async (requestCode: string, contactEmail: string) => {
    const trimmedCode = requestCode.trim()
    const trimmedEmail = contactEmail.trim()
    if (!trimmedCode) {
      setError('Vui lòng nhập mã yêu cầu')
      return
    }
    if (!trimmedEmail) {
      setError('Vui lòng nhập email liên hệ')
      return
    }

    setError('')
    setResult(null)
    setLoading(true)
    try {
      const data = await lookupRentalRequestByCode(trimmedCode, trimmedEmail)
      setResult(data)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 404
            ? LOOKUP_NOT_FOUND_MSG
            : err.message
          : 'Tra cứu thất bại. Vui lòng thử lại.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoLookup && initialCode.trim() && initialEmail.trim()) {
      void runLookup(initialCode, initialEmail)
    }
  }, [autoLookup, initialCode, initialEmail, runLookup])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    void runLookup(code, email)
  }

  return (
    <>
      <LoadingOverlay show={loading} text="Đang tra cứu..." />
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#06edf9]">search</span>
            Tra cứu yêu cầu
          </h3>
          <p className="text-sm text-[#9bb9bb] mb-4">
            Nhập mã yêu cầu (RR-…) và email liên hệ đã dùng khi gửi form. Không cần đăng nhập.
          </p>

          {error && (
            <InlineAlert className="mb-4" message={error} onDismiss={() => setError('')} />
          )}

          <LookupFormFields
            code={code}
            email={email}
            loading={loading}
            onCodeChange={setCode}
            onEmailChange={setEmail}
          />
        </form>

        {result && <LookupResult result={result} />}
      </div>
    </>
  )
}

function LookupFormFields({
  code,
  email,
  loading,
  onCodeChange,
  onEmailChange,
}: {
  code: string
  email: string
  loading: boolean
  onCodeChange: (v: string) => void
  onEmailChange: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="input-glow relative rounded-lg" style={inputWrapStyle}>
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9bb9bb]">
          tag
        </span>
        <input
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
          placeholder="RR-M5ABC-01"
          aria-label="Mã yêu cầu thuê kho"
          required
          className="block w-full pl-12 pr-4 py-3 bg-transparent border-0 text-white focus:outline-none text-base font-mono uppercase"
        />
      </div>
      <div className="input-glow relative rounded-lg" style={inputWrapStyle}>
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9bb9bb]">
          email
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="contact@company.com"
          aria-label="Email liên hệ"
          required
          autoComplete="email"
          className="block w-full pl-12 pr-4 py-3 bg-transparent border-0 text-white focus:outline-none text-base"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="auth-btn w-full sm:w-auto rounded-lg font-semibold py-3 px-6 border-0 disabled:opacity-60 cursor-pointer"
      >
        Tra cứu
      </button>
    </div>
  )
}

function LookupResult({ result }: { result: RentalRequestPublicLookup }) {
  const statusClass = STATUS_COLORS[result.status]

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border-[#06edf9]/20">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#9bb9bb] mb-1">Mã yêu cầu</p>
          <p className="text-2xl font-bold font-mono text-[#06edf9]">{result.requestCode}</p>
          <p className="text-white mt-2">{result.companyName}</p>
        </div>
        <span
          className={`inline-flex self-start px-3 py-1 rounded-full text-sm font-medium border ${statusClass}`}
        >
          {STATUS_LABELS[result.status]}
        </span>
      </div>

      <div>
        <DetailRow label="Khu vực" value={`${result.district}, ${result.city}`} />
        {result.contractType && (
          <DetailRow
            label="Loại hình thuê"
            value={
              CONTRACT_TYPE_LABELS[result.contractType as keyof typeof CONTRACT_TYPE_LABELS] ??
              result.contractType
            }
          />
        )}
        {result.billingCycle && (
          <DetailRow
            label="Chu kỳ thanh toán"
            value={BILLING_CYCLE_GUEST_LABELS[result.billingCycle] ?? result.billingCycle}
          />
        )}
        {result.warehouseName && <DetailRow label="Kho tiếp nhận" value={result.warehouseName} />}
        {result.estimatedBoxCount != null && (
          <DetailRow
            label="Số thùng hàng (ước tính)"
            value={`${result.estimatedBoxCount.toLocaleString('vi-VN')} thùng / kiện`}
          />
        )}
        {result.estimatedSkuCount != null && (
          <DetailRow
            label="Tổng số cái (peak inventory)"
            value={result.estimatedSkuCount.toLocaleString('vi-VN')}
          />
        )}
        {result.estimatedInboundPerWeek != null && (
          <DetailRow
            label="Lượt nhập / tuần"
            value={result.estimatedInboundPerWeek.toLocaleString('vi-VN')}
          />
        )}
        {result.estimatedOutboundPerWeek != null && (
          <DetailRow
            label="Lượt xuất / tuần"
            value={result.estimatedOutboundPerWeek.toLocaleString('vi-VN')}
          />
        )}
        {result.requestedAreaM2 != null && (
          <DetailRow
            label="Diện tích mong muốn"
            value={`${result.requestedAreaM2.toLocaleString('vi-VN')} m²`}
          />
        )}
        {result.expectedStartDate && (
          <DetailRow label="Ngày bắt đầu dự kiến" value={formatDate(result.expectedStartDate)} />
        )}
        {result.expectedEndDate && (
          <DetailRow label="Ngày kết thúc dự kiến" value={formatDate(result.expectedEndDate)} />
        )}
        <DetailRow label="Ngày gửi" value={formatDate(result.createdAt)} />
        {result.reviewedAt && <DetailRow label="Ngày xử lý" value={formatDate(result.reviewedAt)} />}
        {result.rejectionReason && (
          <DetailRow label="Lý do từ chối" value={result.rejectionReason} />
        )}
        {result.reviewNote && (
          <DetailRow label="Thông báo từ NEXSPACE" value={result.reviewNote} />
        )}
      </div>

      <p className="text-xs text-[#9bb9bb] mt-6 pt-4 border-t border-white/5">
        {result.reviewNote && result.status === 'UNDER_REVIEW'
          ? 'Admin đã ghi nhận yêu cầu. Vui lòng theo dõi mã RR và email — chúng tôi sẽ liên hệ khi có kho phù hợp.'
          : result.status === 'APPROVED' || result.status === 'CONVERTED'
          ? 'Yêu cầu đã được duyệt. System Admin sẽ liên hệ cấp tài khoản đăng nhập.'
          : result.status === 'REJECTED'
            ? 'Yêu cầu không được chấp nhận. Bạn có thể gửi yêu cầu mới với thông tin cập nhật.'
            : 'Yêu cầu đang chờ warehouse admin xem xét theo khu vực bạn chọn.'}
      </p>
    </div>
  )
}
