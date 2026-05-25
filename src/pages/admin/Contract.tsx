import { useState, useMemo, useEffect } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { ContractModal } from '../../components/ui/modal/ContractModal'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import type { Contract } from '../../types/Contract'
import { Pagination } from '../../components/ui/Pagination'

/* ================= DATA ================= */

const initialContracts: Contract[] = [
  {
    id: '#CTR-001',
    customerName: 'Công ty ABC',
    warehouse: 'Kho A - Zone 1',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'Active',
    statusClassName: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    price: 50000000,
    createdAt: '2h ago',
  },
  {
    id: '#CTR-002',
    customerName: 'Công ty XYZ',
    warehouse: 'Kho B - Zone 3',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'Expired',
    statusClassName: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
    price: 30000000,
    createdAt: '1d ago',
  },
  {
    id: '#CTR-003',
    customerName: 'Công ty XYZ',
    warehouse: 'Kho B - Zone 3',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'Expired',
    statusClassName: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
    price: 30000000,
    createdAt: '1d ago',
  },
  {
    id: '#CTR-004',
    customerName: 'Công ty XYZ',
    warehouse: 'Kho B - Zone 3',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'Expired',
    statusClassName: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
    price: 30000000,
    createdAt: '1d ago',
  },
  {
    id: '#CTR-005',
    customerName: 'Công ty XYZ',
    warehouse: 'Kho B - Zone 3',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'Expired',
    statusClassName: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
    price: 30000000,
    createdAt: '1d ago',
  },
]

/* ================= PAGE ================= */

export const ContractManagement: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts)

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'create' | 'edit' | 'view'
    data?: Contract
  }>({ open: false, mode: 'view' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'confirm'
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  /* ================= HANDLERS ================= */

  const handleSubmit = (form: any) => {
    if (modal.mode === 'create') {
      const newContract: Contract = {
        id: `#CTR-${Math.floor(Math.random() * 1000)}`,
        createdAt: 'now',
        status: 'Pending',
        statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
        ...form,
      }

      setContracts([newContract, ...contracts])

      setAlert({
        open: true,
        type: 'success',
        message: 'Tạo hợp đồng thành công',
      })
    }

    if (modal.mode === 'edit' && modal.data) {
      const updated = contracts.map((c) =>
        c.id === modal.data!.id ? { ...c, ...form } : c
      )

      setContracts(updated)

      setAlert({
        open: true,
        type: 'success',
        message: 'Cập nhật thành công',
      })
    }
  }

  const handleDelete = (id: string) => {
    setContracts(contracts.filter((c) => c.id !== id))

    setAlert({
      open: true,
      type: 'success',
      message: 'Xóa thành công',
    })
  }
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')


   /* ================= FILTER ================= */

  const filteredContracts = useMemo(() => {
    return contracts.filter((r) => {
      const matchSearch =
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.warehouse.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase())

      const matchStatus =
        statusFilter === 'All' || r.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [contracts, search, statusFilter])

  /* ================= PAGINATION ================= */

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4

  const totalItems = filteredContracts.length
  const totalPages = Math.ceil(totalItems / pageSize)

  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  /* ================= UI ================= */

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 ">

      <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />

        <div className="relative z-10 p-8">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-8">

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard title="Tổng hợp đồng" value={contracts.length} icon="description" accentColor="emerald" />
              <StatsCard title="Đang hoạt động" value={contracts.filter(c => c.status === 'Active').length} icon="check_circle" accentColor='primary' />
              <StatsCard title="Hết hạn" value={contracts.filter(c => c.status === 'Expired').length} icon="cancel" accentColor="purple" />
              <StatsCard title="Chờ xử lý" value={contracts.filter(c => c.status === 'Pending').length} icon="hourglass_top" accentColor="orange" />
            </div>

            {/* Table */}
            <section className="glass-panel rounded-xl border border-white/5 overflow-hidden flex flex-col">

              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-lg font-bold text-white">HỢP ĐỒNG</h3>
                <div className="flex gap-3">
                {/* Search */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm báo cáo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                 {/* Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm"
                  >
                    <option value="All">Tất cả</option>
                    <option value="Active">Đang hoạt động</option>
                    <option value="Expired">Hết hạn</option>
                    <option value="Pending">Chờ xử lý</option>
                  </select>

                <button
                  onClick={() => setModal({ open: true, mode: 'create' })}
                  className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-bold text-black"
                >
                  <span className="material-symbols-outlined">add</span>
                  Tạo hợp đồng
                </button>
              </div>
</div>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-[#131b29] text-xs uppercase text-slate-400 border-b border-white/5">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Khách hàng</th>
                      <th className="px-6 py-4">Kho</th>
                      <th className="px-6 py-4">Thời hạn</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Giá</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {paginatedContracts.map((c) => (
                      <tr key={c.id}>
                        <td className="px-6 py-4 text-cyan-400">{c.id}</td>
                        <td className="px-6 py-4">{c.customerName}</td>
                        <td className="px-6 py-4">{c.warehouse}</td>
                        <td className="px-6 py-4 text-xs">
                          {c.startDate} → {c.endDate}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded ring-1 ${c.statusClassName}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-emerald-400">
                          {c.price.toLocaleString()}₫
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">

                            {/* View */}
                            <button
                              onClick={() => setModal({ open: true, mode: 'view', data: c })}
                              className="hover:bg-white/10 rounded p-1"
                            >
                              <span className="material-symbols-outlined">visibility</span>
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => setModal({ open: true, mode: 'edit', data: c })}
                              className="hover:bg-white/10 rounded p-1"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() =>
                                setAlert({
                                  open: true,
                                  type: 'confirm',
                                  message: 'Bạn có chắc muốn xóa?',
                                  onConfirm: () => handleDelete(c.id),
                                })
                              }
                              className="hover:bg-white/10 rounded p-1"
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
              <div className="flex items-center justify-between border-t border-white/5 bg-[#131b29] px-6 py-4">
                <p className="font-mono text-xs text-slate-400">
                  Showing <span className="text-white">{start}-{end}</span> of{' '}
                  <span className="text-white">{totalItems}</span> items
                </p>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>

            </section>
          </div>
        </div>
      </main>

      {/* Modal */}
      {modal.open && (
        <ContractModal
          mode={modal.mode}
          data={modal.data}
          onClose={() => setModal({ ...modal, open: false })}
          onSubmit={handleSubmit}
        />
      )}

      {/* Alert */}
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