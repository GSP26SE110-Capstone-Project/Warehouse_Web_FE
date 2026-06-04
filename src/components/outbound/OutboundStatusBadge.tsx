import type { OutboundStatus } from '../../api/outboundRequests'
import { OUTBOUND_STATUS_CLASS, OUTBOUND_STATUS_LABELS } from '../../data/outboundStatus'

export function OutboundStatusBadge({ status }: { status: OutboundStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${OUTBOUND_STATUS_CLASS[status] ?? OUTBOUND_STATUS_CLASS.PENDING}`}
    >
      {OUTBOUND_STATUS_LABELS[status] ?? status}
    </span>
  )
}
