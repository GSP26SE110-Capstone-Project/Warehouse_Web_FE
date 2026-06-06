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
  const isWhStaff = user?.role === 'WH_STAFF'
  const isWhAdmin = user?.role === 'WH_ADMIN' || user?.role === 'SYSTEM_ADMIN'

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
        if (isWhStaff) {
          params.assignedPickerMe = true
        }
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
  }, [mode, tenantId, warehouseId, isWhStaff])

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
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading} text="Đang tải yêu cầu xuất kho..." />
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />
        <div className="relative z-10 p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {mode === 'tenant' ? 'Yêu cầu xuất kho' : 'Vận hành xuất kho'}
                </h1>
                <p className="text-sm text-slate-400">
                  {mode === 'tenant'
                    ? 'Tạo phiếu xuất theo HĐ ACTIVE/TERMINATED (còn tồn khả dụng)'
                    : isWhStaff
                      ? 'Phiếu pick được gán cho bạn — RESERVED → PICKING → PACKING'
                      : 'Duyệt, gán picker, duyệt packing và xuất hàng (FIFO)'}
                </p>
              </div>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/new`)}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-orange-400"
                >
                  + Tạo yêu cầu xuất
                </button>
              )}
            </div>

            {error && <InlineAlert message={error} onDismiss={() => setError('')} />}

            {mode === 'warehouse' && isWhStaff && stats.inProgress > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-sm text-violet-100 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  <strong>{stats.inProgress}</strong> phiếu được gán — bắt đầu pick rồi xác nhận
                  hoàn tất pick (WH Admin duyệt packing).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('PICKING')
                    setCurrentPage(1)
                  }}
                  className="shrink-0 rounded-lg border border-violet-400/40 px-4 py-2 text-xs font-semibold hover:bg-violet-400/15"
                >
                  Lọc đang pick
                </button>
              </div>
            )}

            {mode === 'warehouse' && isWhAdmin && stats.pending > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-orange-400/30 bg-orange-400/10 px-4 py-3 text-sm text-orange-100 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Có <strong>{stats.pending}</strong> phiếu xuất chờ duyệt — mở chi tiết để duyệt
                  (reserve FIFO + picking task).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('PENDING')
                    setCurrentPage(1)
                  }}
                  className="shrink-0 rounded-lg border border-orange-400/40 px-4 py-2 text-xs font-semibold hover:bg-orange-400/15"
                >
                  Lọc chờ duyệt
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="Tổng phiếu" value={stats.total} icon="upload" accentColor="orange" />
              <StatsCard title="Chờ duyệt" value={stats.pending} icon="pending" accentColor="primary" />
              <StatsCard
                title="Đang xử lý"
                value={stats.inProgress}
                icon="inventory"
                accentColor="emerald"
              />
              <StatsCard title="Đã xuất" value={stats.shipped} icon="check_circle" accentColor="purple" />
            </div>

            <div className="flex flex-wrap gap-4">
              <input
                type="search"
                placeholder="Tìm mã OUT, kho, tenant..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
              />
              <select
                aria-label="Lọc trạng thái phiếu xuất"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as OutboundStatus | 'all')
                  setCurrentPage(1)
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
              >
                <option value="all">Tất cả trạng thái</option>
                {(Object.keys(OUTBOUND_STATUS_LABELS) as OutboundStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {OUTBOUND_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Mã phiếu</th>
                    {mode === 'warehouse' && <th className="px-4 py-3">Tenant</th>}
                    <th className="px-4 py-3">Kho</th>
                    <th className="px-4 py-3">Ngày xuất dự kiến</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r) => (
                    <tr
                      key={r.outboundRequestId}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-mono text-orange-300">{r.outboundCode}</td>
                      {mode === 'warehouse' && (
                        <td className="px-4 py-3">{tenantNames.get(r.tenantId) ?? '—'}</td>
                      )}
                      <td className="px-4 py-3">{whNames.get(r.warehouseId) ?? '—'}</td>
                      <td className="px-4 py-3">{formatDate(r.requestedShipDate)}</td>
                      <td className="px-4 py-3">
                        <OutboundStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`${basePath}/${r.outboundRequestId}`)}
                          className="text-orange-400 hover:text-orange-300"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={mode === 'warehouse' ? 6 : 5}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Chưa có yêu cầu xuất kho
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
