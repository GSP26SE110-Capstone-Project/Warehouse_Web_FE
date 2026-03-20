import { useState, useMemo } from 'react'
import { StatsCard } from '../../components/ui/StatCard'

type Account = {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Manager' | 'Staff'
  roleClassName: string
  status: 'Active' | 'Inactive' | 'Suspended'
  statusClassName: string
  lastLogin: string
  createdAt: string
  striped?: boolean
}

const accounts: Account[] = [
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
]

function getStatusDot(status: Account['status']) {
  if (status === 'Suspended') return 'bg-orange-400'
  if (status === 'Inactive') return 'bg-gray-400'
  return 'bg-emerald-400'
}

export const AccountManagement: React.FC = () => {
  const [search, setSearch] = useState('')

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc =>
      acc.name.toLowerCase().includes(search.toLowerCase()) ||
      acc.email.toLowerCase().includes(search.toLowerCase()) ||
      acc.id.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 pb-15">

      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 z-0 bg-[#0b101a]/90 backdrop-blur-sm" />

        <div className="relative z-10 flex-1 p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard title="Tổng tài khoản" value={124} icon="group" accentColor="primary" trend={{ direction: 'up', percentage: 5.2, text: 'this month' }} />
              <StatsCard title="Đang hoạt động" value={98} icon="verified_user" accentColor="primary" trend={{ direction: 'up', percentage: 2.1, text: 'active users' }} />
              <StatsCard title="Bị khóa" value={6} icon="block" accentColor="orange" trend={{ direction: 'down', percentage: 0, text: 'need review' }} />
              <StatsCard title="Admin" value={4} icon="admin_panel_settings" accentColor="primary" trend={{ direction: 'up', percentage: 0, text: 'roles' }} />
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

                  <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a2333] px-4 py-2 text-sm text-slate-300 hover:text-white">
                    <span className="material-symbols-outlined text-lg">filter_list</span>
                    Lọc
                  </button>

                  <button className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-black">
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
                    {filteredAccounts.length > 0 ? (
                      filteredAccounts.map((acc) => (
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
                              <button className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button className="p-1.5 hover:bg-white/10 rounded">
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

              {/* Footer */}
              <div className="flex justify-between items-center border-t border-white/5 px-6 py-4 text-xs text-slate-400">
                <span>
                  Showing {filteredAccounts.length} of {accounts.length} accounts
                </span>
              </div>

            </section>
          </div>
        </div>
      </main>
    </div>
  )
}