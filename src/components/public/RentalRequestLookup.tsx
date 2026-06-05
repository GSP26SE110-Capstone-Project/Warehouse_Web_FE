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

// Cập nhật style cho ô nhập liệu (Light mode)
const inputWrapStyle = { 
  border: '1px solid #cbd5e1', // slate-300
  background: '#ffffff' 
} as const

const STATUS_LABELS: Record<RentalRequestPublicLookup['status'], string> = {
  PENDING: 'Chờ duyệt',
  UNDER_REVIEW: 'Đang chờ / tư vấn',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CONVERTED: 'Đã chuyển hợp đồng',
}

// Cập nhật mã màu badge trạng thái cho nền sáng để tăng độ tương phản đọc
const STATUS_COLORS: Record<RentalRequestPublicLookup['status'], string> = {
  PENDING: 'text-amber-700 bg-amber-50 border-amber-200',
  UNDER_REVIEW: 'text-blue-700 bg-blue-50 border-blue-200',
  APPROVED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  REJECTED: 'text-red-700 bg-red-50 border-red-200',
  CONVERTED: 'text-cyan-700 bg-cyan-50 border-cyan-200',
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
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 py-2.5 border-t border-slate-100 first:border-0 first:pt-0">
      <span className="text-sm text-slate-500 font-medium">{label}</span>
      <span className="text-sm text-slate-800 text-left sm:text-right font-semibold">{value}</span>
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
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-600">search</span>
            Tra cứu yêu cầu
          </h3>
          <p className="text-sm text-slate-500 mb-5">
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
    <div className="space-y-3.5">
      <div className="relative rounded-lg shadow-sm" style={inputWrapStyle}>
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          tag
        </span>
        <input
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
          placeholder="RR-M5ABC-01"
          aria-label="Mã yêu cầu thuê kho"
          required
          className="block w-full pl-12 pr-4 py-3 bg-transparent border-0 text-slate-800 focus:outline-none text-base font-mono uppercase placeholder-slate-400"
        />
      </div>
      <div className="relative rounded-lg shadow-sm" style={inputWrapStyle}>
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
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
          className="block w-full pl-12 pr-4 py-3 bg-transparent border-0 text-slate-800 focus:outline-none text-base placeholder-slate-400"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto rounded-lg font-semibold py-3 px-6 border-0 bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer text-base"
      >
        Tra cứu
      </button>
    </div>
  )
}

function LookupResult({ result }: { result: RentalRequestPublicLookup }) {
  const statusClass = STATUS_COLORS[result.status]

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Mã yêu cầu</p>
          <p className="text-2xl font-black font-mono text-cyan-600">{result.requestCode}</p>
          <p className="text-slate-800 font-semibold mt-1.5 text-base">{result.companyName}</p>
        </div>
        <span
          className={`inline-flex self-start px-3 py-1 rounded-full text-sm font-semibold border ${statusClass}`}
        >
          {STATUS_LABELS[result.status]}
        </span>
      </div>

      <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-0.5">
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
          <DetailRow label="Lý do từ chối" value={<span className="text-red-600 font-medium">{result.rejectionReason}</span>} />
        )}
        {result.reviewNote && (
          <DetailRow label="Thông báo từ NEXSPACE" value={<span className="text-cyan-700 font-medium">{result.reviewNote}</span>} />
        )}
      </div>

      <p className="text-xs leading-relaxed text-slate-500 mt-5 pt-4 border-t border-slate-100 font-medium">
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