import type { ApiContract } from '../../api/types'
import { formatVnd } from '../../data/pricing'
import {
  actualPaymentSubtitle,
  initialInvoiceAmount,
  recurringPaymentScheduleNote,
} from '../../utils/contractBilling'
import { parseContractAmount } from '../../utils/contractSigning'

type Props = {
  contract: ApiContract
  variant?: 'sign' | 'detail'
  activationDate?: string | null
  className?: string
}

export function ContractPaymentSummary({
  contract,
  variant = 'sign',
  activationDate,
  className = '',
}: Props) {
  const totalAmount = parseContractAmount(contract.estimatedTotalAmount)
  const actualAmount = initialInvoiceAmount(contract)
  const scheduleNote = recurringPaymentScheduleNote(contract, activationDate)
  const isMonthly = contract.billingCycle === 'MONTHLY'

  const totalSize = variant === 'sign' ? 'text-lg' : 'text-xl'
  const actualSize = variant === 'sign' ? 'text-xl' : 'text-2xl'

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-300/80">
          Giá trị ước tính toàn kỳ
        </p>
        <p className={`mt-1 font-bold text-cyan-300 ${totalSize}`}>
          {totalAmount != null ? formatVnd(totalAmount) : 'Chưa có — liên hệ kho'}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          Số tiền tham chiếu theo báo giá kho; hóa đơn thực tế có thể theo mức sử dụng
          {variant === 'detail' ? ' trong kỳ' : ''}.
        </p>
      </div>

      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-300/90">
          Giá trị thực trả
        </p>
        <p className={`mt-1 font-bold text-emerald-300 ${actualSize}`}>
          {actualAmount != null ? formatVnd(actualAmount) : 'Chưa có — liên hệ kho'}
        </p>
        <p className="mt-1 text-[11px] text-emerald-200/70">
          {actualPaymentSubtitle(contract.billingCycle)}
        </p>
        {isMonthly && scheduleNote && (
          <p className="mt-2 text-[11px] text-slate-400">{scheduleNote}</p>
        )}
      </div>
    </div>
  )
}
