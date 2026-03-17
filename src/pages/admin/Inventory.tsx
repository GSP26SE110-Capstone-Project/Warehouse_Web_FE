import { useState } from 'react'
import {SidebarNav} from '../../components/common/SidebarNav'
import {StatsCard}  from '../../components/ui/StatCard'
import {AdminHeader}  from '../../components/common/header/AdminHeader'

type InventoryItem = {
  sku: string
  name: string
  category: string
  categoryClassName: string
  stock: number
  total: number
  status: 'In Stock' | 'Low Stock' | 'Critical'
  statusClassName: string
  progressClassName: string
  location: string
  updatedAt: string
  striped?: boolean
}

// const stats = [
//   {
//     title: 'Total Stock',
//     value: '14,205',
//     badge: (
//       <span className="flex items-center rounded bg-emerald-400/10 px-1.5 py-0.5 text-xs font-medium text-emerald-400">
//         <span className="material-symbols-outlined mr-0.5 text-[14px]">trending_up</span>
//         2.5%
//       </span>
//     ),
//     glowClassName: 'bg-cyan-500/5 group-hover:bg-cyan-500/10',
//   },
//   {
//     title: 'Pending Inbound',
//     value: '340',
//     badge: (
//       <span className="flex items-center rounded bg-emerald-400/10 px-1.5 py-0.5 text-xs font-medium text-emerald-400">
//         <span className="material-symbols-outlined mr-0.5 text-[14px]">trending_up</span>
//         12%
//       </span>
//     ),
//     glowClassName: 'bg-blue-500/5 group-hover:bg-blue-500/10',
//   },
//   {
//     title: 'Critical Low',
//     value: '12',
//     badge: (
//       <span className="flex items-center rounded bg-red-400/10 px-1.5 py-0.5 text-xs font-medium text-red-400">
//         <span className="material-symbols-outlined mr-0.5 text-[14px]">warning</span>
//         Alert
//       </span>
//     ),
//     glowClassName: 'bg-orange-500/5 group-hover:bg-orange-500/10',
//     className: 'border-orange-500/20',
//   },
//   {
//     title: 'Uptime',
//     value: (
//       <>
//         99.9<span className="text-lg">%</span>
//       </>
//     ),
//     glowClassName: 'bg-indigo-500/5 group-hover:bg-indigo-500/10',
//   },
// ]

const inventoryItems: InventoryItem[] = [
  {
    sku: '#SKU-9021',
    name: 'Quantum Chipset X1',
    category: 'Electronics',
    categoryClassName: 'bg-blue-400/10 text-blue-400 ring-blue-400/20',
    stock: 75,
    total: 100,
    status: 'In Stock',
    statusClassName: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    progressClassName: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    location: 'Zone A-12',
    updatedAt: '10m ago',
    striped: true,
  },
  {
    sku: '#SKU-8822',
    name: 'Neural Interface Unit',
    category: 'Bio-Tech',
    categoryClassName: 'bg-purple-400/10 text-purple-400 ring-purple-400/20',
    stock: 12,
    total: 100,
    status: 'Low Stock',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    progressClassName: 'bg-gradient-to-r from-orange-400 to-red-500',
    location: 'Zone B-04',
    updatedAt: '25m ago',
  },
  {
    sku: '#SKU-7731',
    name: 'Optic Fiber Cabling',
    category: 'Infrastructure',
    categoryClassName: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
    stock: 100,
    total: 100,
    status: 'In Stock',
    statusClassName: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    progressClassName: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    location: 'Zone C-01',
    updatedAt: '1h ago',
    striped: true,
  },
  {
    sku: '#SKU-6619',
    name: 'Fusion Battery Cell',
    category: 'Energy',
    categoryClassName: 'bg-amber-400/10 text-amber-400 ring-amber-400/20',
    stock: 5,
    total: 100,
    status: 'Critical',
    statusClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    progressClassName: 'bg-red-500',
    location: 'Zone A-09',
    updatedAt: '2h ago',
  },
  {
    sku: '#SKU-5501',
    name: 'Holographic Emitter',
    category: 'Displays',
    categoryClassName: 'bg-indigo-400/10 text-indigo-400 ring-indigo-400/20',
    stock: 45,
    total: 100,
    status: 'In Stock',
    statusClassName: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    progressClassName: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    location: 'Zone D-22',
    updatedAt: '4h ago',
    striped: true,
  },
]

function getStatusDotClass(status: InventoryItem['status']) {
  if (status === 'Critical') return 'bg-red-400 animate-pulse'
  if (status === 'Low Stock') return 'bg-orange-400'
  return 'bg-emerald-400'
}

export const Inventory: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b101a] text-slate-100">

      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 z-0 bg-[#0b101a]/90 backdrop-blur-sm" />
        <div className="custom-scrollbar relative z-10 flex-1 overflow-y-auto p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
             {/* Stats Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCard
                          title="Tổng hàng trong kho"
                          value={14205}
                          unit="units"
                          icon="inventory_2"
                          accentColor="primary"
                          trend={{ direction: 'up', percentage: 2.5, text: 'vs last week' }}
                        />
                        <StatsCard
                          title="Đơn hàng đang vận chuyển"
                          value={42}
                          unit="active"
                          icon="local_shipping"
                          accentColor="primary"
                          trend={{ direction: 'up', percentage: 0, text: '12 arriving today' }}
                        />
                        <StatsCard
                          title="Điểm hiệu suất AI"
                          value="98.4%"
                          icon="memory"
                          accentColor="primary"
                          trend={{ direction: 'up', percentage: 0.8, text: 'optimization' }}
                        />
                        <StatsCard
                          title="Cảnh báo đang chờ"
                          value={3}
                          unit="critical"
                          icon="warning"
                          accentColor="orange"
                          trend={{ direction: 'down', percentage: 0, text: 'Action required' }}
                        />
                      </div>

            <section className="glass-panel flex flex-col overflow-hidden rounded-xl border border-white/5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-5">
                <h3 className="text-lg font-bold tracking-wide text-white">HÀNG TRONG KHO HIỆN TẠI</h3>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a2333] px-4 py-2 text-sm text-slate-300 transition-all hover:border-white/20 hover:text-white">
                    <span className="material-symbols-outlined text-lg">filter_list</span>
                    <span>Lọc</span>
                  </button>
                  <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a2333] px-4 py-2 text-sm text-slate-300 transition-all hover:border-white/20 hover:text-white">
                    <span className="material-symbols-outlined text-lg">download</span>
                    <span>Xuất báo cáo</span>
                  </button>
                  <button className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold tracking-wide text-black shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40">
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span>THÊM MẶT HÀNG</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#131b29] text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4 font-medium">ID / SKU</th>
                      <th className="px-6 py-4 font-medium">Tên sản phẩm</th>
                      <th className="px-6 py-4 font-medium">Danh mục</th>
                      <th className="px-6 py-4 font-medium">Mức tồn kho</th>
                      <th className="px-6 py-4 font-medium">Trạng thái</th>
                      <th className="px-6 py-4 font-medium">Vị trí</th>
                      <th className="px-6 py-4 font-medium">Lần cập nhật cuối cùng</th>
                      <th className="px-6 py-4 text-right font-medium">Hoạt động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {inventoryItems.map((item) => {
                      const percentage = `${(item.stock / item.total) * 100}%`

                      return (
                        <tr
                          key={item.sku}
                          className={`group table-row-hover transition-colors ${item.striped ? 'bg-white/[0.02]' : 'bg-transparent'}`}
                        >
                          <td className="px-6 py-4 font-mono text-cyan-400">{item.sku}</td>
                          <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.categoryClassName}`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-700/50">
                              <div className={`h-1.5 rounded-full ${item.progressClassName}`} style={{ width: percentage }} />
                            </div>
                            <div className={`mt-1 font-mono text-xs ${item.status === 'Critical' ? 'font-bold text-red-400' : 'text-slate-400'}`}>
                              {item.stock} / {item.total}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${item.statusClassName}`}>
                              <span className={`size-1.5 rounded-full ${getStatusDotClass(item.status)}`} />
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-400">{item.location}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.updatedAt}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-60 transition-opacity group-hover:opacity-100">
                              <button className="rounded p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button className="rounded p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
                                <span className="material-symbols-outlined text-lg">qr_code</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 bg-[#131b29] px-6 py-4">
                <p className="font-mono text-xs text-slate-400">
                  Showing <span className="text-white">1-5</span> of <span className="text-white">458</span> items
                </p>
                <div className="flex gap-2">
                  <button className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50">
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
                    1
                  </button>
                  <button className="rounded-md px-3 py-1 text-xs font-medium text-slate-400 hover:bg-white/5">
                    2
                  </button>
                  <button className="rounded-md px-3 py-1 text-xs font-medium text-slate-400 hover:bg-white/5">
                    3
                  </button>
                  <span className="px-2 py-1 text-xs text-slate-600">...</span>
                  <button className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}