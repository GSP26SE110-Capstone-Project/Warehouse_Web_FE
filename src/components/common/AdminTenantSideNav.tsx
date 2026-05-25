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
  { label: 'Bảng điều khiển', icon: 'grid_view', key: 'dashboard', href: '/admin' },
  { label: 'Quản lý Hợp đồng', icon: 'grid_view', key: 'contracts', href: '/admin/contract' },
  { label: 'Quản lý Hàng', icon: 'grid_view', key: 'inventory', href: '/admin/inventory' },
  { label: 'Xuất  Kho', icon: 'grid_view', key: 'stock-movements', href: '/admin/stock-movements' },
  { label: ' Nhập Kho', icon: 'grid_view', key: 'stock-movements', href: '/admin/stock-movements' },
  { label: 'Lịch sử giao dịch', icon: 'grid_view', key: 'stock-movements', href: '/admin/stock-movements' },
  { label: 'Báo cáo', icon: 'grid_view', key: 'grid_view', href: '/admin/reports' },
  { label: 'Quản lý nhân viên', icon: 'grid_view', key: 'reports', href: '/admin/reports' },
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

export const AdminTenantSideNav: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation()
  const [scanOpen, setScanOpen] = useState(false)


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
      className={`fixed z-50 flex h-full shrink-0 flex-col justify-between transition-all duration-300 
      ${collapsed ? 'w-20' : 'w-64'} md:relative`}
    >
      <div className="flex flex-col gap-6 p-6">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center flex size-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-900 to-slate-900">
              <img src={logo} alt="Logo" className="h-10 w-10" />
            </div>

            {!collapsed && (
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-slate-800">NEXSPACE</h1>
                <p className="font-mono text-[11px] font-semibold text-cyan-600">Warehouse</p>
              </div>
            )}
          </div>

          {/* Toggle button */}
          <button
            onClick={onToggle}>
            <span className="material-symbols-outlined text-slate-400 hover:text-slate-800">
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
                  ? 'active-nav-item flex items-center gap-3 rounded-lg px-4 py-3 text-cyan-600 font-semibold shadow-sm'
                  : 'flex items-center gap-3 rounded-lg px-4 py-3 text-slate-800 hover:bg-white/5 hover:text-slate-900'
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
            className={`flex items-center gap-3 rounded-lg px-4 py-2 transition-all hover:text-cyan-600 ${item.className ?? 'text-slate-500'}`}
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