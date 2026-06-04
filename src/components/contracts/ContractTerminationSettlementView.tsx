import type { ContractTerminationPreview } from '../../api/types'
import { BILLING_CYCLE_GUEST_LABELS } from '../../data/contractTypes'
import { formatVnd } from '../../data/pricing'
import { terminationSettlementSummary } from '../../utils/contractTermination'

type Props = {
  preview: ContractTerminationPreview
  compact?: boolean
}

export function ContractTerminationSettlementView({ preview, compact }: Props) {
  const cycleLabel =
    BILLING_CYCLE_GUEST_LABELS[preview.billingCycle] ?? preview.billingCycle ?? '—'

  if (compact) {
    return (
      <p className="text-sm text-slate-300">{terminationSettlementSummary(preview)}</p>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm">
      <p className="font-medium text-amber-200">Ước tính khi chấm dứt sớm</p>
      <p className="text-xs text-slate-400">{terminationSettlementSummary(preview)}</p>
      <dl className="grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">Chu kỳ thanh toán</dt>
          <dd className="text-slate-200">{cycleLabel}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Đã nhập hàng (inbound)</dt>
          <dd className="text-slate-200">{preview.hasInbound ? 'Có' : 'Chưa'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Đã thanh toán</dt>
          <dd className="tabular-nums text-cyan-300">{formatVnd(preview.totalPaid)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Tiền thuê / tháng (tham chiếu)</dt>
          <dd className="tabular-nums text-slate-200">{formatVnd(preview.monthlyRate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Thời hạn HĐ</dt>
          <dd className="text-slate-200">
            {preview.usedMonths} / {preview.contractMonths} tháng đã qua
            {preview.unusedMonths > 0 ? ` · còn ${preview.unusedMonths} tháng` : ''}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Phí xử lý hoàn</dt>
          <dd className="tabular-nums text-slate-200">{formatVnd(preview.processingFee)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Phí chấm dứt (phạt)</dt>
          <dd className="tabular-nums text-orange-300">{formatVnd(preview.terminationFee)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Hoàn dự kiến</dt>
          <dd className="tabular-nums font-semibold text-emerald-300">
            {formatVnd(preview.refundAmount)}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-slate-500">
        Số liệu preview; kho duyệt mới chính thức chấm dứt HĐ. Sau chấm dứt vẫn có thể tạo phiếu xuất
        để lấy hết tồn.
      </p>
    </div>
  )
}
