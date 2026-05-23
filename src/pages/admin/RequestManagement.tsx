import { useState, useMemo, useEffect, useCallback } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { RequestDetailModal } from '../../components/ui/modal/RequestDetailModal'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { ContractModal } from '../../components/ui/modal/ContractModal'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { ApiError } from '../../api/client'
import * as rentalRequestsApi from '../../api/rentalRequests'
import * as contractsApi from '../../api/contracts'
import * as tenantsApi from '../../api/tenants'
import * as warehousesApi from '../../api/warehouses'
import { rentalRequestToRow, type RentalRequestRow } from '../../mappers'

type Status = 'pending' | 'approved' | 'rejected'

export const RequestManagement = () => {
  const [requests, setRequests] = useState<RentalRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [modal, setModal] = useState<{ open: boolean; data?: RentalRequestRow }>({ open: false })
  const [contractModal, setContractModal] = useState<{ open: boolean; data?: RentalRequestRow }>({
    open: false,
  })
  const [alert, setAlert] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [{ items: rentalItems }, { items: warehouseItems }] = await Promise.all([
        rentalRequestsApi.listRentalRequests({ limit: 100 }),
        warehousesApi.listWarehouses({ limit: 100 }),
      ])
      const whMap = new Map(warehouseItems.map((w) => [w.warehouseId, w.warehouseName]))
      setRequests(rentalItems.map((r) => rentalRequestToRow(r, whMap)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được yêu cầu thuê')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

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

  const updateStatus = async (rentalRequestId: string, status: 'APPROVED' | 'REJECTED') => {
    await rentalRequestsApi.updateRentalRequest(rentalRequestId, { status })
    await loadRequests()
  }

  const resolveTenantId = async (row: RentalRequestRow) => {
    const { items } = await tenantsApi.listTenants({ limit: 100 })
    const found = items.find(
      (t) => t.companyName.toLowerCase() === row.customer.toLowerCase()
    )
    if (found) return found.tenantId

    const created = await tenantsApi.createTenant({
      companyName: row.customer,
      contactEmail: row.customerEmail !== '—' ? row.customerEmail : undefined,
      companyCode: row.customer.replace(/\s+/g, '-').slice(0, 20).toUpperCase(),
    })
    return created.tenantId
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
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
                {error}
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
                      <th>Kho</th>
                      <th>Loại</th>
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
                        <td>{r.warehouse}</td>
                        <td>{r.type === 'rent' ? 'Thuê mới' : 'Gia hạn'}</td>
                        <td>
                          {r.startDate} → {r.endDate}
                        </td>
                        <td>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              r.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : r.status === 'approved'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setModal({ open: true, data: r })}
                            className="hover:bg-white/10 rounded p-1"
                          >
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
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
          onClose={() => setModal({ open: false })}
          onApprove={() => {
            setModal({ open: false })
            setContractModal({ open: true, data: modal.data })
          }}
          onReject={async () => {
            try {
              if (modal.data) await updateStatus(modal.data.rentalRequestId, 'REJECTED')
              setModal({ open: false })
              setAlert({ open: true, message: 'Đã từ chối yêu cầu' })
            } catch (err) {
              setAlert({
                open: true,
                message: err instanceof ApiError ? err.message : 'Từ chối thất bại',
              })
            }
          }}
        />
      )}

      {contractModal.open && contractModal.data && (
        <ContractModal
          mode="create"
          data={contractModal.data}
          onClose={() => setContractModal({ open: false })}
          onSubmit={async (form) => {
            try {
              const row = contractModal.data!
              const tenantId = await resolveTenantId(row)
              await contractsApi.createContract({
                tenantId,
                warehouseId: row.warehouseId,
                rentalRequestId: row.rentalRequestId,
                contractType: 'SHARED_STORAGE',
                pricingModel: 'FIXED',
                billingCycle: 'MONTHLY',
                startDate: form.startDate || row.startDate,
                endDate: form.endDate || row.endDate,
                contractName: form.customerName || row.customer,
                estimatedTotalAmount: form.totalValue,
                status: 'DRAFT',
              })
              await updateStatus(row.rentalRequestId, 'APPROVED')
              setAlert({ open: true, message: 'Đã tạo hợp đồng & duyệt yêu cầu!' })
              setContractModal({ open: false })
            } catch (err) {
              setAlert({
                open: true,
                message: err instanceof ApiError ? err.message : 'Tạo hợp đồng thất bại',
              })
            }
          }}
        />
      )}

      {alert.open && (
        <AlertModal title="Thông báo" message={alert.message} onClose={() => setAlert({ open: false, message: '' })} />
      )}
    </div>
  )
}
