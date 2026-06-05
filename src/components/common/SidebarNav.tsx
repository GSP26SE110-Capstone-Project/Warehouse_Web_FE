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
  roles?: ApiUser['role'][]
}

const navItems: NavItem[] = [
  { label: 'Bảng điều khiển', icon: 'grid_view', key: 'dashboard', href: '/admin/dashboard' },
  { label: 'Quản lý Yêu cầu', icon: 'description', key: 'requests', href: '/admin/requests' },
  {
    label: 'Quản lý Tài khoản',
    icon: 'people',
    key: 'accounts',
    href: '/admin/accounts',
    roles: ['SYSTEM_ADMIN', 'WH_ADMIN'],
  },
  {
    label: 'Quản lý Kho',
    icon: 'warehouse',
    key: 'warehouse',
    href: '/admin/warehouse',
    roles: ['SYSTEM_ADMIN', 'WH_ADMIN'],
  },
  {
    label: 'Quản lý Zone',
    icon: 'grid_view',
    key: 'zones',
    href: '/admin/zones',
    roles: ['SYSTEM_ADMIN', 'WH_ADMIN'],
  },
  {
    label: 'Sơ đồ Rack',
    icon: 'view_module',
    key: 'racks',
    href: '/admin/racks',
    roles: ['SYSTEM_ADMIN', 'WH_ADMIN'],
  },
  { label: 'Quản lý Hàng', icon: 'inventory_2', key: 'inventory', href: '/admin/inventory' },
  { label: 'Quản lý Hợp đồng', icon: 'description', key: 'contracts', href: '/admin/contract' },
  {
    label: 'Vận chuyển',
    icon: 'local_shipping',
    key: 'transportation',
    href: '/admin/transportation',
    roles: ['SYSTEM_ADMIN'],
  },
  {
    label: 'Nhập kho',
    icon: 'input',
    key: 'inbound',
    href: '/admin/inbound',
    roles: ['WH_ADMIN'],
  },
  {
    label: 'Quản lý Batch',
    icon: 'qr_code_2',
    key: 'batches',
    href: '/admin/batches',
    roles: ['WH_ADMIN'],
  },
  {
    label: 'AI Putaway',
    icon: 'psychology',
    key: 'ai-putaway',
    href: '/admin/ai-putaway',
    roles: ['WH_ADMIN'],
  },
  {
    label: 'Xuất kho',
    icon: 'outbound',
    key: 'outbound',
    href: '/admin/outbound',
    roles: ['WH_ADMIN'],
  },
  {
    label: 'Báo cáo',
    icon: 'bar_chart',
    key: 'reports',
    href: '/admin/reports',
    roles: ['SYSTEM_ADMIN'],
  },
]

/** System Admin chỉ vận hành 3 module cốt lõi */
const SYSTEM_ADMIN_NAV_KEYS = new Set(['requests', 'accounts', 'warehouse'])

function navItemsForRole(role?: ApiUser['role']) {
  if (!role) return navItems
  if (role === 'SYSTEM_ADMIN') {
    return navItems.filter((item) => SYSTEM_ADMIN_NAV_KEYS.has(item.key))
  }
  return navItems.filter((item) => !item.roles || item.roles.includes(role))
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export const SidebarNav: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation()
  const { logout, user } = useAuth()
  const visibleNav = navItemsForRole(user?.role)

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  const handleItemClick = (path: string) => {
    navigationService.goTo(path)
  }

  const handleLogout = () => {
    logout()
    navigationService.goTo('/login')
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
          {visibleNav.map((item) => (
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

          <button
            onClick={() => navigationService.goTo('/admin/settings')}
            className="flex items-center gap-3 rounded-lg px-4 py-2 transition-all hover:text-white text-slate-500 hover:text-red-400"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            <span>Setting </span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-4 py-2 transition-all hover:text-white text-slate-500 hover:text-red-400"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span>Log Out</span>
          </button>
      </div>
    </aside>

  )
}