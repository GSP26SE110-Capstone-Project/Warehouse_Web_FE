import type { InboundStatus } from '../api/inboundRequests'

export const INBOUND_STATUS_LABELS: Record<InboundStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  IN_TRANSIT: 'Đã lấy hàng',
  ARRIVED: 'Đã đến kho',
  RECEIVING: 'Đang nhận hàng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

export const INBOUND_STATUS_CLASS: Record<InboundStatus, string> = {
  DRAFT: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
  PENDING: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  APPROVED: 'bg-blue-400/10 text-blue-300 ring-blue-400/20',
  IN_TRANSIT: 'bg-orange-400/10 text-orange-300 ring-orange-400/20',
  ARRIVED: 'bg-violet-400/10 text-violet-300 ring-violet-400/20',
  RECEIVING: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20',
  COMPLETED: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  CANCELLED: 'bg-red-400/10 text-red-400 ring-red-400/20',
}

export const BOX_TYPE_OPTIONS = [
  { value: 'SMALL', label: 'Small (1 unit)', volumeUnits: 1 },
  { value: 'MEDIUM', label: 'Medium (2 units)', volumeUnits: 2 },
  { value: 'LARGE', label: 'Large (4 units)', volumeUnits: 4 },
  { value: 'EXTRA', label: 'Extra (8 units)', volumeUnits: 8 },
] as const

export type BoxTypeOption = (typeof BOX_TYPE_OPTIONS)[number]

export function filterBoxTypeOptionsForMax(maxBoxType: string) {
  const maxVol =
    BOX_TYPE_OPTIONS.find((o) => o.value === maxBoxType)?.volumeUnits ??
    BOX_TYPE_OPTIONS[BOX_TYPE_OPTIONS.length - 1].volumeUnits
  return BOX_TYPE_OPTIONS.filter((o) => o.volumeUnits <= maxVol)
}
