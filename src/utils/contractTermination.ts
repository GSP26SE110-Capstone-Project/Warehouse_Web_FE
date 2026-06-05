import type { ContractTerminationPreview } from '../api/types'
import { formatVnd } from '../data/pricing'
import { BILLING_CYCLE_GUEST_LABELS } from '../data/contractTypes'

export const TERMINATION_REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ kho duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
}

export function terminationNoticeSummary(preview: ContractTerminationPreview): string | null {
  if (!preview.appliesNoticeRule) return null
  const fmt = (iso?: string | null) =>
    iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('vi-VN', { timeZone: 'UTC' }) : '—'
  const days = preview.terminationNoticeDays ?? 3
  if (preview.canRequestNow === false) {
    return `Bạn phải gửi yêu cầu trước ít nhất ${days} ngày so với kỳ thanh toán tiếp theo (${fmt(preview.nextBillingDate)}). Hạn chót: ${fmt(preview.latestRequestDate)}.`
  }
  if (preview.billingDayOfMonth != null) {
    return `Kỳ thanh toán hàng tháng: ngày ${preview.billingDayOfMonth} (từ ngày HĐ ACTIVE). Kỳ tiếp theo: ${fmt(preview.nextBillingDate)} — cần báo trước ${days} ngày.`
  }
  return null
}

export function terminationSettlementSummary(preview: ContractTerminationPreview): string {
  const cycle =
    BILLING_CYCLE_GUEST_LABELS[preview.billingCycle] ?? preview.billingCycle ?? '—'
  if (preview.billingCycle === 'MONTHLY') {
    return `HĐ trả theo tháng (${cycle}): không phí chấm dứt thêm; hoàn tiền theo chính sách vận hành (preview = 0).`
  }
  if (!preview.hasInbound) {
    return `Trả trước cả kỳ, chưa nhập hàng: phí xử lý hoàn ${preview.processingRatePercent ?? 1}% = ${formatVnd(preview.processingFee)}; hoàn dự kiến ${formatVnd(preview.refundAmount)}.`
  }
  return (
    `Đã có nhập hàng: phạt 1 tháng ${formatVnd(preview.terminationFee)}; ` +
    `hoàn dự kiến ${formatVnd(preview.refundAmount)} ` +
    `(đã dùng ${preview.usedMonths}/${preview.contractMonths} tháng).`
  )
}
