import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { RequestDetailModal } from '../../components/ui/modal/RequestDetailModal'
import { RentalOnboardingWizard } from '../../components/ui/modal/RentalOnboardingWizard'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { ApiError } from '../../api/client'
import * as rentalRequestsApi from '../../api/rentalRequests'
import { fetchGuestAccountAlerts, fetchWhPendingInboundAlerts, fetchWhPendingRentalAlerts, type GuestAccountAlerts, type WhPendingInboundAlerts, type WhPendingRentalAlerts } from '../../api/adminNotifications'
import * as tenantsApi from '../../api/tenants'
import * as warehousesApi from '../../api/warehouses'
import { rentalRequestToRow, type RentalRequestRow } from '../../mappers'
import { CONTRACT_TYPE_LABELS, type ContractTypeValue } from '../../data/contractTypes'
import {
  rentalRequestStatusClass,
  rentalRequestStatusLabel,
} from '../../data/rentalRequestStatus'
import { useAuth } from '../../auth/AuthContext'
import { resolveClaimWarehouseId as resolveClaimWh } from '../../utils/warehouseRegion'
import type { OnboardingOperator } from '../../components/ui/modal/RentalOnboardingWizard'

type Status = 'pending' | 'approved' | 'rejected'

export const RequestManagement = () => {
  const { user: currentUser } = useAuth()
  const [requests, setRequests] = useState<RentalRequestRow[]>([])
  const [warehouses, setWarehouses] = useState<Awaited<ReturnType<typeof warehousesApi.listWarehouses>>['items']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [modal, setModal] = useState<{ open: boolean; data?: RentalRequestRow }>({ open: false })
  const [wizard, setWizard] = useState<{ open: boolean; data?: RentalRequestRow }>({ open: false })
  const [alert, setAlert] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
  })
  const [notifyBusy, setNotifyBusy] = useState(false)
  const [guestAlerts, setGuestAlerts] = useState<GuestAccountAlerts | null>(null)
  const [whPendingAlerts, setWhPendingAlerts] = useState<WhPendingRentalAlerts | null>(null)
  const [whInboundAlerts, setWhInboundAlerts] = useState<WhPendingInboundAlerts | null>(null)

  const operator: OnboardingOperator = useMemo(
    () => ({
      role: currentUser?.role ?? 'SYSTEM_ADMIN',
      warehouseId: currentUser?.warehouseId,
      warehouseName: undefined,
    }),
    [currentUser]
  )

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const whId = currentUser?.warehouseId
      const isWhAdmin = currentUser?.role === 'WH_ADMIN' && whId

      let rentalItems: Awaited<ReturnType<typeof rentalRequestsApi.listRentalRequests>>['items']
      if (isWhAdmin) {
        const [inbox, mine] = await Promise.all([
          rentalRequestsApi.listRentalRequests({
            warehouseId: whId,
            regionMatch: true,
            includeProductLines: true,
            limit: 100,
          }),
          rentalRequestsApi.listRentalRequests({
            warehouseId: whId,
            includeProductLines: true,
            limit: 100,
          }),
        ])
        const byId = new Map<string, (typeof inbox.items)[0]>()
        for (const r of [...inbox.items, ...mine.items]) {
          byId.set(r.rentalRequestId, r)
        }
        rentalItems = [...byId.values()]
      } else {
        const res = await rentalRequestsApi.listRentalRequests({
          includeProductLines: true,
          limit: 100,
        })
        rentalItems = res.items
      }

      const [{ items: warehouseItems }, { items: tenantItems }] = await Promise.all([
        warehousesApi.listWarehouses({ limit: 100 }),
        tenantsApi.listTenants({ limit: 100 }),
      ])

      const scopedWarehouses = isWhAdmin
        ? warehouseItems.filter((w) => w.warehouseId === whId)
        : warehouseItems
      setWarehouses(scopedWarehouses)
      const whMap = new Map(warehouseItems.map((w) => [w.warehouseId, w.warehouseName]))
      const tenantMap = new Map(tenantItems.map((t) => [t.tenantId, t]))
      setRequests(rentalItems.map((r) => rentalRequestToRow(r, whMap, tenantMap)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được yêu cầu thuê')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.role, currentUser?.warehouseId])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  useEffect(() => {
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      void fetchGuestAccountAlerts()
        .then(setGuestAlerts)
        .catch(() => setGuestAlerts(null))
    }
    if (currentUser?.role === 'WH_ADMIN') {
      void fetchWhPendingRentalAlerts()
        .then(setWhPendingAlerts)
        .catch(() => setWhPendingAlerts(null))
      void fetchWhPendingInboundAlerts()
        .then(setWhInboundAlerts)
        .catch(() => setWhInboundAlerts(null))
    }
  }, [currentUser?.role, requests.length])

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch =
        r.customer.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'all' || r.status === filter
      return matchSearch && matchFilter
    })
  }, [requests, search, filter])

  const pageSize = 4
  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedRequests = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filter])

  const resolveClaimWarehouseId = (row: RentalRequestRow) => {
    if (currentUser?.role === 'WH_ADMIN' && currentUser.warehouseId) {
      if (row.warehouseId && row.warehouseId !== currentUser.warehouseId) {
        throw new Error('Yêu cầu đã được kho khác trong khu vực nhận trước')
      }
      return currentUser.warehouseId
    }
    return resolveClaimWh(warehouses, row.city, row.district, row.warehouseId)
  }

  const operatorWithWhName: OnboardingOperator = useMemo(() => {
    const wh = warehouses.find((w) => w.warehouseId === operator.warehouseId)
    return { ...operator, warehouseName: wh?.warehouseName }
  }, [operator, warehouses])

  const canOnboard = (r: RentalRequestRow) =>
    currentUser?.role === 'WH_ADMIN' &&
    (r.apiStatus === 'PENDING' ||
      r.apiStatus === 'UNDER_REVIEW' ||
      r.apiStatus === 'APPROVED')

  const contractTypeLabel = (r: RentalRequestRow) => {
    const ct = r.contractType as ContractTypeValue | undefined
    if (!ct) return '—'
    return CONTRACT_TYPE_LABELS[ct] ?? ct
  }

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading} text="Đang tải yêu cầu..." />
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />
        <div className="relative z-10 p-8">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
            {error && (
              <InlineAlert message={error} onDismiss={() => setError('')} />
            )}
            {currentUser?.role === 'SYSTEM_ADMIN' &&
              guestAlerts &&
              guestAlerts.guestWithoutAccountCount > 0 && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 leading-relaxed flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-300 shrink-0">person_add</span>
                    <p>
                      Có <strong>{guestAlerts.pendingGuestCount}</strong> guest mới gửi yêu cầu thuê
                      {guestAlerts.approvedAwaitingAccountCount > 0 && (
                        <>
                          {' '}
                          và <strong>{guestAlerts.approvedAwaitingAccountCount}</strong> đã duyệt cần
                          cấp Tenant Admin
                        </>
                      )}
                      . Vào <strong>Quản lý Tài khoản</strong> để tạo tài khoản sau khi xử lý yêu
                      cầu.
                    </p>
                  </div>
                  <Link
                    to="/admin/accounts"
                    className="shrink-0 rounded-lg border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-xs font-semibold text-amber-100 no-underline hover:bg-amber-400/25"
                  >
                    Cấp tài khoản
                  </Link>
                </div>
              )}
            {currentUser?.role === 'WH_ADMIN' &&
              whPendingAlerts &&
              whPendingAlerts.pendingCount > 0 && (
                <div className="flex flex-col gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined shrink-0 text-amber-300">
                      notifications_active
                    </span>
                    <p>
                      Có <strong>{whPendingAlerts.pendingCount}</strong> yêu cầu thuê chưa duyệt
                      trong vùng{' '}
                      <strong>
                        {whPendingAlerts.district}, {whPendingAlerts.city}
                      </strong>
                      . Mở onboarding để duyệt và claim cho kho bạn.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilter('pending')}
                    className="shrink-0 rounded-lg border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/25"
                  >
                    Lọc chờ duyệt
                  </button>
                </div>
              )}
              {currentUser?.role === 'WH_ADMIN' &&
                whInboundAlerts &&
                whInboundAlerts.pendingCount > 0 && (
                <div className="flex flex-col gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined shrink-0 text-amber-300">
                      inventory_2
                    </span>
                    <p>
                      Có <strong>{whInboundAlerts.pendingCount}</strong> yêu cầu nhập kho chờ duyệt
                      {whInboundAlerts.warehouseName ? (
                        <>
                          {' '}
                          tại <strong>{whInboundAlerts.warehouseName}</strong>
                        </>
                      ) : null}
                      .
                    </p>
                  </div>
                  <Link
                    to="/admin/inbound"
                    className="shrink-0 rounded-lg border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-xs font-semibold text-amber-100 no-underline hover:bg-amber-400/25"
                  >
                    Xem nhập kho
                  </Link>
                </div>
              )}
              {currentUser?.role === 'WH_ADMIN' && currentUser.warehouseId && (
              <p className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">
                Hộp thư vùng <strong>{operatorWithWhName.warehouseName ?? 'kho của bạn'}</strong>: yêu cầu
                chưa claim trong cùng quận/thành phố. Duyệt = claim cho kho bạn — kho khác cùng vùng cạnh tranh,
                ai duyệt trước nhận.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard title="Tổng" value={stats.total} icon="description" accentColor="emerald" />
              <StatsCard title="Chờ duyệt" value={stats.pending} icon="pending" accentColor="primary" />
              <StatsCard title="Đã duyệt" value={stats.approved} icon="check" accentColor="orange" />
              <StatsCard title="Từ chối" value={stats.rejected} icon="close" accentColor="purple" />
            </div>

            <section className="glass-panel rounded-xl border border-white/5 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-lg font-bold text-white">QUẢN LÝ YÊU CẦU</h3>
                <div className="flex gap-3">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm yêu cầu..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <select
                    title="Lọc trạng thái yêu cầu"
                    aria-label="Lọc trạng thái yêu cầu"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as Status | 'all')}
                    className="px-3 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm"
                  >
                    <option value="all">Tất cả</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Từ chối</option>
                    <option value="pending">Chờ duyệt</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-[#131b29] text-xs uppercase text-slate-400 border-b border-white/5">
                      <th className="p-3">Mã</th>
                      <th>Khách hàng</th>
                      <th>Khu vực</th>
                      <th>Loại HĐ</th>
                      <th>Kho</th>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedRequests.map((r) => (
                      <tr key={r.rentalRequestId}>
                        <td className="p-3 font-mono text-cyan-400 text-xs">{r.id}</td>
                        <td>{r.customer}</td>
                        <td>
                          {r.district}, {r.city}
                        </td>
                        <td className="text-xs">{contractTypeLabel(r)}</td>
                        <td>{r.warehouse}</td>
                        <td>
                          {r.startDate} → {r.endDate}
                        </td>
                        <td>
                          <span
                            className={`rounded px-2 py-1 text-xs ${rentalRequestStatusClass(r.apiStatus)}`}
                          >
                            {rentalRequestStatusLabel(r.apiStatus)}
                          </span>
                        </td>
                        <td className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setModal({ open: true, data: r })}
                            className="hover:bg-white/10 rounded p-1"
                            title="Xem"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                          {canOnboard(r) && (
                            <button
                              type="button"
                              onClick={() => setWizard({ open: true, data: r })}
                              className="hover:bg-cyan-400/10 rounded px-2 py-1 text-xs font-bold text-cyan-400"
                            >
                              Xử lý
                            </button>
                          )}
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

      {modal.open && modal.data && (
        <RequestDetailModal
          data={modal.data}
          canProcess={currentUser?.role === 'WH_ADMIN'}
          canNotifyGuest={currentUser?.role === 'SYSTEM_ADMIN'}
          notifyBusy={notifyBusy}
          onClose={() => setModal({ open: false })}
          onNotifyGuest={async (message) => {
            if (!modal.data) return
            setNotifyBusy(true)
            try {
              await rentalRequestsApi.updateRentalRequest(modal.data.rentalRequestId, {
                status: 'UNDER_REVIEW',
                reviewNote: message,
              })
              await loadRequests()
              setModal((prev) =>
                prev.data
                  ? {
                      ...prev,
                      data: {
                        ...prev.data,
                        apiStatus: 'UNDER_REVIEW',
                        status: 'pending',
                        reviewNote: message,
                      },
                    }
                  : prev
              )
              setAlert({
                open: true,
                type: 'success',
                message: 'Đã lưu thông báo — guest tra cứu mã RR sẽ thấy nội dung.',
              })
            } catch (err) {
              setAlert({
                open: true,
                type: 'error',
                message: err instanceof ApiError ? err.message : 'Không lưu được thông báo',
              })
            } finally {
              setNotifyBusy(false)
            }
          }}
          onStartOnboarding={() => {
            const data = modal.data!
            setModal({ open: false })
            setWizard({ open: true, data })
          }}
        />
      )}

      {wizard.open && wizard.data && (
        <RentalOnboardingWizard
          row={wizard.data}
          warehouses={warehouses}
          operator={operatorWithWhName}
          resolveWarehouseId={resolveClaimWarehouseId}
          onClose={() => setWizard({ open: false })}
          onComplete={async () => {
            await loadRequests()
            setAlert({ open: true, type: 'success', message: 'Hoàn tất onboarding tenant!' })
          }}
        />
      )}

      {alert.open && (
        <AlertModal
          title="Thông báo"
          type={alert.type ?? 'success'}
          message={alert.message}
          onClose={() => setAlert({ open: false, message: '' })}
        />
      )}
    </div>
  )
}
