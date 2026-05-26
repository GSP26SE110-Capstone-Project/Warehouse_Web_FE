import type { InboundStatus } from '../../api/inboundRequests'
import { INBOUND_STATUS_CLASS, INBOUND_STATUS_LABELS } from '../../data/inboundStatus'

export function InboundStatusBadge({ status }: { status: InboundStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${INBOUND_STATUS_CLASS[status] ?? INBOUND_STATUS_CLASS.PENDING}`}
    >
      {INBOUND_STATUS_LABELS[status] ?? status}
    </span>
  )
}
