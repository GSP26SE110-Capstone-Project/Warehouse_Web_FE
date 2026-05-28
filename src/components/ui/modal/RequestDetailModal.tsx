import React from 'react'
import {
  BILLING_CYCLE_GUEST_LABELS,
  CONTRACT_TYPE_LABELS,
  type ContractTypeValue,
} from '../../../data/contractTypes'
import type { RentalRequestRow } from '../../../mappers'

type Props = {
  data: RentalRequestRow
  canProcess?: boolean
  onClose: () => void
  onStartOnboarding: () => void
}

export const RequestDetailModal: React.FC<Props> = ({
  data,
  canProcess = true,
  onClose,
  onStartOnboarding,
}) => {
  const labelStyle =
    'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'

  const inputStyle =
    'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white'

  const ct = data.contractType as ContractTypeValue | undefined
  const showOnboard =
    data.apiStatus === 'PENDING' ||
    data.apiStatus === 'UNDER_REVIEW' ||
    data.apiStatus === 'APPROVED'

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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
              {data.estimatedBoxCount != null && (
                <p>Hộp ước tính: {data.estimatedBoxCount}</p>
              )}
              {data.estimatedInboundPerWeek != null && (
                <p>Nhập/tuần: {data.estimatedInboundPerWeek}</p>
              )}
              {data.estimatedOutboundPerWeek != null && (
                <p>Xuất/tuần: {data.estimatedOutboundPerWeek}</p>
              )}
              {data.requestedAreaM2 != null && <p>Diện tích: {data.requestedAreaM2} m²</p>}
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

            <div>
              <label className={labelStyle}>Trạng thái API</label>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${
                  data.status === 'pending'
                    ? 'text-yellow-400 bg-yellow-400/10 ring-yellow-400/20'
                    : data.status === 'approved'
                      ? 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20'
                      : 'text-red-400 bg-red-400/10 ring-red-400/20'
                }`}
              >
                {data.apiStatus}
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
