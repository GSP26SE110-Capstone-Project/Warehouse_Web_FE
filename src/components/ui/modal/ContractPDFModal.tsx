import { useState, useEffect } from 'react'
import type { ContractResponse } from '../../../types/Contract'
import { accountApi } from '../../../service/accountApi'

type Props = {
    contract: ContractResponse
    onClose: () => void
}

type UserData = {
    userId: string
    fullName: string
    email?: string
    phone?: string
    role?: string
    status?: string
    tenantId?: string
    warehouseId?: string | null
    createdAt?: string
    updatedAt?: string
}

export const ContractPDFModal: React.FC<Props> = ({ contract, onClose }) => {
    const [userMap, setUserMap] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const response = await accountApi.getAll()
                console.log('API Response:', response)
                if (response.data.success && response.data.data) {
                    // Tạo map: userId -> fullName
                    const map: Record<string, string> = {}
                    response.data.data.forEach((user: UserData) => {
                        console.log('Mapping user:', user.userId, '->', user.fullName)
                        map[user.userId] = user.fullName
                    })
                    console.log('User map:', map)
                    setUserMap(map)
                }
            } catch (error) {
                console.error('Lỗi khi tải danh sách user:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchAllUsers()
    }, [])

    // Hàm lấy tên từ userId
    const getUserName = (userId: string | undefined) => {
        if (!userId) return '---'
        return userMap[userId] || userId // Nếu không tìm thấy, hiển thị userId
    }

    const handlePrint = () => {
        window.print()
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            DRAFT: 'text-amber-600',
            PENDING_APPROVAL: 'text-blue-600',
            ACTIVE: 'text-emerald-600',
            EXPIRED: 'text-red-600',
            TERMINATED: 'text-purple-600',
            CANCELLED: 'text-slate-600',
        }
        return colors[status] || 'text-slate-600'
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            DRAFT: 'Chờ xử lý',
            PENDING_APPROVAL: 'Đang xem xét',
            ACTIVE: 'Đã phê duyệt',
            EXPIRED: 'Đã hết hạn',
            TERMINATED: 'Đã chấm dứt',
            CANCELLED: 'Đã hủy',
        }
        return labels[status] || 'Không xác định'
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

                    {/* Header Toolbar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Hợp đồng: {contract.contractCode}</h2>
                            <p className="text-sm text-slate-500 mt-1">{contract.contractName}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                title="In"
                                className="p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <span className="material-symbols-outlined">print</span>
                            </button>
                            <button
                                onClick={onClose}
                                title="Đóng"
                                className="p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    {/* PDF Content */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
                        <div className="bg-white rounded-lg shadow-sm p-8 max-w-3xl mx-auto">

                            {/* Document Header */}
                            <div className="text-center mb-8 pb-8 border-b-2 border-slate-300">
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">HỢP ĐỒNG THUÊ KHO</h1>
                                <p className="text-sm text-slate-600">Số: {contract.contractCode}</p>
                                <p className={`text-lg font-semibold mt-4 ${getStatusColor(contract.status)}`}>
                                    Trạng thái: {getStatusLabel(contract.status)}
                                </p>
                            </div>

                            {/* Main Information Grid */}
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                {/* Thông tin cơ bản */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b-2 border-cyan-500">
                                        Thông tin cơ bản
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Tên hợp đồng</p>
                                            <p className="text-slate-900 font-medium">{contract.contractName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Loại hợp đồng</p>
                                            <p className="text-slate-900">{contract.contractType}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Mô hình giá</p>
                                            <p className="text-slate-900">{contract.pricingModel}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Chu kỳ thanh toán</p>
                                            <p className="text-slate-900">{contract.billingCycle}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Thông tin ngày */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b-2 border-emerald-500">
                                        Khoảng thời gian
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Ngày bắt đầu</p>
                                            <p className="text-slate-900 font-mono">
                                                {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Ngày kết thúc</p>
                                            <p className="text-slate-900 font-mono">
                                                {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Thời hạn tối thiểu (ngày)</p>
                                            <p className="text-slate-900 font-mono">{contract.minimumBillingDays}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chi tiết hợp đồng */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b-2 border-blue-500">
                                    Chi tiết hợp đồng
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Công suất dự trữ tối thiểu</p>
                                        <p className="text-slate-900">{contract.minimumReservedCapacity}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Tổng tiền dự kiến</p>
                                        <p className="text-slate-900 font-bold text-lg">
                                            {contract.estimatedTotalAmount?.toLocaleString('vi-VN')} VND
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Cho phép định vị lại động</p>
                                        <p className="text-slate-900">
                                            {contract.allowDynamicRelocation ? '✓ Có' : '✗ Không'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Tự động gia hạn</p>
                                        <p className="text-slate-900">
                                            {contract.autoRenew ? '✓ Có' : '✗ Không'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Chữ ký */}
                            <div className="border-t-2 border-slate-300 pt-8">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 pb-2 border-b-2 border-purple-500">
                                    Ký phê duyệt
                                </h3>
                                <div className="grid grid-cols-3 gap-8">
                                    <div className="text-center">
                                        <div className="h-16 border-b-2 border-slate-400 mb-2"></div>
                                        <p className="text-xs font-semibold text-slate-700">Người tạo</p>
                                        <p className="text-xs text-slate-900 font-semibold mt-1">
                                            {loading ? 'Đang tải...' : getUserName(contract.createdBy)}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className="h-16 border-b-2 border-slate-400 mb-2"></div>
                                        <p className="text-xs font-semibold text-slate-700">Bên cho thuê</p>
                                        <p className="text-xs text-slate-900 font-semibold mt-1">
                                            {loading ? 'Đang tải...' : getUserName(contract.warehouseSignature)}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className="h-16 border-b-2 border-slate-400 mb-2"></div>
                                        <p className="text-xs font-semibold text-slate-700">Bên thuê</p>
                                        <p className="text-xs text-slate-900 font-semibold mt-1">
                                            {loading ? 'Đang tải...' : getUserName(contract.tenantSignature)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                                <p>Tài liệu này được tạo tự động bởi hệ thống quản lý kho</p>
                                <p className="mt-1">
                                    Ngày in: {new Date().toLocaleString('vi-VN')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body {
                        background: white;
                    }
                    
                    .fixed {
                        position: static;
                    }
                    
                    div[class*="inset-0"] {
                        display: none;
                    }
                }
            `}</style>
        </>
    )
}