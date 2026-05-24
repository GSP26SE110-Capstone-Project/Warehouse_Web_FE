import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { ZoneModal, type ZoneFormPayload } from '../../components/ui/modal/ZoneModal'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { ApiError } from '../../api/client'
import * as zonesApi from '../../api/zones'
import type { ApiZone } from '../../api/zones'
import * as warehousesApi from '../../api/warehouses'
import { useAuth } from '../../auth/AuthContext'
import { ZONE_TYPE_LABELS } from '../../data/zoneTypes'

function formatArea(m2?: number | null) {
  if (m2 == null) return '—'
  return new Intl.NumberFormat('vi-VN').format(m2)
}

export const ZoneManagement = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isWhAdmin = user?.role === 'WH_ADMIN'
  const fixedWarehouseId = isWhAdmin ? user?.warehouseId ?? '' : ''

  const [warehouses, setWarehouses] = useState<
    Awaited<ReturnType<typeof warehousesApi.listWarehouses>>['items']
  >([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(fixedWarehouseId)
  const [zones, setZones] = useState<ApiZone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'create' | 'edit' | 'view'
    data?: ApiZone
  }>({ open: false, mode: 'view' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'confirm'
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  const activeWarehouseId = isWhAdmin ? fixedWarehouseId : selectedWarehouseId
  const activeWarehouse = warehouses.find((w) => w.warehouseId === activeWarehouseId)

  useEffect(() => {
    if (!isWhAdmin) {
      warehousesApi.listWarehouses({ limit: 100 }).then(({ items }) => {
        setWarehouses(items)
        if (items.length && !selectedWarehouseId) {
          setSelectedWarehouseId(items[0].warehouseId)
        }
      })
    } else if (fixedWarehouseId) {
      warehousesApi
        .listWarehouses({ limit: 100 })
        .then(({ items }) => setWarehouses(items.filter((w) => w.warehouseId === fixedWarehouseId)))
    }
  }, [isWhAdmin, fixedWarehouseId, selectedWarehouseId])

  const loadZones = useCallback(async () => {
    if (!activeWarehouseId) {
      setZones([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const { items } = await zonesApi.listZones({ warehouseId: activeWarehouseId, limit: 100 })
      setZones(items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách zone')
    } finally {
      setLoading(false)
    }
  }, [activeWarehouseId])

  useEffect(() => {
    loadZones()
  }, [loadZones])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return zones.filter(
      (z) =>
        z.zoneCode.toLowerCase().includes(q) ||
        (z.zoneName ?? '').toLowerCase().includes(q)
    )
  }, [zones, search])

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6
  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeWarehouseId])

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((w) => ({
        warehouseId: w.warehouseId,
        label: `${w.warehouseName} (${w.warehouseCode}) — ${w.district}, ${w.city}`,
      })),
    [warehouses]
  )

  const warehouseLabelForModal = activeWarehouse
    ? `${activeWarehouse.warehouseName} (${activeWarehouse.warehouseCode}) — ${activeWarehouse.district}, ${activeWarehouse.city}`
    : '—'

  const handleSubmit = async (form: ZoneFormPayload) => {
    const targetWarehouseId = form.warehouseId || activeWarehouseId
    if (!targetWarehouseId) return
    try {
      if (modal.mode === 'create') {
        await zonesApi.createZone({
          warehouseId: targetWarehouseId,
          zoneCode: form.zoneCode,
          zoneName: form.zoneName || undefined,
          zoneType: form.zoneType,
          areaM2: form.areaM2 ?? undefined,
          isDedicated: form.isDedicated,
          status: form.status,
        })
        setAlert({ open: true, type: 'success', message: 'Tạo zone thành công' })
      } else if (modal.mode === 'edit' && modal.data) {
        await zonesApi.updateZone(modal.data.zoneId, {
          zoneName: form.zoneName || undefined,
          zoneType: form.zoneType,
          areaM2: form.areaM2 ?? undefined,
          isDedicated: form.isDedicated,
          status: form.status,
        })
        setAlert({ open: true, type: 'success', message: 'Cập nhật zone thành công' })
      }
      await loadZones()
    } catch (err) {
      setAlert({
        open: true,
        type: 'success',
        message: err instanceof ApiError ? err.message : 'Thao tác thất bại',
      })
      throw err
    }
  }

  const handleDelete = async (zone: ApiZone) => {
    try {
      await zonesApi.deleteZone(zone.zoneId)
      setAlert({ open: true, type: 'success', message: 'Đã xóa zone' })
      await loadZones()
    } catch (err) {
      setAlert({
        open: true,
        type: 'success',
        message: err instanceof ApiError ? err.message : 'Xóa thất bại',
      })
    }
  }

  if (isWhAdmin && !fixedWarehouseId) {
    return (
      <div className="p-8 text-amber-300">
        Tài khoản Warehouse Admin chưa được gắn kho. Liên hệ System Admin.
      </div>
    )
  }

  const activeCount = zones.filter((z) => z.status === 'ACTIVE').length

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading} text="Đang tải zone..." />
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />
        <div className="relative z-10 flex-1 p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            {error && (
              <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">QUẢN LÝ ZONE</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {activeWarehouse
                    ? `Kho: ${activeWarehouse.warehouseName} (${activeWarehouse.district}, ${activeWarehouse.city})`
                    : 'Chọn kho để quản lý zone'}
                </p>
              </div>
              {!isWhAdmin && warehouses.length > 0 && (
                <select
                  aria-label="Chọn kho"
                  className="rounded-lg border border-white/10 bg-[#1a2333] px-4 py-2 text-sm text-white"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                >
                  {warehouses.map((w) => (
                    <option key={w.warehouseId} value={w.warehouseId}>
                      {w.warehouseName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <StatsCard title="Tổng zone" value={zones.length} icon="grid_view" accentColor="emerald" />
              <StatsCard title="Đang hoạt động" value={activeCount} icon="check" accentColor="primary" />
              <StatsCard
                title="Dedicated"
                value={zones.filter((z) => z.isDedicated).length}
                icon="lock"
                accentColor="orange"
              />
            </div>

            <section className="glass-panel flex flex-col overflow-hidden rounded-xl border border-white/5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-5">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm mã, tên zone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#1a2333] py-2 pl-10 pr-4 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={!activeWarehouseId}
                  onClick={() => setModal({ open: true, mode: 'create' })}
                  className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-black disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  TẠO ZONE
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#131b29] text-xs uppercase text-slate-400">
                      <th className="px-6 py-4">Mã</th>
                      {!isWhAdmin && <th className="px-6 py-4">Kho</th>}
                      <th className="px-6 py-4">Tên</th>
                      <th className="px-6 py-4">Loại</th>
                      <th className="px-6 py-4 text-center">m²</th>
                      <th className="px-6 py-4 text-center">Dedicated</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginated.map((z) => (
                      <tr key={z.zoneId} className="hover:bg-white/5">
                        <td className="px-6 py-4 font-mono text-cyan-400">{z.zoneCode}</td>
                        {!isWhAdmin && (
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {warehouses.find((w) => w.warehouseId === z.warehouseId)?.warehouseName ??
                              z.warehouseId.slice(0, 8)}
                          </td>
                        )}
                        <td className="px-6 py-4 text-white">{z.zoneName || '—'}</td>
                        <td className="px-6 py-4 text-slate-300">
                          {ZONE_TYPE_LABELS[z.zoneType ?? ''] ?? z.zoneType}
                        </td>
                        <td className="px-6 py-4 text-center">{formatArea(z.areaM2)}</td>
                        <td className="px-6 py-4 text-center">
                          {z.isDedicated ? (
                            <span className="text-amber-400">Có</span>
                          ) : (
                            <span className="text-slate-500">Không</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              z.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {z.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              title="Sơ đồ rack"
                              onClick={() =>
                                navigate(`/admin/racks?zoneId=${encodeURIComponent(z.zoneId)}`)
                              }
                              className="rounded p-1.5 hover:bg-cyan-500/10 text-cyan-400"
                            >
                              <span className="material-symbols-outlined text-lg">view_module</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setModal({ open: true, mode: 'view', data: z })}
                              className="rounded p-1.5 hover:bg-white/10"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setModal({ open: true, mode: 'edit', data: z })}
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
                                  message: `Xóa zone ${z.zoneCode}?`,
                                  onConfirm: () => handleDelete(z),
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
                {filtered.length === 0 && !loading && (
                  <p className="px-6 py-12 text-center text-slate-500">Chưa có zone nào trong kho này.</p>
                )}
              </div>

              {filtered.length > 0 && (
                <div className="flex justify-end border-t border-white/5 bg-[#131b29] px-6 py-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {modal.open && (
        <ZoneModal
          mode={modal.mode}
          data={modal.data}
          warehouseId={modal.data?.warehouseId ?? activeWarehouseId}
          warehouseLabel={
            modal.data
              ? (warehouseOptions.find((w) => w.warehouseId === modal.data?.warehouseId)?.label ??
                warehouseLabelForModal)
              : warehouseLabelForModal
          }
          warehouses={warehouseOptions}
          allowWarehousePick={!isWhAdmin}
          onClose={() => setModal({ open: false })}
          onSubmit={handleSubmit}
        />
      )}

      {alert.open && (
        <AlertModal
          title="Thông báo"
          message={alert.message}
          type={alert.type}
          onConfirm={alert.onConfirm}
          onClose={() => setAlert({ open: false, message: '' })}
        />
      )}
    </div>
  )
}
