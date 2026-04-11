import { useState, useEffect, useMemo } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { useNavigate } from 'react-router-dom'
import { warehouses } from '../../data/initialData'
import type { Warehouse } from '../../types/Warehouse'
import { WarehouseModal } from '../../components/ui/modal/WarehouseModal'
import { AlertModal } from '../../components/ui/modal/AlertModal'

export const WarehouseManagement: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const [warehouse, setWarehouses] = useState<Warehouse[]>(warehouses)
  const [modal, setModal] = useState<{
    open: boolean
    mode: 'create' | 'edit' | 'view'
    data?: Warehouse
  }>({ open: false, mode: 'view' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'confirm'
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  const handleSubmit = (form: any) => {
    if (modal.mode === 'create') {
      const newWarehouse: Warehouse = {
        id: `#CTR-${Math.floor(Math.random() * 1000)}`,
        createdAt: 'now',
        status: 'Pending',
        statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
        ...form,
      }

      setWarehouses([newWarehouse, ...warehouses])

      setAlert({
        open: true,
        type: 'success',
        message: 'Tạo kho thành công',
      })
    }

    if (modal.mode === 'edit' && modal.data) {
      const updated = warehouse.map((w) =>
        w.warehouseId === modal.data!.warehouseId ? { ...w, ...form } : w
      )

      setWarehouses(updated)

      setAlert({
        open: true,
        type: 'success',
        message: 'Cập nhật thành công',
      })
    }
  }

  const handleDelete = (id: string) => {
    setWarehouses(warehouse.filter((w) => w.warehouseId !== id))

    setAlert({
      open: true,
      type: 'success',
      message: 'Xóa thành công',
    })
  }
  const SearchWarehouse = useMemo(() => {
    return warehouses.filter(warehouse =>
      warehouse.warehouseName.toLowerCase().includes(search.toLowerCase()) ||
      warehouse.address.toLowerCase().includes(search.toLowerCase()))
  }, [search])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const totalItems = SearchWarehouse.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedWarehouses = SearchWarehouse.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)
  useEffect(() => {
    setCurrentPage(1)
  }, [SearchWarehouse.length])



  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">
      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 z-0 bg-[#0b101a]/90 backdrop-blur-sm" />
        <div className="relative z-10 flex-1 p-6">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-2">
              <StatsCard title="Số lượng kho" value={warehouses.length} icon="group" accentColor="emerald" />
              <StatsCard title="Số lượng pallet" value={warehouses.reduce((acc, warehouse) => acc + warehouse.numberOfPallets, 0)} icon="verified_user" accentColor="primary" />
            </div>
            <section className="glass-panel flex flex-col overflow-hidden rounded-xl border border-white/5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-5">
                <h3 className="text-2xl font-bold tracking-wide text-white">QUẢN LÝ KHO</h3>
                <div className="flex gap-3">
                  {/* Search */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên, email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setModal({ open: true, mode: 'create' })
                    }}
                    className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold tracking-wide text-black shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40">
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span>TẠO KHO</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#131b29] text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-3 font-medium">Mã kho</th>
                      <th className="px-6 py-3 font-medium">Tên kho</th>
                      <th className="px-6 py-3 text-center font-medium">Địa chỉ</th>
                      <th className="px-6 py-3 font-medium">Số lượng pallet</th>
                      <th className="px-6 py-3 text-center font-medium">Lần cuối cập nhật</th>
                      <th className="px-6 py-3 text-center font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {paginatedWarehouses.map((item) => {
                      return (
                        <tr
                          key={item.warehouseId}
                          className="group cursor-pointer transition-colors hover:bg-white/5"
                        >
                          <td className="px-6 py-3 font-mono text-cyan-400">{item.warehouseId}</td>
                          <td className="px-6 py-3 font-medium text-white">{item.warehouseName}</td>
                          <td className="px-6 py-3  text-white">{item.address}</td>
                          <td className="px-6 py-3 text-center  text-white">{item.numberOfPallets}</td>
                          <td className="px-6 py-3 text-center text-white">{item.lastUpdated}</td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-60 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => navigate(`/warehouses/${item.warehouseId}`)}
                                className="rounded p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              <button
                                onClick={() => {
                                  setModal({ open: true, mode: 'edit', data: item })
                                }}
                                className="rounded p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  setAlert({
                                    open: true,
                                    type: 'confirm',
                                    message: `Bạn có chắc muốn xóa kho ${item.warehouseName}?`,
                                    onConfirm: () => {
                                      handleDelete(item.warehouseId)
                                    }
                                  })
                                }}
                                className="rounded p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
                                <span className="material-symbols-outlined text-lg">delete</span>
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
              <div className="flex items-center justify-between border-t border-white/5 bg-[#131b29] px-6 py-2">
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
        <WarehouseModal
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