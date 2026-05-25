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
  { label: 'Quản lý Kho', icon: 'warehouse', key: 'warehouse', href: '/admin-warehouse/warehouses' },
  { label: 'Yêu cầu thuê', icon: 'description', key: 'requests', href: '/admin-warehouse/requests' },
  { label: 'Quản lý Hợp đồng', icon: 'description', key: 'contracts', href: '/admin-warehouse/contracts' },
  { label: 'Yêu cầu nhập kho', icon: 'input', key: 'inbound', href: '/admin-warehouse/inbound' },
  { label: 'Yêu cầu xuất kho', icon: 'output', key: 'outbound', href: '/admin-warehouse/outbound' },
  { label: 'Quản lý nhân viên', icon: 'person', key: 'warehouse-staff', href: '/admin-warehouse/warehouse-staff' },
  { label: 'Quản lý Hàng', icon: 'inventory_2', key: 'inventory', href: '/admin-warehouse/inventory' },
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
  { label: 'Đăng xuất', icon: 'logout', action: handleLogout, className: 'text-slate-500 hover:text-red-500' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export const SidebarNav: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  const handleItemClick = (path: string) => {
    navigationService.goTo(path)
  }

  return (
    <aside
      className={`fixed z-50 flex h-full shrink-0 flex-col justify-between border-r border-slate-200 bg-white shadow-sm transition-all duration-300 
      ${collapsed ? 'w-20' : 'w-64'} md:relative`}
    >
      <div className="flex flex-col gap-6 p-6 overflow-y-auto max-h-[calc(100vh-180px)] scrollbar-none">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-15 items-center justify-center flex size-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-900 to-slate-900">
              <img src={logo} alt="Logo" className="h-10 w-10" />
            </div>

            {!collapsed && (
              <div className="flex flex-col">
                <h1 className="text-base font-bold text-slate-800 tracking-wide">NEXSPACE</h1>
                <p className="font-mono text-[11px] font-semibold text-cyan-600">Warehouse Admin</p>
              </div>
            )}
          </div>

          {/* Toggle button */}
          <button 
            onClick={onToggle}
            className="flex p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500 hover:text-slate-800">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <button
                key={item.key}
                onClick={() => handleItemClick(item.href)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                  active
                    ? 'bg-cyan-50 text-cyan-600 font-semibold shadow-sm'
                    : 'text-slate-900 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={`material-symbols-outlined ${active ? 'text-cyan-600' : 'text-slate-500'}`}>
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-3 border-t border-slate-100 p-6 bg-white">

        {!collapsed && (
          <button
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 text-sm font-bold text-cyan-600 hover:bg-cyan-100 transition-colors"
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
            className={`flex items-center gap-3 rounded-lg px-4 py-2 transition-all hover:bg-slate-50 ${
              item.className ?? 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-xl text-slate-500">{item.icon}</span>

            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </aside>
  )
}