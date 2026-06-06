import { Link } from 'react-router-dom'
import { StatsCard } from '../../components/ui/StatCard'

const TENANT_LINKS = [
  { href: '/staff/inbound', icon: 'input', label: 'Yêu cầu nhập kho' },
  { href: '/staff/outbound', icon: 'outbound', label: 'Yêu cầu xuất kho' },
  { href: '/staff/inventory', icon: 'warehouse', label: 'Tồn kho' },
  { href: '/staff/products', icon: 'inventory_2', label: 'Sản phẩm / SKU' },
] as const

export function TenantStaffDashboard() {
  return (
    <div className="overflow-y-auto overflow-x-hidden bg-[#0b101a] p-6 md:p-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-white">Bảng điều khiển</h2>
          <p className="text-sm text-slate-400">
            Tạo và theo dõi yêu cầu nhập/xuất, xem tồn kho tenant
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TENANT_LINKS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="glass-panel flex items-center gap-3 rounded-xl p-4 transition-colors hover:bg-white/5"
            >
              <span className="material-symbols-outlined text-2xl text-cyan-400">{item.icon}</span>
              <span className="text-sm font-medium text-white">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatsCard title="Inbound" value="—" icon="input" accentColor="primary" />
          <StatsCard title="Outbound" value="—" icon="outbound" accentColor="orange" />
          <StatsCard title="SKU" value="—" icon="inventory_2" accentColor="emerald" />
        </div>
      </div>
    </div>
  )
}
