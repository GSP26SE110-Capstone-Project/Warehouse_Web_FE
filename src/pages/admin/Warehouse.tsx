import { useState, useEffect, useMemo, useCallback } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { useNavigate } from 'react-router-dom'
import type { Warehouse } from '../../types/Warehouse'
import {
  WarehouseModal,
  type WarehouseFormPayload,
} from '../../components/ui/modal/WarehouseModal'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { ApiError } from '../../api/client'
import * as warehousesApi from '../../api/warehouses'
import * as usersApi from '../../api/users'
import { warehouseToRow } from '../../mappers'

function formatArea(m2?: number | null) {
  if (m2 == null || m2 === 0) return '—'
  return new Intl.NumberFormat('vi-VN').format(m2)
}

export const WarehouseManagement: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [warehouse, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const loadWarehouses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { items } = await warehousesApi.listWarehouses({ limit: 100 })
      setWarehouses(items.map(warehouseToRow))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách kho')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWarehouses()
  }, [loadWarehouses])

  const handleSubmit = async (form: WarehouseFormPayload) => {
    try {
      if (modal.mode === 'create') {
        const created = await warehousesApi.createWarehouse({
          warehouseCode: form.warehouseCode,
          warehouseName: form.warehouseName,
          address: form.address || undefined,
          city: form.city,
          district: form.district,
          totalAreaM2: form.totalAreaM2 ?? undefined,
          usableAreaM2: form.usableAreaM2 ?? undefined,
          status: form.status,
        })

        let adminMessage = ''
        const admin = form.warehouseAdmin
        try {
          if (admin.mode === 'create') {
            await usersApi.createUser({
              fullName: admin.fullName,
              email: admin.email,
              password: admin.password,
              phone: admin.phone || undefined,
              role: 'WH_ADMIN',
              warehouseId: created.warehouseId,
              status: 'ACTIVE',
            })
            adminMessage = ` Đã tạo WH Admin: ${admin.email}.`
          } else if (admin.mode === 'existing') {
            await usersApi.updateUser(admin.userId, {
              warehouseId: created.warehouseId,
            })
            adminMessage = ' Đã gán Warehouse Admin cho kho.'
          }
        } catch (adminErr) {
          const detail =
            adminErr instanceof ApiError ? adminErr.message : 'Gán admin thất bại'
          setAlert({
            open: true,
            type: 'success',
            message: `Tạo kho thành công nhưng ${detail}. Gán lại tại Quản lý tài khoản.`,
          })
          await loadWarehouses()
          return
        }

        setAlert({
          open: true,
          type: 'success',
          message: `Tạo kho thành công.${adminMessage}`,
        })
      }

      if (modal.mode === 'edit' && modal.data) {
        await warehousesApi.updateWarehouse(modal.data.warehouseId, {
          warehouseName: form.warehouseName,
          address: form.address || undefined,
          city: form.city,
          district: form.district,
          totalAreaM2: form.totalAreaM2 ?? undefined,
          usableAreaM2: form.usableAreaM2 ?? undefined,
          status: form.status,
        })
        setAlert({ open: true, type: 'success', message: 'Cập nhật thành công' })
      }

      await loadWarehouses()
    } catch (err) {
      setAlert({
        open: true,
        type: 'success',
        message: err instanceof ApiError ? err.message : 'Thao tác thất bại',
      })
      throw err
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await warehousesApi.deleteWarehouse(id)
      setAlert({ open: true, type: 'success', message: 'Xóa thành công' })
      await loadWarehouses()
    } catch (err) {
      setAlert({
        open: true,
        type: 'success',
        message: err instanceof ApiError ? err.message : 'Xóa thất bại',
      })
    }
  }

  const activeCount = warehouse.filter((w) => w.status === 'ACTIVE').length

  const searchWarehouse = useMemo(() => {
    const q = search.toLowerCase()
    return warehouse.filter(
      (w) =>
        w.warehouseName.toLowerCase().includes(q) ||
        w.address.toLowerCase().includes(q) ||
        (w.warehouseCode ?? '').toLowerCase().includes(q) ||
        `${w.district} ${w.city}`.toLowerCase().includes(q)
    )
  }, [warehouse, search])

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4
  const totalItems = searchWarehouse.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedWarehouses = searchWarehouse.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchWarehouse.length])

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading} text="Đang tải kho..." />
      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 z-0 bg-[#0b101a]/90 backdrop-blur-sm" />
        <div className="relative z-10 flex-1 p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            {error && (
              <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
              <StatsCard title="Số lượng kho" value={warehouse.length} icon="group" accentColor="emerald" />
              <StatsCard
                title="Kho đang hoạt động"
                value={activeCount}
                icon="verified_user"
                accentColor="primary"
              />
            </div>
            <section className="glass-panel flex flex-col overflow-hidden rounded-xl border border-white/5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-5">
                <h3 className="text-2xl font-bold tracking-wide text-white">QUẢN LÝ KHO</h3>
                <div className="flex gap-3">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm mã, tên, khu vực..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="rounded-lg border border-white/10 bg-[#1a2333] py-2 pl-10 pr-4 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setModal({ open: true, mode: 'create' })}
                    className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-black"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    TẠO KHO
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#131b29] text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4 font-medium">Mã kho</th>
                      <th className="px-6 py-4 font-medium">Tên kho</th>
                      <th className="px-6 py-4 font-medium">Khu vực</th>
                      <th className="px-6 py-4 font-medium">Địa chỉ</th>
                      <th className="px-6 py-4 text-center font-medium">DT sử dụng (m²)</th>
                      <th className="px-6 py-4 text-center font-medium">Trạng thái</th>
                      <th className="px-6 py-4 text-center font-medium">Cập nhật</th>
                      <th className="px-6 py-4 text-center font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {paginatedWarehouses.map((item) => (
                      <tr key={item.warehouseId} className="group transition-colors hover:bg-white/5">
                        <td className="px-6 py-4 font-mono text-xs text-cyan-400">
                          {item.warehouseCode ?? item.warehouseId.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 font-medium text-white">{item.warehouseName}</td>
                        <td className="px-6 py-4 text-slate-300">
                          {item.district && item.city
                            ? `${item.district}, ${item.city}`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-white">{item.address}</td>
                        <td className="px-6 py-4 text-center text-white">
                          {formatArea(item.usableAreaM2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              item.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-500/20 text-slate-400'
                            }`}
                          >
                            {item.status ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-400">{item.lastUpdated}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => navigate(`/warehouses/${item.warehouseId}`, { state: item })}
                              className="rounded p-1.5 hover:bg-white/10"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setModal({ open: true, mode: 'edit', data: item })}
                              className="rounded p-1.5 hover:bg-white/10"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAlert({
                                  open: true,
                                  type: 'confirm',
                                  message: `Bạn có chắc muốn xóa kho ${item.warehouseName}?`,
                                  onConfirm: () => handleDelete(item.warehouseId),
                                })
                              }
                              className="rounded p-1.5 hover:bg-white/10"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
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
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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
