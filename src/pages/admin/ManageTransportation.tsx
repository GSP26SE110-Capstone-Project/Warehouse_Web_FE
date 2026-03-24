import { useState, useMemo, useEffect } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import type { Transportation } from '../../types/Warehouse'
import { Pagination } from '../../components/ui/Pagination'
import { TransportationModal } from '../../components/ui/modal/TransportationModal'
import { AlertModal } from '../../components/ui/modal/AlertModal'

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
    id: '#SHIP-005',
    orderId: '#ORD-6619',
    customer: 'Phạm Văn D',
    destination: 'Cần Thơ',
    carrier: 'GHN',
    status: 'Pending',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    lastUpdate: '5m ago',
    eta: 'Processing',
  },
   {
    id: '#SHIP-006',
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'in-transit' | 'delayed' | 'pending'>('all')
  const [transportationData, setTransportationData] = useState<Transportation[]>(transportation)

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'create' | 'edit' | 'view'
    data?: Transportation
  }>({ open: false, mode: 'view' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'confirm'
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  const handleSubmit = (form: any) => {
    if (modal.mode === 'create') {
      const newItem: Transportation = {
        id: `#SHIP-${Math.floor(Math.random() * 1000)}`,
        ...form,
      }

      setTransportationData([newItem, ...transportationData])

      setAlert({ open: true, type: 'success', message: 'Tạo thành công' })
    }

    if (modal.mode === 'edit' && modal.data) {
      const updated = transportationData.map((item) =>
        item.id === modal.data!.id ? { ...item, ...form } : item
      )

      setTransportationData(updated)

      setAlert({ open: true, type: 'success', message: 'Cập nhật thành công' })
    }
  }

  const handleDelete = (id: string) => {
    setTransportationData(transportationData.filter((item) => item.id !== id))
    setAlert({ open: true, type: 'success', message: 'Xóa thành công' })
  }

  const filteredTransportation = useMemo(() => {
    return transportationData.filter((item) => {
      // search theo id, order, customer
      const matchSearch =
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.orderId.toLowerCase().includes(search.toLowerCase()) ||
        item.customer.toLowerCase().includes(search.toLowerCase())

      // filter theo status
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'delivered'
            ? item.status === 'Delivered'
            : statusFilter === 'in-transit'
              ? item.status === 'In Transit'
              : statusFilter === 'delayed'
                ? item.status === 'Delayed'
                : item.status === 'Pending'

      return matchSearch && matchStatus
    })
  }, [search, statusFilter, transportationData])

  // ===== PAGINATION =====
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4

  const totalItems = filteredTransportation.length
  const totalPages = Math.ceil(totalItems / pageSize)

  const paginatedTransportation = filteredTransportation.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 pb-15">

      <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />

        <div className="relative z-10 p-8">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-8">

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatsCard title="Tổng vận chuyển" value={320} icon="local_shipping" accentColor="emerald" />
              <StatsCard title="Đang giao" value={120} icon="sync" accentColor="primary" />
              <StatsCard title="Hoàn thành" value={180} icon="check_circle" accentColor="orange" />
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

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">Tất cả</option>
                    <option value="in-transit">Đang giao</option>
                    <option value="delivered">Hoàn thành</option>
                    <option value="delayed">Trễ</option>
                    <option value="pending">Chờ xử lý</option>
                  </select>
                  <button
                    onClick={() => {
                      setModal({ open: true, mode: 'create' })
                    }}
                    className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold tracking-wide text-black shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40">
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span>THÊM VẬN CHUYỂN</span>
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
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Thời gian dự kiến</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {paginatedTransportation.length > 0 ? (
                      paginatedTransportation.map((t) => (
                        <tr key={t.id} className={`${t.striped ? 'bg-white/[0.02]' : ''}`}>
                          <td className="px-6 py-4 text-cyan-400 font-mono">{t.id}</td>
                          <td className="px-6 py-4 text-white">{t.orderId}</td>
                          <td className="px-6 py-4">{t.customer}</td>
                          <td className="px-6 py-4 text-slate-400">{t.destination}</td>
                          <td className="px-6 py-4">
                            <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ring-1 ${t.statusClassName}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(t.status)}`} />
                              {t.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-400">{t.eta}</td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-60 hover:opacity-100">
                              <button 
                                onClick={() => {
                                  setModal({ open: true, mode: 'view', data: t })
                                }}
                              className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined">visibility</span>
                              </button>
                              <button 
                                onClick={() => {
                                  setModal({ open: true, mode: 'edit', data: t })
                                }}
                                className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  setAlert({
                                    open: true,
                                    message: 'Bạn có chắc chắn muốn xóa đơn vận chuyển này?',
                                    type: 'confirm',
                                    onConfirm: () => {
                                      handleDelete(t.id)
                                    }
                                  })
                                }}
                                className="p-1.5 hover:bg-white/10 rounded">
                                <span className="material-symbols-outlined">delete</span>
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

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-white/5 bg-[#131b29] px-6 py-4">
                <p className="font-mono text-xs text-slate-400">
                  Showing <span className="text-white">{start}-{end}</span> of{' '}
                  <span className="text-white">{totalItems}</span> items
                </p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>

            </section>
          </div>
        </div>
      </main>
      {modal.open && (
        <TransportationModal
          mode={modal.mode}
          data={modal.data}
          onClose={() => setModal({ ...modal, open: false })}
          onSubmit={handleSubmit}
        />
      )}
      {/* Alert */}
      {alert.open && (
        <AlertModal
          title="Thông báo"
          message={alert.message}
          type={alert.type}
          onConfirm={alert.onConfirm}
          onClose={() => setAlert({ ...alert, open: false })}
        />
      )}
    </div>
  )
}