import type { ChangeEvent } from 'react'
import { UserAvatarMenu } from './UserAvatarMenu'

type AdminHeaderProps = {
  title?: string
  onSearchChange?: (value: string) => void
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title = 'Admin Dashboard',
  onSearchChange,
}) => {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(event.target.value)
  }

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
        <div className="group relative hidden w-96 md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-symbols-outlined text-slate-500 transition-colors group-focus-within:text-[#06edf9]">
              search
            </span>
          </div>
          <input
            type="text"
            placeholder="Search SKU, Serial, or Location..."
            onChange={handleSearchChange}
            className="block w-full rounded-lg border border-white/10 bg-[#1a2333]/60 py-2.5 pl-10 pr-3 font-mono text-sm text-white placeholder-slate-500 transition-all focus:border-[#06edf9]/50 focus:outline-none focus:ring-1 focus:ring-[#06edf9]"
          />
        </div>

        <button className="relative p-2 text-slate-400 transition-colors hover:text-white">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#06edf9] shadow-[0_0_8px_rgba(6,237,249,0.8)]" />
        </button>

        <UserAvatarMenu />
      </div>
    </header>
  )
}
