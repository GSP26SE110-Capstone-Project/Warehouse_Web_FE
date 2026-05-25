import { useState, useEffect, useMemo } from 'react'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { WPagination } from '../../components/ui/WhitePagination'
import type { UserRequest, UserResponse, Status, Role } from '../../types/Account'
import { accountApi } from '../../service/accountApi'
import { StaffModal } from '../../components/ui/modal/StaffModal'

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

export const ManageWarehouseStaff: React.FC = () => {
    // Get warehouseId from localStorage (only for WH_ADMIN)
    const [warehouseId, setWarehouseId] = useState<string | null>(null)
    const [staffList, setStaffList] = useState<UserResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
    const [selectedStaff, setSelectedStaff] = useState<UserResponse | undefined>()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleOpenModal = (mode: 'view' | 'edit' | 'create', staff?: UserResponse) => {
        setModalMode(mode)
        setSelectedStaff(staff)
        setShowModal(true)
    }

    const handleSubmitStaff = async (data: UserRequest) => {
        try {
            setIsSubmitting(true)

            if (modalMode === 'create') {
                const response = await accountApi.create(data)
                if (response.data.success) {
                    setAlert({
                        open: true,
                        type: 'success',
                        message: 'Tạo nhân viên thành công'
                    })
                    // Reload staff
                    if (warehouseId) {
                        const refreshResponse = await accountApi.getAll()
                        if (refreshResponse.data.success && refreshResponse.data.data) {
                            const filtered = refreshResponse.data.data.filter(
                                (u) => u.role === 'WH_STAFF' && u.warehouseId === warehouseId
                            )
                            setStaffList(filtered)
                        }
                    }
                }
            } else if (modalMode === 'edit' && selectedStaff) {
                const response = await accountApi.update(selectedStaff.userId, data)
                if (response.data.success) {
                    setAlert({
                        open: true,
                        type: 'success',
                        message: 'Cập nhật nhân viên thành công'
                    })
                    // Reload staff
                    if (warehouseId) {
                        const refreshResponse = await accountApi.getAll()
                        if (refreshResponse.data.success && refreshResponse.data.data) {
                            const filtered = refreshResponse.data.data.filter(
                                (u) => u.role === 'WH_STAFF' && u.warehouseId === warehouseId
                            )
                            setStaffList(filtered)
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

    const handleDeleteStaff = async (userId: string) => {
        setAlert({
            open: true,
            type: 'confirm',
            message: 'Bạn có chắc muốn xóa nhân viên này?',
            onConfirm: async () => {
                try {
                    const response = await accountApi.delete(userId)
                    if (response.data.success) {
                        // Reload staff
                        if (warehouseId) {
                            const refreshResponse = await accountApi.getAll()
                            if (refreshResponse.data.success && refreshResponse.data.data) {
                                const filtered = refreshResponse.data.data.filter(
                                    (u) => u.role === 'WH_STAFF' && u.warehouseId === warehouseId
                                )
                                setStaffList(filtered)
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
                    setError('Bạn không có quyền quản lý nhân viên')
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

    // Fetch staff for this warehouse
    useEffect(() => {
        const fetchStaff = async () => {
            if (!warehouseId) return

            try {
                setLoading(true)
                setError(null)
                const response = await accountApi.getAll()
                if (response.data.success && response.data.data) {
                    const filtered = response.data.data.filter(
                        (u) => u.role === 'WH_STAFF' && u.warehouseId === warehouseId
                    )
                    setStaffList(filtered)
                } else {
                    setError(response.data.message || 'Không thể tải dữ liệu nhân viên')
                }
            } catch (err) {
                console.error('Lỗi tải nhân viên:', err)
                setError('Lỗi kết nối khi tải dữ liệu')
            } finally {
                setLoading(false)
            }
        }

        fetchStaff()
    }, [warehouseId])

    // Filter staff
    const filteredStaff = useMemo(() => {
        return staffList.filter((staff) => {
            const matchSearch =
                staff.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
                staff.email.toLowerCase().includes(filters.search.toLowerCase())

            const matchStatus = filters.status === 'all' || staff.status === filters.status

            return matchSearch && matchStatus
        })
    }, [staffList, filters])

    // Pagination
    const totalItems = filteredStaff.length
    const totalPages = Math.ceil(totalItems / pageSize)

    const paginatedStaff = filteredStaff.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalItems)

    const getStatusBadge = (status: Status) => {
        const statusMap = {
            ACTIVE: { label: 'Hoạt động', className: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20' },
            INACTIVE: { label: 'Không hoạt động', className: 'bg-slate-50 text-slate-600 ring-slate-500/20' },
            SUSPENDED: { label: 'Tạm khóa', className: 'bg-amber-50 text-amber-600 ring-amber-500/20' },
            BLOCKED: { label: 'Bị chặn', className: 'bg-red-50 text-red-600 ring-red-500/20' },
        }
        return statusMap[status] || statusMap.INACTIVE
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
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Quản lý nhân viên kho</h1>
                        <p className="text-slate-500 text-sm">Xem xét và quản lý nhân viên của kho hàng</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal('create')}
                        className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-bold hover:bg-cyan-600 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Thêm nhân viên
                    </button>
                </div>

                {/* Filters */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc email..."
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
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="INACTIVE">Không hoạt động</option>
                            <option value="SUSPENDED">Tạm khóa</option>
                            <option value="BLOCKED">Bị chặn</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <LoadingOverlay show={loading} />
                ) : filteredStaff.length === 0 ? (
                    <div className="p-12 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">people</span>
                        <p className="text-slate-500 text-base font-medium">Không có nhân viên nào</p>
                    </div>
                ) : (
                    <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tên nhân viên</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Điện thoại</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedStaff.map((staff) => (
                                        <tr key={staff.userId} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-900 font-medium">{staff.fullName}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                {staff.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                {staff.phone || '---'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${getStatusBadge(staff.status).className}`}>
                                                    {getStatusBadge(staff.status).label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal('view', staff)}
                                                        className="px-3 py-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined">visibility</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal('edit', staff)}
                                                        className="px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-200 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStaff(staff.userId)}
                                                        className="px-3 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-200 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
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
                                <span className="text-slate-500">{totalItems}</span> nhân viên
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
                <StaffModal
                    mode={modalMode}
                    data={selectedStaff}
                    onClose={() => {
                        setShowModal(false)
                        setSelectedStaff(undefined)
                    }}
                    onSubmit={handleSubmitStaff}
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