import type { ChangeEvent } from 'react'
import { navigationService } from '../../../utils/NavigationService'
import { useAuth } from '../../../auth/AuthContext'
import type { ApiUser } from '../../../api/types'

type StaffHeaderProps = {
  title?: string
  onSearchChange?: (value: string) => void
}

const ROLE_LABEL: Record<ApiUser['role'], string> = {
  SYSTEM_ADMIN: 'System Admin',
  WH_ADMIN: 'Warehouse Admin',
  WH_STAFF: 'Warehouse Staff',
  WH_TRANSPORTER: 'Tài xế kho',
  TENANT_ADMIN: 'Tenant Admin',
  TENANT_STAFF: 'Tenant Staff',
}

function userInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({
  title = 'Staff Dashboard',
  onSearchChange,
}) => {
  const { user, logout } = useAuth()

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(event.target.value)
  }

  const handleLogout = () => {
    logout()
    navigationService.goTo('/login')
  }

  const displayName = user?.fullName?.trim() || 'User'
  const roleLine = user?.role ? (ROLE_LABEL[user.role] ?? user.role) : ''

  return (
    <header className="relative z-10 flex items-center justify-between border-b border-white/5 bg-[#0b101a]/40 px-8 py-5 backdrop-blur-md">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        <p className="mt-1 flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
          Intelligent Warehouse Orchestration System
        </p>
      </div>

      <div className="flex items-center gap-6">
        {onSearchChange && (
          <div className="group relative hidden w-72 lg:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="material-symbols-outlined text-slate-500 transition-colors group-focus-within:text-[#06edf9]">
                search
              </span>
            </div>
            <input
              type="text"
              placeholder="Tìm SKU, mã hàng..."
              onChange={handleSearchChange}
              className="block w-full rounded-lg border border-white/10 bg-[#1a2333]/60 py-2.5 pl-10 pr-3 font-mono text-sm text-white placeholder-slate-500 transition-all focus:border-[#06edf9]/50 focus:outline-none focus:ring-1 focus:ring-[#06edf9]"
            />
          </div>
        )}

        <button
          type="button"
          className="relative p-2 text-slate-400 transition-colors hover:text-white"
          aria-label="Thông báo"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#06edf9] shadow-[0_0_8px_rgba(6,237,249,0.8)]" />
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="px-2 text-xs text-slate-400 transition-colors hover:text-red-400"
        >
          Đăng xuất
        </button>

        <button
          type="button"
          onClick={() => navigationService.goTo('/profile')}
          className="flex cursor-pointer items-center gap-3 border-l border-white/10 pl-6 text-left"
        >
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="truncate text-xs text-slate-400">{roleLine}</p>
          </div>
          <div className="size-10 shrink-0 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1px]">
            <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-bold text-cyan-300">
              {userInitials(displayName)}
            </div>
          </div>
        </button>
      </div>
    </header>
  )
}
