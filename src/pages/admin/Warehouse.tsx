import { useState, useEffect, useMemo, useCallback } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import type { Warehouse } from '../../types/Warehouse'
import {
  WarehouseModal,
  type WarehouseFormPayload,
} from '../../components/ui/modal/WarehouseModal'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { ApiError } from '../../api/client'
import * as warehousesApi from '../../api/warehouses'
import * as usersApi from '../../api/users'
import { warehouseToRow, whAdminFromUser } from '../../mappers'
import { useAuth } from '../../auth/AuthContext'

function formatArea(m2?: number | null) {
  if (m2 == null || m2 === 0) return '—'
  return new Intl.NumberFormat('vi-VN').format(m2)
}

export const WarehouseManagement: React.FC = () => {
  const { user } = useAuth()
  const isWhAdmin = user?.role === 'WH_ADMIN'
  const isDarkMode = user?.role === 'SYSTEM_ADMIN' // Dark mode cho SYSTEM_ADMIN, Light mode cho các role khác
  const fixedWarehouseId = isWhAdmin ? user?.warehouseId ?? '' : ''
  const [search, setSearch] = useState('')
  const [onlyMissingAdmin, setOnlyMissingAdmin] = useState(false)
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
    type: 'success' | 'error' | 'warning' | 'confirm'
    message: string
    title?: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  const loadWarehouses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      let rows: Warehouse[] = []
      if (isWhAdmin && fixedWarehouseId) {
        const w = await warehousesApi.getWarehouse(fixedWarehouseId)
        rows = [warehouseToRow(w)]
      } else if (!isWhAdmin) {
        const [{ items }, { items: adminUsers }] = await Promise.all([
          warehousesApi.listWarehouses({ limit: 100 }),
          usersApi.listUsers({ role: 'WH_ADMIN', limit: 200 }),
        ])
        const adminByWarehouse = new Map(
          adminUsers
            .filter((u) => u.warehouseId)
            .map((u) => [u.warehouseId as string, whAdminFromUser(u)])
        )
        rows = items.map((w) => {
          const row = warehouseToRow(w)
          return { ...row, whAdmin: adminByWarehouse.get(w.warehouseId) ?? null }
        })
      } else {
        rows = []
      }
      setWarehouses(rows)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách kho')
    } finally {
      setLoading(false)
    }
  }, [isWhAdmin, fixedWarehouseId])

  useEffect(() => {
    loadWarehouses()
  }, [loadWarehouses])

  const assignWarehouseAdmin = async (
    warehouseId: string,
    admin: WarehouseFormPayload['warehouseAdmin'],
    currentAdmin?: Warehouse['whAdmin']
  ) => {
    if (admin.mode === 'skip') return ''

    if (admin.mode === 'existing') {
      if (currentAdmin && currentAdmin.userId !== admin.userId) {
        await usersApi.updateUser(currentAdmin.userId, { warehouseId: null })
      }
      await usersApi.updateUser(admin.userId, { warehouseId })
      return ' Đã gán Warehouse Admin cho kho.'
    }

    if (admin.mode === 'create') {
      if (currentAdmin) {
        await usersApi.updateUser(currentAdmin.userId, { warehouseId: null })
      }
      const createdAdmin = await usersApi.createUser({
        fullName: admin.fullName,
        email: admin.email,
        password: admin.password,
        phone: admin.phone || undefined,
        role: 'WH_ADMIN',
        warehouseId,
        status: 'ACTIVE',
      })
      return ` Đã tạo WH Admin: ${admin.email}.${usersApi.welcomeEmailMessage(createdAdmin.welcomeEmail)}`
    }

    return ''
  }

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
        try {
          adminMessage = await assignWarehouseAdmin(created.warehouseId, form.warehouseAdmin)
        } catch (adminErr) {
          const detail =
            adminErr instanceof ApiError ? adminErr.message : 'Gán admin thất bại'
          setAlert({
            open: true,
            type: 'warning',
            title: 'Lưu ý',
            message: `Tạo kho thành công nhưng ${detail}. Gán lại khi chỉnh sửa kho.`,
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

        let adminMessage = ''
        if (form.warehouseAdmin.mode !== 'skip') {
          try {
            adminMessage = await assignWarehouseAdmin(
              modal.data.warehouseId,
              form.warehouseAdmin,
              modal.data.whAdmin ?? undefined
            )
          } catch (adminErr) {
            const detail =
              adminErr instanceof ApiError ? adminErr.message : 'Gán admin thất bại'
            setAlert({
              open: true,
              type: 'warning',
              title: 'Lưu ý',
              message: `Cập nhật kho thành công nhưng ${detail}.`,
            })
            await loadWarehouses()
            return
          }
        }

        setAlert({
          open: true,
          type: 'success',
          message: `Cập nhật thành công.${adminMessage}`,
        })
      }

      await loadWarehouses()
    } catch (err) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Có lỗi xảy ra',
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
        type: 'error',
        title: 'Có lỗi xảy ra',
        message: err instanceof ApiError ? err.message : 'Xóa thất bại',
      })
    }
  }

  const activeCount = warehouse.filter((w) => w.status === 'ACTIVE').length
  const missingAdminCount = warehouse.filter((w) => !w.whAdmin).length

  const searchWarehouse = useMemo(() => {
    const q = search.toLowerCase()
    return warehouse.filter((w) => {
      const matchSearch =
        w.warehouseName.toLowerCase().includes(q) ||
        w.address.toLowerCase().includes(q) ||
        (w.warehouseCode ?? '').toLowerCase().includes(q) ||
        `${w.district} ${w.city}`.toLowerCase().includes(q) ||
        (w.whAdmin?.fullName ?? '').toLowerCase().includes(q) ||
        (w.whAdmin?.email ?? '').toLowerCase().includes(q)

      const matchMissing = !onlyMissingAdmin || !w.whAdmin
      return matchSearch && matchMissing
    })
  }, [warehouse, search, onlyMissingAdmin])

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
  }, [searchWarehouse.length, onlyMissingAdmin])

  if (isWhAdmin && !fixedWarehouseId) {
    return (
      <div className={`p-8 font-semibold ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
        Tài khoản Warehouse Admin chưa được gắn kho. Liên hệ System Admin.
      </div>
    )
  }

  return (
    <div className={`flex max-w-screen overflow-hidden transition-colors ${
      isDarkMode ? 'bg-[#0b101a] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <LoadingOverlay show={loading} text="Đang tải kho..." />
      
      {/* Wrapper chính thay thế hoặc áp dụng ảnh nền động dựa trên Theme */}
      <main className={`relative flex h-full flex-1 flex-col overflow-hidden bg-cover bg-center ${
        isDarkMode 
          ? "bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')]" 
          : "bg-none"
      }`}>
        {/* Lớp Overlay lót nền */}
        <div className={`absolute inset-0 z-0 ${
          isDarkMode ? 'bg-[#0b101a]/90 backdrop-blur-sm' : 'bg-transparent'
        }`} />

        <div className="relative z-10 flex-1 p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            {error && (
              <InlineAlert message={error} onDismiss={() => setError('')} />
            )}

            {/* Các thẻ thống kê (StatsCard) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <StatsCard title="Số lượng kho" value={warehouse.length} icon="group" accentColor="emerald" />
              <StatsCard
                title="Kho đang hoạt động"
                value={activeCount}
                icon="verified_user"
                accentColor="primary"
              />
              {!isWhAdmin && (
                <StatsCard
                  title="Chưa có WH Admin"
                  value={missingAdminCount}
                  icon="person_off"
                  accentColor="orange"
                />
              )}
            </div>

            {/* Khu vực bảng dữ liệu chính (Panel) */}
            <section className={`flex flex-col overflow-hidden rounded-xl border transition-colors shadow-sm ${
              isDarkMode ? 'bg-[#111827]/40 border-white/5 backdrop-blur-md' : 'bg-white border-slate-200'
            }`}>
              
              {/* Header của bảng quản lý */}
              <div className={`flex flex-wrap items-center justify-between gap-4 border-b px-6 py-5 ${
                isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/70'
              }`}>
                <h3 className={`text-2xl font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  QUẢN LÝ KHO
                </h3>
                <div className="flex flex-wrap gap-3">
                  
                  {/* Ô tìm kiếm dữ liệu */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm mã, tên, admin..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`rounded-lg border py-2 pl-10 pr-4 text-sm focus:outline-none transition-all ${
                        isDarkMode 
                          ? 'border-white/10 bg-[#1a2333] text-white focus:border-cyan-400' 
                          : 'border-slate-300 bg-white text-slate-900 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600'
                      }`}
                    />
                  </div>

                  {/* Checkbox lọc WH Admin */}
                  {!isWhAdmin && (
                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                      isDarkMode 
                        ? 'border-amber-400/30 bg-amber-400/5 text-amber-200' 
                        : 'border-amber-300 bg-amber-50 text-amber-800 shadow-sm'
                    }`}>
                      <input
                        type="checkbox"
                        checked={onlyMissingAdmin}
                        onChange={(e) => setOnlyMissingAdmin(e.target.checked)}
                        className={`rounded ${isDarkMode ? 'border-white/20' : 'border-slate-300 text-amber-600 focus:ring-amber-500'}`}
                      />
                      Chưa có WH Admin
                    </label>
                  )}

                  {/* Nút Tạo Kho mới */}
                  {!isWhAdmin && (
                    <button
                      type="button"
                      onClick={() => setModal({ open: true, mode: 'create' })}
                      className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold shadow-sm transition-all active:scale-[0.98] ${
                        isDarkMode
                          ? 'btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 text-black'
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                      TẠO KHO
                    </button>
                  )}
                </div>
              </div>

              {/* Bảng hiển thị thông tin */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className={`border-b text-xs uppercase tracking-wider font-semibold ${
                      isDarkMode ? 'border-white/5 bg-[#131b29] text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-600'
                    }`}>
                      <th className="px-6 py-4 font-medium">Mã kho</th>
                      <th className="px-6 py-4 font-medium">Tên kho</th>
                      {!isWhAdmin && (
                        <th className="px-6 py-4 font-medium">Warehouse Admin</th>
                      )}
                      <th className="px-6 py-4 font-medium">Khu vực</th>
                      <th className="px-6 py-4 font-medium">Địa chỉ</th>
                      <th className="px-6 py-4 text-center font-medium">DT sử dụng (m²)</th>
                      <th className="px-6 py-4 text-center font-medium">Trạng thái</th>
                      <th className="px-6 py-4 text-center font-medium">Cập nhật</th>
                      <th className="px-6 py-4 text-center font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  
                  <tbody className={`divide-y text-sm ${isDarkMode ? 'divide-white/5' : 'divide-slate-200'}`}>
                    {paginatedWarehouses.map((item) => (
                      <tr
                        key={item.warehouseId}
                        className={`group transition-colors ${
                          isDarkMode 
                            ? `hover:bg-white/5 ${!isWhAdmin && !item.whAdmin ? 'bg-amber-400/[0.03]' : ''}` 
                            : `hover:bg-slate-50 ${!isWhAdmin && !item.whAdmin ? 'bg-amber-50/50' : ''}`
                        }`}
                      >
                        {/* Mã kho */}
                        <td className={`px-6 py-4 font-mono text-xs font-semibold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                          {item.warehouseCode ?? item.warehouseId.slice(0, 8)}
                        </td>

                        {/* Tên kho */}
                        <td className={`px-6 py-4 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {item.warehouseName}
                        </td>

                        {/* Cột Admin điều phối kho */}
                        {!isWhAdmin && (
                          <td className="px-6 py-4">
                            {item.whAdmin ? (
                              <div>
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.whAdmin.fullName}</p>
                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.whAdmin.email}</p>
                              </div>
                            ) : (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-inset ${
                                isDarkMode 
                                  ? 'bg-amber-400/10 text-amber-300 ring-amber-400/30' 
                                  : 'bg-amber-100 text-amber-800 ring-amber-200'
                              }`}>
                                <span className="material-symbols-outlined text-sm">warning</span>
                                Chưa gán
                              </span>
                            )}
                          </td>
                        )}

                        {/* Khu vực */}
                        <td className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                          {item.district && item.city
                            ? `${item.district}, ${item.city}`
                            : '—'}
                        </td>

                        {/* Địa chỉ */}
                        <td className={`px-6 py-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{item.address}</td>

                        {/* Diện tích sử dụng */}
                        <td className={`px-6 py-4 text-center font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {formatArea(item.usableAreaM2)}
                        </td>

                        {/* Trạng thái hoạt động */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                              item.status === 'ACTIVE'
                                ? isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                                : isDarkMode ? 'bg-slate-500/20 text-slate-400' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.status ?? '—'}
                          </span>
                        </td>

                        {/* Ngày cập nhật */}
                        <td className={`px-6 py-4 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.lastUpdated}</td>

                        {/* Các nút hành động (Thao tác) */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Nút Xem chi tiết */}
                            <button
                              type="button"
                              title="Xem chi tiết"
                              onClick={() => setModal({ open: true, mode: 'view', data: item })}
                              className={`rounded p-1.5 opacity-70 transition group-hover:opacity-100 ${
                                isDarkMode ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                              }`}
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>

                            {/* Nút Chỉnh sửa */}
                            <button
                              type="button"
                              title="Chỉnh sửa"
                              onClick={() => setModal({ open: true, mode: 'edit', data: item })}
                              className={`rounded p-1.5 opacity-70 transition group-hover:opacity-100 ${
                                isDarkMode ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                              }`}
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>

                            {/* Nút Xóa kho */}
                            {!isWhAdmin && (
                              <button
                                type="button"
                                title={`Xóa kho ${item.warehouseName}`}
                                onClick={() =>
                                  setAlert({
                                    open: true,
                                    type: 'confirm',
                                    title: 'Xác nhận xóa kho',
                                    message: `Bạn có chắc muốn xóa kho "${item.warehouseName}" (${
                                      item.warehouseCode ?? item.warehouseId.slice(0, 8)
                                    })? Thao tác này không thể hoàn tác.`,
                                    onConfirm: () => handleDelete(item.warehouseId),
                                  })
                                }
                                className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-bold transition shadow-sm ${
                                  isDarkMode
                                    ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400 hover:bg-red-500/20 hover:text-red-100'
                                    : 'border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100'
                                }`}
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                                Xóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Chân trang bảng (Footer Pagination) */}
              <div className={`flex items-center justify-between border-t px-6 py-4 ${
                isDarkMode ? 'border-white/5 bg-[#131b29]' : 'border-slate-200 bg-slate-50'
              }`}>
                <p className={`font-mono text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Showing <span className={isDarkMode ? 'text-white' : 'text-slate-900 font-bold'}>{start}-{end}</span> of{' '}
                  <span className={isDarkMode ? 'text-white' : 'text-slate-900 font-bold'}>{totalItems}</span> items
                </p>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Cấu trúc Modal bổ trợ */}
      {modal.open && (
        <WarehouseModal
          mode={modal.mode}
          data={modal.data}
          onClose={() => setModal({ ...modal, open: false })}
          onSubmit={handleSubmit}
          isDarkMode={isDarkMode}
        />
      )}
      {alert.open && (
        <AlertModal
          title={alert.title ?? 'Thông báo'}
          message={alert.message}
          type={alert.type}
          onConfirm={alert.onConfirm}
          onClose={() => setAlert({ ...alert, open: false })}
        />
      )}
    </div>
  )
}