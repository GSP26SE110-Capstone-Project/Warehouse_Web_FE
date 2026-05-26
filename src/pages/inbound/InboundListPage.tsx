import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { InboundStatusBadge } from '../../components/inbound/InboundStatusBadge'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as inboundApi from '../../api/inboundRequests'
import type { ApiInboundRequest, InboundStatus } from '../../api/inboundRequests'
import * as warehousesApi from '../../api/warehouses'
import * as tenantsApi from '../../api/tenants'
import { INBOUND_STATUS_LABELS } from '../../data/inboundStatus'
import { formatDate } from '../../mappers'

type Mode = 'tenant' | 'warehouse'

type Props = {
  mode: Mode
  basePath: string
}

export function InboundListPage({ mode, basePath }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''
  const warehouseId = user?.warehouseId ?? ''

  const [rows, setRows] = useState<ApiInboundRequest[]>([])
  const [whNames, setWhNames] = useState<Map<string, string>>(new Map())
  const [tenantNames, setTenantNames] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InboundStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Parameters<typeof inboundApi.listInboundRequests>[0] = { limit: 200 }
      if (mode === 'tenant') {
        if (!tenantId) {
          setRows([])
          return
        }
        params.tenantId = tenantId
      } else if (warehouseId) {
        params.warehouseId = warehouseId
      }

      const [inboundRes, whRes, tenantRes] = await Promise.all([
        inboundApi.listInboundRequests(params),
        warehousesApi.listWarehouses({ limit: 100 }),
        tenantsApi.listTenants({ limit: 100 }),
      ])
      setRows(inboundRes.items)
      setWhNames(new Map(whRes.items.map((w) => [w.warehouseId, w.warehouseName])))
      setTenantNames(new Map(tenantRes.items.map((t) => [t.tenantId, t.companyName])))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách nhập kho')
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
        r.inboundCode.toLowerCase().includes(q) ||
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
      receiving: rows.filter((r) => r.status === 'RECEIVING').length,
      completed: rows.filter((r) => r.status === 'COMPLETED').length,
    }),
    [rows]
  )

  const canCreate = mode === 'tenant' && (user?.role === 'TENANT_ADMIN' || user?.role === 'TENANT_STAFF')

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading} text="Đang tải yêu cầu nhập kho..." />
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />
        <div className="relative z-10 p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {mode === 'tenant' ? 'Yêu cầu nhập kho' : 'Vận hành nhập kho'}
                </h1>
                <p className="text-sm text-slate-400">
                  {mode === 'tenant'
                    ? 'Tạo và theo dõi đơn nhập hàng (cần hợp đồng ACTIVE)'
                    : 'Duyệt, nhận hàng, putaway và hoàn tất inbound'}
                </p>
              </div>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/new`)}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
                >
                  + Tạo yêu cầu nhập
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="Tổng" value={stats.total} icon="inventory_2" accentColor="emerald" />
              <StatsCard title="Chờ duyệt" value={stats.pending} icon="pending" accentColor="primary" />
              <StatsCard title="Đang nhận" value={stats.receiving} icon="input" accentColor="orange" />
              <StatsCard title="Hoàn tất" value={stats.completed} icon="check_circle" accentColor="purple" />
            </div>

            <div className="flex flex-wrap gap-4">
              <input
                type="search"
                placeholder="Tìm mã, kho, tenant..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
              />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as InboundStatus | 'all')
                  setCurrentPage(1)
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
              >
                <option value="all">Tất cả trạng thái</option>
                {(Object.keys(INBOUND_STATUS_LABELS) as InboundStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {INBOUND_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Mã</th>
                    {mode === 'warehouse' && <th className="px-4 py-3">Tenant</th>}
                    <th className="px-4 py-3">Kho</th>
                    <th className="px-4 py-3">Dự kiến đến</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r) => (
                    <tr
                      key={r.inboundRequestId}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-mono text-cyan-300">{r.inboundCode}</td>
                      {mode === 'warehouse' && (
                        <td className="px-4 py-3">{tenantNames.get(r.tenantId) ?? '—'}</td>
                      )}
                      <td className="px-4 py-3">{whNames.get(r.warehouseId) ?? '—'}</td>
                      <td className="px-4 py-3">{formatDate(r.expectedArrivalDate)}</td>
                      <td className="px-4 py-3">
                        <InboundStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`${basePath}/${r.inboundRequestId}`)}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && !loading && (
                    <tr>
                      <td colSpan={mode === 'warehouse' ? 6 : 5} className="px-4 py-8 text-center text-slate-500">
                        Chưa có yêu cầu nhập kho
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
