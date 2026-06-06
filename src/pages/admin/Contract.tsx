import { useState, useMemo, useEffect, useCallback } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import {
  ContractModal,
  type ContractFormPayload,
} from '../../components/ui/modal/ContractModal'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import type { Contract } from '../../types/Contract'
import { Pagination } from '../../components/ui/Pagination'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { ApiError } from '../../api/client'
import * as contractsApi from '../../api/contracts'
import * as warehousesApi from '../../api/warehouses'
import * as tenantsApi from '../../api/tenants'
import { contractToRow } from '../../mappers'
import { CONTRACT_TYPE_LABELS, type ContractTypeValue } from '../../data/contractTypes'
import { ContractStatusBadge } from '../../components/contracts/ContractStatusBadge'
import { useAuth } from '../../auth/AuthContext'

export const ContractManagement: React.FC = () => {
  const { user } = useAuth()
  const scopedWarehouseId =
    user?.role === 'WH_ADMIN' ? (user.warehouseId ?? undefined) : undefined

  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'edit' | 'view'
    contractId?: string
  }>({ open: false, mode: 'view' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'error' | 'warning' | 'confirm'
    message: string
    title?: string
  }>({ open: false, type: 'success', message: '' })

  const loadContracts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [{ items }, { items: warehouses }, { items: tenants }] = await Promise.all([
        contractsApi.listContracts({
          limit: 100,
          ...(scopedWarehouseId ? { warehouseId: scopedWarehouseId } : {}),
        }),
        warehousesApi.listWarehouses({ limit: 100 }),
        tenantsApi.listTenants({ limit: 100 }),
      ])
      const whMap = new Map(warehouses.map((w) => [w.warehouseId, w.warehouseName]))
      const tenantMap = new Map(tenants.map((t) => [t.tenantId, t.companyName]))
      setContracts(items.map((c) => contractToRow(c, whMap, tenantMap)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được hợp đồng')
    } finally {
      setLoading(false)
    }
  }, [scopedWarehouseId])

  useEffect(() => {
    loadContracts()
  }, [loadContracts])

  const handleSubmit = async (contractId: string, form: ContractFormPayload) => {
    try {
      await contractsApi.updateContract(contractId, {
        contractName: form.contractName,
        startDate: form.startDate,
        endDate: form.endDate,
        estimatedTotalAmount: form.estimatedTotalAmount ?? undefined,
        status: form.status,
      })
      setAlert({ open: true, type: 'success', message: 'Cập nhật hợp đồng thành công' })
      await loadContracts()
    } catch (err) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Có lỗi xảy ra',
        message: err instanceof ApiError ? err.message : 'Cập nhật thất bại',
      })
      throw err
    }
  }

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredContracts = useMemo(() => {
    return contracts.filter((r) => {
      const matchSearch =
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.warehouse.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'All' || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [contracts, search, statusFilter])

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4
  const totalItems = filteredContracts.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const contractTypeLabel = (c: Contract) => {
    const ct = c.contractType as ContractTypeValue | undefined
    if (!ct) return '—'
    return CONTRACT_TYPE_LABELS[ct] ?? ct
  }

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading} text="Đang tải hợp đồng..." />
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />
        <div className="relative z-10 p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            {error && (
              <InlineAlert message={error} onDismiss={() => setError('')} />
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <StatsCard title="Tổng hợp đồng" value={contracts.length} icon="description" accentColor="emerald" />
              <StatsCard
                title="Đang hoạt động"
                value={contracts.filter((c) => c.status === 'Active').length}
                icon="check_circle"
                accentColor="primary"
              />
              <StatsCard
                title="Hết hạn"
                value={contracts.filter((c) => c.status === 'Expired').length}
                icon="cancel"
                accentColor="purple"
              />
            </div>

            <section className="glass-panel flex flex-col overflow-hidden rounded-xl border border-white/5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-5">
                <h3 className="text-lg font-bold text-white">QUẢN LÝ HỢP ĐỒNG</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Tìm mã, khách, kho..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#1a2333] px-4 py-2 text-sm text-white"
                  />
                  <select
                    aria-label="Lọc trạng thái"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm"
                  >
                    <option value="All">Tất cả</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#131b29] text-xs uppercase text-slate-400">
                      <th className="px-6 py-4">Mã HĐ</th>
                      <th className="px-6 py-4">Khách hàng</th>
                      <th className="px-6 py-4">Kho</th>
                      <th className="px-6 py-4">Loại</th>
                      <th className="px-6 py-4">Thời hạn</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Giá trị</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedContracts.map((c) => (
                      <tr key={c.contractId} className="hover:bg-white/5">
                        <td className="px-6 py-4 font-mono text-cyan-400">{c.id}</td>
                        <td className="px-6 py-4">{c.customerName}</td>
                        <td className="px-6 py-4">{c.warehouse}</td>
                        <td className="px-6 py-4 text-xs">{contractTypeLabel(c)}</td>
                        <td className="px-6 py-4 text-xs">
                          {c.startDate} → {c.endDate}
                        </td>
                        <td className="px-6 py-4">
                          <ContractStatusBadge status={c.apiStatus ?? c.status} />
                        </td>
                        <td className="px-6 py-4 text-emerald-400">
                          {c.price.toLocaleString('vi-VN')}₫
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setModal({ open: true, mode: 'view', contractId: c.contractId })
                              }
                              className="rounded p-1 hover:bg-white/10"
                              title="Xem chi tiết HĐ"
                            >
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setModal({ open: true, mode: 'edit', contractId: c.contractId })
                              }
                              className="rounded p-1 hover:bg-white/10"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 bg-[#131b29] px-6 py-4">
                <p className="font-mono text-xs text-slate-400">
                  Showing <span className="text-white">{start}-{end}</span> of{' '}
                  <span className="text-white">{totalItems}</span>
                </p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </section>
          </div>
        </div>
      </main>

      {modal.open && modal.contractId && (
        <ContractModal
          mode={modal.mode}
          contractId={modal.contractId}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          onSubmit={(form) => handleSubmit(modal.contractId!, form)}
        />
      )}

      {alert.open && (
        <AlertModal
          title={alert.title ?? 'Thông báo'}
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((a) => ({ ...a, open: false, message: '' }))}
        />
      )}
    </div>
  )
}
