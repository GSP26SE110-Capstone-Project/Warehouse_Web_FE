import { UserAvatarMenu } from './UserAvatarMenu'
import { AdminNotificationBell } from './AdminNotificationBell'

type AdminHeaderProps = {
  title?: string
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title = 'Admin Dashboard',
}) => {
  return (
    <header className="relative z-20 flex items-center justify-between overflow-visible border-b border-white/5 bg-[#0b101a]/40 px-8 py-5 backdrop-blur-md">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        <p className="mt-1 flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
          SYSTEM ONLINE
        </p>
      </div>

      <div className="flex items-center gap-6">
        <AdminNotificationBell />

        <UserAvatarMenu />
      </div>
    </header>
  )
}
