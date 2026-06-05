import type { ChangeEvent } from 'react'
import { UserAvatarMenu } from './UserAvatarMenu'
import { TransporterNotificationBell } from './TransporterNotificationBell'
import { TenantTransportNotificationBell } from './TenantTransportNotificationBell'

type StaffHeaderProps = {
  title?: string
  onSearchChange?: (value: string) => void
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({
  title = 'Admin Tenant Dashboard',
  onSearchChange,
}) => {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(event.target.value)
  }

  return (
    <header className="relative z-20 flex items-center justify-between overflow-visible border-b border-slate-200/80 bg-white/80 px-8 py-5 backdrop-blur-md">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 flex items-center gap-2 font-mono text-xs font-medium text-slate-500">
          {/* Đèn tín hiệu xung nhịp đã tối ưu cho nền sáng */}
          <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
          Intelligent Warehouse Orchestration System
        </p>
      </div>

      <div className="flex items-center gap-6">
        {onSearchChange && (
          <div className="group relative hidden w-72 lg:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="material-symbols-outlined text-slate-400 transition-colors group-focus-within:text-sky-600">
                search
              </span>
            </div>
            <input
              type="text"
              placeholder="Tìm SKU, mã hàng..."
              onChange={handleSearchChange}
              className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 font-mono text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        )}

        {/* Các component thông báo & avatar tự động thừa hưởng màu icon tối từ layout sáng nếu viết chuẩn */}
        <TenantTransportNotificationBell />
        <TransporterNotificationBell />

        <UserAvatarMenu />
      </div>
    </header>
  )
}