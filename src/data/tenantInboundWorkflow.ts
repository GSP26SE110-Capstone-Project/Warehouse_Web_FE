import type { InboundStatus } from '../api/inboundRequests'
import type { DeliveryMode } from './deliveryMode'

export const TENANT_INBOUND_STEPS: { status: InboundStatus; label: string }[] = [
  { status: 'PENDING', label: 'Chờ kho duyệt' },
  { status: 'APPROVED', label: 'Đã duyệt' },
  { status: 'ARRIVED', label: 'Xe đến kho' },
  { status: 'RECEIVING', label: 'Kho nhận hàng' },
  { status: 'COMPLETED', label: 'Hoàn tất' },
]

export const TENANT_WAREHOUSE_TRANSPORT_STEPS: { status: InboundStatus; label: string }[] = [
  { status: 'PENDING', label: 'Chờ kho duyệt' },
  { status: 'APPROVED', label: 'Đã duyệt' },
  { status: 'IN_TRANSIT', label: 'Đã lấy hàng' },
  { status: 'ARRIVED', label: 'Xe đến kho' },
  { status: 'RECEIVING', label: 'Kho nhận hàng' },
  { status: 'COMPLETED', label: 'Hoàn tất' },
]

export function getTenantInboundSteps(deliveryMode?: DeliveryMode | null) {
  return deliveryMode === 'WAREHOUSE_TRANSPORT'
    ? TENANT_WAREHOUSE_TRANSPORT_STEPS
    : TENANT_INBOUND_STEPS
}

export function tenantInboundStepProgress(
  status: InboundStatus,
  deliveryMode?: DeliveryMode | null
): number {
  if (status === 'CANCELLED' || status === 'DRAFT') return 0
  const steps = getTenantInboundSteps(deliveryMode)
  const idx = steps.findIndex((s) => s.status === status)
  if (idx < 0) return 0
  return idx + 1
}
