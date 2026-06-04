import type { InboundStatus } from '../api/inboundRequests'

export const TENANT_INBOUND_STEPS: { status: InboundStatus; label: string }[] = [
  { status: 'PENDING', label: 'Chờ kho duyệt' },
  { status: 'APPROVED', label: 'Đã duyệt' },
  { status: 'ARRIVED', label: 'Xe đến kho' },
  { status: 'RECEIVING', label: 'Kho nhận hàng' },
  { status: 'COMPLETED', label: 'Hoàn tất' },
]

export function tenantInboundStepProgress(status: InboundStatus): number {
  if (status === 'CANCELLED' || status === 'DRAFT') return 0
  const idx = TENANT_INBOUND_STEPS.findIndex((s) => s.status === status)
  if (idx < 0) return 0
  return idx + 1
}
