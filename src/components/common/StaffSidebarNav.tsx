import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { navigationService } from '../../utils/NavigationService'
import logo from '../../assets/logo.png'
import { useAuth } from '../../auth/AuthContext'
import type { ApiUser } from '../../api/types'

type NavItem = {
  label: string
  icon: string
  key: string
  href: string
}

const TENANT_NAV: NavItem[] = [
  { label: 'Bảng điều khiển', icon: 'grid_view', key: 'dashboard', href: '/staff/dashboard' },
  {
    label: 'Quản lý hàng hóa',
    icon: 'inventory_2',
    key: 'products',
    href: '/staff/products',
  },
  {
    label: 'Yêu cầu xuất nhập',
    icon: 'swap_horiz',
    key: 'import-export',
    href: '/staff/import-export',
  },
]

const WH_STAFF_NAV: NavItem[] = [
  { label: 'Bảng điều khiển', icon: 'grid_view', key: 'dashboard', href: '/staff/dashboard' },
  { label: 'Quản lý vận chuyển', icon: 'local_shipping', key: 'requests', href: '/staff/requests' },
]

function navItemsForRole(role?: ApiUser['role']) {
  if (role === 'TENANT_ADMIN' || role === 'TENANT_STAFF') return TENANT_NAV
  return WH_STAFF_NAV
}

type BottomAction = {
  label: string
  icon: string
  href: string
  className?: string
}

const bottomActions: BottomAction[] = [
  { label: 'Settings', icon: 'settings', href: '/admin/settings' },
  { label: 'Log Out', icon: 'logout', href: '/login', className: 'text-slate-500 hover:text-red-400' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export const StaffSidebarNav: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation()
  const { logout, user } = useAuth()
  const visibleNav = navItemsForRole(user?.role)

  const isActive = (path: string) => {
    if (path === '/staff/dashboard') {
      return location.pathname === '/staff' || location.pathname === '/staff/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  const handleItemClick = (path: string) => {
    if (path === '/login') {
      logout()
      navigationService.goTo('/login')
      return
    }
    navigationService.goTo(path)
  }

  return (
    <aside
      className={`glass-sidebar fixed z-50 flex h-full shrink-0 flex-col justify-between transition-all duration-300 
      ${collapsed ? 'w-20' : 'w-64'} md:relative`}
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-900 to-slate-900">
              <img src={logo} alt="Logo" className="h-10 w-10" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-white">NEXSPACE</h1>
                <p className="font-mono text-xs text-cyan-400/60">
                  {user?.role === 'TENANT_ADMIN' ? 'Tenant' : 'Staff'}
                </p>
              </div>
            )}
          </div>
          <button type="button" onClick={onToggle}>
            <span className="material-symbols-outlined text-slate-400 hover:text-white">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {visibleNav.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleItemClick(item.href)}
              className={
                isActive(item.href)
                  ? 'active-nav-item flex items-center gap-3 rounded-lg px-4 py-3 text-white'
                  : 'flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white'
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-4 border-t border-white/5 p-6">
        {bottomActions.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleItemClick(item.href)}
            className={`flex items-center gap-3 rounded-lg px-4 py-2 transition-all hover:text-white ${item.className ?? 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </div>
    </aside>
  )
}
