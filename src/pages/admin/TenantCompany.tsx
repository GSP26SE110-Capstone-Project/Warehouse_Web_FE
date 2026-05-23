import { useState, useMemo, useEffect } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { AccountModal } from '../../components/ui/modal/AccountModal'
import { Pagination } from '../../components/ui/Pagination'
import { tenantCompanyApi } from '../../service/tenantCompany'
import type { TenantCompanyResponse, TenantRequest } from '../../types/TenantCompany'
import { TenantCompanyModal } from '../../components/ui/modal/TenantCompany'

export const TenantCompany: React.FC = () => {
  const [search, setSearch] = useState('')
  const [tenants, setTenants] = useState<TenantCompanyResponse[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'SUSPENDED'>('all')
  const [loading, setLoading] = useState(false)

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'view' | 'edit' | 'create'
    data?: TenantCompanyResponse
  }>({ open: false, mode: 'view' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'confirm'
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  /* ================= API GET ALL TENANTS ================= */
  const getTenants = async () => {
    setLoading(true)
    try {
      const response = await tenantCompanyApi.getAll()
      const resData = response.data

      if (resData.data && Array.isArray(resData.data)) {
        setTenants(resData.data)
      } else {
        setTenants([])
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
      setTenants([])
    } finally {
      setLoading(false)
    }
  }

  /* ================= API CREATE/UPDATE ================= */
  const handleSubmit = async (form: TenantRequest) => {
    try {
      if (modal.mode === 'create') {
        const response = await tenantCompanyApi.create(form)
        setTenants([response.data.data, ...tenants])
        setAlert({ open: true, type: 'success', message: 'Tạo đối tác thành công' })
      }

      if (modal.mode === 'edit' && modal.data) {
        const response = await tenantCompanyApi.update(modal.data.tenantId, form)

        const updated = tenants.map((c) =>
          c.tenantId === modal.data!.tenantId ? response.data.data : c
        )

        setTenants(updated)
        setAlert({ open: true, type: 'success', message: 'Cập nhật thành công' })
      }

      setModal({ ...modal, open: false })
      getTenants()
    } catch (error) {
      setAlert({ open: true, type: 'confirm', message: 'Có lỗi xảy ra khi cập nhật đối tác' })
    }
  }
  /* ================= API BLOCK ================= */
  const handleDelete = async (tenantId: string) => {
    try {
      await tenantCompanyApi.delete(tenantId);

      const updated = tenants.filter((c) => c.tenantId !== tenantId);
      setTenants(updated);

      setAlert({
        open: true,
        type: 'success',
        message: 'Xóa đối tác thành công',
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      setAlert({
        open: true,
        type: 'confirm',
        message: 'Có lỗi xảy ra khi xóa đối tác'
      });
    }
  };
       
  /* ================= FILTER ================= */
  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => {
      const matchSearch =
        tenant.companyName?.toLowerCase().includes(search?.toLowerCase()) ||
        tenant.contactPhone?.toLowerCase().includes(search?.toLowerCase())

      const matchRole = statusFilter === 'all' || tenant.status === statusFilter

      return matchSearch && matchRole
    })
  }, [search, statusFilter, tenants])

  /* ================= STATUS COLORS ================= */
  const statusColors: Record<TenantCompanyResponse['status'], { label: string; className: string }> = {
    ACTIVE: { label: 'Hoạt động', className: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' },
    SUSPENDED: { label: 'Bị khóa', className: 'bg-orange-400/10 text-orange-400 ring-orange-400/20' },
  }
  /* ================= PAGINATION ================= */
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const totalItems = filteredTenants.length
  const totalPages = Math.ceil(totalItems / pageSize)

  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  useEffect(() => {
    getTenants()
  }, [])

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">

      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 z-0 bg-[#0b101a]/90 backdrop-blur-sm" />

        <div className="relative z-10 flex-1 p-6">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
              <StatsCard title="Tổng đối tác" value={tenants.length} icon="group" accentColor="emerald" />
              <StatsCard title="Đang hoạt động" value={tenants.filter(t => t.status === 'ACTIVE').length} icon="verified_user" accentColor="primary" />
              <StatsCard title="Bị khóa" value={tenants.filter(t => t.status === 'SUSPENDED').length} icon="block" accentColor="orange" />
            </div>

            {/* Table */}
            <section className="glass-panel flex flex-col overflow-hidden rounded-xl border border-white/5">

              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-5">
                <h3 className="text-lg font-bold tracking-wide text-white">
                  QUẢN LÝ TÀI KHOẢN
                </h3>

                <div className="flex items-center gap-3">

                  {/* Search */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên, email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'ACTIVE' | 'SUSPENDED')}
                    className="px-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="SUSPENDED">Bị khóa</option>
                  </select>
                   
                  <button
                    onClick={() => setModal({ open: true, mode: 'create' })}

                    className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-black">
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    Thêm công ty
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#131b29] text-xs uppercase text-slate-400">
                      <th className="px-6 py-3">Họ và tên</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Số điện thoại</th>
                      <th className="px-6 py-3">Trạng thái</th>
                      <th className="px-6 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {paginatedTenants.length > 0 ? (
                      paginatedTenants.map((tenant) => (
                        <tr key={tenant.tenantId} >
                          <td className="px-6 py-3 text-white">{tenant.companyName}</td>
                          <td className="px-6 py-3 text-slate-400">{tenant.contactEmail}</td>
                          <td className="px-6 py-3 text-slate-400">{tenant.contactPhone}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors[tenant.status].className}`}>
                              {statusColors[tenant.status].label}
                            </span>
                          </td>

                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100">
                              <button
                                onClick={() => setModal({ open: true, mode: 'view', data: tenant })}
                                className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              <button
                                onClick={() => setModal({ open: true, mode: 'edit', data: tenant })}
                                className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                onClick={() =>
                                  setAlert({
                                    open: true,
                                    type: 'confirm',
                                    message: 'Bạn có chắc muốn khóa tài khoản?',
                                    onConfirm: () => handleDelete(tenant.tenantId),
                                  })
                                }
                                className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined text-lg">block</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-slate-400">
                          Không tìm thấy tài khoản nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 bg-[#131b29] px-6 py-2">
                <p className="font-mono text-xs text-slate-400">
                  Showing <span className="text-white">{start}-{end}</span> of{' '}
                  <span className="text-white">{totalItems}</span> items
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
      {/* Modal */}
      {modal.open && (
        <TenantCompanyModal
          mode={modal.mode}
          data={modal.data}
          onClose={() => setModal({ ...modal, open: false })}
          onSubmit={handleSubmit}
        />

      )}

      {/* Alert */}
      {alert.open && (
        <AlertModal
          title="Thông báo"
          message={alert.message}
          type={alert.type}
          onConfirm={alert.onConfirm}
          onClose={() => setAlert({ ...alert, open: false })}
        />
      )}
    </div>
  )
}