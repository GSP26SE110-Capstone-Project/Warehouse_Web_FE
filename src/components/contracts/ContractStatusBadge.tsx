import type { ContractStatus } from '../../api/types'
import {
  adminContractStatusBadgeClass,
  adminContractStatusIcon,
  adminContractStatusLabel,
} from '../../utils/contractSigning'

type Props = {
  status: ContractStatus | string
  className?: string
}

export function ContractStatusBadge({ status, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${adminContractStatusBadgeClass(status)} ${className}`}
    >
      <span className="material-symbols-outlined text-[15px] leading-none">
        {adminContractStatusIcon(status)}
      </span>
      {adminContractStatusLabel(status)}
    </span>
  )
}
