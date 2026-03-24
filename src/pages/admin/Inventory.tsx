import { useState, useEffect, useMemo } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import type { InventoryItem } from '../../types/Warehouse'
import { Pagination } from '../../components/ui/Pagination'
import { InventoryModal } from '../../components/ui/modal/InventoryModal'
import { AlertModal } from '../../components/ui/modal/AlertModal'

const inventoryItems: InventoryItem[] = [
  {
    sku: '#SKU-9021',
    name: 'Quantum Chipset X1',
    category: 'Electronics',
    stock: 75,
    total: 100,
    location: 'Zone A-12',
    importDate: '2024-05-15',
    warehouse: 'In Stock',
  },
  {
    sku: '#SKU-8822',
    name: 'Neural Interface Unit',
    category: 'Bio-Tech',
    stock: 12,
    total: 100,
    location: 'Zone B-04',
    importDate: '2026-03-20',
    warehouse: 'In Stock',
  },
  {
    sku: '#SKU-7731',
    name: 'Optic Fiber Cabling',
    category: 'Infrastructure',
    stock: 100,
    total: 100,
    location: 'Zone C-01',
    importDate: '2024-06-01',
    warehouse: 'In Stock',
  },
  {
    sku: '#SKU-6619',
    name: 'Fusion Battery Cell',
    category: 'Energy',
    stock: 5,
    total: 100,
    location: 'Zone A-09',
    importDate: '2024-03-10',
    warehouse: 'In Stock',
  },
  {
    sku: '#SKU-5501',
    name: 'Holographic Emitter',
    category: 'Displays',
    stock: 45,
    total: 100,
    location: 'Zone D-22',
    importDate: '2024-05-01',
    warehouse: 'In Stock',
  },
]

export const Inventory: React.FC = () => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'old'>('all')

  const [inventory, setInventory] = useState<InventoryItem[]>(inventoryItems)

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'create' | 'edit' | 'view'
    data?: InventoryItem
  }>({ open: false, mode: 'view' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'confirm'
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  const handleSubmit = (form: any) => {
    if (modal.mode === 'create') {
      const newItem: InventoryItem = {
        sku: `#SKU-${Math.floor(Math.random() * 1000)}`,
        importDate: new Date().toISOString().slice(0, 10),
        warehouse: 'Warehouse A',
        ...form,
      }

      setInventory([newItem, ...inventory])

      setAlert({ open: true, type: 'success', message: 'Tạo thành công' })
    }

    if (modal.mode === 'edit' && modal.data) {
      const updated = inventory.map((item) =>
        item.sku === modal.data!.sku ? { ...item, ...form } : item
      )

      setInventory(updated)

      setAlert({ open: true, type: 'success', message: 'Cập nhật thành công' })
    }
  }

  const handleDelete = (sku: string) => {
    setInventory(inventory.filter((item) => item.sku !== sku))
    setAlert({ open: true, type: 'success', message: 'Xóa thành công' })
  }

  // ===== STATUS =====
  const getInventoryStatus = (item: InventoryItem) => {
    const now = new Date()
    const importDate = new Date(item.importDate)

    const diffMonths =
      (now.getFullYear() - importDate.getFullYear()) * 12 +
      (now.getMonth() - importDate.getMonth())

    if (diffMonths >= 3) {
      return {
        label: 'Tồn lâu',
        className: 'bg-yellow-400/10 text-yellow-400 ring-yellow-400/20',
        dot: 'bg-yellow-400',
      }
    }

    return {
      label: 'Mới',
      className: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
      dot: 'bg-emerald-400',
    }
  }

  // ===== FILTER + SEARCH =====
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase())

      const status = getInventoryStatus(item)

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'new' && status.label === 'Mới') ||
        (statusFilter === 'old' && status.label === 'Tồn lâu')

      return matchSearch && matchStatus
    })
  }, [search, statusFilter, inventory])

  // ===== PAGINATION =====
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4

  const totalItems = filteredInventory.length
  const totalPages = Math.ceil(totalItems / pageSize)

  const paginatedInventory = filteredInventory.slice(
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

      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 z-0 bg-[#0b101a]/90 backdrop-blur-sm" />
        <div className="relative z-10 flex-1 p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <StatsCard
                title="Tổng hàng hóa"
                value={14205}
                icon="inventory_2"
                accentColor="emerald"
              />
              <StatsCard
                title="Cảnh báo tồn kho"
                value={3}
                icon="warning"
                accentColor="primary"
              />
            </div>

            <section className="glass-panel flex flex-col overflow-hidden rounded-xl border border-white/5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-5">
                <h3 className="text-lg font-bold tracking-wide text-white">HÀNG TRONG KHO HIỆN TẠI</h3>
                <div className="flex gap-3">
                  {/* Search */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên,..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-[#1a2333] border border-white/10 text-sm text-white px-3 py-2 rounded-lg"
                  >
                    <option value="all">Tất cả</option>
                    <option value="new">Mới</option>
                    <option value="old">Tồn lâu</option>
                  </select>

                  <button
                    onClick={() => {
                      setModal({ open: true, mode: 'create' })
                    }}
                    className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold tracking-wide text-black shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40">
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span>THÊM MẶT HÀNG</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#131b29] text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4 font-medium">SKU</th>
                      <th className="px-6 py-4 font-medium">Tên sản phẩm</th>
                      <th className="px-6 py-4 font-medium">Danh mục</th>
                      <th className="px-6 py-4 font-medium">Nhà kho</th>
                      <th className="px-6 py-4 font-medium">Ngày nhập kho</th>
                      <th className="px-6 py-4 font-medium">Trạng thái</th>
                      <th className="px-6 py-4 font-medium">Vị trí</th>
                      <th className="px-6 py-4 text-right font-medium">Hoạt động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {paginatedInventory.map((item) => {
                      const status = getInventoryStatus(item)
                      return (
                        <tr
                          key={item.sku}
                          className={`group transition-colors ${item.sku ? 'bg-white/[0.02]' : 'bg-transparent'
                            }`}
                        >
                          {/* SKU */}
                          <td className="px-6 py-4 font-mono text-cyan-400">
                            {item.sku}
                          </td>

                          {/* NAME */}
                          <td className="px-6 py-4 font-medium text-white">
                            {item.name}
                          </td>

                          {/* CATEGORY */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.category}`}
                            >
                              {item.category}
                            </span>
                          </td>

                          {/* NHÀ KHO */}
                          <td className="px-6 py-4 text-slate-300">
                            {item.warehouse || 'Warehouse A'} {/* hoặc item.warehouse nếu có */}
                          </td>

                          {/* NGÀY NHẬP KHO */}
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                            {item.importDate || '2024-06-01'} {/* hoặc item.importDate nếu có */}
                          </td>

                          {/* TRẠNG THÁI */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}
                            >
                              <span className={`size-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </td>

                          {/* VỊ TRÍ */}
                          <td className="px-6 py-4 font-mono text-slate-400">
                            {item.location}
                          </td>

                          {/* ACTION */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-60 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => {
                                  setModal({ open: true, mode: 'edit', data: item })
                                }} className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white">
                                <span className="material-symbols-outlined text-lg">
                                  edit
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setAlert({
                                    open: true,
                                    message: 'Bạn có chắc chắn muốn xóa mặt hàng này?',
                                    type: 'confirm',
                                    onConfirm: () => {
                                      handleDelete(item.sku)
                                    }
                                  })
                                }}
                                className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  delete
                                </span>
                              </button>
                              <button className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white">
                                <span className="material-symbols-outlined text-lg">
                                  qr_code
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
        <InventoryModal
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