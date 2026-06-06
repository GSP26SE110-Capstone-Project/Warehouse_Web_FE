import React from 'react'
import type { RequestTransportation } from '../../../types/Transportation'
import { MODAL_BODY_SCROLL_SPACE } from '../../../styles/scrollClasses'

type Props = {
    mode?: 'view' | 'edit'
    data: RequestTransportation
    onClose: () => void
    onApprove?: (id: number) => void
    onReject?: (id: number) => void
}

export const RequestShipmentModal: React.FC<Props> = ({
    mode = 'view',
    data,
    onClose,
    onApprove,
    onReject
}) => {
    const isView = mode === 'view'
    const canAction = !isView && data.status === 'WAITING'

    const labelStyle =
        'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'

    const inputStyle =
        'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            {/* Overlay */}
            <div
                className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-400">
                                assignment
                            </span>
                            Chi tiết yêu cầu vận chuyển
                        </h2>

                        <p className="text-xs text-slate-400 mt-1">
                            Thông tin yêu cầu từ khách hàng
                        </p>
                    </div>

                    <button onClick={onClose} className="p-2 rounded hover:bg-white/10">
                        <span className="material-symbols-outlined text-slate-400">
                            close
                        </span>
                    </button>
                </div>

                {/* Body */}
                <div className={MODAL_BODY_SCROLL_SPACE}>

                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-4">
                        <h3 className="text-sm font-semibold text-cyan-400">
                            THÔNG TIN YÊU CẦU
                        </h3>

                        <div>
                            <label className={labelStyle}>Khách hàng</label>
                            <input className={inputStyle} value={data.customer} disabled />
                        </div>

                        <div>
                            <label className={labelStyle}>Miêu tả</label>
                            <input className={inputStyle} value={data.description} disabled />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Kho</label>
                                <input className={inputStyle} value={data.warehouse} disabled />
                            </div>

                            <div>
                                <label className={labelStyle}>Thời gian dự kiến</label>
                                <input
                                    className={inputStyle}
                                    value={data.scheduledTime}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Ngày bắt đầu</label>
                                <input className={inputStyle} value={data.actyalStartTime} disabled />
                            </div>

                            <div>
                                <label className={labelStyle}>Ngày kết thúc</label>
                                <input className={inputStyle} value={data.actualEndTime} disabled />
                            </div>
                        </div>

                        <div>
                            <label className={labelStyle}>Trạng thái</label>
                            <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${
                                    data.status === 'WAITING'
                                        ? 'text-yellow-400 bg-yellow-400/10 ring-yellow-400/20'
                                        : data.status === 'APPROVED'
                                        ? 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20'
                                        : 'text-red-400 bg-red-400/10 ring-red-400/20'
                                }`}
                            >
                                {data.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-white/[0.02]">

                    <span className="text-xs text-slate-500">
                        NEXSPACE
                    </span>

                    <div className="flex gap-3">

                        {/* Luôn có nút đóng */}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                        >
                            Đóng
                        </button>

                        {/* Chỉ hiện khi EDIT + WAITING */}
                        {canAction && (
                            <>
                                <button
                                    onClick={() => onReject?.(data.id)}
                                    className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600"
                                >
                                    Từ chối
                                </button>

                                <button
                                    onClick={() => onApprove?.(data.id)}
                                    className="btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-black flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-black text-[18px]">
                                        check
                                    </span>
                                    Duyệt
                                </button>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}