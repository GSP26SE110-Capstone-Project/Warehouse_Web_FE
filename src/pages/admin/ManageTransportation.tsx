import { useState, useMemo } from 'react'
import { StatsCard } from '../../components/ui/StatCard'

type Transportation = {
  id: string
  orderId: string
  customer: string
  destination: string
  carrier: string
  status: 'In Transit' | 'Delivered' | 'Delayed' | 'Pending'
  statusClassName: string
  lastUpdate: string
  eta: string
  striped?: boolean
}

const transportation: Transportation[] = [
  {
    id: '#SHIP-001',
    orderId: '#ORD-9981',
    customer: 'Nguyễn Văn A',
    destination: 'Hà Nội',
    carrier: 'DHL',
    status: 'In Transit',
    statusClassName: 'bg-blue-400/10 text-blue-400 ring-blue-400/20',
    lastUpdate: '10m ago',
    eta: 'Today',
    striped: true,
  },
  {
    id: '#SHIP-002',
    orderId: '#ORD-8822',
    customer: 'Trần Thị B',
    destination: 'TP.HCM',
    carrier: 'FedEx',
    status: 'Delivered',
    statusClassName: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    lastUpdate: '1h ago',
    eta: 'Completed',
  },
  {
    id: '#SHIP-003',
    orderId: '#ORD-7731',
    customer: 'Lê Văn C',
    destination: 'Đà Nẵng',
    carrier: 'UPS',
    status: 'Delayed',
    statusClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    lastUpdate: '30m ago',
    eta: 'Tomorrow',
    striped: true,
  },
  {
    id: '#SHIP-004',
    orderId: '#ORD-6619',
    customer: 'Phạm Văn D',
    destination: 'Cần Thơ',
    carrier: 'GHN',
    status: 'Pending',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    lastUpdate: '5m ago',
    eta: 'Processing',
  },
]

function getStatusDot(status: Transportation['status']) {
  if (status === 'Delayed') return 'bg-red-400 animate-pulse'
  if (status === 'Pending') return 'bg-orange-400'
  if (status === 'In Transit') return 'bg-blue-400'
  return 'bg-emerald-400'
}

export const TransportationManagement: React.FC = () => {
  const [search, setSearch] = useState('')

  const filteredTransportation = useMemo(() => {
    return transportation.filter(t =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.orderId.toLowerCase().includes(search.toLowerCase()) ||
      t.customer.toLowerCase().includes(search.toLowerCase())
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
              <StatsCard title="Tổng đơn vận chuyển" value={320} icon="local_shipping" accentColor="primary" trend={{ direction: 'up', percentage: 4.2, text: 'this week' }} />
              <StatsCard title="Đang giao" value={120} icon="sync" accentColor="primary" trend={{ direction: 'up', percentage: 2.1, text: 'in transit' }} />
              <StatsCard title="Hoàn thành" value={180} icon="check_circle" accentColor="primary" trend={{ direction: 'up', percentage: 3.5, text: 'delivered' }} />
              <StatsCard title="Trễ hạn" value={20} icon="warning" accentColor="orange" trend={{ direction: 'down', percentage: 1.2, text: 'delayed' }} />
            </div>

            {/* Table */}
            <section className="glass-panel rounded-xl border border-white/5 overflow-hidden flex flex-col">

              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-lg font-bold text-white">
                  QUẢN LÝ VẬN CHUYỂN
                </h3>

                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm đơn, khách hàng..."
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
                      <th className="px-6 py-4">Shipment ID</th>
                      <th className="px-6 py-4">Order</th>
                      <th className="px-6 py-4">Khách hàng</th>
                      <th className="px-6 py-4">Điểm đến</th>
                      <th className="px-6 py-4">Đơn vị vận chuyển</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Thời gian dự kiến</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {filteredTransportation.length > 0 ? (
                      filteredTransportation.map((t) => (
                        <tr key={t.id} className={`${t.striped ? 'bg-white/[0.02]' : ''}`}>
                          <td className="px-6 py-4 text-cyan-400 font-mono">{t.id}</td>
                          <td className="px-6 py-4 text-white">{t.orderId}</td>
                          <td className="px-6 py-4">{t.customer}</td>
                          <td className="px-6 py-4 text-slate-400">{t.destination}</td>
                          <td className="px-6 py-4">{t.carrier}</td>

                          <td className="px-6 py-4">
                            <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ring-1 ${t.statusClassName}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(t.status)}`} />
                              {t.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-400">{t.eta}</td>

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
                          Không tìm thấy đơn vận chuyển
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/5 text-xs text-slate-400">
                Showing {filteredTransportation.length} of {transportation.length} transportation
              </div>

            </section>
          </div>
        </div>
      </main>
    </div>
  )
}