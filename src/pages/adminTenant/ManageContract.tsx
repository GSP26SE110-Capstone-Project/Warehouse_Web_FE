import { useState, useEffect, useMemo } from 'react'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { WPagination } from '../../components/ui/WhitePagination'
import type { ContractResponse, status } from '../../types/Contract'
import { contractApi } from '../../service/contractApi'
import { ContractPDFModal } from '../../components/ui/modal/ContractPDFModal'
import { StatsCard } from '../../components/ui/StatCard'

interface User {
    id: string
    email: string
    role: 'SYSTEM_ADMIN' | 'WH_ADMIN' | 'TENANT_ADMIN' | 'STAFF'
    tenantId?: string
}

interface TableFilters {
    search: string
    status: status | 'all'
}

export const ManageContract: React.FC = () => {
    const [tenantId, setTenantId] = useState<string | null>(null)
    const [contracts, setContracts] = useState<ContractResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [filters, setFilters] = useState<TableFilters>({
        search: '',
        status: 'all',
    })

    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 6

    const [alert, setAlert] = useState<{
        open: boolean
        type: 'success' | 'confirm' | 'error'
        message: string
        onConfirm?: () => void
    }>({ open: false, type: 'success', message: '' })

    const [showPDFModal, setShowPDFModal] = useState(false)
    const [selectedContract, setSelectedContract] = useState<ContractResponse | undefined>()

    // Get tenantId from localStorage
    useEffect(() => {
        const userString = localStorage.getItem('user')
        if (userString) {
            try {
                const user: User = JSON.parse(userString)
                if (user.role === 'TENANT_ADMIN' && user.tenantId) {
                    setTenantId(user.tenantId)
                } else {
                    setError('Bạn không có quyền quản lý hợp đồng')
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

    // Fetch contracts for this tenant
    useEffect(() => {
        const fetchContracts = async () => {
            if (!tenantId) return

            try {
                setLoading(true)
                setError(null)
                const response = await contractApi.getAllContractsByWarehouse('')
                if (response.data.success && response.data.data) {
                    const filtered = response.data.data.filter(c => c.tenantId === tenantId)
                    setContracts(filtered)
                } else {
                    setError(response.data.message || 'Không thể tải dữ liệu hợp đồng')
                }
            } catch (err) {
                console.error('Lỗi tải hợp đồng:', err)
                setError('Lỗi kết nối khi tải dữ liệu')
            } finally {
                setLoading(false)
            }
        }

        fetchContracts()
    }, [tenantId])

    // Filter contracts
    const filteredContracts = useMemo(() => {
        return contracts.filter((contract) => {
            const matchSearch =
                contract.contractCode.toLowerCase().includes(filters.search.toLowerCase()) ||
                contract.contractName.toLowerCase().includes(filters.search.toLowerCase())

            const matchStatus = filters.status === 'all' || contract.status === filters.status

            return matchSearch && matchStatus
        })
    }, [contracts, filters])

    // Pagination
    const totalItems = filteredContracts.length
    const totalPages = Math.ceil(totalItems / pageSize)

    const paginatedContracts = filteredContracts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalItems)

    const handleViewPDF = (contract: ContractResponse) => {
        setSelectedContract(contract)
        setShowPDFModal(true)
    }

    const getStatusBadge = (status: status) => {
        const statusMap = {
            DRAFT: { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-700 border-amber-200' },
            PENDING_APPROVAL: { label: 'Đang xem xét', className: 'bg-blue-50 text-blue-700 border-blue-200' },
            ACTIVE: { label: 'Đã phê duyệt', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            EXPIRED: { label: 'Đã hết hạn', className: 'bg-rose-50 text-rose-700 border-rose-200' },
            TERMINATED: { label: 'Đã chấm dứt', className: 'bg-purple-50 text-purple-700 border-purple-200' },
            CANCELLED: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-700 border-slate-200' },
        }
        return statusMap[status] || statusMap.DRAFT
    }

    if (loading && !tenantId) {
        return <LoadingOverlay show />
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-50 text-slate-900">
                <div className="text-center p-6 bg-white rounded-xl shadow-md border border-slate-200">
                    <p className="text-rose-600 text-lg font-medium">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex max-w-screen overflow-hidden bg-slate-50 text-slate-800 min-h-screen">
            <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
                {/* Lớp phủ chuyển sang nền trắng mờ để lộ nhẹ hình nền công nghệ phía sau */}
                <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-xs" />

                <div className="relative z-10 p-6 overflow-y-auto w-full">
                    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">

                        {/* Header & Filter */}
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <h3 className="text-2xl font-bold text-slate-900">
                                    Hợp đồng của tôi
                                </h3>
                            </div>

                            {/* Search & Filter Inputs */}
                            <div className="flex gap-3 flex-wrap">
                                <div className="relative flex-1 min-w-[250px]">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        search
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Tìm mã hoặc tên hợp đồng..."
                                        value={filters.search}
                                        onChange={(e) => {
                                            setFilters({ ...filters, search: e.target.value })
                                            setCurrentPage(1)
                                        }}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition-all shadow-xs"
                                    />
                                </div>

                                <select
                                    value={filters.status}
                                    onChange={(e) => {
                                        setFilters({ ...filters, status: e.target.value as any })
                                        setCurrentPage(1)
                                    }}
                                    className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition-all shadow-xs cursor-pointer"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="DRAFT">Chờ xử lý</option>
                                    <option value="PENDING_APPROVAL">Đang xem xét</option>
                                    <option value="ACTIVE">Đang hoạt động</option>
                                    <option value="EXPIRED">Đã hết hạn</option>
                                    <option value="TERMINATED">Đã chấm dứt</option>
                                    <option value="CANCELLED">Đã hủy</option>
                                </select>
                            </div>
                        </div>

                        {/* Contract Cards Grid */}
                        {paginatedContracts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {paginatedContracts.map((contract) => (
                                        <div
                                            key={contract.contractId}
                                            onClick={() => handleViewPDF(contract)}
                                            className="group cursor-pointer bg-white rounded-xl border border-slate-200/80 hover:border-cyan-500/50 overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50 flex flex-col justify-between"
                                        >
                                            {/* Card Header */}
                                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <p className="text-xs font-mono text-slate-400 mb-1">Mã HĐ</p>
                                                        <h4 className="text-lg font-bold text-cyan-600 font-mono tracking-tight group-hover:text-cyan-500 transition-colors">
                                                            {contract.contractCode}
                                                        </h4>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${getStatusBadge(contract.status).className}`}>
                                                        {getStatusBadge(contract.status).label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-6 space-y-4 flex-1">
                                                {/* Tên HĐ */}
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tên hợp đồng</p>
                                                    <p className="text-slate-800 font-medium line-clamp-2 text-sm leading-relaxed">{contract.contractName}</p>
                                                </div>

                                                {/* Loại HĐ */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Loại HĐ</p>
                                                        <p className="text-sm text-slate-600 font-medium">{contract.contractType}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mô hình giá</p>
                                                        <p className="text-sm text-slate-600 font-medium">{contract.pricingModel}</p>
                                                    </div>
                                                </div>

                                                {/* Ngày */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bắt đầu</p>
                                                        <p className="text-sm text-slate-600 font-mono font-medium">
                                                            {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Kết thúc</p>
                                                        <p className="text-sm text-slate-600 font-mono font-medium">
                                                            {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Chu kỳ TT */}
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Chu kỳ thanh toán</p>
                                                    <p className="text-sm text-slate-600 font-medium">{contract.billingCycle}</p>
                                                </div>
                                            </div>

                                            {/* Card Footer */}
                                            <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
                                                <div className="text-slate-400 font-medium">
                                                    Nhấn để xem chi tiết
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="material-symbols-outlined text-base text-cyan-600">open_in_full</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                                    <p className="font-mono text-sm text-slate-500">
                                        Hiển thị <span className="text-slate-800 font-semibold">{start}-{end}</span> trong{' '}
                                        <span className="text-slate-800 font-semibold">{totalItems}</span> hợp đồng
                                    </p>
                                    <WPagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-xs">
                                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">description</span>
                                <p className="text-slate-500 text-lg font-medium">Không có hợp đồng nào</p>
                                <p className="text-slate-400 text-sm mt-1">Bắt đầu bằng cách tạo một hợp đồng mới</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Contract PDF Modal */}
            {showPDFModal && selectedContract && (
                <ContractPDFModal
                    contract={selectedContract}
                    onClose={() => setShowPDFModal(false)}
                />
            )}

            {/* Alert Modal */}
            {alert.open && (
                <AlertModal
                    title={alert.type === 'confirm' ? 'Xác nhận' : alert.type === 'success' ? 'Thành công' : 'Lỗi'}
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ ...alert, open: false })}
                    onConfirm={alert.onConfirm}
                />
            )}
        </div>
    )
}