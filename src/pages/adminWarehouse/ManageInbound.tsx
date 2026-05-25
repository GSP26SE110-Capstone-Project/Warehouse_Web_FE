import { useState, useEffect, useMemo } from 'react'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { WPagination } from '../../components/ui/WhitePagination'
import type { InboundRequestRequest, InboundRequestResponse, Status } from '../../types/Inbound'
import { inboundApi } from '../../service/inboundApi'
import { InboundModal } from '../../components/ui/modal/InboundModal'
import type { TenantCompanyResponse } from '../../types/TenantCompany'
import { tenantCompanyApi } from '../../service/tenantCompany'

interface User {
    id: string
    email: string
    role: 'SYSTEM_ADMIN' | 'WH_ADMIN' | 'TENANT_ADMIN' | 'WH_STAFF'
    warehouseId?: string
    tenantId?: string
}

interface TableFilters {
    search: string
    status: Status | 'all'
}

export const ManageInbound: React.FC = () => {
    // Get warehouseId from localStorage (only for WH_ADMIN)
    const [warehouseId, setWarehouseId] = useState<string | null>(null)
    const [inboundRequests, setInboundRequests] = useState<InboundRequestResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tenants, setTenants] = useState<TenantCompanyResponse[]>([])

    const [filters, setFilters] = useState<TableFilters>({
        search: '',
        status: 'all',
    })

    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 5


    const [alert, setAlert] = useState<{
        open: boolean
        type: 'success' | 'confirm' | 'error'
        message: string
        onConfirm?: () => void
    }>({ open: false, type: 'success', message: '' })

    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create')
    const [selectedRequest, setSelectedRequest] = useState<InboundRequestResponse | undefined>()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleOpenModal = (mode: 'view' | 'edit' | 'create', request?: InboundRequestResponse) => {
        setModalMode(mode)
        setSelectedRequest(request)
        setShowModal(true)
    }

    const handleSubmitInboundRequest = async (data: InboundRequestRequest) => {
        try {
            setIsSubmitting(true)

            if (modalMode === 'create') {
                const response = await inboundApi.create(data)
                if (response.data.success) {
                    setAlert({
                        open: true,
                        type: 'success',
                        message: 'Tạo yêu cầu nhập kho thành công'
                    })
                    // Reload contracts
                    if (warehouseId) {
                        const refreshResponse = await inboundApi.getAllInboundRequestsByWarehouse(warehouseId)
                        if (refreshResponse.data.success && refreshResponse.data.data) {
                            setInboundRequests(refreshResponse.data.data)
                        }
                    }
                }
            } else if (modalMode === 'edit' && selectedRequest) {
                const response = await inboundApi.update(selectedRequest.inboundRequestId, data)
                if (response.data.success) {
                    setAlert({
                        open: true,
                        type: 'success',
                        message: 'Cập nhật yêu cầu nhập kho thành công'
                    })
                    // Reload contracts
                    if (warehouseId) {
                        const refreshResponse = await inboundApi.getAllInboundRequestsByWarehouse(warehouseId)
                        if (refreshResponse.data.success && refreshResponse.data.data) {
                            setInboundRequests(refreshResponse.data.data)
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Lỗi:', err)
            setAlert({
                open: true,
                type: 'error',
                message: 'Có lỗi xảy ra, vui lòng thử lại'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteInboundRequest = async (inboundRequestId: string) => {
        setAlert({
            open: true,
            type: 'confirm',
            message: 'Bạn có chắc muốn xóa yêu cầu nhập kho này?',
            onConfirm: async () => {
                try {
                    const response = await inboundApi.delete(inboundRequestId)
                    if (response.data.success) {
                        // Reload inbound requests
                        if (warehouseId) {
                            const refreshResponse = await inboundApi.getAllInboundRequestsByWarehouse(warehouseId)
                            if (refreshResponse.data.success && refreshResponse.data.data) {
                                setInboundRequests(refreshResponse.data.data)
                            }
                        }
                    }
                } catch (err) {
                    console.error('Lỗi xóa:', err)
                }
            }
        })
    }

    // Get warehouseId from localStorage
    useEffect(() => {
        const userString = localStorage.getItem('user')
        if (userString) {
            try {
                const user: User = JSON.parse(userString)
                if (user.role === 'WH_ADMIN' && user.warehouseId) {
                    setWarehouseId(user.warehouseId)
                } else {
                    setError('Bạn không có quyền quản lý các yêu cầu thuê này')
                    setLoading(false)
                }
            } catch (e) {
                console.error('Lỗi phân tích dữ liệu user:', e)
                setError('Lỗi xác thực người dùng')
                setLoading(false)
            }
        } else {
            setError('Vui lòng đăng nhập lại')
            setLoading(false)
        }
    }, [])

    // Fetch rental requests for this warehouse
    useEffect(() => {
        const fetchInboundRequests = async () => {
            if (!warehouseId) return

            try {
                setLoading(true)
                setError(null)
                const response = await inboundApi.getAllInboundRequestsByWarehouse(warehouseId)
                if (response.data.success && response.data.data) {
                    setInboundRequests(response.data.data)
                } else {
                    setError(response.data.message || 'Không thể tải dữ liệu yêu cầu')
                }
            } catch (err) {
                console.error('Lỗi tải yêu cầu nhập kho:', err)
                setError('Lỗi kết nối khi tải dữ liệu')
            } finally {
                setLoading(false)
            }
        }

        fetchInboundRequests()
    }, [warehouseId])

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const response = await tenantCompanyApi.getAll()
                if (response.data.success && response.data.data) {
                    setTenants(response.data.data)
                }
            } catch (err) {
                console.error('Lỗi tải danh sách thương nhân:', err)
            }
        }

        fetchTenants()
    }, [])

    const getTenantName = (tenantId: string) => {
        return tenants.find(t => t.tenantId === tenantId)?.companyName || tenantId
    }

    // Filter requests
    const filteredInboundRequests = useMemo(() => {
        return inboundRequests.filter((inboundRequest) => {
            const matchSearch =
                inboundRequest.inboundCode.toLowerCase().includes(filters.search.toLowerCase())

            const matchStatus = filters.status === 'all' || inboundRequest.status === filters.status

            return matchSearch && matchStatus
        })
    }, [inboundRequests, filters])

    // Pagination
    const totalItems = filteredInboundRequests.length
    const totalPages = Math.ceil(totalItems / pageSize)

    const paginatedInboundRequests = filteredInboundRequests.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalItems)


    const getStatusBadge = (status: Status) => {
        const statusMap = {
            DRAFT: { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-600 ring-amber-500/20' },
            PENDING: { label: 'Đang xem xét', className: 'bg-blue-50 text-blue-600 ring-blue-500/20' },
            APPROVED: { label: 'Đã phê duyệt', className: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20' },
            ARRIVED: { label: 'Đã từ chối', className: 'bg-red-50 text-red-600 ring-red-500/20' },
            RECEIVED: { label: 'Đã chuyển đổi', className: 'bg-purple-50 text-purple-600 ring-purple-500/20' },
            COMPLETED: { label: 'Đã hoàn thành', className: 'bg-green-50 text-green-600 ring-green-500/20' },
            CANCELED: { label: 'Đã hủy', className: 'bg-slate-50 text-slate-600 ring-slate-500/20' },
        }
        return statusMap[status] || statusMap.DRAFT
    }

    if (loading && !warehouseId) {
        return <LoadingOverlay show />
    }

    if (error && !warehouseId) {
        return (
            <div className="p-8 bg-slate-50 min-h-screen">
                <div className="max-w-[1200px] mx-auto">
                    <div className="p-6 rounded-2xl bg-red-50 border border-red-200 shadow-sm">
                        <p className="text-red-600 text-center font-medium">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="overflow-y-auto overflow-x-hidden p-6 md:p-8 bg-slate-50 text-slate-800">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Quản lý đơn nhập kho</h1>
                        <p className="text-slate-500 text-sm">Xem xét và phê duyệt các đơn nhập kho</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal('create')}
                        className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-bold hover:bg-cyan-600 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Tạo đơn nhập kho
                    </button>
                </div>

                {/* Filters */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên công ty, mã, hoặc liên hệ..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all text-sm"
                            />
                        </div>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value as Status | 'all' })}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all text-sm"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="DRAFT">Chờ xử lý</option>
                            <option value="PENDING">Đang xem xét</option>
                            <option value="APPROVED">Đã phê duyệt</option>
                            <option value="ARRIVED">Đã từ chối</option>
                            <option value="RECEIVED">Đã chuyển đổi</option>
                            <option value="COMPLETED">Đã hủy</option>
                            <option value="CANCELED">Đã hoàn thành</option>
                        </select>

                        {/* <select
                            value={filters.pricingModel}
                            onChange={(e) => setFilters({ ...filters, pricingModel: e.target.value as pricingModel | 'all' })}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all text-sm"
                        >
                            <option value="all">Tất cả mô hình định giá</option>
                            <option value="USAGE_BASED">Dựa trên sử dụng</option>
                            <option value="HYBRID">Kết hợp</option>
                            <option value="FIXED">Cố định</option>
                        </select> */}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <LoadingOverlay show={loading} />
                ) : filteredInboundRequests.length === 0 ? (
                    <div className="p-12 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">inbox</span>
                        <p className="text-slate-500 text-base font-medium">Không có đơn nhập kho nào</p>
                    </div>
                ) : (
                    <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Mã nhập kho</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Khách hàng</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày dự kiến ​​đến</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">thời gian đến thực tế</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedInboundRequests.map((request) => (
                                        <tr key={request.inboundRequestId} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-900 font-mono font-medium">{request.inboundCode}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                {getTenantName(request.tenantId)}                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                {request.expectedArrivalDate ? new Date(request.expectedArrivalDate).toLocaleDateString('vi-VN') : '---'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                {request.actualArrivalAt ? new Date(request.actualArrivalAt).toLocaleDateString('vi-VN') : '---'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${getStatusBadge(request.status).className}`}>
                                                    {getStatusBadge(request.status).label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal('view', request)}
                                                        className="px-3 py-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined ">visibility</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal('edit', request)}
                                                        className="px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-200 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined ">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteInboundRequest(request.inboundRequestId)}
                                                        className="px-3 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-200 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined ">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/5 bg-white px-6 py-2">
                            <p className="font-medium text-sm text-slate-500">
                                Hiển thị <span className="text-slate-500">{start}-{end}</span> trong{' '}
                                <span className="text-slate-500">{totalItems}</span> yêu cầu
                            </p>

                            <WPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                )}


            </div>


            {showModal && (
                <InboundModal
                    mode={modalMode}
                    data={selectedRequest}
                    onClose={() => {
                        setShowModal(false)
                        setSelectedRequest(undefined)
                    }}
                    onSubmit={handleSubmitInboundRequest}
                />
            )}
            {alert.open && (
                <AlertModal
                    title="Thông báo"
                    message={alert.message}
                    type={alert.type}
                    onConfirm={alert.onConfirm}
                    onClose={() => setAlert({ ...alert, open: false })}
                />
            )}
        </div>
    )
}