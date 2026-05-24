import { useState, useEffect, useMemo } from 'react'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { WPagination } from '../../components/ui/WhitePagination'
import type { billingCycle, ContractRequest, ContractResponse, pricingModel, status } from '../../types/Contract'
import { contractApi } from '../../service/contractApi'
import { ContractModal } from '../../components/ui/modal/ContractModal'

interface User {
  id: string
  email: string
  role: 'SYSTEM_ADMIN' | 'WH_ADMIN' | 'TENANT_ADMIN' | 'STAFF'
  warehouseId?: string
  tenantId?: string
}

interface TableFilters {
  search: string
  status: status | 'all'
  pricingModel: pricingModel | 'all'
  billingCycle: billingCycle | 'all'
}

export const ManageContracts: React.FC = () => {
  // Get warehouseId from localStorage (only for WH_ADMIN)
  const [warehouseId, setWarehouseId] = useState<string | null>(null)
  const [requests, setRequests] = useState<ContractResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    status: 'all',
    pricingModel: 'all',
    billingCycle: 'all'
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
  const [selectedContract, setSelectedContract] = useState<ContractResponse | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenModal = (mode: 'view' | 'edit' | 'create', contract?: ContractResponse) => {
    setModalMode(mode)
    setSelectedContract(contract)
    setShowModal(true)
  }

  const handleSubmitContract = async (data: ContractRequest) => {
    try {
      setIsSubmitting(true)

      if (modalMode === 'create') {
        const response = await contractApi.create(data)
        if (response.data.success) {
          setAlert({
            open: true,
            type: 'success',
            message: 'Tạo hợp đồng thành công'
          })
          // Reload contracts
          if (warehouseId) {
            const refreshResponse = await contractApi.getAllContractsByWarehouse(warehouseId)
            if (refreshResponse.data.success && refreshResponse.data.data) {
              setRequests(refreshResponse.data.data)
            }
          }
        }
      } else if (modalMode === 'edit' && selectedContract) {
        const response = await contractApi.update(selectedContract.contractId, data)
        if (response.data.success) {
          setAlert({
            open: true,
            type: 'success',
            message: 'Cập nhật hợp đồng thành công'
          })
          // Reload contracts
          if (warehouseId) {
            const refreshResponse = await contractApi.getAllContractsByWarehouse(warehouseId)
            if (refreshResponse.data.success && refreshResponse.data.data) {
              setRequests(refreshResponse.data.data)
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

  const handleDeleteContract = async (contractId: string) => {
    setAlert({
      open: true,
      type: 'confirm',
      message: 'Bạn có chắc muốn xóa hợp đồng này?',
      onConfirm: async () => {
        try {
          const response = await contractApi.delete(contractId)
          if (response.data.success) {
            // Reload contracts
            if (warehouseId) {
              const refreshResponse = await contractApi.getAllContractsByWarehouse(warehouseId)
              if (refreshResponse.data.success && refreshResponse.data.data) {
                setRequests(refreshResponse.data.data)
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
    const fetchContracts = async () => {
      if (!warehouseId) return

      try {
        setLoading(true)
        setError(null)
        const response = await contractApi.getAllContractsByWarehouse(warehouseId)
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

    fetchContracts()
  }, [warehouseId])

  // Filter requests
  const filteredContracts = useMemo(() => {
    return requests.filter((req) => {
      const matchSearch =
        req.contractName.toLowerCase().includes(filters.search.toLowerCase()) ||
        req.contractCode.toLowerCase().includes(filters.search.toLowerCase())

      const matchStatus = filters.status === 'all' || req.status === filters.status
      const matchPricingModel = filters.pricingModel === 'all' || req.pricingModel === filters.pricingModel
      const matchBillingCycle = filters.billingCycle === 'all' || req.billingCycle === filters.billingCycle

      return matchSearch && matchStatus && matchPricingModel && matchBillingCycle
    })
  }, [requests, filters])

  // Pagination
  const totalItems = filteredContracts.length
  const totalPages = Math.ceil(totalItems / pageSize)

  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)


  const getStatusBadge = (status: status) => {
    const statusMap = {
      DRAFT: { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-600 ring-amber-500/20' },
      PENDING_APPROVAL: { label: 'Đang xem xét', className: 'bg-blue-50 text-blue-600 ring-blue-500/20' },
      ACTIVE: { label: 'Đã phê duyệt', className: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20' },
      EXPIRED: { label: 'Đã từ chối', className: 'bg-red-50 text-red-600 ring-red-500/20' },
      TERMINATED: { label: 'Đã chuyển đổi', className: 'bg-purple-50 text-purple-600 ring-purple-500/20' },
      CANCELLED: { label: 'Đã hủy', className: 'bg-slate-50 text-slate-600 ring-slate-500/20' },
    }
    return statusMap[status] || statusMap.DRAFT
  }

  const getPricingModelBadge = (pricingModel: pricingModel) => {
    const pricingModelMap = {
      USAGE_BASED: { label: 'Dựa trên mức sử dụng', className: 'bg-blue-50 text-blue-600 ring-blue-500/20' },
      HYBRID: { label: 'Kết hợp', className: 'bg-purple-50 text-purple-600 ring-purple-500/20' },
      FIXED: { label: 'Giá cố định', className: 'bg-green-50 text-green-600 ring-green-500/20' },
    }
    return pricingModelMap[pricingModel] || pricingModelMap.FIXED
  }

  const getBillingCycleBadge = (billingCycle: billingCycle) => {
    const billingCycleMap = {
      MONTHLY: { label: 'Tháng', className: 'bg-blue-50 text-blue-600 ring-blue-500/20' },
      QUARTERLY: { label: 'Quý', className: 'bg-green-50 text-green-600 ring-green-500/20' },
      DAILY: { label: 'Ngày', className: 'bg-purple-50 text-purple-600 ring-purple-500/20' },
    }
    return billingCycleMap[billingCycle] || billingCycleMap.MONTHLY

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
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Quản lý Hợp đồng</h1>
            <p className="text-slate-500 text-sm">Xem xét và phê duyệt các hợp đồng</p>
          </div>
          <button
            onClick={() => handleOpenModal('create')}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-bold hover:bg-cyan-600 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Tạo hợp đồng
          </button>
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
              onChange={(e) => setFilters({ ...filters, status: e.target.value as status | 'all' })}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="DRAFT">Chờ xử lý</option>
              <option value="PENDING_APPROVAL">Đang xem xét</option>
              <option value="ACTIVE">Đã phê duyệt</option>
              <option value="EXPIRED">Đã từ chối</option>
              <option value="TERMINATED">Đã chuyển đổi</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>

            <select
              value={filters.pricingModel}
              onChange={(e) => setFilters({ ...filters, pricingModel: e.target.value as pricingModel | 'all' })}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all text-sm"
            >
              <option value="all">Tất cả mô hình định giá</option>
              <option value="USAGE_BASED">Dựa trên sử dụng</option>
              <option value="HYBRID">Kết hợp</option>
              <option value="FIXED">Cố định</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingOverlay show={loading} />
        ) : filteredContracts.length === 0 ? (
          <div className="p-12 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">inbox</span>
            <p className="text-slate-500 text-base font-medium">Không có hợp đồng nào</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Mã hợp đồng</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Mô hình định giá</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Chu kỳ thanh toán</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Bắt đầu - Kết thúc</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedContracts.map((contract) => (
                    <tr key={contract.contractId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-900 font-mono font-medium">{contract.contractCode}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${getBillingCycleBadge(contract.billingCycle).className}`}>
                          {getBillingCycleBadge(contract.billingCycle).label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${getPricingModelBadge(contract.pricingModel).className}`}>
                          {getPricingModelBadge(contract.pricingModel).label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${getStatusBadge(contract.status).className}`}>
                          {getStatusBadge(contract.status).label}
                        </span>
                      </td>
                      <td className="text-center px-6 py-4 text-sm text-slate-800">
                        {new Date(contract.startDate).toLocaleDateString('vi-VN')} - {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal('view', contract)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all"
                          >
                            <span className="material-symbols-outlined ">visibility</span>
                          </button>
                          <button
                            onClick={() => handleOpenModal('edit', contract)}
                            className="px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-200 transition-all"
                          >
                            <span className="material-symbols-outlined ">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteContract(contract.contractId)}
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
        <ContractModal
          mode={modalMode}
          data={selectedContract}
          onClose={() => {
            setShowModal(false)
            setSelectedContract(undefined)
          }}
          onSubmit={handleSubmitContract}
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