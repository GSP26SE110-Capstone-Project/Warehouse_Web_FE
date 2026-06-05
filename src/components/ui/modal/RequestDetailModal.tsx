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
import { useAuth } from '../../../auth/AuthContext' // Import hook auth để check role

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
  const { user: currentUser } = useAuth()
  const [guestMessage, setGuestMessage] = useState(data.reviewNote ?? '')

  // Kiểm tra nếu là SYSTEM_ADMIN thì giữ giao diện Dark Mode nguyên bản
  const isDarkMode = currentUser?.role === 'SYSTEM_ADMIN'

  // Kiểu dáng cho các nhãn (Labels)
  const labelStyle = `text-[11px] font-bold uppercase tracking-wider mb-1.5 block ${
    isDarkMode ? 'text-slate-500' : 'text-slate-500'
  }`

  // Kiểu dáng ô nhập liệu (Inputs / Textarea) động theo Theme
  const inputStyle = `w-full rounded-lg px-4 py-2.5 text-sm transition-all shadow-sm focus:outline-none focus:ring-1 ${
    isDarkMode
      ? 'bg-[#1a2333] border border-white/10 text-white focus:border-cyan-400 focus:ring-cyan-400/20 disabled:bg-[#1a2333] disabled:text-slate-400'
      : 'bg-white border border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-600'
  }`

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Lớp nền mờ phía sau overlay (Phụ thuộc vào Theme) */}
      <div className={`absolute inset-0 backdrop-blur-sm ${
        isDarkMode ? 'bg-[#0b101a]/90' : 'bg-slate-900/40'
      }`} onClick={onClose} />

      {/* Khung Modal chính */}
      <div className={`relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border shadow-2xl flex flex-col transition-colors duration-200 ${
        isDarkMode ? 'border-white/5 bg-[#0b101a]' : 'border-slate-200 bg-white'
      }`}>
        
        {/* Header Modal */}
        <div className={`flex items-center justify-between px-6 py-5 border-b transition-colors ${
          isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <span className={`material-symbols-outlined ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>assignment</span>
              Chi tiết yêu cầu thuê
            </h2>
            <p className={`text-xs font-mono mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{data.id}</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Nội dung Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className={`p-5 rounded-lg border space-y-4 ${
            isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/50 border-slate-100'
          }`}>
            <h3 className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
              THÔNG TIN YÊU CẦU
            </h3>

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

            {/* Khối thông tin bổ sung phụ thuộc Theme */}
            <div className={`grid grid-cols-2 gap-4 text-xs font-medium p-3 rounded-lg border shadow-inner ${
              isDarkMode 
                ? 'bg-[#131b29]/30 border-white/5 text-slate-400' 
                : 'bg-white border-slate-200 text-slate-600'
            }`}>
              {data.estimatedBoxCount != null && (
                <p>Hộp ước tính: <span className={isDarkMode ? 'text-slate-200 font-semibold' : 'text-slate-900 font-semibold'}>{data.estimatedBoxCount}</span></p>
              )}
              {data.estimatedInboundPerWeek != null && (
                <p>Nhập/tuần: <span className={isDarkMode ? 'text-slate-200 font-semibold' : 'text-slate-900 font-semibold'}>{data.estimatedInboundPerWeek}</span></p>
              )}
              {data.estimatedOutboundPerWeek != null && (
                <p>Xuất/tuần: <span className={isDarkMode ? 'text-slate-200 font-semibold' : 'text-slate-900 font-semibold'}>{data.estimatedOutboundPerWeek}</span></p>
              )}
              {data.requestedAreaM2 != null && (
                <p>Diện tích: <span className={isDarkMode ? 'text-slate-200 font-semibold' : 'text-slate-900 font-semibold'}>{data.requestedAreaM2} m²</span></p>
              )}
            </div>

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

            {/* Thông báo cho Guest (Khối Amber thích ứng tinh gọn tốt hơn cho cả 2 theme) */}
            {showGuestNotify && (
              <div className={`rounded-lg border p-4 space-y-3 shadow-sm ${
                isDarkMode 
                  ? 'border-amber-400/25 bg-amber-400/5' 
                  : 'border-amber-200 bg-amber-50'
              }`}>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-amber-200' : 'text-amber-900'}`}>
                  <span className={`material-symbols-outlined text-base ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>hourglass_top</span>
                  Thông báo chờ kho trống
                </h3>
                <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-amber-800'}`}>
                  Guest sẽ thấy nội dung này khi tra cứu mã RR + email. Trạng thái chuyển sang{' '}
                  <strong className={isDarkMode ? 'text-amber-200' : 'text-amber-900'}>UNDER_REVIEW</strong>.
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
                  className={`rounded-lg border text-sm font-semibold px-4 py-2 shadow-sm transition-colors disabled:opacity-50 ${
                    isDarkMode
                      ? 'border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20'
                      : 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200'
                  }`}
                >
                  {notifyBusy ? 'Đang lưu…' : 'Lưu thông báo cho guest'}
                </button>
              </div>
            )}

            <div>
              <label className={labelStyle}>Trạng thái</label>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                  rentalRequestStatusClass(data.apiStatus, isDarkMode) // Tự động đồng bộ class trạng thái theo theme
                }`}
              >
                {rentalRequestStatusLabel(data.apiStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Chân Modal (Footer) */}
        <div className={`flex justify-between items-center px-6 py-4 border-t transition-colors ${
          isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <span className="text-xs font-medium text-slate-500"></span>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đóng
            </button>
            {showOnboard && canProcess && (
              <button
                type="button"
                onClick={onStartOnboarding}
                className={`shadow-md px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.98] ${
                  isDarkMode
                    ? 'btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 text-black'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${isDarkMode ? 'text-black' : 'text-white'}`}>route</span>
                Bắt đầu xử lý
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}