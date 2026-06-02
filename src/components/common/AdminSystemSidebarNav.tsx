import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { navigationService } from '../../utils/NavigationService'
import logo from '../../assets/logo.png'


type NavItem = {
  label: string
  icon: string
  key: string
  href: string
}

const navItems: NavItem[] = [
  { label: 'Bảng điều khiển', icon: 'grid_view', key: 'dashboard', href: '/admin-system' },
  { label: 'Quản lý Tài khoản', icon: 'people', key: 'accounts', href: '/admin-system/accounts' },
  { label: 'Quản lý Kho', icon: 'warehouse', key: 'warehouse', href: '/admin-system/warehouse' },
  { label: 'Quản lý Công ty', icon: 'apartment', key: 'tenants', href: '/admin-system/tenants' },
    { label: 'Quản lý Sản phẩm', icon: 'inventory', key: 'manageProduct', href: '/admin-system/manageProduct' },

]

type BottomAction = {
  label: string
  icon: string
  href?: string
  action?: () => void
  className?: string
}

const handleLogout = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')

  navigationService.goTo('/login')
}

const bottomActions: BottomAction[] = [
  { label: 'Cài đặt', icon: 'settings', href: '/admin/settings' },
  { label: 'Đăng xuất', icon: 'logout', action: handleLogout, className: 'text-slate-500 hover:text-red-400' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export const AdminSystemSidebarNav: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/admin-system') {
      return location.pathname === '/admin-system'
    }
    return location.pathname.startsWith(path)
  }

  const handleItemClick = (path: string) => {
    navigationService.goTo(path)
  }

  return (
    <aside
      className={`glass-sidebar fixed z-50 flex h-full shrink-0 flex-col justify-between transition-all duration-300 
      ${collapsed ? 'w-20' : 'w-64'} md:relative`}
    >
      <div className="flex flex-col gap-6 p-6">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-15 items-center justify-center flex size-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-900 to-slate-900">
              <img src={logo} alt="Logo" className="h-10 w-10" />
            </div>

            {!collapsed && (
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-white">NEXSPACE</h1>
                <p className="font-mono text-xs text-cyan-400/60">Warehouse</p>
              </div>
            )}
          </div>

          {/* Toggle button */}
          <button
            onClick={onToggle}>
            <span className="material-symbols-outlined text-slate-400 hover:text-white">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleItemClick(item.href)}
              className={
                isActive(item.href)
                  ? 'active-nav-item flex items-center gap-3 rounded-lg px-4 py-3 text-white'
                  : 'flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white'
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>

              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="flex flex-col gap-4 border-t border-white/5 p-6">

        {!collapsed && (
          <button
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-sm font-bold text-[#06edf9]"
          >
            <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
            <span>SCAN QR</span>
          </button>
        )}

        {bottomActions.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.action) {
                item.action();
              } else {
                handleItemClick(item.href ?? '');
              }
            }}
            className={`flex items-center gap-3 rounded-lg px-4 py-2 transition-all hover:text-white ${item.className ?? 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>

            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </aside>

  )
}