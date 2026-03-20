import React from 'react';

export type Report = {
    id: string;
    staffName: string;
    title: string;
    type: 'Incident' | 'Inventory' | 'Delivery';
    typeClassName: string;
    status: 'Pending' | 'Reviewed' | 'Rejected';
    statusClassName: string;
    createdAt: string;
    priority: 'Low' | 'Medium' | 'High';
    priorityClassName: string;
};

type Props = {
    report: Report;
    onClose: () => void;
};

// Hàm bổ trợ để lấy icon tương ứng với loại báo cáo
const getTypeIcon = (type: Report['type']) => {
    switch (type) {
        case 'Incident': return 'warning';
        case 'Inventory': return 'inventory_2';
        case 'Delivery': return 'local_shipping';
        default: return 'description';
    }
};

export const ReportViewModal: React.FC<Props> = ({ report, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay: Làm mờ hậu cảnh sâu hơn để tạo sự tập trung */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl shadow-black/50">

                {/* Header Section: Gradient nhẹ để tạo điểm nhấn */}
                <div className="relative border-b border-white/5 bg-white/[0.02] px-8 py-6">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className={`mt-1 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 ${report.typeClassName.split(' ')[0]}`}>
                                <span className="material-symbols-outlined text-2xl">
                                    {getTypeIcon(report.type)}
                                </span>
                            </div>
                                <h2 className="text-2xl font-semibold text-white mt-3">
                                    {report.title}
                                </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-8 py-8">
                    {/* Top Info Grid */}
                    <div className="mb-8 grid grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Nhân viên</p>
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full  bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center text-[10px] text-indigo-300 border border-indigo-500/30">
                                    {report.staffName.charAt(0)}
                                </div>
                                <p className="text-sm font-medium text-slate-200">{report.staffName}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Ngày tạo</p>
                            <div className="flex items-center gap-2 text-slate-200">
                                <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                                <p className="text-sm font-medium">{report.createdAt}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Loại báo cáo</p>
                            <div>
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${report.typeClassName}`}>
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    {report.type}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-cyan-400">subject</span>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Mô tả chi tiết</p>
                        </div>
                        <div className="min-h-[120px] rounded-xl border border-white/5 bg-white/[0.03] p-5 text-sm leading-relaxed text-slate-300 shadow-inner">
                            <p>
                                Đây là nội dung chi tiết của báo cáo. Hệ thống sẽ tự động lấy dữ liệu từ API để hiển thị tại đây.
                                Giao diện đã được tối ưu cho việc đọc văn bản dài với khoảng cách dòng hợp lý.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.01] px-8 py-5">
                    <div className="flex items-center gap-2">
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-lg px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};