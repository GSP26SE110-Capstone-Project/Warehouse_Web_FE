import { useState, useMemo, useEffect } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { StockMovementModal } from '../../components/ui/modal/StockMovementModal'
import type { StockMovement } from '../../types/Warehouse'

function getStatusDot(status: StockMovement['status']) {
  if (status === 'Pending') return 'bg-orange-400'
  if (status === 'Cancelled') return 'bg-red-400'
  return 'bg-emerald-400'
}
const movements: StockMovement[] = [
  {
    id: '#MOV-001',
    sku: '#SKU-9021',
    productName: 'Quantum Chipset X1',
    warehouse: 'Kho A',
    type: 'Import',
    quantity: 100,
    status: 'Completed',
    statusClassName: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    date: '2026-03-20',
    striped: true,
  },
  {
    id: '#MOV-002',
    sku: '#SKU-8822',
    productName: 'Neural Interface Unit',
    warehouse: 'Kho B',
    type: 'Export',
    quantity: 20,
    status: 'Pending',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    date: '2026-03-22',
  },
  {
    id: '#MOV-013',
    sku: '#SKU-8822',
    productName: 'Neural Interface Unit',
    warehouse: 'Kho B',
    type: 'Export',
    quantity: 20,
    status: 'Pending',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    date: '2026-03-22',
  },
  {
    id: '#MOV-003',
    sku: '#SKU-8822',
    productName: 'Neural Interface Unit',
    warehouse: 'Kho B',
    type: 'Export',
    quantity: 20,
    status: 'Pending',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    date: '2026-03-22',
  },
  {
    id: '#MOV-004',
    sku: '#SKU-8822',
    productName: 'Neural Interface Unit',
    warehouse: 'Kho B',
    type: 'Export',
    quantity: 20,
    status: 'Pending',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    date: '2026-03-22',
  },
  {
    id: '#MOV-005',
    sku: '#SKU-8822',
    productName: 'Neural Interface Unit',
    warehouse: 'Kho B',
    type: 'Export',
    quantity: 20,
    status: 'Pending',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    date: '2026-03-22',
  },
  {
    id: '#MOV-006',
    sku: '#SKU-8822',
    productName: 'Neural Interface Unit',
    warehouse: 'Kho B',
    type: 'Export',
    quantity: 20,
    status: 'Pending',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    date: '2026-03-22',
  },
  {
    id: '#MOV-007',
    sku: '#SKU-8822',
    productName: 'Neural Interface Unit',
    warehouse: 'Kho B',
    type: 'Export',
    quantity: 20,
    status: 'Pending',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    date: '2026-03-22',
  },
  {
    id: '#MOV-008',
    sku: '#SKU-8822',
    productName: 'Neural Interface Unit',
    warehouse: 'Kho B',
    type: 'Export',
    quantity: 20,
    status: 'Pending',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    date: '2026-03-22',
  },
]

export const StockMovementManagement: React.FC = () => {
  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all')

  const [data, setData] = useState<StockMovement[]>(movements)

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'create' | 'edit' | 'view'
    data?: StockMovement
    type?: 'Import' | 'Export'
  }>({ open: false, mode: 'create', type: 'Import' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'confirm'
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  // ===== CRUD =====
  const handleSubmit = (form: any) => {
    if (modal.mode === 'create') {
      const newItem: StockMovement = {
        id: `#MOV-${Math.floor(Math.random() * 1000)}`,
        ...form,
      }
      setData([newItem, ...data])
      setAlert({
        open: true,
        type: 'success',
        message: 'Tạo thành công'
      })
    }

    if (modal.mode === 'edit' && modal.data) {
      const updated = data.map(item =>
        item.id === modal.data!.id ? { ...item, ...form } : item
      )
      setData(updated)
      setAlert({ open: true, type: 'success', message: 'Cập nhật thành công' })
    }
  }

  const handleDelete = (id: string) => {
    setData(data.filter(item => item.id !== id))
    setAlert({ open: true, type: 'success', message: 'Xóa thành công' })
  }

  // ===== FILTER =====
  const filtered = useMemo(() => {
    return data.filter(item => {
      const matchSearch =
        item.productName.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase())

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'completed'
            ? item.status === 'Completed'
            : statusFilter === 'pending'
              ? item.status === 'Pending'
              : item.status === 'Cancelled'

      return matchSearch && matchStatus
    })
  }, [search, statusFilter, data])

  // ===== PAGINATION =====
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize)

  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 pb-15">

      <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />

        <div className="relative z-10 p-8">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-8">

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatsCard title="Tổng giao dịch" value={520} icon="sync_alt" accentColor="emerald" />
              <StatsCard title="Nhập kho" value={320} icon="download" accentColor="primary" />
              <StatsCard title="Xuất kho" value={180} icon="upload" accentColor="orange" />
            </div>

            {/* Table */}
            <section className="glass-panel rounded-xl border border-white/5 overflow-hidden flex flex-col">

              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-lg font-bold text-white">
                  QUẢN LÝ XUẤT - NHẬP KHO
                </h3>

                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm sản phẩm, SKU..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-white"
                  >
                    <option value="all">Tất cả</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>

                  <button
                    onClick={() => {
                      setModal({ open: true, mode: 'create', type: 'Import' })
                    }}
                    className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold tracking-wide text-black shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40">
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span>TẠO NHẬP KHO</span>
                  </button>
                   <button
                    onClick={() => {
                      setModal({ open: true, mode: 'create', type: 'Export' })
                    }}
                    className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold tracking-wide text-black shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40">
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span>TẠO XUẤT KHO</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-[#131b29] text-xs uppercase text-slate-400 border-b border-white/5">
                      <th className="px-6 py-4">Mã</th>
                      <th className="px-6 py-4">SKU</th>
                      <th className="px-6 py-4">Sản phẩm</th>
                      <th className="px-6 py-4">Kho</th>
                      <th className="px-6 py-4">Loại</th>
                      <th className="px-6 py-4">Số lượng</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Ngày</th>
                      <th className="px-6 py-4 text-right">Hoạt động</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {paginated.length > 0 ? (
                      paginated.map((m) => (
                        <tr key={m.id} className={`${m.striped ? 'bg-white/[0.02]' : ''}`}>
                          <td className="px-6 py-4 text-cyan-400 font-mono">{m.id}</td>
                          <td className="px-6 py-4 text-white">{m.sku}</td>
                          <td className="px-6 py-4 text-slate-400">{m.productName}</td>
                          <td className="px-6 py-4 text-slate-400">{m.warehouse}</td>

                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded ring-1 ${m.type === 'Import' ? 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20' : 'text-orange-400 bg-orange-400/10 ring-orange-400/20'}`}>
                              {m.type}
                            </span>
                          </td>

                          <td className="px-6 py-4 font-mono">{m.quantity}</td>

                          <td className="px-6 py-4">
                            <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ring-1 ${m.statusClassName}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(m.status)}`} />
                              {m.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-500">{m.date}</td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-60 hover:opacity-100">
                              <button
                                onClick={() => setModal({ open: true, mode: 'view', data: m })}
                                className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined">visibility</span>
                              </button>
                              <button
                                onClick={() => setModal({ open: true, mode: 'edit', data: m })}
                                className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                              <button
                                 onClick={() => {
                                  setAlert({
                                    open: true,
                                    type: 'confirm',
                                    message: `Bạn có chắc muốn xóa kho?`,
                                    onConfirm: () => {
                                      handleDelete(m.id)
                                    }
                                  })
                                }}
                                className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="text-center py-10 text-slate-400">
                          Không tìm thấy dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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
      {modal.open && (
        <StockMovementModal
          mode={modal.mode}
          type={modal.type || 'Import'}
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



