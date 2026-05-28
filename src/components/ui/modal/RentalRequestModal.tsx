import { useState } from 'react'
import type { RentalRequestResponse } from '../../../types/RentalRequest'
import type { TenantCompanyResponse } from '../../../types/TenantCompany'

type Props = {
    request: RentalRequestResponse
    tenant: TenantCompanyResponse | undefined
    onClose: () => void
    onApprove?: () => void
    onReject?: () => void
}

export const RentalRequestDetailModal: React.FC<Props> = ({
    request,
    tenant,
    onClose,
    onApprove,
    onReject,
}) => {
    const [isRejecting, setIsRejecting] = useState(false)

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            PENDING: { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-600 ring-amber-500/20' },
            UNDER_REVIEW: { label: 'Đang xem xét', className: 'bg-blue-50 text-blue-600 ring-blue-500/20' },
            APPROVED: { label: 'Đã phê duyệt', className: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20' },
            REJECTED: { label: 'Đã từ chối', className: 'bg-red-50 text-red-600 ring-red-500/20' },
            CONVERTED: { label: 'Đã chuyển đổi', className: 'bg-purple-50 text-purple-600 ring-purple-500/20' },
        }
        return statusMap[status] || statusMap.PENDING
    }

    const getContractTypeName = (type: string) => {
        const typeMap: Record<string, string> = {
            SHARED_STORAGE: 'Lưu trữ chung',
            RESERVED_STORAGE: 'Lưu trữ dự trữ',
            DEDICATED_ZONE: 'Zone riêng',
            DEDICATED_WAREHOUSE: 'Kho riêng',
        }
        return typeMap[type] || type
    }

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Chi tiết Yêu cầu Thuê</h2>
                            <p className="text-sm text-slate-500 mt-1">Mã: {request.requestCode}</p>
                        </div>

                        <button
                            onClick={onClose}
                            title="Đóng"
                            className="p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                        <div className="space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                                <span className="text-sm font-semibold text-slate-700">Trạng thái</span>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${getStatusBadge(request.status).className}`}>
                                    {getStatusBadge(request.status).label}
                                </span>
                            </div>

                            {/* Tenant Information */}
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b-2 border-cyan-500">
                                    Thông tin công ty
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Tên công ty</p>
                                        <p className="text-slate-900 font-medium mt-1">{tenant?.companyName || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Mã công ty</p>
                                        <p className="text-slate-900 font-medium mt-1">{tenant?.companyCode || '---'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Địa chỉ</p>
                                        <p className="text-slate-900 font-medium mt-1">{tenant?.address || '---'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Người liên hệ</p>
                                        <p className="text-slate-900 font-medium mt-1">{tenant?.contactName || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Điện thoại</p>
                                        <p className="text-slate-900 font-medium mt-1">{tenant?.contactPhone || '---'}</p>
                                    </div>
                                    <div >
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                                        <p className="text-slate-900 font-medium mt-1">{tenant?.contactEmail || '---'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Request Details */}
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b-2 border-blue-500">
                                    Chi tiết yêu cầu
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Loại hợp đồng</p>
                                        <p className="text-slate-900 font-medium mt-1">{getContractTypeName(request.contractType)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Mô hình giá</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.pricingModel}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Chu kỳ thanh toán</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.billingCycle}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Thành phố</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.city || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Quận/Huyện</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.district || '---'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Capacity & Volume */}
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b-2 border-green-500">
                                    Công suất & Khối lượng
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Diện tích yêu cầu (m²)</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.requestedAreaM2}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Số SKU ước tính</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.estimatedSkuCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Số thùng ước tính</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.estimatedBoxCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Thể tích ước tính (m³)</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.estimatedVolume}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Nhập/tuần ước tính</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.estimatedInboundPerWeek}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Xuất/tuần ước tính</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.estimatedOutboundPerWeek}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Storage Requirements */}
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b-2 border-purple-500">
                                    Yêu cầu lưu trữ
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Ngày lưu trữ trung bình</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.averageStorageDays} ngày</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Cần lấy nhanh</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.requiresFastPicking ? '✓ Có' : '✗ Không'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Cần lưu trữ cao cấp</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.requiresPremiumStorage ? '✓ Có' : '✗ Không'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Loại kệ đề xuất</p>
                                        <p className="text-slate-900 font-medium mt-1">{request.suggestedRackType || '---'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b-2 border-orange-500">
                                    Lịch trình
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Ngày bắt đầu dự kiến</p>
                                        <p className="text-slate-900 font-medium mt-1">
                                            {new Date(request.expectedStartDate).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Ngày kết thúc dự kiến</p>
                                        <p className="text-slate-900 font-medium mt-1">
                                            {new Date(request.expectedEndDate).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Ngày tạo</p>
                                        <p className="text-slate-900 font-medium mt-1">
                                            {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {request.notes && (
                                <div className="bg-white rounded-lg border border-slate-200 p-4">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b-2 border-slate-500">
                                        Ghi chú
                                    </h3>
                                    <p className="text-slate-800">{request.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-all text-sm font-bold"
                        >
                            Đóng
                        </button>

                        {(request.status === 'PENDING' || request.status === 'UNDER_REVIEW') && (
                            <>
                                <button
                                    onClick={onReject}
                                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all text-sm font-bold"
                                >
                                    Từ chối
                                </button>
                                <button
                                    onClick={onApprove}
                                    className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all text-sm font-bold"
                                >
                                    Phê duyệt
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}