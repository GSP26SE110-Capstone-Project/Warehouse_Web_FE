import React, { useState } from 'react'
import {
  BILLING_CYCLE_GUEST_LABELS,
  CONTRACT_TYPE_LABELS,
  type ContractTypeValue,
} from '../../../data/contractTypes'
import {
  rentalRequestStatusClass,
  rentalRequestStatusLabel,
} from '../../../data/rentalRequestStatus'
import type { RentalRequestRow } from '../../../mappers'
import { MODAL_BODY_SCROLL_SPACE } from '../../../styles/scrollClasses'
import {
  formatRentalCapacitySummary,
  formatRentalProductLineLabel,
  hasRentalCapacityData,
} from '../../../utils/rentalCapacitySummary'

type Props = {
  data: RentalRequestRow
  canProcess?: boolean
  canNotifyGuest?: boolean
  notifyBusy?: boolean
  onClose: () => void
  onStartOnboarding: () => void
  onNotifyGuest?: (message: string) => void | Promise<void>
}

export const RequestDetailModal: React.FC<Props> = ({
  data,
  canProcess = true,
  canNotifyGuest = false,
  notifyBusy = false,
  onClose,
  onStartOnboarding,
  onNotifyGuest,
}) => {
  const [guestMessage, setGuestMessage] = useState(data.reviewNote ?? '')
  const labelStyle =
    'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'

  const inputStyle =
    'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white'

  const ct = data.contractType as ContractTypeValue | undefined
  const showOnboard =
    data.apiStatus === 'PENDING' ||
    data.apiStatus === 'UNDER_REVIEW' ||
    data.apiStatus === 'APPROVED'

  const showGuestNotify =
    canNotifyGuest &&
    !data.warehouseId &&
    (data.apiStatus === 'PENDING' || data.apiStatus === 'UNDER_REVIEW') &&
    onNotifyGuest

  const handleNotifyGuest = () => {
    const trimmed = guestMessage.trim()
    if (!trimmed || !onNotifyGuest) return
    void onNotifyGuest(trimmed)
  }

  const capacitySummary = formatRentalCapacitySummary(data)
  const showCapacity = hasRentalCapacityData(data)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">assignment</span>
              Chi tiết yêu cầu thuê
            </h2>
            <p className="text-xs text-slate-400 mt-1">{data.id}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded hover:bg-white/10">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className={MODAL_BODY_SCROLL_SPACE}>
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-cyan-400">THÔNG TIN YÊU CẦU</h3>

            <div>
              <label className={labelStyle}>Khách hàng</label>
              <input
                title="Khách hàng"
                placeholder="Khách hàng"
                className={inputStyle}
                value={data.customer}
                disabled
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Khu vực</label>
                <input
                  title="Khu vực"
                  placeholder="Khu vực"
                  className={inputStyle}
                  value={`${data.district}, ${data.city}`}
                  disabled
                />
              </div>
              <div>
                <label className={labelStyle}>Kho / claim</label>
                <input title="Kho / claim" placeholder="Kho" className={inputStyle} value={data.warehouse} disabled />
              </div>
            </div>

            {ct && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Loại hợp đồng</label>
                  <input
                    title="Loại hợp đồng"
                    placeholder="Loại hợp đồng"
                    className={inputStyle}
                    value={CONTRACT_TYPE_LABELS[ct] ?? ct}
                    disabled
                  />
                </div>
                <div>
                  <label className={labelStyle}>Chu kỳ</label>
                  <input
                    title="Chu kỳ thanh toán"
                    placeholder="Chu kỳ"
                    className={inputStyle}
                    value={
                      BILLING_CYCLE_GUEST_LABELS[data.billingCycle ?? ''] ??
                      data.billingCycle ??
                      '—'
                    }
                    disabled
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Ngày bắt đầu</label>
                <input title="Ngày bắt đầu" placeholder="Ngày bắt đầu" className={inputStyle} value={data.startDate} disabled />
              </div>
              <div>
                <label className={labelStyle}>Ngày kết thúc</label>
                <input title="Ngày kết thúc" placeholder="Ngày kết thúc" className={inputStyle} value={data.endDate} disabled />
              </div>
            </div>

            {showCapacity && (
              <div>
                <label className={labelStyle}>Quy mô hàng hóa</label>
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 space-y-2 text-sm text-slate-300">
                  {data.productLines && data.productLines.length > 0 && (
                    <ul className="space-y-1.5">
                      {data.productLines.map((line, index) => (
                        <li key={line.lineId ?? `${line.productKind}-${line.size}-${index}`}>
                          {formatRentalProductLineLabel(line)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {capacitySummary !== '—' && (
                    <p className={data.productLines?.length ? 'pt-1 border-t border-white/5 text-slate-400' : ''}>
                      {capacitySummary}
                    </p>
                  )}
                </div>
              </div>
            )}

            {(data.estimatedInboundPerWeek != null || data.estimatedOutboundPerWeek != null) && (
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                {data.estimatedInboundPerWeek != null && (
                  <p>Nhập/tuần: {data.estimatedInboundPerWeek}</p>
                )}
                {data.estimatedOutboundPerWeek != null && (
                  <p>Xuất/tuần: {data.estimatedOutboundPerWeek}</p>
                )}
              </div>
            )}

            {data.notes && (
              <div>
                <label className={labelStyle}>Ghi chú</label>
                <textarea
                  title="Ghi chú"
                  placeholder="Ghi chú"
                  className={`${inputStyle} min-h-[60px]`}
                  value={data.notes}
                  disabled
                />
              </div>
            )}

            {data.reviewNote && !showGuestNotify && (
              <div>
                <label className={labelStyle}>Thông báo guest (đã gửi)</label>
                <textarea
                  title="Thông báo guest"
                  className={`${inputStyle} min-h-[60px]`}
                  value={data.reviewNote}
                  disabled
                />
              </div>
            )}

            {showGuestNotify && (
              <div className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-amber-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">hourglass_top</span>
                  Thông báo chờ kho trống
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Guest sẽ thấy nội dung này khi tra cứu mã RR + email. Trạng thái chuyển sang{' '}
                  <strong className="text-amber-200">UNDER_REVIEW</strong>.
                </p>
                <textarea
                  title="Thông báo cho guest"
                  placeholder="VD: Hiện chưa có kho trống tại Bình Thạnh. Dự kiến có phương án Q3/2026 — chúng tôi sẽ liên hệ qua email."
                  className={`${inputStyle} min-h-[88px]`}
                  value={guestMessage}
                  onChange={(e) => setGuestMessage(e.target.value)}
                />
                <button
                  type="button"
                  disabled={notifyBusy || !guestMessage.trim()}
                  onClick={handleNotifyGuest}
                  className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-400/20 disabled:opacity-50"
                >
                  {notifyBusy ? 'Đang lưu…' : 'Lưu thông báo cho guest'}
                </button>
              </div>
            )}

            <div>
              <label className={labelStyle}>Trạng thái</label>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${rentalRequestStatusClass(data.apiStatus)}`}
              >
                {rentalRequestStatusLabel(data.apiStatus)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-white/[0.02]">
          <span className="text-xs text-slate-500">Duyệt → HĐ → Cấp bin/zone</span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">
              Đóng
            </button>
            {showOnboard && canProcess && (
              <button
                type="button"
                onClick={onStartOnboarding}
                className="btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-black flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-black text-[18px]">route</span>
                Bắt đầu xử lý
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
