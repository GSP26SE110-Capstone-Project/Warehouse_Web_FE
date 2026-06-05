import type { ApiContractAppendix } from '../../api/contractAppendices'
import type { ApiContract } from '../../api/types'
import {
  tenantPayAppendix,
  tenantSignAppendix,
  tenantWaitingWhAppendices,
} from '../../utils/contractAppendix'

type Props = {
  contract: ApiContract
  appendices: ApiContractAppendix[]
  isTenantAdmin: boolean
  payingAppendixId?: string | null
  onRequest: () => void
  onSign: (appendix: ApiContractAppendix) => void
  onPay: (appendix: ApiContractAppendix) => void
  onViewDetail: () => void
}

function StatusChip({
  icon,
  label,
  tone,
}: {
  icon: string
  label: string
  tone: 'amber' | 'cyan' | 'orange' | 'slate'
}) {
  const tones = {
    amber: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
    cyan: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200',
    orange: 'border-orange-400/25 bg-orange-400/10 text-orange-200',
    slate: 'border-white/10 bg-white/5 text-slate-400',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {label}
    </span>
  )
}

export function TenantContractAppendixActions({
  contract,
  appendices,
  isTenantAdmin,
  payingAppendixId,
  onRequest,
  onSign,
  onPay,
  onViewDetail,
}: Props) {
  if (contract.status !== 'ACTIVE') {
    return <span className="text-xs text-slate-600">—</span>
  }

  const signTarget = tenantSignAppendix(appendices)
  const payTarget = tenantPayAppendix(appendices)
  const waitingWh = tenantWaitingWhAppendices(appendices)
  const canManage = isTenantAdmin

  return (
    <div className="flex min-w-[148px] flex-col gap-2">
      {signTarget ? (
        <StatusChip icon="draw" label="Chờ bạn ký" tone="cyan" />
      ) : payTarget ? (
        <StatusChip icon="payments" label="Chờ thanh toán" tone="orange" />
      ) : waitingWh > 0 ? (
        <StatusChip icon="schedule" label={`${waitingWh} chờ kho`} tone="amber" />
      ) : (
        <StatusChip icon="note_add" label="Chưa có PL" tone="slate" />
      )}

      {canManage && signTarget && (
        <button
          type="button"
          onClick={() => onSign(signTarget)}
          className="rounded-md bg-cyan-500 px-2.5 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-cyan-400"
        >
          Ký phụ lục
        </button>
      )}

      {canManage && payTarget && (
        <button
          type="button"
          disabled={payingAppendixId === payTarget.appendixId}
          onClick={() => onPay(payTarget)}
          className="rounded-md bg-orange-500 px-2.5 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-orange-400 disabled:opacity-50"
        >
          {payingAppendixId === payTarget.appendixId ? 'Đang mở PayOS…' : 'Thanh toán PL'}
        </button>
      )}

      {canManage && !signTarget && !payTarget && (
        <button
          type="button"
          onClick={onRequest}
          className="rounded-md border border-violet-400/30 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-medium text-violet-200 hover:bg-violet-500/20"
        >
          Yêu cầu thuê thêm
        </button>
      )}

      {(signTarget || payTarget || waitingWh > 0 || appendices.length > 0) && (
        <button
          type="button"
          onClick={onViewDetail}
          className="text-left text-[11px] text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
        >
          Xem chi tiết PL
        </button>
      )}
    </div>
  )
}
