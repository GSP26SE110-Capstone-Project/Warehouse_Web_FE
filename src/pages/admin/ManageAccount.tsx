import { useState, useMemo, useEffect } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { AccountModal } from '../../components/ui/modal/AccountModal'
import type { AccountResponse, AccountRequest } from '../../types/Account'
import { Pagination } from '../../components/ui/Pagination'
import { accountApi } from '../../service/accountApi'

export const AccountManagement: React.FC = () => {
  const [search, setSearch] = useState('')
  const [accounts, setAccounts] = useState<AccountResponse[]>([])
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'warehouse_staff' | 'tenant_admin'>('all')
  const [loading, setLoading] = useState(false)

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'view' | 'edit' | 'create'
    data?: AccountResponse
  }>({ open: false, mode: 'view' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'confirm'
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  // API get all accounts
  const getAccounts = async () => {
    setLoading(true)
    try {
      const response = await accountApi.getAll()
      const data = response.data
      setAccounts(data)
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (form: AccountRequest) => {
    try {
      if (modal.mode === 'create') {
        const response = await accountApi.create(form); // Gọi API POST
        setAccounts([response.data, ...accounts]);
        setAlert({ open: true, type: 'success', message: 'Tạo tài khoản thành công' });
      }

      if (modal.mode === 'edit' && modal.data) {
        const response = await accountApi.update(modal.data.userId, form); // Gọi API PUT
        const updated = accounts.map((c) =>
          c.userId === modal.data!.userId ? response.data : c
        );
        setAccounts(updated);
        setAlert({ open: true, type: 'success', message: 'Cập nhật thành công' });
      }
    } catch (error) {
      // Xử lý lỗi alert ở đây
      setAlert({ open: true, type: 'confirm', message: 'Có lỗi xảy ra khi cập nhật tài khoản' });
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await accountApi.delete(userId);
      setAccounts(accounts.filter((c) => c.userId !== userId));
      setAlert({
        open: true,
        type: 'success',
        message: 'Khóa tài khoản thành công',
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      setAlert({
        open: true,
        type: 'confirm',
        message: 'Có lỗi xảy ra khi khóa tài khoản'
      });
    }
  };


  /* ================= FILTER ================= */
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchSearch =
        acc.fullName.toLowerCase().includes(search.toLowerCase()) ||
        acc.email.toLowerCase().includes(search.toLowerCase()) ||
        acc.userId.toLowerCase().includes(search.toLowerCase())

      const matchRole =
        roleFilter === 'all'
          ? true
          : roleFilter === 'admin'
            ? acc.role === 'admin'
            : roleFilter === 'warehouse_staff'
              ? acc.role === 'warehouse_staff'
              : acc.role === 'tenant_admin'

      return matchSearch && matchRole
    })
  }, [search, roleFilter, accounts])

  const statusColors: Record<AccountResponse['status'], { label: string; className: string }> = {
    active: { label: 'Hoạt động', className: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' },
    inactive: { label: 'Không hoạt động', className: 'bg-gray-400/10 text-gray-400 ring-gray-400/20' },
    suspended: { label: 'Bị khóa', className: 'bg-orange-400/10 text-orange-400 ring-orange-400/20' }
  }

  const roleColors: Record<AccountResponse['role'], { label: string; className: string }> = {
    admin: { label: 'Quản trị viên', className: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' },
    warehouse_staff: { label: 'Nhân viên kho', className: 'bg-orange-400/10 text-orange-400 ring-orange-400/20' },
    tenant_admin: { label: 'Người thuê', className: 'bg-blue-400/10 text-blue-400 ring-blue-400/20' }
  }
  /* ================= PAGINATION ================= */
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const totalItems = filteredAccounts.length
  const totalPages = Math.ceil(totalItems / pageSize)

  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  useEffect(() => {
    getAccounts()
  }, [])

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">

      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 z-0 bg-[#0b101a]/90 backdrop-blur-sm" />

        <div className="relative z-10 flex-1 p-6">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
              <StatsCard title="Tổng tài khoản" value={accounts.length} icon="group" accentColor="emerald" />
              <StatsCard title="Đang hoạt động" value={accounts.filter(a => a.status === 'active').length} icon="verified_user" accentColor="primary" />
              <StatsCard title="Bị khóa" value={accounts.filter(a => a.status === 'suspended').length} icon="block" accentColor="orange" />
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
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as AccountResponse['role'] | 'all')}
                    className="px-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="admin">Quản trị viên</option>
                    <option value="warehouse_staff">Quản lý kho</option>
                    <option value="tenant_admin">Người thuê</option>
                  </select>
                  <button
                    onClick={() => setModal({ open: true, mode: 'create' })}

                    className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-black">
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    Thêm tài khoản
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
                      <th className="px-6 py-3">Vai trò</th>
                      <th className="px-6 py-3">Trạng thái</th>
                      <th className="px-6 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {paginatedAccounts.length > 0 ? (
                      paginatedAccounts.map((acc) => (
                        <tr key={acc.userId} >
                          <td className="px-6 py-3 text-white">{acc.fullName}</td>
                          <td className="px-6 py-3 text-slate-400">{acc.email}</td>
                          <td className="px-6 py-3 text-slate-400">{acc.phone}</td>

                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${roleColors[acc.role].className}`}>
                              {roleColors[acc.role].label}
                            </span>
                          </td>

                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors[acc.status].className}`}>
                              {statusColors[acc.status].label}
                            </span>
                          </td>

                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100">
                              <button
                                onClick={() => setModal({ open: true, mode: 'view', data: acc })}
                                className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              <button
                                onClick={() => setModal({ open: true, mode: 'edit', data: acc })}
                                className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                onClick={() =>
                                  setAlert({
                                    open: true,
                                    type: 'confirm',
                                    message: 'Bạn có chắc muốn khóa tài khoản?',
                                    onConfirm: () => handleDelete(acc.userId),
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
        <AccountModal
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