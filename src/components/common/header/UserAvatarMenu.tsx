import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthContext'
import type { ApiUser } from '../../../api/types'

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

export const UserAvatarMenu: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const displayName = user?.fullName?.trim() || 'User'
  const roleLine = user?.role ? (ROLE_LABEL[user.role] ?? user.role) : ''

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const goProfile = () => {
    setOpen(false)
    navigate('/profile')
  }

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <div ref={rootRef} className="relative overflow-visible border-l border-white/10 pl-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-3 text-left"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-sm font-medium text-white">{displayName}</p>
          <p className="truncate text-xs text-slate-400">{roleLine}</p>
        </div>
        <div className="size-10 shrink-0 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1px]">
          <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-bold text-cyan-300">
            {userInitials(displayName)}
          </div>
        </div>
        <span className="material-symbols-outlined hidden text-slate-400 sm:inline">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[200] min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-[#121a28] py-1 shadow-2xl"
        >
          <div className="border-b border-white/5 px-4 py-3 sm:hidden">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="truncate text-xs text-slate-400">{roleLine}</p>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={goProfile}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
          >
            <span className="material-symbols-outlined text-lg text-cyan-400">person</span>
            Hồ sơ cá nhân
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}
