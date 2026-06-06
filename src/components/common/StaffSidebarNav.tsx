import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { navigationService } from '../../utils/NavigationService'
import logo from '../../assets/logo.png'
import { useAuth } from '../../auth/AuthContext'
import type { ApiUser } from '../../api/types'
import { getTenant } from '../../api/tenants'
import { getWarehouse } from '../../api/warehouses'

type NavItem = {
  label: string
  icon: string
  key: string
  href: string
}

const TENANT_ADMIN_ACCOUNTS: NavItem = {
  label: 'Quản lý tài khoản',
  icon: 'people',
  key: 'accounts',
  href: '/staff/accounts',
}

const TENANT_ADMIN_BATCHES: NavItem = {
  label: 'Quản lý Batch',
  icon: 'qr_code_2',
  key: 'batches',
  href: '/staff/batches',
}

const TENANT_NAV: NavItem[] = [
  { label: 'Bảng điều khiển', icon: 'grid_view', key: 'dashboard', href: '/staff/dashboard' },
  { label: 'Hợp đồng', icon: 'description', key: 'contracts', href: '/staff/contracts' },
  {
    label: 'Tiền thuê định kỳ',
    icon: 'payments',
    key: 'recurring-rent',
    href: '/staff/recurring-rent',
  },
  { label: 'Yêu cầu thuê', icon: 'fact_check', key: 'rental-requests', href: '/staff/rental-requests' },
  {
    label: 'Quản lý hàng hóa',
    icon: 'inventory_2',
    key: 'products',
    href: '/staff/products',
  },
  {
    label: 'Yêu cầu nhập kho',
    icon: 'input',
    key: 'inbound',
    href: '/staff/inbound',
  },
  {
    label: 'Yêu cầu xuất kho',
    icon: 'outbound',
    key: 'outbound',
    href: '/staff/outbound',
  },
  { label: 'Tồn kho', icon: 'warehouse', key: 'inventory', href: '/staff/inventory' },
]

const WH_STAFF_NAV: NavItem[] = [
  { label: 'Bảng điều khiển', icon: 'grid_view', key: 'dashboard', href: '/staff/dashboard' },
  { label: 'Nhập kho', icon: 'input', key: 'inbound-ops', href: '/staff/inbound-ops' },
  { label: 'AI Putaway', icon: 'psychology', key: 'ai-putaway', href: '/staff/ai-putaway' },
  { label: 'Xuất kho', icon: 'outbound', key: 'outbound-ops', href: '/staff/outbound-ops' },
  { label: 'Tồn kho', icon: 'inventory_2', key: 'inventory-ops', href: '/staff/inventory-ops' },
]

const WH_TRANSPORTER_NAV: NavItem[] = [
  {
    label: 'Chuyến của tôi',
    icon: 'local_shipping',
    key: 'my-deliveries',
    href: '/staff/my-deliveries',
  },
]

function navItemsForRole(role?: ApiUser['role']) {
  if (role === 'TENANT_ADMIN') {
    const rest = TENANT_NAV.slice(1)
    const inboundIdx = rest.findIndex((i) => i.key === 'inbound')
    const withBatches =
      inboundIdx >= 0
        ? [
            ...rest.slice(0, inboundIdx + 1),
            TENANT_ADMIN_BATCHES,
            ...rest.slice(inboundIdx + 1),
          ]
        : [...rest, TENANT_ADMIN_BATCHES]
    return [TENANT_NAV[0], TENANT_ADMIN_ACCOUNTS, ...withBatches]
  }
  if (role === 'TENANT_STAFF') return TENANT_NAV
  if (role === 'WH_TRANSPORTER') return WH_TRANSPORTER_NAV
  return WH_STAFF_NAV
}

type BottomAction = {
  label: string
  icon: string
  href: string
  className?: string
}

function bottomActionsForRole(_role?: ApiUser['role']): BottomAction[] {
  const profileHref = '/profile'
  return [
    { label: 'Hồ sơ', icon: 'person', href: profileHref },
    { label: 'Log Out', icon: 'logout', href: '/login', className: 'text-slate-500 hover:text-red-400' },
  ]
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

function roleSubtitle(role?: ApiUser['role']) {
  if (role === 'TENANT_ADMIN') return 'Quản trị tenant'
  if (role === 'TENANT_STAFF') return 'Nhân viên tenant'
  if (role === 'WH_STAFF') return 'Nhân viên kho'
  if (role === 'WH_TRANSPORTER') return 'Tài xế kho'
  return 'Staff'
}

export const StaffSidebarNav: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation()
  const { logout, user } = useAuth()
  const visibleNav = navItemsForRole(user?.role)
  const bottomActions = bottomActionsForRole(user?.role)
  const [orgLabel, setOrgLabel] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadOrg() {
      if (!user) {
        setOrgLabel('')
        return
      }

      try {
        if (user.tenantId && (user.role === 'TENANT_ADMIN' || user.role === 'TENANT_STAFF')) {
          const tenant = await getTenant(user.tenantId)
          if (!cancelled) {
            setOrgLabel(tenant.companyName || tenant.companyCode || 'Tenant')
          }
          return
        }

        if (user.warehouseId && user.role === 'WH_STAFF') {
          const warehouse = await getWarehouse(user.warehouseId)
          if (!cancelled) {
            setOrgLabel(warehouse.warehouseName || warehouse.warehouseCode || 'Kho')
          }
          return
        }

        if (!cancelled) setOrgLabel(roleSubtitle(user.role))
      } catch {
        if (!cancelled) setOrgLabel(roleSubtitle(user.role))
      }
    }

    loadOrg()
    return () => {
      cancelled = true
    }
  }, [user?.tenantId, user?.warehouseId, user?.role])

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
                <p
                  className="max-w-[140px] truncate font-mono text-xs text-cyan-400/80"
                  title={orgLabel || roleSubtitle(user?.role)}
                >
                  {orgLabel || roleSubtitle(user?.role)}
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
