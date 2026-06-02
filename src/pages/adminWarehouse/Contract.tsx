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
  const [warehouseId, setWarehouseId] = useState<string | null>(null)
  const [requests, setRequests] = useState<ContractResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    status: 'all',
    pricingModel: 'all',
    billingCycle: 'all',
  })

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view')
  const [selectedContract, setSelectedContract] = useState<ContractResponse | undefined>(undefined)

  const [alert, setAlert] = useState<{
    open: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'warning'
    onConfirm?: () => void
  }>({
    open: false,
    title: '',
    message: '',
    type: 'success',
  })

  useEffect(() => {
    const userString = localStorage.getItem('user')
    if (userString) {
      const user: User = JSON.parse(userString)
      if (user.role === 'WH_ADMIN' && user.warehouseId) {
        setWarehouseId(user.warehouseId)
      }
    }
  }, [])

  const fetchContracts = async () => {
    try {
      setLoading(true)
      const response = await contractApi.getAllContracts()
      if (response.data.success && response.data.data) {
        let data = response.data.data
        if (warehouseId) {
          data = data.filter((item) => item.warehouseId === warehouseId)
        }
        setRequests(data)
      } else {
        setError(response.data.message || 'Không thể lấy dữ liệu hợp đồng.')
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách hợp đồng:', err)
      setError('Hệ thống gặp sự cố khi tải danh sách hợp đồng.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [warehouseId])

  // CHỈNH SỬA CHÍNH: Tối ưu hóa chuỗi lưu liên hoàn & xử lý rollback an toàn dữ liệu
  const handleSubmitContract = async (formData: any) => {
    let createdContractId: string | null = null;
    try {
      setLoading(true)

      if (modalMode === 'create') {
        // Bước 1: Khởi tạo Hợp đồng tổng quan (Gốc)
        const contractPayload: ContractRequest = {
          tenantId: formData.tenantId,
          warehouseId: formData.warehouseId,
          contractCode: formData.contractCode,
          contractName: formData.contractName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status || 'DRAFT',
          pricingModel: formData.pricingModel,
          billingCycle: formData.billingCycle,
          contractType: formData.contractType,
          allowDynamicRelocation: formData.allowDynamicRelocation,
          autoRenew: formData.autoRenew,
          minimumBillingDays: formData.minimumBillingDays,
          minimumReservedCapacity: formData.minimumReservedCapacity,
          estimatedTotalAmount: formData.estimatedTotalAmount,
          tenantSignature: formData.tenantSignature,
          warehouseSignature: formData.warehouseSignature,
          createdBy: formData.createdBy,
          approvedBy: formData.approvedBy,
          rentalRequestId: formData.rentalRequestId,
        }

        const contractResponse = await contractApi.create(contractPayload)

        if (contractResponse.data.success && contractResponse.data.data) {
          createdContractId = contractResponse.data.data.contractId

          // Bước 2: Tạo hạng mục phụ lục (Contract Item) đính kèm mã ID vừa sinh ra
          try {
            const itemPayload = {
              ...formData.contractItem,
              contractId: createdContractId
            }
            await contractApi.createContractItem?.(itemPayload)
          } catch (itemErr) {
            throw new Error(`Lỗi khởi tạo mục phụ lục giá: ${itemErr instanceof Error ? itemErr.message : ''}`);
          }

          // Bước 3: Đặt chỗ diện tích & sơ đồ kho (Storage Reservation)
          try {
            const reservationPayload = {
              ...formData.storageReservation,
              contractId: createdContractId
            }
            await contractApi.createStorageReservation?.(reservationPayload)
          } catch (reserveErr) {
            throw new Error(`Lỗi cấu hình vị trí đặt chỗ kho: ${reserveErr instanceof Error ? reserveErr.message : ''}`);
          }

          setAlert({
            open: true,
            title: 'Thành công hoàn toàn',
            message: 'Đã hoàn thành khởi tạo chuỗi đồng bộ thành công: Hợp đồng gốc, Biểu phí hạng mục và Vị trí lưu kho!',
            type: 'success',
          })
          fetchContracts()
          setShowModal(false)
        } else {
          throw new Error(contractResponse.data.message || 'Không thể khởi tạo hợp đồng gốc.')
        }
      } else if (modalMode === 'edit' && selectedContract) {
        // Xử lý cập nhật thông tin chỉnh sửa thông thường
        const response = await contractApi.update(selectedContract.contractId, formData)
        if (response.data.success) {
          setAlert({
            open: true,
            title: 'Thành công',
            message: 'Cập nhật thông tin hợp đồng thành công.',
            type: 'success',
          })
          fetchContracts()
          setShowModal(false)
        } else {
          throw new Error(response.data.message || 'Cập nhật thất bại.')
        }
      }
    } catch (err: any) {
      console.error('Lỗi nghiêm trọng trong chuỗi lưu liên hoàn:', err)

      // Kịch bản Rollback dữ liệu lỗi: Nếu đã tạo Contract thành công nhưng các bước cấu hình sau lỗi, xóa bỏ contract rác
      if (createdContractId && modalMode === 'create') {
        try {
          await contractApi.delete(createdContractId);
          console.log(`Đã thực hiện rollback xóa hợp đồng lỗi ID: ${createdContractId}`);
        } catch (cleanupErr) {
          console.error('Không thể dọn dẹp dữ liệu lỗi sau sự cố:', cleanupErr);
        }
      }

      setAlert({
        open: true,
        title: 'Tiến trình thất bại',
        message: err.message || 'Có sự cố phát sinh khiến dữ liệu chuỗi không được đồng bộ. Hệ thống đã tự động hủy bỏ tác vụ an toàn.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setAlert({
      open: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa hợp đồng này? Tất cả các danh mục lưu kho liên quan sẽ bị hủy bỏ.',
      type: 'warning',
      onConfirm: async () => {
        try {
          setLoading(true)
          const response = await contractApi.delete(id)
          if (response.data.success) {
            setAlert({
              open: true,
              title: 'Thành công',
              message: 'Đã xóa hợp đồng khỏi hệ thống thành công.',
              type: 'success',
            })
            fetchContracts()
          } else {
            setAlert({
              open: true,
              title: 'Lỗi',
              message: response.data.message || 'Không thể thực thi xóa hợp đồng.',
              type: 'error',
            })
          }
        } catch (err) {
          console.error(err)
          setAlert({
            open: true,
            title: 'Lỗi hệ thống',
            message: 'Gặp lỗi trong quá trình thực thi xóa dữ liệu cấu trúc.',
            type: 'error',
          })
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.contractCode.toLowerCase().includes(filters.search.toLowerCase()) ||
        (req.contractName && req.contractName.toLowerCase().includes(filters.search.toLowerCase()))
      const matchesStatus = filters.status === 'all' || req.status === filters.status
      const matchesPricing = filters.pricingModel === 'all' || req.pricingModel === filters.pricingModel
      const matchesBilling = filters.billingCycle === 'all' || req.billingCycle === filters.billingCycle

      return matchesSearch && matchesStatus && matchesPricing && matchesBilling
    })
  }, [requests, filters])

  const totalItems = filteredRequests.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const end = Math.min(currentPage * itemsPerPage, totalItems)

  const paginatedRequests = useMemo(() => {
    return filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [filteredRequests, currentPage])

  const getStatusClass = (status: status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-300'
      case 'PENDING_APPROVAL': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'TERMINATED': return 'bg-rose-50 text-rose-700 border-rose-200'
      case 'EXPIRED': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
      <LoadingOverlay show={loading} text="ĐANG XỬ LÝ CHUỖI HỢP ĐỒNG..." />

      {/* Giao diện Header Điều hướng */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Hợp đồng kho</h1>
          <p className="text-sm text-slate-500">Thiết lập cấu trúc liên hoàn: Hợp đồng gốc → Biểu phí lưu trữ → Giữ chỗ không gian kho bãi.</p>
        </div>
        <button
          onClick={() => {
            setModalMode('create')
            setSelectedContract(undefined)
            setShowModal(true)
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tạo chuỗi hợp đồng mới
        </button>
      </div>

      {/* Thanh bộ lọc dữ liệu đồng bộ chuẩn API Enum */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm mã hoặc tên hợp đồng..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-[18px]">search</span>
        </div>

        <select
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as status | 'all' })}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="DRAFT">DRAFT (Bản nháp)</option>
          <option value="PENDING_APPROVAL">PENDING APPROVAL (Chờ duyệt)</option>
          <option value="ACTIVE">ACTIVE (Đang hoạt động)</option>
          <option value="EXPIRED">EXPIRED (Hết hạn)</option>
          <option value="TERMINATED">TERMINATED (Đã hủy/chấm dứt)</option>
        </select>

        <select
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          value={filters.pricingModel}
          onChange={(e) => setFilters({ ...filters, pricingModel: e.target.value as pricingModel | 'all' })}
        >
          <option value="all">Tất cả mô hình giá</option>
          <option value="USAGE_BASED">USAGE_BASED (Theo lượng sử dụng)</option>
          <option value="FIXED_RATE">FIXED_RATE (Thuê bao cố định)</option>
          <option value="TIERED">TIERED (Bậc thang phân cấp)</option>
        </select>

        <select
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          value={filters.billingCycle}
          onChange={(e) => setFilters({ ...filters, billingCycle: e.target.value as billingCycle | 'all' })}
        >
          <option value="all">Tất cả chu kỳ thanh toán</option>
          <option value="DAILY">DAILY (Theo ngày)</option>
          <option value="WEEKLY">WEEKLY (Hàng tuần)</option>
          <option value="MONTHLY">MONTHLY (Hàng tháng)</option>
          <option value="YEARLY">YEARLY (Hàng năm)</option>
        </select>
      </div>

      {/* Danh sách dữ liệu */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-rose-600 font-medium">{error}</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Không tìm thấy dữ liệu chuỗi hợp đồng thích hợp.</div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Mã hợp đồng</th>
                    <th className="px-6 py-3.5">Tên hợp đồng</th>
                    <th className="px-6 py-3.5">Mô hình tính giá</th>
                    <th className="px-6 py-3.5">Thời hạn hiệu lực</th>
                    <th className="px-6 py-3.5">Trạng thái</th>
                    <th className="px-6 py-3.5 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {paginatedRequests.map((req) => (
                    <tr key={req.contractId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{req.contractCode}</td>
                      <td className="px-6 py-4 max-w-[250px] truncate">{req.contractName || '---'}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono">
                          {req.pricingModel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(req.startDate).toLocaleDateString('vi-VN')} - {new Date(req.endDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusClass(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedContract(req)
                              setModalMode('view')
                              setShowModal(true)
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-md hover:bg-slate-100 transition-colors"
                            title="Xem chi tiết toàn bộ chuỗi"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedContract(req)
                              setModalMode('edit')
                              setShowModal(true)
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-slate-100 transition-colors"
                            title="Sửa thông tin hợp đồng"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(req.contractId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                            title="Xóa bỏ mục này"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Điều hướng phân trang */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
              <p className="text-sm text-slate-500">
                Hiển thị <span className="font-semibold text-slate-700">{start}-{end}</span> trong tổng số{' '}
                <span className="font-semibold text-slate-700">{totalItems}</span> chuỗi hợp đồng hệ thống
              </p>
              <WPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        )}
      </div>

      {/* Gọi hiển thị Modal quản trị viên liên hoàn */}
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

      {/* Quản lý thông báo hệ thống */}
      {alert.open && (
        <AlertModal
          title={alert.title || 'Thông báo trạng thái'}
          message={alert.message}
          type={alert.type}
          onConfirm={alert.onConfirm}
          onClose={() => setAlert({ ...alert, open: false })}
        />
      )}
    </div>
  )
}