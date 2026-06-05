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
import { WhiteStatCard } from '../../components/ui/WhiteStatCard'

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

  // Tính toán rangeStart và rangeEnd dựa trên trang hiện tại và số phần tử lọc được
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalItems)

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((r) => r.status === 'PENDING').length,
      receiving: rows.filter((r) => r.status === 'RECEIVING').length,
      completed: rows.filter((r) => r.status === 'COMPLETED').length,
    }),
    [rows]
  )

  const canCreate = mode === 'tenant' && isTenantAdmin

  return (
    <div className="flex max-w-screen overflow-hidden bg-slate-50 text-slate-800">
      <LoadingOverlay show={loading} text="Đang tải yêu cầu nhập kho..." />
      <main className="relative flex flex-1 flex-col overflow-hidden bg-slate-50/50">
        <div className="relative z-10 p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6">

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {mode === 'tenant' ? 'Yêu cầu nhập kho' : 'Vận hành nhập kho'}
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  {mode === 'tenant'
                    ? 'Tạo và theo dõi đơn nhập hàng (cần hợp đồng ACTIVE)'
                    : 'Duyệt, nhận hàng, putaway và hoàn tất inbound'}
                </p>
              </div>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/new`)}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-cyan-700 active:bg-cyan-800 transition-colors"
                >
                  + Tạo yêu cầu nhập
                </button>
              )}
            </div>

            {error && (
              <InlineAlert message={error} onDismiss={() => setError('')} />
            )}

            {mode === 'tenant' && activeContractCount === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
                Chưa có hợp đồng <strong className="font-bold">ACTIVE</strong> — ký và thanh toán invoice đầu tại{' '}
                <button
                  type="button"
                  onClick={() => navigate('/staff/contracts')}
                  className="font-bold text-cyan-600 underline hover:text-cyan-700"
                >
                  Hợp đồng
                </button>{' '}
                trước khi tạo yêu cầu nhập.
              </div>
            )}

            {mode === 'tenant' && stats.pending > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium">
                  Có <strong className="font-bold">{stats.pending}</strong> phiếu nhập chờ kho duyệt.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('PENDING')
                    setCurrentPage(1)
                  }}
                  className="shrink-0 rounded-lg border border-cyan-300 bg-white px-3 py-1.5 text-xs font-bold text-cyan-700 shadow-sm hover:bg-cyan-100/50 transition-colors"
                >
                  Lọc chờ duyệt
                </button>
              </div>
            )}

            {mode === 'warehouse' &&
              user?.role === 'WH_ADMIN' &&
              stats.pending > 0 && (
                <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined shrink-0 text-amber-600">pending_actions</span>
                    <p className="font-medium">
                      Có <strong className="font-bold">{stats.pending}</strong> yêu cầu nhập kho đang chờ duyệt — mở từng
                      đơn để duyệt hoặc từ chối.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('PENDING')
                      setCurrentPage(1)
                    }}
                    className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm hover:bg-amber-100/50 transition-colors"
                  >
                    Lọc chờ duyệt
                  </button>
                </div>
              )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              <WhiteStatCard title="Tổng" value={stats.total} icon="inventory_2" accentColor="emerald" />
              <WhiteStatCard title="Chờ duyệt" value={stats.pending} icon="pending" accentColor="primary" />
              <WhiteStatCard title="Đang nhận" value={stats.receiving} icon="input" accentColor="orange" />
              <WhiteStatCard title="Hoàn tất" value={stats.completed} icon="check_circle" accentColor="purple" />
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
                className="min-w-[200px] flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <select
                aria-label="Lọc trạng thái nhập kho"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as InboundStatus | 'all')
                  setCurrentPage(1)
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                {(Object.keys(INBOUND_STATUS_LABELS) as InboundStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {INBOUND_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* Bọc toàn bộ Table và vùng Pagination mới vào cùng một card để tạo sự liền mạch */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Mã</th>
                    {mode === 'warehouse' && <th className="px-5 py-3.5 font-bold">Tenant</th>}
                    <th className="px-5 py-3.5 font-bold">Kho</th>
                    <th className="px-5 py-3.5 font-bold">Dự kiến đến</th>
                    <th className="px-5 py-3.5 font-bold">Trạng thái</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginated.map((r) => (
                    <tr
                      key={r.inboundRequestId}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-cyan-700">{r.inboundCode}</td>
                      {mode === 'warehouse' && (
                        <td className="px-5 py-3.5 font-medium">{tenantNames.get(r.tenantId) ?? '—'}</td>
                      )}
                      <td className="px-5 py-3.5 font-medium">{whNames.get(r.warehouseId) ?? '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600">{formatDate(r.expectedArrivalDate)}</td>
                      <td className="px-5 py-3.5">
                        <InboundStatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`${basePath}/${r.inboundRequestId}`)}
                          className="font-bold text-slate-500 hover:text-slate-700 hover:underline"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && !loading && (
                    <tr>
                      <td colSpan={mode === 'warehouse' ? 6 : 5} className="px-5 py-10 text-center font-medium text-slate-400 bg-slate-50/30">
                        Chưa có yêu cầu nhập kho
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
        </div>
      </main>
    </div>
  )
}