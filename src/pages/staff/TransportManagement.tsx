import { useState, useMemo, useEffect } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { useNavigate } from 'react-router-dom'
import type { RequestTransportation } from '../../types/Transportation'
import { RequestShipmentModal } from '../../components/ui/modal/RequestTransportationModel'
import { initialTransportRequests } from '../../data/initialData'

/* ================= COMPONENT ================= */

export const StaffRequestManagement = () => {
    const [requests, setRequests] = useState<RequestTransportation[]>(initialTransportRequests)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<RequestTransportation['status'] | 'all'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const navigate = useNavigate()

    /* ===== MODALS ===== */
    const [modal, setModal] = useState<{ open: boolean; data?: RequestTransportation }>({
        open: false
    })

    const [assignDriverModal, setAssignDriverModal] = useState<{
        open: boolean
        requestId?: number
    }>({
        open: false
    })

    const [alert, setAlert] = useState<{
        open: boolean
        message: string
    }>({ open: false, message: '' })
    /* ================= FILTER ================= */

    const filtered = useMemo(() => {
        return requests.filter(r => {
            const matchSearch =
                r.customer.toLowerCase().includes(search.toLowerCase()) ||
                r.warehouse.toLowerCase().includes(search.toLowerCase())

            const matchFilter = filter === 'all' || r.status === filter

            return matchSearch && matchFilter
        })
    }, [requests, search, filter])

    /* ================= PAGINATION ================= */

    const pageSize = 4

    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / pageSize)

    const paginatedRequests = filtered.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalItems)

    useEffect(() => {
        setCurrentPage(1)
    }, [search, filter])

    /* ================= ACTION ================= */

    const updateStatus = (id: number, status: RequestTransportation['status']) => {
        setRequests(prev =>
            prev.map(r => (r.id === id ? { ...r, status } : r))
        )
    }

    /* ================= STATS ================= */

    const stats = {
        total: requests.length,
        approved: requests.filter(r => r.status === 'APPROVED').length,
        canceled: requests.filter(r => r.status === 'CANCELED').length,
        waiting: requests.filter(r => r.status === 'WAITING').length,
    }

    const statusShipment: Record<RequestTransportation['status'], { label: string; color: string }> = {
        WAITING: { label: 'Chờ duyệt', color: 'bg-amber-400/10 text-amber-400 ring-amber-400/20' },
        CANCELED: { label: 'Đã hủy', color: 'bg-gray-400/10 text-gray-400 ring-gray-400/20' },
        APPROVED: { label: 'Đã duyệt', color: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' },
    }
    /* ================= UI ================= */

    return (
        <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 ">

            <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
                <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />

                <div className="relative z-10 p-8">
                    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatsCard title="Tổng" value={stats.total} icon='description' accentColor='emerald' />
                            <StatsCard title="Chờ duyệt" value={stats.waiting} icon='pending' accentColor='primary' />
                            <StatsCard title="Đã duyệt" value={stats.approved} icon='local_shipping' accentColor='orange' />
                            <StatsCard title="Đã hủy" value={stats.canceled} icon='local_shipping' accentColor='purple' />

                        </div>

                        {/* Table */}
                        <section className="glass-panel rounded-xl border border-white/5 overflow-hidden flex flex-col">

                            {/* Header */}
                            <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-bold text-white">QUẢN LÝ YÊU CẦU</h3>
                                <div className="flex gap-3">
                                    {/* Search */}
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            search
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Tìm yêu cầu..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-10 pr-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                                        />
                                    </div>

                                    {/* Filter */}
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value as RequestTransportation['status'] | 'all')}
                                        className="px-3 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm"
                                    >
                                        <option value="all">Tất cả</option>
                                        <option value="WAITING">Chờ duyệt</option>
                                        <option value="CANCELED">Đã hủy</option>
                                        <option value="APPROVED">Đã duyệt</option>
                                    </select>

                                </div>
                            </div>
                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-[#131b29] text-xs uppercase text-slate-400 border-b border-white/5">
                                            <th className="p-3">ID</th>
                                            <th>Khách hàng</th>
                                            <th>Kho</th>
                                            <th>Loại</th>
                                            <th>Thời gian</th>
                                            <th>Trạng thái</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-white/5">
                                        {paginatedRequests.map(r => (
                                            <tr key={r.id} className="border-t border-gray-700">
                                                <td className="p-3">{r.id}</td>
                                                <td>{r.customer}</td>
                                                <td>{r.fromAdress}</td>
                                                <td>
                                                    {r.toAdress}
                                                </td>
                                                <td>
                                                    {r.actyalStartTime} → {r.actualEndTime}
                                                </td>

                                                <td >
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusShipment[r.status].color}`}>
                                                        {statusShipment[r.status].label}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 opacity-60 hover:opacity-100">

                                                    {/* View */}
                                                    <button
                                                        onClick={() => setModal({ open: true, data: r })}
                                                        className="hover:bg-white/10 rounded p-1"
                                                    >
                                                        <span className="material-symbols-outlined">visibility</span>
                                                    </button>

                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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

            {/* ===== REQUEST MODAL ===== */}
            {modal.open && modal.data && (
                <RequestShipmentModal
                    mode="view"
                    data={modal.data}
                    onClose={() => setModal({ open: false })}
                />
            )}

            {/* ===== ALERT ===== */}
            {alert.open && (
                <AlertModal
                    title="Thông báo"
                    message={alert.message}
                    onClose={() => setAlert({ open: false, message: '' })}
                />
            )}

        </div>
    )
}