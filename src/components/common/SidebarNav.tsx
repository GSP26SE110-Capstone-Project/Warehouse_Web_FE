import { useState } from 'react'
import type { ReactNode } from 'react'
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
  {
    label: 'Quản lý Kho',
    icon: 'warehouse',
    key: 'warehouse',
    href: '/admin/warehouse',
    roles: ['SYSTEM_ADMIN'],
  },
  {
    label: 'Hệ thống Kho',
    icon: 'dashboard_customize',
    key: 'warehouse-dashboard',
    href: '/admin/warehouseDashboard',
    roles: ['WH_ADMIN'],
  },
  { label: 'Quản lý Yêu cầu', icon: 'description', key: 'requests', href: '/admin/requests' },
  { label: 'Quản lý Hợp đồng', icon: 'description', key: 'contracts', href: '/admin/contract' },


  // {
  //   label: 'Quản lý Zone',
  //   icon: 'grid_view',
  //   key: 'zones',
  //   href: '/admin/zones',
  //   roles: ['SYSTEM_ADMIN', 'WH_ADMIN'],
  // },
  // {
  //   label: 'Sơ đồ Rack',
  //   icon: 'view_module',
  //   key: 'racks',
  //   href: '/admin/racks',
  //   roles: ['SYSTEM_ADMIN', 'WH_ADMIN'],
  // },
  { label: 'Quản lý Hàng', icon: 'inventory_2', key: 'inventory', href: '/admin/inventory' },
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
    label: 'Xuất kho',
    icon: 'outbound',
    key: 'outbound',
    href: '/admin/outbound',
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
    label: 'Quản lý Tài khoản',
    icon: 'people',
    key: 'accounts',
    href: '/admin/accounts',
    roles: ['SYSTEM_ADMIN', 'WH_ADMIN'],
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
  const [scanOpen, setScanOpen] = useState(false)
  const { logout, user } = useAuth()
  const visibleNav = navItemsForRole(user?.role)

  // Logic nhận diện Dark Mode tương thích với màn hình quản lý tài khoản
  const isDarkMode = user?.role === 'SYSTEM_ADMIN'

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
      className={`fixed z-50 flex h-full shrink-0 flex-col justify-between border-r transition-all duration-300 md:relative ${collapsed ? 'w-20' : 'w-64'
        } ${isDarkMode
          ? 'bg-[#0b101a] border-white/5 text-slate-100 shadow-none'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
    >
      <div className="flex flex-col gap-6 p-6">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Đã dọn dẹp class trùng lặp size-15 và size-10 tại đây */}
            <div className={`flex size-10 items-center justify-center rounded-lg border transition-colors ${isDarkMode
              ? 'border-cyan-500/30 bg-gradient-to-br from-cyan-900 to-slate-900'
              : 'border-slate-200 bg-slate-50'
              }`}>
              <img src={logo} alt="Logo" className="h-6 w-6 object-contain" />
            </div>

            {!collapsed && (
              <div className="flex flex-col">
                <h1 className={`text-sm font-bold tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  NEXSPACE
                </h1>
                <p className={`font-mono text-[10px] uppercase tracking-widest ${isDarkMode ? 'text-cyan-400/60' : 'text-slate-400 font-semibold'
                  }`}>
                  Warehouse
                </p>
              </div>
            )}
          </div>

          {/* Toggle button collapse sidebar */}
          <button
            onClick={onToggle}>
            <span className="material-symbols-outlined text-slate-400 hover:text-white">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1">
          {visibleNav.map((item) => {
            const active = isActive(item.href)
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleItemClick(item.href)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all text-sm font-medium ${active
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-l-2 border-cyan-400 text-cyan-400'
                    : 'bg-cyan-50 text-cyan-600 font-semibold'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <span className={`material-symbols-outlined text-xl ${active && !isDarkMode ? 'text-cyan-600' : ''
                  }`}>{item.icon}</span>

                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className={`flex flex-col gap-1.5 border-t p-6 ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>

        {/* Settings Button */}
        <button
          type="button"
          onClick={() => navigationService.goTo('/admin/settings')}
          className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all ${isDarkMode
            ? 'text-slate-400 hover:bg-white/5 hover:text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <span className="material-symbols-outlined text-xl">settings</span>
          {!collapsed && <span>Cài đặt</span>}
        </button>

        {/* Log Out Button */}
        <button
          type="button"
          onClick={handleLogout}
          className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all ${isDarkMode
            ? 'text-slate-400 hover:bg-red-950/30 hover:text-red-400'
            : 'text-slate-600 hover:bg-red-50 hover:text-red-600'
            }`}
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}