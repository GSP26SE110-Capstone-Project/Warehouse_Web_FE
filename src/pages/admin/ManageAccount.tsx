import { useState, useMemo, useEffect } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { AccountModal } from '../../components/ui/modal/AccountModal'
import type { Account } from '../../types/Account'
import { Pagination } from '../../components/ui/Pagination'

/* ================= DATA ================= */
const initialAccounts: Account[] = [
  {
    id: '#ACC-001',
    name: 'Nguyễn Văn A',
    email: 'admin@nexspace.com',
    role: 'Admin',
    roleClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    status: 'Active',
    statusClassName: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    lastLogin: '5m ago',
    createdAt: '2025-01-10',
    striped: true,
  },
  {
    id: '#ACC-002',
    name: 'Trần Thị B',
    email: 'manager@nexspace.com',
    role: 'Manager',
    roleClassName: 'bg-blue-400/10 text-blue-400 ring-blue-400/20',
    status: 'Active',
    statusClassName: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    lastLogin: '20m ago',
    createdAt: '2025-02-15',
  },
  {
    id: '#ACC-003',
    name: 'Lê Văn C',
    email: 'staff@nexspace.com',
    role: 'Staff',
    roleClassName: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
    status: 'Inactive',
    statusClassName: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
    lastLogin: '2 days ago',
    createdAt: '2025-03-01',
    striped: true,
  },
  {
    id: '#ACC-004',
    name: 'Phạm Văn D',
    email: 'user@nexspace.com',
    role: 'Staff',
    roleClassName: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
    status: 'Suspended',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    lastLogin: '1 week ago',
    createdAt: '2025-01-20',
  },
  {
    id: '#ACC-005',
    name: 'Phạm Văn D',
    email: 'user@nexspace.com',
    role: 'Staff',
    roleClassName: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
    status: 'Suspended',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    lastLogin: '1 week ago',
    createdAt: '2025-01-20',
  },
  {
    id: '#ACC-006',
    name: 'Phạm Văn D',
    email: 'user@nexspace.com',
    role: 'Staff',
    roleClassName: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
    status: 'Suspended',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    lastLogin: '1 week ago',
    createdAt: '2025-01-20',
  },
]
/* ================= DATA ================= */


export const AccountManagement: React.FC = () => {
  const [search, setSearch] = useState('')
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'staff'>('all')

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'view' | 'edit' | 'create'
    data?: Account
  }>({ open: false, mode: 'view' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'confirm'
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  const handleSubmit = (form: any) => {
    if (modal.mode === 'create') {
      const newAccount: Account = {
        id: `#ACC-${Math.floor(Math.random() * 1000)}`,
        createdAt: 'now',
        status: 'Pending',
        statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
        ...form,
      }

      setAccounts([newAccount, ...accounts])

      setAlert({
        open: true,
        type: 'success',
        message: 'Tạo tài khoản thành công',
      })
    }

    if (modal.mode === 'edit' && modal.data) {
      const updated = accounts.map((c) =>
        c.id === modal.data!.id ? { ...c, ...form } : c
      )

      setAccounts(updated)

      setAlert({
        open: true,
        type: 'success',
        message: 'Cập nhật thành công',
      })
    }
  }

  const handleDelete = (id: string) => {
    setAccounts(accounts.filter((c) => c.id !== id))

    setAlert({
      open: true,
      type: 'success',
      message: 'Xóa thành công',
    })
  }

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchSearch =
        acc.name.toLowerCase().includes(search.toLowerCase()) ||
        acc.email.toLowerCase().includes(search.toLowerCase()) ||
        acc.id.toLowerCase().includes(search.toLowerCase())

      const matchRole =
        roleFilter === 'all'
          ? true
          : roleFilter === 'admin'
            ? acc.role === 'Admin'
            : roleFilter === 'manager'
              ? acc.role === 'Manager'
              : acc.role === 'Staff'

      return matchSearch && matchRole
    })
  }, [search, roleFilter, accounts])

  /* ================= PAGINATION ================= */

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4

  const totalItems = filteredAccounts.length
  const totalPages = Math.ceil(totalItems / pageSize)

  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, roleFilter])
  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">

      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 z-0 bg-[#0b101a]/90 backdrop-blur-sm" />

        <div className="relative z-10 flex-1 p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatsCard title="Tổng tài khoản" value={124} icon="group" accentColor="emerald" />
              <StatsCard title="Đang hoạt động" value={98} icon="verified_user" accentColor="primary" />
              <StatsCard title="Bị khóa" value={6} icon="block" accentColor="orange" />
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
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="px-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
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
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Tên</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Vai trò</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {paginatedAccounts.length > 0 ? (
                      paginatedAccounts.map((acc) => (
                        <tr key={acc.id} >
                          <td className="px-6 py-4 text-cyan-400 font-mono">{acc.id}</td>
                          <td className="px-6 py-4 text-white">{acc.name}</td>
                          <td className="px-6 py-4 text-slate-400">{acc.email}</td>

                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded ring-1 ${acc.roleClassName}`}>
                              {acc.role}
                            </span>
                          </td>

                          <td className="px-6 py-4 ">
                            <span className={`flex items-center justify-center  gap-1 px-2 py-1 text-xs rounded-full ring-1 ${acc.statusClassName}`}>
                              {acc.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100">
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
                                    message: 'Bạn có chắc muốn xóa?',
                                    onConfirm: () => handleDelete(acc.id),
                                  })
                                }
                                className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined text-lg">delete</span>
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

              <div className="flex items-center justify-between border-t border-white/5 bg-[#131b29] px-6 py-4">
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