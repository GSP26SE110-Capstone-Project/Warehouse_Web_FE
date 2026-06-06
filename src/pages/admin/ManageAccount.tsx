import { useState, useMemo, useEffect, useCallback } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { AccountModal } from '../../components/ui/modal/AccountModal'
import type { Account } from '../../types/Account'
import { Pagination } from '../../components/ui/Pagination'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { ApiError } from '../../api/client'
import * as usersApi from '../../api/users'
import { statusToApiStatus, USER_ROLE_LABEL, userToAccount } from '../../mappers'
import { useAuth } from '../../auth/AuthContext'
import type { AccountFormValues } from '../../components/ui/modal/AccountModal'
import type { UserRole, UserStatus } from '../../api/types'

type AccountRoleFilter = UserRole | 'all'
type AccountStatusFilter = UserStatus | 'all'

function roleFilterOptionsFor(creatorRole?: UserRole): { value: AccountRoleFilter; label: string }[] {
  const all = { value: 'all' as const, label: 'Tất cả vai trò' }
  if (creatorRole === 'WH_ADMIN') {
    return [
      all,
      { value: 'WH_STAFF', label: USER_ROLE_LABEL.WH_STAFF },
      { value: 'WH_TRANSPORTER', label: USER_ROLE_LABEL.WH_TRANSPORTER },
      { value: 'WH_ADMIN', label: USER_ROLE_LABEL.WH_ADMIN },
    ]
  }
  if (creatorRole === 'TENANT_ADMIN') {
    return [
      all,
      { value: 'TENANT_STAFF', label: USER_ROLE_LABEL.TENANT_STAFF },
      { value: 'TENANT_ADMIN', label: USER_ROLE_LABEL.TENANT_ADMIN },
    ]
  }
  return [
    all,
    { value: 'WH_ADMIN', label: USER_ROLE_LABEL.WH_ADMIN },
    { value: 'TENANT_ADMIN', label: USER_ROLE_LABEL.TENANT_ADMIN },
    { value: 'WH_STAFF', label: USER_ROLE_LABEL.WH_STAFF },
    { value: 'WH_TRANSPORTER', label: USER_ROLE_LABEL.WH_TRANSPORTER },
    { value: 'TENANT_STAFF', label: USER_ROLE_LABEL.TENANT_STAFF },
    { value: 'SYSTEM_ADMIN', label: USER_ROLE_LABEL.SYSTEM_ADMIN },
  ]
}

function pageSubtitleFor(creatorRole?: UserRole): string {
  if (creatorRole === 'WH_ADMIN') {
    return 'Tạo và quản lý nhân viên kho (WH_STAFF) và tài xế (WH_TRANSPORTER) trong kho của bạn.'
  }
  if (creatorRole === 'TENANT_ADMIN') {
    return 'Tạo và quản lý nhân viên tenant (TENANT_STAFF) trong brand của bạn.'
  }
  return 'Quản lý tài khoản hệ thống — dùng nút kích hoạt/vô hiệu hóa hoặc chỉnh sửa chi tiết.'
}

const STATUS_FILTER_OPTIONS: { value: AccountStatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Vô hiệu hóa' },
  { value: 'SUSPENDED', label: 'Tạm ngưng' },
  { value: 'BLOCKED', label: 'Bị khóa' },
]

function accountStatusLabel(status: Account['status']) {
  if (status === 'Active') return 'Đang hoạt động'
  if (status === 'Suspended') return 'Tạm ngưng'
  return 'Vô hiệu hóa'
}

export const AccountManagement: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState<AccountRoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>('all')
  const roleFilterOptions = roleFilterOptionsFor(currentUser?.role)
  const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN'
  const canManageAccounts =
    currentUser?.role === 'SYSTEM_ADMIN' ||
    currentUser?.role === 'WH_ADMIN' ||
    currentUser?.role === 'TENANT_ADMIN'

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'view' | 'edit' | 'create'
    data?: Account
  }>({ open: false, mode: 'view' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'error' | 'warning' | 'confirm'
    message: string
    title?: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null)

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Parameters<typeof usersApi.listUsers>[0] = { limit: 100 }
      if (roleFilter !== 'all') params.role = roleFilter
      if (statusFilter !== 'all') params.status = statusFilter
      const { items } = await usersApi.listUsers(params)
      setAccounts(items.map((u, i) => userToAccount(u, i)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách tài khoản')
    } finally {
      setLoading(false)
    }
  }, [roleFilter, statusFilter])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  useEffect(() => {
    if (!roleFilterOptions.some((o) => o.value === roleFilter)) {
      setRoleFilter('all')
    }
  }, [roleFilter, roleFilterOptions])

  const handleSubmit = async (form: AccountFormValues) => {
    try {
      if (modal.mode === 'create') {
        const body: Parameters<typeof usersApi.createUser>[0] = {
          fullName: form.fullName,
          email: form.email.trim(),
          password: form.password,
          role: form.role as UserRole,
          phone: form.phone || undefined,
          status: statusToApiStatus(form.status),
        }

        if (currentUser?.role === 'SYSTEM_ADMIN') {
          if (form.role === 'WH_ADMIN') body.warehouseId = form.warehouseId
          if (form.role === 'TENANT_ADMIN') body.tenantId = form.tenantId
        } else if (currentUser?.role === 'WH_ADMIN') {
          body.warehouseId = currentUser.warehouseId ?? undefined
        } else if (currentUser?.role === 'TENANT_ADMIN') {
          body.tenantId = currentUser.tenantId ?? undefined
        }

        const created = await usersApi.createUser(body)
        setAlert({
          open: true,
          type: 'success',
          message: `Tạo tài khoản thành công.${usersApi.welcomeEmailMessage(created.welcomeEmail)}`,
        })
      }

      if (modal.mode === 'edit' && modal.data) {
        await usersApi.updateUser(modal.data.id, {
          fullName: form.fullName,
          phone: form.phone,
          status: statusToApiStatus(form.status),
        })
        setAlert({ open: true, type: 'success', message: 'Cập nhật thành công' })
      }

      await loadAccounts()
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null
      setAlert({
        open: true,
        type: apiErr?.code === 'ADMIN_HAS_ACTIVE_CONTRACT' ? 'warning' : 'error',
        title:
          apiErr?.code === 'ADMIN_HAS_ACTIVE_CONTRACT' ? 'Không thể vô hiệu hóa' : 'Thông báo',
        message: apiErr?.message ?? 'Thao tác thất bại',
      })
    }
  }

  const handleToggleActive = (acc: Account) => {
    if (!isSystemAdmin) return
    if (acc.id === currentUser?.userId) {
      setAlert({
        open: true,
        type: 'warning',
        title: 'Không thể thực hiện',
        message: 'Bạn không thể tự vô hiệu hóa tài khoản của chính mình.',
      })
      return
    }

    const isActive = acc.apiStatus === 'ACTIVE'
    const nextActive = !isActive
    const actionLabel = nextActive ? 'kích hoạt' : 'vô hiệu hóa'

    setAlert({
      open: true,
      type: 'confirm',
      title: nextActive ? 'Kích hoạt tài khoản' : 'Vô hiệu hóa tài khoản',
      message: `Bạn có chắc muốn ${actionLabel} tài khoản "${acc.name}" (${acc.email})?${
        nextActive ? '' : ' Người dùng sẽ không đăng nhập được cho đến khi được kích hoạt lại.'
      }`,
      onConfirm: async () => {
        setToggleBusyId(acc.id)
        try {
          await usersApi.setUserAccountActive(acc.id, nextActive)
          setAlert({
            open: true,
            type: 'success',
            message: nextActive
              ? `Đã kích hoạt tài khoản ${acc.name}.`
              : `Đã vô hiệu hóa tài khoản ${acc.name}.`,
          })
          await loadAccounts()
        } catch (err) {
          const apiErr = err instanceof ApiError ? err : null
          setAlert({
            open: true,
            type: apiErr?.code === 'ADMIN_HAS_ACTIVE_CONTRACT' ? 'warning' : 'error',
            title:
              apiErr?.code === 'ADMIN_HAS_ACTIVE_CONTRACT'
                ? 'Không thể vô hiệu hóa'
                : 'Có lỗi xảy ra',
            message: apiErr?.message ?? 'Cập nhật trạng thái thất bại',
          })
        } finally {
          setToggleBusyId(null)
        }
      },
    })
  }

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchSearch =
        acc.name.toLowerCase().includes(search.toLowerCase()) ||
        acc.email.toLowerCase().includes(search.toLowerCase())

      return matchSearch
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
  }, [search, roleFilter, statusFilter])
  const activeCount = accounts.filter((a) => a.apiStatus === 'ACTIVE').length

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading} text="Đang tải tài khoản..." />
      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 z-0 bg-[#0b101a]/90 backdrop-blur-sm" />

        <div className="relative z-10 flex-1 p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            {error && (
              <InlineAlert variant="error" message={error} onDismiss={() => setError('')} />
            )}
            <div className="mb-2">
              <p className="text-sm text-slate-400">{pageSubtitleFor(currentUser?.role)}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatsCard title="Tổng tài khoản" value={accounts.length} icon="group" accentColor="emerald" />
              <StatsCard title="Đang hoạt động" value={activeCount} icon="verified_user" accentColor="primary" />
              <StatsCard
                title="Bị khóa / tạm ngưng"
                value={accounts.length - activeCount}
                icon="block"
                accentColor="orange"
              />
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
                    aria-label="Lọc theo vai trò"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as AccountRoleFilter)}
                    className="px-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    {roleFilterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {isSystemAdmin && (
                    <select
                      aria-label="Lọc theo trạng thái"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as AccountStatusFilter)}
                      className="px-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    >
                      {STATUS_FILTER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {canManageAccounts && (
                    <button
                      type="button"
                      onClick={() => setModal({ open: true, mode: 'create' })}
                      className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-black"
                    >
                      <span className="material-symbols-outlined text-lg">person_add</span>
                      Thêm tài khoản
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#131b29] text-xs uppercase text-slate-400">
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
                        <tr key={acc.id}>
                          <td className="px-6 py-4 text-white">{acc.name}</td>
                          <td className="px-6 py-4 text-slate-400">{acc.email}</td>

                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded ring-1 ${acc.roleClassName}`}>
                              {acc.role}
                            </span>
                          </td>

                          <td className="px-6 py-4 ">
                            <span className={`flex items-center justify-center gap-1 px-2 py-1 text-xs rounded-full ring-1 ${acc.statusClassName}`}>
                              {accountStatusLabel(acc.status)}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {isSystemAdmin && acc.id !== currentUser?.userId && (
                                <button
                                  type="button"
                                  title={
                                    acc.apiStatus === 'ACTIVE'
                                      ? 'Vô hiệu hóa tài khoản'
                                      : 'Kích hoạt tài khoản'
                                  }
                                  disabled={toggleBusyId === acc.id}
                                  onClick={() => handleToggleActive(acc)}
                                  className={`rounded p-1.5 hover:bg-white/10 disabled:opacity-40 ${
                                    acc.apiStatus === 'ACTIVE'
                                      ? 'text-orange-400'
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-lg">
                                    {acc.apiStatus === 'ACTIVE' ? 'person_off' : 'how_to_reg'}
                                  </span>
                                </button>
                              )}
                              <button
                                type="button"
                                title="Xem chi tiết"
                                onClick={() => setModal({ open: true, mode: 'view', data: acc })}
                                className="rounded p-1.5 hover:bg-white/10"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              {canManageAccounts && (
                                <button
                                  type="button"
                                  title="Chỉnh sửa"
                                  onClick={() => setModal({ open: true, mode: 'edit', data: acc })}
                                  className="rounded p-1.5 hover:bg-white/10"
                                >
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400">
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
          creatorRole={currentUser?.role}
          data={
            modal.data
              ? { ...modal.data, fullName: modal.data.name, name: modal.data.name }
              : undefined
          }
          onClose={() => setModal({ ...modal, open: false })}
          onSubmit={handleSubmit}
        />

      )}

      {/* Alert */}
      {alert.open && (
        <AlertModal
          title={alert.title ?? 'Thông báo'}
          message={alert.message}
          type={alert.type}
          onConfirm={alert.onConfirm}
          onClose={() => setAlert({ ...alert, open: false })}
        />
      )}
    </div>
  )
}