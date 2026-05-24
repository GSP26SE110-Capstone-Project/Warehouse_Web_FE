import { useState, useEffect, useMemo } from 'react'
import { rentalRequestApi } from '../../service/rentalRequestApi'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import type { RentalRequestResponse, RentalRequestStatus } from '../../types/RentalRequest'
import { WPagination } from '../../components/ui/WhitePagination'

interface User {
  id: string
  email: string
  role: 'SYSTEM_ADMIN' | 'WH_ADMIN' | 'TENANT_ADMIN' | 'STAFF'
  warehouseId?: string
  tenantId?: string
}

interface TableFilters {
  search: string
  status: RentalRequestStatus | 'all'
  contractType: string
}

export const ManageRequestRental: React.FC = () => {
  // Get warehouseId from localStorage (only for WH_ADMIN)
  const [warehouseId, setWarehouseId] = useState<string | null>(null)
  const [requests, setRequests] = useState<RentalRequestResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    status: 'all',
    contractType: 'all',
  })

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const [selectedRequest, setSelectedRequest] = useState<RentalRequestResponse | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'confirm' | 'error'
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

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
    const fetchRequests = async () => {
      if (!warehouseId) return

      try {
        setLoading(true)
        setError(null)
        const response = await rentalRequestApi.getRentalRequestsByWarehouse(warehouseId)
        if (response.data.success && response.data.data) {
          setRequests(response.data.data)
        } else {
          setError(response.data.message || 'Không thể tải dữ liệu yêu cầu')
        }
      } catch (err) {
        console.error('Lỗi tải yêu cầu thuê:', err)
        setError('Lỗi kết nối khi tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [warehouseId])

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchSearch =
        req.companyName.toLowerCase().includes(filters.search.toLowerCase()) ||
        req.requestCode.toLowerCase().includes(filters.search.toLowerCase()) ||
        req.contactName.toLowerCase().includes(filters.search.toLowerCase())

      const matchStatus = filters.status === 'all' || req.status === filters.status
      const matchContract = filters.contractType === 'all' || req.contractType === filters.contractType

      return matchSearch && matchStatus && matchContract
    })
  }, [requests, filters])

  // Pagination
  const totalItems = filteredRequests.length
  const totalPages = Math.ceil(totalItems / pageSize)

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  // Approve request
  const handleApprove = async (request: RentalRequestResponse) => {
    setAlert({
      open: true,
      type: 'confirm',
      message: `Xác nhận phê duyệt yêu cầu thuê của ${request.companyName}?`,
      onConfirm: async () => {
        try {
          await rentalRequestApi.approveApi(request.rentalRequestId)
          setRequests(
            requests.map((r) =>
              r.rentalRequestId === request.rentalRequestId
                ? { ...r, status: 'APPROVED' as RentalRequestStatus }
                : r
            )
          )
          setAlert({
            open: true,
            type: 'success',
            message: 'Phê duyệt yêu cầu thành công',
          })
        } catch (err) {
          console.error('Lỗi phê duyệt:', err)
          setAlert({
            open: true,
            type: 'error',
            message: 'Lỗi phê duyệt yêu cầu',
          })
        }
      },
    })
  }

  // Reject request
  const handleReject = (request: RentalRequestResponse) => {
    setSelectedRequest(request)
    setRejectionReason('')
    setModalOpen(true)
  }

  const confirmReject = async () => {
    if (!selectedRequest) return

    if (!rejectionReason.trim()) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Vui lòng nhập lý do từ chối',
      })
      return
    }

    try {
      await rentalRequestApi.rejectApi(
        selectedRequest.rentalRequestId,
        rejectionReason
      )
      setRequests(
        requests.map((r) =>
          r.rentalRequestId === selectedRequest.rentalRequestId
            ? { ...r, status: 'REJECTED' as RentalRequestStatus }
            : r
        )
      )
      setModalOpen(false)
      setSelectedRequest(null)
      setRejectionReason('')
      setAlert({
        open: true,
        type: 'success',
        message: 'Từ chối yêu cầu thành công',
      })
    } catch (err) {
      console.error('Lỗi từ chối:', err)
      setAlert({
        open: true,
        type: 'error',
        message: 'Lỗi từ chối yêu cầu',
      })
    }
  }

  const getStatusBadge = (status: RentalRequestStatus) => {
    const statusMap = {
      PENDING: { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-600 ring-amber-500/20' },
      UNDER_REVIEW: { label: 'Đang xem xét', className: 'bg-blue-50 text-blue-600 ring-blue-500/20' },
      APPROVED: { label: 'Đã phê duyệt', className: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20' },
      REJECTED: { label: 'Đã từ chối', className: 'bg-red-50 text-red-600 ring-red-500/20' },
      CONVERTED: { label: 'Đã chuyển đổi', className: 'bg-purple-50 text-purple-600 ring-purple-500/20' },
    }
    return statusMap[status] || statusMap.PENDING
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
    <div className="overflow-y-auto overflow-x-hidden p-6 md:p-8 bg-slate-50 min-h-screen text-slate-800">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Quản lý Yêu cầu Thuê</h1>
            <p className="text-slate-500 text-sm">Xem xét và phê duyệt các yêu cầu thuê kho hàng</p>
          </div>
        </div>

        {/* Filters */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onChange={(e) => setFilters({ ...filters, status: e.target.value as RentalRequestStatus | 'all' })}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="UNDER_REVIEW">Đang xem xét</option>
              <option value="APPROVED">Đã phê duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="CONVERTED">Đã chuyển đổi</option>
            </select>

            <select
              value={filters.contractType}
              onChange={(e) => setFilters({ ...filters, contractType: e.target.value })}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all text-sm"
            >
              <option value="all">Tất cả loại hợp đồng</option>
              <option value="SHARED_STORAGE">Lưu trữ chung</option>
              <option value="RESERVED_STORAGE">Lưu trữ dự trữ</option>
              <option value="DEDICATED_ZONE">Zone riêng</option>
              <option value="DEDICATED_WAREHOUSE">Kho riêng</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingOverlay show={loading} />
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">inbox</span>
            <p className="text-slate-500 text-base font-medium">Không có yêu cầu thuê nào</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Mã yêu cầu</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Công ty</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Liên hệ</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Loại hợp đồng</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày tạo</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRequests.map((request) => (
                    <tr key={request.rentalRequestId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-900 font-mono font-medium">{request.requestCode}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">
                        <div>
                          <p className="font-semibold text-slate-900">{request.companyName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{request.companyCode}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800">
                        <div>
                          <p className="font-medium text-slate-800">{request.contactName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{request.contactPhone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {request.contractType === 'SHARED_STORAGE' ? 'Lưu trữ chung' :
                          request.contractType === 'RESERVED_STORAGE' ? 'Lưu trữ dự trữ' :
                            request.contractType === 'DEDICATED_ZONE' ? 'Zone riêng' : 'Kho riêng'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${getStatusBadge(request.status).className}`}>
                          {getStatusBadge(request.status).label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {(request.status === 'PENDING' || request.status === 'UNDER_REVIEW') && (
                            <>
                              <button
                                onClick={() => handleApprove(request)}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
                              >
                                Phê duyệt
                              </button>
                              <button
                                onClick={() => handleReject(request)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          <button className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                            Chi tiết
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

      {/* Rejection Modal */}
      {modalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="p-6 rounded-xl bg-white border border-slate-200 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Từ chối yêu cầu</h3>
            <p className="text-sm text-slate-500 mb-4">
              Yêu cầu từ: <span className="font-semibold text-slate-800">{selectedRequest.companyName}</span>
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối cụ thể..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all text-sm min-h-24 resize-none"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setModalOpen(false); setSelectedRequest(null); setRejectionReason('') }}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-all text-sm font-bold"
              >
                Hủy
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-bold shadow-sm shadow-red-600/10"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
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