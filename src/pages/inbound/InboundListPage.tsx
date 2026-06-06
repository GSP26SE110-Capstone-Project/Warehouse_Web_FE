import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { InboundStatusBadge } from '../../components/inbound/InboundStatusBadge'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as inboundApi from '../../api/inboundRequests'
import type { ApiInboundRequest, InboundStatus } from '../../api/inboundRequests'
import * as warehousesApi from '../../api/warehouses'
import * as tenantsApi from '../../api/tenants'
import * as contractsApi from '../../api/contracts'
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
  const [activeContractCount, setActiveContractCount] = useState<number | null>(null)
  const pageSize = 8
  const isTenantAdmin = user?.role === 'TENANT_ADMIN'
  const isWhStaff = user?.role === 'WH_STAFF'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Parameters<typeof inboundApi.listInboundRequests>[0] = { limit: 200 }
      if (mode === 'tenant') {
        if (!tenantId) {
          setRows([])
          setActiveContractCount(null)
          return
        }
        params.tenantId = tenantId
      } else if (warehouseId) {
        params.warehouseId = warehouseId
      }

      const inboundRes = await inboundApi.listInboundRequests(params)

      if (mode === 'tenant') {
        const [whRes, tenant] = await Promise.all([
          warehousesApi.listWarehouses({ limit: 100 }),
          tenantId ? tenantsApi.getTenant(tenantId).catch(() => null) : Promise.resolve(null),
        ])
        setRows(inboundRes.items)
        setWhNames(new Map(whRes.items.map((w) => [w.warehouseId, w.warehouseName])))
        setTenantNames(
          tenant ? new Map([[tenant.tenantId, tenant.companyName]]) : new Map()
        )
        const cRes = await contractsApi.listContracts({ tenantId, status: 'ACTIVE', limit: 100 })
        setActiveContractCount(cRes.items.length)
      } else {
        setActiveContractCount(null)
        const [whRes, tenantRes] = await Promise.all([
          warehousesApi.listWarehouses({ limit: 100 }),
          tenantsApi.listTenants({ limit: 100 }),
        ])
        setRows(inboundRes.items)
        setWhNames(new Map(whRes.items.map((w) => [w.warehouseId, w.warehouseName])))
        setTenantNames(new Map(tenantRes.items.map((t) => [t.tenantId, t.companyName])))
      }
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
      arrived: rows.filter((r) => r.status === 'ARRIVED').length,
      receiving: rows.filter((r) => r.status === 'RECEIVING').length,
      completed: rows.filter((r) => r.status === 'COMPLETED').length,
    }),
    [rows]
  )

  const canCreate = mode === 'tenant' && isTenantAdmin

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
                    : isWhStaff
                      ? 'Nhận hàng, tạo batch/LPN, putaway và hoàn tất inbound'
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
              <InlineAlert message={error} onDismiss={() => setError('')} />
            )}

            {mode === 'tenant' && activeContractCount === 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Chưa có hợp đồng <strong>ACTIVE</strong> — ký và thanh toán invoice đầu tại{' '}
                <button
                  type="button"
                  onClick={() => navigate('/staff/contracts')}
                  className="font-semibold text-cyan-300 underline hover:text-cyan-200"
                >
                  Hợp đồng
                </button>{' '}
                trước khi tạo yêu cầu nhập.
              </div>
            )}

            {mode === 'tenant' && stats.pending > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Có <strong>{stats.pending}</strong> phiếu nhập chờ kho duyệt.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('PENDING')
                    setCurrentPage(1)
                  }}
                  className="shrink-0 rounded-lg border border-cyan-400/40 px-4 py-2 text-xs font-semibold hover:bg-cyan-400/15"
                >
                  Lọc chờ duyệt
                </button>
              </div>
            )}

            {mode === 'warehouse' &&
              isWhStaff &&
              (stats.arrived > 0 || stats.receiving > 0) && (
                <div className="flex flex-col gap-3 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined shrink-0 text-cyan-300">inventory</span>
                    <p>
                      {stats.arrived > 0 && (
                        <>
                          <strong>{stats.arrived}</strong> phiếu đã đến kho (ARRIVED) — bắt đầu receiving.
                          {stats.receiving > 0 ? ' ' : ''}
                        </>
                      )}
                      {stats.receiving > 0 && (
                        <>
                          <strong>{stats.receiving}</strong> phiếu đang nhận hàng.
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {stats.arrived > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('ARRIVED')
                          setCurrentPage(1)
                        }}
                        className="rounded-lg border border-cyan-400/40 bg-cyan-400/15 px-4 py-2 text-xs font-semibold"
                      >
                        Lọc ARRIVED
                      </button>
                    )}
                    {stats.receiving > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('RECEIVING')
                          setCurrentPage(1)
                        }}
                        className="rounded-lg border border-orange-400/40 bg-orange-400/15 px-4 py-2 text-xs font-semibold text-orange-100"
                      >
                        Lọc RECEIVING
                      </button>
                    )}
                  </div>
                </div>
              )}

            {mode === 'warehouse' &&
              user?.role === 'WH_ADMIN' &&
              stats.pending > 0 && (
                <div className="flex flex-col gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined shrink-0 text-amber-300">pending_actions</span>
                    <p>
                      Có <strong>{stats.pending}</strong> yêu cầu nhập kho đang chờ duyệt — mở từng
                      đơn để duyệt hoặc từ chối.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('PENDING')
                      setCurrentPage(1)
                    }}
                    className="shrink-0 rounded-lg border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/25"
                  >
                    Lọc chờ duyệt
                  </button>
                </div>
              )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="Tổng" value={stats.total} icon="inventory_2" accentColor="emerald" />
              {mode === 'warehouse' && isWhStaff ? (
                <>
                  <StatsCard title="Đã đến kho" value={stats.arrived} icon="local_shipping" accentColor="primary" />
                  <StatsCard title="Đang nhận" value={stats.receiving} icon="input" accentColor="orange" />
                </>
              ) : (
                <StatsCard title="Chờ duyệt" value={stats.pending} icon="pending" accentColor="primary" />
              )}
              {!(mode === 'warehouse' && isWhStaff) && (
                <StatsCard title="Đang nhận" value={stats.receiving} icon="input" accentColor="orange" />
              )}
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
                aria-label="Lọc trạng thái nhập kho"
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
