import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { ZoneModal, type ZoneFormPayload } from '../../components/ui/modal/ZoneModal'
import { BulkZoneModal } from '../../components/ui/modal/BulkZoneModal'
import type { ApiWarehouseZonePlanning } from '../../api/warehouses'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { ApiError } from '../../api/client'
import * as zonesApi from '../../api/zones'
import type { ApiZone } from '../../api/zones'
import * as warehousesApi from '../../api/warehouses'
import { useAuth } from '../../auth/AuthContext'
import { ZONE_TYPE_LABELS, ZONE_TYPE_OPTIONS } from '../../data/zoneTypes'

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
  const [zoneTypeFilter, setZoneTypeFilter] = useState('')

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'create' | 'edit' | 'view'
    data?: ApiZone
  }>({ open: false, mode: 'view' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'error' | 'warning' | 'confirm'
    message: string
    title?: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  const [zonePlanning, setZonePlanning] = useState<ApiWarehouseZonePlanning | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

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
      warehousesApi.getWarehouse(fixedWarehouseId).then((w) => setWarehouses([w]))
    }
  }, [isWhAdmin, fixedWarehouseId, selectedWarehouseId])

  const loadPlanning = useCallback(async () => {
    if (!activeWarehouseId) {
      setZonePlanning(null)
      return
    }
    try {
      const p = await warehousesApi.getWarehouseZonePlanning(activeWarehouseId)
      setZonePlanning(p)
    } catch {
      setZonePlanning(null)
    }
  }, [activeWarehouseId])

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
    loadPlanning()
  }, [loadZones, loadPlanning])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return zones.filter((z) => {
      if (zoneTypeFilter && (z.zoneType ?? 'SHARED') !== zoneTypeFilter) return false
      return (
        z.zoneCode.toLowerCase().includes(q) ||
        (z.zoneName ?? '').toLowerCase().includes(q)
      )
    })
  }, [zones, search, zoneTypeFilter])

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6
  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
    setZoneTypeFilter('')
    setSearch('')
  }, [activeWarehouseId])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, zoneTypeFilter])

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
      await loadPlanning()
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

  const handleDelete = async (zone: ApiZone) => {
    try {
      await zonesApi.deleteZone(zone.zoneId)
      setAlert({ open: true, type: 'success', message: 'Đã xóa zone' })
      await loadZones()
      await loadPlanning()
    } catch (err) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Có lỗi xảy ra',
        message: err instanceof ApiError ? err.message : 'Xóa thất bại',
      })
    }
  }

  const handleBulkCreate = async (payload: {
    count: number
    areaM2PerZone: number
    zoneCodePrefix: string
    zoneType: string
  }) => {
    if (!activeWarehouseId) return
    await zonesApi.createZonesBulk({
      warehouseId: activeWarehouseId,
      count: payload.count,
      areaM2PerZone: payload.areaM2PerZone,
      zoneCodePrefix: payload.zoneCodePrefix,
      zoneType: payload.zoneType,
    })
    setAlert({
      open: true,
      type: 'success',
      message: `Đã tạo ${payload.count} zone`,
    })
    await loadZones()
    await loadPlanning()
  }

  if (isWhAdmin && !fixedWarehouseId) {
    return (
      <div className="p-8 text-amber-600 font-medium bg-amber-50">
        Tài khoản Warehouse Admin chưa được gắn kho. Liên hệ System Admin.
      </div>
    )
  }

  const activeCount = zones.filter((z) => z.status === 'ACTIVE').length

  return (
    <div className="flex max-w-screen overflow-hidden bg-slate-50 text-slate-800">
      <LoadingOverlay show={loading} text="Đang tải zone..." />
      
      <main className="relative flex flex-1 flex-col overflow-hidden bg-slate-50">
        <div className="relative z-10 flex-1 p-5">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
            
            {error && (
              <InlineAlert message={error} onDismiss={() => setError('')} />
            )}

            <div className="flex flex-wrap items-end justify-between gap-2">
              {/* <div>
                <h2 className="text-2xl font-bold tracking-wide text-slate-900">QUẢN LÝ ZONE</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {activeWarehouse
                    ? `Kho: ${activeWarehouse.warehouseName} (${activeWarehouse.district}, ${activeWarehouse.city})`
                    : 'Chọn kho để quản lý zone'}
                </p>
              </div> */}
              
              {!isWhAdmin && warehouses.length > 0 && (
                <select
                  aria-label="Chọn kho"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-cyan-500 focus:outline-none"
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

            {/* Khối quy hoạch diện tích (Zone Planning) */}
            {zonePlanning && (
              <div
                className={`rounded-xl border px-5 py-3.5 text-sm shadow-sm ${
                  zonePlanning.areaValid
                    ? 'border-cyan-200 bg-cyan-50 text-cyan-900'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                <p className="font-medium">
                  Diện tích sử dụng:{' '}
                  <strong className="text-slate-900">{formatArea(zonePlanning.usableAreaM2)} m²</strong>
                  {zonePlanning.totalAreaM2 != null && (
                    <span className="text-slate-500 font-normal">
                      {' '}
                      (tổng {formatArea(zonePlanning.totalAreaM2)} m²)
                    </span>
                  )}
                  {' · '}
                  Zone đã phân bổ: <strong className="text-slate-900">{formatArea(zonePlanning.usedZoneAreaM2)} m²</strong>
                  {' · '}
                  Còn lại: <strong className="text-cyan-700">
                    {formatArea(zonePlanning.remainingZoneAreaM2)} m²
                  </strong>
                </p>
                {zonePlanning.suggestedMinZoneCount != null && (
                  <p className="mt-1 text-xs text-amber-700">
                    Gợi ý tối thiểu ~{zonePlanning.suggestedMinZoneCount} zone (≈{' '}
                    {zonePlanning.suggestedReferenceZoneAreaM2} m²/zone). Hiện có{' '}
                    {zonePlanning.zoneCount} zone
                    {(zonePlanning.missingZoneCount ?? 0) > 0 && (
                      <>
                        {' '}
                        — còn {formatArea(zonePlanning.remainingZoneAreaM2)} m², có thể thêm ~
                        {zonePlanning.missingZoneCount} zone
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Khu vực Thống kê Dashboard nhỏ (Light version) */}
            {/* <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <StatsCard title="Tổng zone" value={zones.length} icon="grid_view" accentColor="emerald" />
              <StatsCard title="Đang hoạt động" value={activeCount} icon="check" accentColor="primary" />
              <StatsCard
                title="Kho riêng"
                value={zones.filter((z) => z.isDedicated).length}
                icon="lock"
                accentColor="orange"
              />
            </div> */}

            {/* Bảng Danh sách dữ liệu chính */}
            <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm mã, tên zone..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full min-w-[200px] rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:outline-none sm:w-64 shadow-sm"
                    />
                  </div>
                  
                  <select
                    aria-label="Lọc loại zone"
                    value={zoneTypeFilter}
                    onChange={(e) => setZoneTypeFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">Tất cả loại zone</option>
                    {ZONE_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  {(zoneTypeFilter || search) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('')
                        setZoneTypeFilter('')
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-cyan-600"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!activeWarehouseId}
                    onClick={() => setModal({ open: true, mode: 'create' })}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    TẠO ZONE
                  </button>
                  <button
                    type="button"
                    disabled={!activeWarehouseId}
                    onClick={() => setBulkOpen(true)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-50"
                  >
                    Tạo nhiều zone
                  </button>
                </div>
              </div>

              {/* Giao diện Table Light Mode */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600">
                      <th className="px-6 py-3.5">Mã</th>
                      {!isWhAdmin && <th className="px-6 py-3.5">Kho</th>}
                      <th className="px-6 py-3.5">Tên</th>
                      <th className="px-6 py-3.5">Loại</th>
                      <th className="px-6 py-3.5 text-center">m²</th>
                      <th className="px-6 py-3.5 text-center">Trạng thái</th>
                      <th className="px-6 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginated.map((z) => (
                      <tr key={z.zoneId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-mono font-bold text-cyan-600">{z.zoneCode}</td>
                        {!isWhAdmin && (
                          <td className="px-6 py-3.5 text-xs font-medium text-slate-500">
                            {warehouses.find((w) => w.warehouseId === z.warehouseId)?.warehouseName ??
                              z.warehouseId.slice(0, 8)}
                          </td>
                        )}
                        <td className="px-6 py-3.5 font-medium text-slate-900">{z.zoneName || '—'}</td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {ZONE_TYPE_LABELS[z.zoneType ?? ''] ?? z.zoneType}
                        </td>
                        <td className="px-6 py-3.5 text-center font-semibold text-slate-700">{formatArea(z.areaM2)}</td>
                        
                        <td className="px-6 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold ${
                              z.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {z.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              title="Sơ đồ rack"
                              onClick={() =>
                                navigate(`/admin/racks?zoneId=${encodeURIComponent(z.zoneId)}`)
                              }
                              className="rounded-md p-1.5 hover:bg-cyan-50 text-cyan-600 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">view_module</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setModal({ open: true, mode: 'view', data: z })}
                              className="rounded-md p-1.5 hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setModal({ open: true, mode: 'edit', data: z })}
                              className="rounded-md p-1.5 hover:bg-slate-100 text-slate-500 transition-colors"
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
                              className="rounded-md p-1.5 hover:bg-rose-50 text-rose-600 transition-colors"
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
                  <p className="px-6 py-12 text-center font-medium text-slate-400 bg-white">
                    {zones.length === 0
                      ? 'Chưa có zone nào trong kho này.'
                      : 'Không có zone phù hợp bộ lọc.'}
                  </p>
                )}
              </div>

              {filtered.length > 0 && (
                <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-3.5">
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

      {/* Cấu trúc Modals */}
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
          zonePlanning={zonePlanning}
          editingZoneAreaM2={
            modal.mode === 'edit' && modal.data?.areaM2 != null ? Number(modal.data.areaM2) : 0
          }
          onClose={() => setModal({ open: false, mode: 'view' })}
          onSubmit={handleSubmit}
        />
      )}

      {bulkOpen && activeWarehouseId && (
        <BulkZoneModal
          warehouseId={activeWarehouseId}
          warehouseLabel={warehouseLabelForModal}
          planning={zonePlanning}
          onClose={() => setBulkOpen(false)}
          onSubmit={handleBulkCreate}
        />
      )}

      {alert.open && (
        <AlertModal
          title="Thông báo"
          message={alert.message}
          type={alert.type}
          onConfirm={alert.onConfirm}
          onClose={() => setAlert({ open: false, type: 'success', message: '' })}
        />
      )}
    </div>
  )
}