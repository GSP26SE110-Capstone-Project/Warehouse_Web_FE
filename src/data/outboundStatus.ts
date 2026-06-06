import type { OutboundStatus } from '../api/outboundRequests'

export const OUTBOUND_STATUS_LABELS: Record<OutboundStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  RESERVED: 'Đã reserve',
  PICKING: 'Đang pick',
  PACKING: 'Đang đóng gói',
  SHIPPED: 'Đã xuất',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

export const OUTBOUND_STATUS_CLASS: Record<OutboundStatus, string> = {
  DRAFT: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
  PENDING: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  APPROVED: 'bg-blue-400/10 text-blue-300 ring-blue-400/20',
  RESERVED: 'bg-violet-400/10 text-violet-300 ring-violet-400/20',
  PICKING: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20',
  PACKING: 'bg-orange-400/10 text-orange-300 ring-orange-400/20',
  SHIPPED: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  COMPLETED: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30',
  CANCELLED: 'bg-red-400/10 text-red-300 ring-red-400/20',
}

export const WH_OUTBOUND_NEXT_STATUS: Partial<
  Record<OutboundStatus, { label: string; status: OutboundStatus; hint?: string }>
> = {
  PENDING: {
    label: 'Duyệt + reserve FIFO',
    status: 'APPROVED',
    hint: 'Chọn nhân viên pick, tạo picking task và chuyển RESERVED',
  },
  RESERVED: { label: 'Bắt đầu pick', status: 'PICKING' },
  PICKING: { label: 'Xác nhận pick đủ', status: 'PACKING' },
  PACKING: {
    label: 'Duyệt packing & xuất hàng',
    status: 'SHIPPED',
    hint: 'Trừ tồn ngay — sau đó gán tài xế (nếu kho giao ra)',
  },
  SHIPPED: { label: 'Hoàn tất phiếu', status: 'COMPLETED' },
}

type WhRole = string | undefined

/** Nút workflow theo role: admin duyệt/ship; staff pick (chỉ phiếu được gán). */
export function getWhOutboundNextAction(
  status: OutboundStatus,
  role: WhRole
): { label: string; status: OutboundStatus; hint?: string } | undefined {
  const isAdmin = role === 'WH_ADMIN' || role === 'SYSTEM_ADMIN'
  const isStaff = role === 'WH_STAFF'

  if (isAdmin) {
    if (status === 'PENDING') return WH_OUTBOUND_NEXT_STATUS.PENDING
    if (status === 'PACKING') return WH_OUTBOUND_NEXT_STATUS.PACKING
    if (status === 'SHIPPED') return WH_OUTBOUND_NEXT_STATUS.SHIPPED
  }

  if (isStaff) {
    if (status === 'RESERVED') return WH_OUTBOUND_NEXT_STATUS.RESERVED
    if (status === 'PICKING') return WH_OUTBOUND_NEXT_STATUS.PICKING
  }

  return undefined
}
