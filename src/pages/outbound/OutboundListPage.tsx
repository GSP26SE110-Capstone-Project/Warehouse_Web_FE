import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { OutboundStatusBadge } from '../../components/outbound/OutboundStatusBadge'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as outboundApi from '../../api/outboundRequests'
import type { ApiOutboundRequest, OutboundStatus } from '../../api/outboundRequests'
import * as warehousesApi from '../../api/warehouses'
import * as tenantsApi from '../../api/tenants'
import { OUTBOUND_STATUS_LABELS } from '../../data/outboundStatus'
import { formatDate } from '../../mappers'
import { WhiteStatCard } from '../../components/ui/WhiteStatCard'

type Mode = 'tenant' | 'warehouse'

type Props = {
  mode: Mode
  basePath: string
}

export function OutboundListPage({ mode, basePath }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''
  const warehouseId = user?.warehouseId ?? ''

  const [rows, setRows] = useState<ApiOutboundRequest[]>([])
  const [whNames, setWhNames] = useState<Map<string, string>>(new Map())
  const [tenantNames, setTenantNames] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OutboundStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Parameters<typeof outboundApi.listOutboundRequests>[0] = { limit: 200 }
      if (mode === 'tenant') {
        if (!tenantId) {
          setRows([])
          return
        }
        params.tenantId = tenantId
      } else if (warehouseId) {
        params.warehouseId = warehouseId
      }

      const outboundRes = await outboundApi.listOutboundRequests(params)

      if (mode === 'tenant') {
        const [whRes, tenant] = await Promise.all([
          warehousesApi.listWarehouses({ limit: 100 }),
          tenantId ? tenantsApi.getTenant(tenantId).catch(() => null) : Promise.resolve(null),
        ])
        setRows(outboundRes.items)
        setWhNames(new Map(whRes.items.map((w) => [w.warehouseId, w.warehouseName])))
        setTenantNames(
          tenant ? new Map([[tenant.tenantId, tenant.companyName]]) : new Map()
        )
      } else {
        const [whRes, tenantRes] = await Promise.all([
          warehousesApi.listWarehouses({ limit: 100 }),
          tenantsApi.listTenants({ limit: 100 }),
        ])
        setRows(outboundRes.items)
        setWhNames(new Map(whRes.items.map((w) => [w.warehouseId, w.warehouseName])))
        setTenantNames(new Map(tenantRes.items.map((t) => [t.tenantId, t.companyName])))
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách xuất kho')
    } finally {
      setLoading(false)
    }
  }, [mode, tenantId, warehouseId])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase()
      const matchSearch =
        r.outboundCode.toLowerCase().includes(q) ||
        (whNames.get(r.warehouseId) ?? '').toLowerCase().includes(q) ||
        (tenantNames.get(r.tenantId) ?? '').toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [rows, search, statusFilter, whNames, tenantNames])

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Tính toán rangeStart và rangeEnd dựa trên trang hiện tại và số phần tử lọc được
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalItems)

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((r) => r.status === 'PENDING').length,
      inProgress: rows.filter((r) =>
        ['RESERVED', 'PICKING', 'PACKING'].includes(r.status)
      ).length,
      shipped: rows.filter((r) => r.status === 'SHIPPED' || r.status === 'COMPLETED').length,
    }),
    [rows]
  )

  const canCreate =
    mode === 'tenant' &&
    (user?.role === 'TENANT_ADMIN' || user?.role === 'TENANT_STAFF')

  return (
    <div className="flex max-w-screen overflow-hidden bg-slate-50 text-slate-800 min-h-screen">
      <LoadingOverlay show={loading} text="Đang tải yêu cầu xuất kho..." />
      <main className="relative flex flex-1 flex-col overflow-hidden bg-slate-50">
        <div className="relative z-10 p-6 md:p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6">

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {mode === 'tenant' ? 'Yêu cầu xuất kho' : 'Vận hành xuất kho'}
                </h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  {mode === 'tenant'
                    ? 'Tạo phiếu xuất theo HĐ ACTIVE/TERMINATED (còn tồn khả dụng)'
                    : 'Duyệt, pick, đóng gói và xuất hàng (Hỗ trợ cấu hình FIFO)'}
                </p>
              </div>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/new`)}
                  className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-500 shadow-sm transition-colors"
                >
                  + Tạo yêu cầu xuất
                </button>
              )}
            </div>

            {error && <InlineAlert message={error} onDismiss={() => setError('')} />}

            {mode === 'warehouse' && stats.pending > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900 sm:flex-row sm:items-center sm:justify-between shadow-sm animate-pulse">
                <p className="font-medium">
                  Có <strong className="text-orange-700 font-bold">{stats.pending}</strong> phiếu xuất chờ duyệt — mở chi tiết để duyệt (hệ thống tự động reserve lô FIFO + tạo picking task).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('PENDING')
                    setCurrentPage(1)
                  }}
                  className="shrink-0 rounded-lg border border-orange-300 bg-white px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition-colors shadow-sm"
                >
                  Lọc chờ duyệt
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <WhiteStatCard title="Tổng phiếu" value={stats.total} icon="upload" accentColor="orange" />
              <WhiteStatCard title="Chờ duyệt" value={stats.pending} icon="pending" accentColor="primary" />
              <WhiteStatCard
                title="Đang xử lý"
                value={stats.inProgress}
                icon="inventory"
                accentColor="emerald"
              />
              <WhiteStatCard title="Đã xuất" value={stats.shipped} icon="check_circle" accentColor="purple" />
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                type="search"
                placeholder="Tìm mã OUT, kho, đối tác tenant..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="min-w-[240px] flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none placeholder:text-slate-400 shadow-sm"
              />
              <select
                aria-label="Lọc trạng thái phiếu xuất"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as OutboundStatus | 'all')
                  setCurrentPage(1)
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none shadow-sm font-medium"
              >
                <option value="all">Tất cả trạng thái</option>
                {(Object.keys(OUTBOUND_STATUS_LABELS) as OutboundStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {OUTBOUND_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-4 py-3.5">Mã phiếu</th>
                      {mode === 'warehouse' && <th className="px-4 py-3.5">Tenant</th>}
                      <th className="px-4 py-3.5">Kho</th>
                      <th className="px-4 py-3.5">Ngày xuất dự kiến</th>
                      <th className="px-4 py-3.5">Trạng thái</th>
                      <th className="px-4 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginated.map((r) => (
                      <tr
                        key={r.outboundRequestId}
                        className="hover:bg-slate-50/80 transition-colors bg-white"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-orange-700">{r.outboundCode}</td>
                        {mode === 'warehouse' && (
                          <td className="px-4 py-3 text-slate-900 font-semibold">{tenantNames.get(r.tenantId) ?? '—'}</td>
                        )}
                        <td className="px-4 py-3 text-slate-600">{whNames.get(r.warehouseId) ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(r.requestedShipDate)}</td>
                        <td className="px-4 py-3">
                          <OutboundStatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`${basePath}/${r.outboundRequestId}`)}
                            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50/30 transition-all shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && !loading && (
                      <tr>
                        <td
                          colSpan={mode === 'warehouse' ? 6 : 5}
                          className="px-4 py-12 text-center font-semibold text-slate-400 bg-white"
                        >
                          Chưa có yêu cầu xuất kho nào khớp với bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Vùng thiết kế Pagination mới theo yêu cầu của bạn nằm ngay dưới Table */}
                {totalItems > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                    <p className="font-mono text-xs text-slate-500">
                      Hiển thị{' '}
                      <span className="font-bold text-slate-800">
                        {rangeStart}–{rangeEnd}
                      </span>{' '}
                      trong số <span className="font-bold text-slate-800">{totalItems}</span>
                      {totalPages > 1 && (
                        <>
                          {' '}
                          · Trang <span className="font-bold text-slate-800">{currentPage}</span> / {totalPages}
                        </>
                      )}
                    </p>
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            /> */}
          </div>
        </div>
      </main>
    </div>
  )
}