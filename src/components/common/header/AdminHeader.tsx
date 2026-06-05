import type { ChangeEvent } from 'react'
import { UserAvatarMenu } from './UserAvatarMenu'
import { AdminNotificationBell } from './AdminNotificationBell'
import { useAuth } from '../../../auth/AuthContext'

type AdminHeaderProps = {
  title?: string
  onSearchChange?: (value: string) => void
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title = 'Admin Dashboard',
  onSearchChange,
}) => {
  const { user } = useAuth()
  
  // Logic nhận diện theme đồng bộ toàn bộ hệ thống
  const isDarkMode = user?.role === 'SYSTEM_ADMIN'

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(event.target.value)
  }

  return (
    <header className={`relative z-20 flex items-center justify-between overflow-visible px-8 py-4 transition-all duration-300 backdrop-blur-md border-b ${
      isDarkMode 
        ? 'border-white/5 bg-[#0b101a]/40 shadow-none' 
        : 'border-slate-200 bg-white/80 shadow-sm'
    }`}>
      
      {/* Tiêu đề trang */}
      <div className="flex flex-col">
        <h2 className={`text-lg font-bold tracking-tight transition-colors ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}>{title}</h2>
        
        <p className="mt-0.5 flex items-center gap-2 font-mono text-[11px] font-medium text-slate-400">
          <span className={`size-2 rounded-full bg-emerald-500 animate-pulse ${
            isDarkMode ? 'shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''
          }`} />
          SYSTEM ONLINE
        </p>
      </div>

      {/* Ô tìm kiếm và Menu góc phải */}
      <div className="flex items-center gap-6">
        <div className="group relative hidden w-80 md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className={`material-symbols-outlined text-sm text-slate-400 transition-colors ${
              isDarkMode ? 'group-focus-within:text-[#06edf9]' : 'group-focus-within:text-cyan-500'
            }`}>
              search
            </span>
          </div>
          <input
            type="text"
            placeholder="Search SKU, Serial, or Location..."
            onChange={handleSearchChange}
            className={`block w-full rounded-lg py-2 pl-9 pr-3 text-sm transition-all focus:outline-none focus:ring-1 ${
              isDarkMode
                ? 'border border-white/10 bg-[#1a2333]/60 font-mono text-white placeholder-slate-500 focus:border-[#06edf9]/50 focus:ring-[#06edf9]'
                : 'border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-cyan-500'
            }`}
          />
        </div>

        {/* Component thông báo (Nên truyền thêm prop isDarkMode nếu bên trong cần đổi màu) */}
        <AdminNotificationBell />

        {/* Component Avatar Menu (Nên truyền thêm prop isDarkMode nếu bên trong cần đổi màu) */}
        <UserAvatarMenu />
      </div>
    </header>
  )
}