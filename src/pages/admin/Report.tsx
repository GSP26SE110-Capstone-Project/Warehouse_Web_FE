import { useState, useMemo, useEffect } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { ReportViewModal } from '../../components/ui/modal/ReportDetailModal'
import { Pagination } from '../../components/ui/Pagination'

type Report = {
  id: string
  staffName: string
  title: string
  type: 'Incident' | 'Inventory' | 'Delivery'
  typeClassName: string
  status: 'Pending' | 'Reviewed' | 'Rejected'
  statusClassName: string
  createdAt: string
  priority: 'Low' | 'Medium' | 'High'
  priorityClassName: string
  striped?: boolean
}

const reports: Report[] = [
  {
    id: '#REP-001',
    staffName: 'Nguyễn Văn A',
    title: 'Thiếu hàng SKU-9021',
    type: 'Inventory',
    typeClassName: 'bg-blue-400/10 text-blue-400 ring-blue-400/20',
    status: 'Pending',
    statusClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
    createdAt: '10m ago',
    priority: 'High',
    priorityClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    striped: true,
  },
  {
    id: '#REP-002',
    staffName: 'Trần Thị B',
    title: 'Giao hàng trễ đơn #ORD-8822',
    type: 'Delivery',
    typeClassName: 'bg-purple-400/10 text-purple-400 ring-purple-400/20',
    status: 'Reviewed',
    statusClassName: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
    createdAt: '1h ago',
    priority: 'Medium',
    priorityClassName: 'bg-orange-400/10 text-orange-400 ring-orange-400/20',
  },
  {
    id: '#REP-003',
    staffName: 'Lê Văn C',
    title: 'Hư hỏng hàng hóa',
    type: 'Incident',
    typeClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    status: 'Rejected',
    statusClassName: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
    createdAt: '2h ago',
    priority: 'High',
    priorityClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    striped: true,
  },
  {
    id: '#REP-004',
    staffName: 'Lê Văn C',
    title: 'Hư hỏng hàng hóa',
    type: 'Incident',
    typeClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    status: 'Rejected',
    statusClassName: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
    createdAt: '2h ago',
    priority: 'High',
    priorityClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    striped: true,
  },
  {
    id: '#REP-005',
    staffName: 'Lê Văn C',
    title: 'Hư hỏng hàng hóa',
    type: 'Incident',
    typeClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    status: 'Rejected',
    statusClassName: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
    createdAt: '2h ago',
    priority: 'High',
    priorityClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    striped: true,
  },
  {
    id: '#REP-006',
    staffName: 'Lê Văn C',
    title: 'Hư hỏng hàng hóa',
    type: 'Incident',
    typeClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    status: 'Rejected',
    statusClassName: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
    createdAt: '2h ago',
    priority: 'High',
    priorityClassName: 'bg-red-400/10 text-red-400 ring-red-400/20',
    striped: true,
  },
]

export const Reports: React.FC = () => {
  const [search, setSearch] = useState('')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'rejected'>('all')
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchSearch =
        r.staffName.toLowerCase().includes(search.toLowerCase()) ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase())

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
            ? r.status === 'Pending'
            : statusFilter === 'reviewed'
              ? r.status === 'Reviewed'
              : r.status === 'Rejected'

      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  // ESC để đóng modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedReport(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4
  const totalItems = filteredReports.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedData = filteredReports.slice(
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard title="Tổng báo cáo" value={86} icon="description" accentColor="emerald" />
              <StatsCard title="Chờ duyệt" value={12} icon="hourglass_top" accentColor="primary" />
              <StatsCard title="Đã xử lý" value={60} icon="check_circle" accentColor="orange" />
              <StatsCard title="Bị từ chối" value={14} icon="cancel" accentColor="purple" />
            </div>

            {/* Table */}
            <section className="glass-panel rounded-xl border border-white/5 overflow-hidden flex flex-col">

              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-lg font-bold text-white">
                  BÁO CÁO NHÂN VIÊN
                </h3>

                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm báo cáo..."
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
                    <option value="pending">Chờ duyệt</option>
                    <option value="reviewed">Đã xử lý</option>
                    <option value="rejected">Bị từ chối</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-[#131b29] text-xs uppercase text-slate-400 border-b border-white/5">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Nhân viên</th>
                      <th className="px-6 py-4">Tiêu đề</th>
                      <th className="px-6 py-4">Loại</th>
                      <th className="px-6 py-4">Ngày tạo</th>
                      <th className="px-6 py-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedData.map((r) => (
                      <tr key={r.id} className={`${r.striped ? 'bg-white/[0.02]' : ''}`}>
                        <td className="px-6 py-4 text-cyan-400 font-mono">{r.id}</td>
                        <td className="px-6 py-4">{r.staffName}</td>
                        <td className="px-6 py-4">{r.title}</td>

                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded ring-1 ${r.typeClassName}`}>
                            {r.type}
                          </span>
                        </td>

                        <td className="px-6 py-4">{r.createdAt}</td>

                        <td className="px-6 py-4 opacity-60 hover:opacity-100">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="hover:bg-white/10 rounded p-1 ml-5"
                          >
                            <span className="material-symbols-outlined ">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
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
      {selectedReport && (
        <ReportViewModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  )
}