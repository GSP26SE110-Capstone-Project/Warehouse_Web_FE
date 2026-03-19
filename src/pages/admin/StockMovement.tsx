import { useState, useMemo } from 'react'
import { StatsCard } from '../../components/ui/StatCard'

type Movement = {
  id: string
  product: string
  sku: string
  type: 'Import' | 'Export'
  typeClassName: string
  quantity: number
  status: 'Completed' | 'Pending' | 'Cancelled'
  statusClassName: string
  warehouse: string
  createdAt: string
  striped?: boolean
}

const movements: Movement[] = [
  {
    id: '#MOV-001',
    product: 'Quantum Chipset X1',
    sku: '#SKU-9021',
    type: 'Import',
    typeClassName: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    quantity: 120,
    status: 'Completed',
    statusClassName: 'bg-blue-400/10 text-blue-400 ring-blue-400/20',
    warehouse: 'Zone A-12',
    createdAt: '10m ago',
    striped: true,
  },
  {
    id: '#MOV-002',
    product: 'Fusion Battery Cell',
    sku: '#SKU-6619',
    type: 'Export',
    typeClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    quantity: 20,
    status: 'Pending',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    warehouse: 'Zone B-04',
    createdAt: '30m ago',
  },
  {
    id: '#MOV-003',
    product: 'Optic Fiber Cabling',
    sku: '#SKU-7731',
    type: 'Import',
    typeClassName: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    quantity: 200,
    status: 'Completed',
    statusClassName: 'bg-blue-400/10 text-blue-400 ring-blue-400/20',
    warehouse: 'Zone C-01',
    createdAt: '1h ago',
    striped: true,
  },
  {
    id: '#MOV-004',
    product: 'Neural Interface Unit',
    sku: '#SKU-8822',
    type: 'Export',
    typeClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    quantity: 10,
    status: 'Cancelled',
    statusClassName: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
    warehouse: 'Zone D-22',
    createdAt: '2h ago',
  },
]

function getStatusDot(status: Movement['status']) {
  if (status === 'Pending') return 'bg-orange-400 animate-pulse'
  if (status === 'Cancelled') return 'bg-gray-400'
  return 'bg-blue-400'
}

export const StockMovement: React.FC = () => {
  const [search, setSearch] = useState('')

  const filteredMovements = useMemo(() => {
    return movements.filter(m =>
      m.product.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 pb-15">

      <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />

        <div className="relative z-10 p-8">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-8">

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard title="Tổng giao dịch" value={520} icon="sync_alt" accentColor="primary" trend={{ direction: 'up', percentage: 3.2, text: 'this week' }} />
              <StatsCard title="Nhập kho" value={320} icon="download" accentColor="primary" trend={{ direction: 'up', percentage: 1.8, text: 'imports' }} />
              <StatsCard title="Xuất kho" value={180} icon="upload" accentColor="primary" trend={{ direction: 'up', percentage: 2.5, text: 'exports' }} />
              <StatsCard title="Chờ xử lý" value={20} icon="hourglass_top" accentColor="orange" trend={{ direction: 'down', percentage: 1.2, text: 'pending' }} />
            </div>

            {/* Table */}
            <section className="glass-panel rounded-xl border border-white/5 overflow-hidden flex flex-col">

              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-lg font-bold text-white">
                  QUẢN LÝ XUẤT - NHẬP KHO
                </h3>

                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm sản phẩm, SKU..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button className="flex items-center gap-2 px-4 py-2 bg-[#1a2333] border border-white/10 rounded-lg text-sm text-slate-300 hover:text-white">
                    <span className="material-symbols-outlined">filter_list</span>
                    Lọc
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-[#131b29] text-xs uppercase text-slate-400 border-b border-white/5">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Sản phẩm</th>
                      <th className="px-6 py-4">SKU</th>
                      <th className="px-6 py-4">Loại</th>
                      <th className="px-6 py-4">Số lượng</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Kho</th>
                      <th className="px-6 py-4">Thời gian</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {filteredMovements.length > 0 ? (
                      filteredMovements.map((m) => (
                        <tr key={m.id} className={`${m.striped ? 'bg-white/[0.02]' : ''}`}>
                          <td className="px-6 py-4 text-cyan-400 font-mono">{m.id}</td>
                          <td className="px-6 py-4 text-white">{m.product}</td>
                          <td className="px-6 py-4 text-slate-400">{m.sku}</td>

                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded ring-1 ${m.typeClassName}`}>
                              {m.type}
                            </span>
                          </td>

                          <td className="px-6 py-4 font-mono">{m.quantity}</td>

                          <td className="px-6 py-4">
                            <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ring-1 ${m.statusClassName}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(m.status)}`} />
                              {m.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-slate-400">{m.warehouse}</td>
                          <td className="px-6 py-4 text-xs text-slate-500">{m.createdAt}</td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-60 hover:opacity-100">
                              <button className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined">visibility</span>
                              </button>
                              <button className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="text-center py-10 text-slate-400">
                          Không tìm thấy dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/5 text-xs text-slate-400">
                Showing {filteredMovements.length} of {movements.length} records
              </div>

            </section>
          </div>
        </div>
      </main>
    </div>
  )
}