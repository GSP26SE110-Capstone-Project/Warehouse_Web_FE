import { useState, useMemo, useEffect } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { RequestDetailModal } from '../../components/ui/modal/RequestDetailModal'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { ContractModal } from '../../components/ui/modal/ContractModal'
import { initialRequests } from '../../data/initialData'
import type { Request } from '../../types/Contract'


export const RequestManagement = () => {
    const [requests, setRequests] = useState(initialRequests)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<Request['status'] | 'all'>('all')
    const [currentPage, setCurrentPage] = useState(1)

    /* ===== MODALS ===== */
    const [modal, setModal] = useState<{ open: boolean; data?: Request }>({
        open: false
    })

    const [contractModal, setContractModal] = useState<{
        open: boolean
        data?: Request
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
                r.id.toLowerCase().includes(search.toLowerCase())

            const matchFilter = filter === 'all' || r.status === filter

            return matchSearch && matchFilter
        })
    }, [requests, search, filter])

    /* ================= PAGINATION ================= */
    const pageSize = 5

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
    const updateStatus = (id: string, status: Request['status']) => {
        setRequests(prev =>
            prev.map(r => (r.id === id ? { ...r, status } : r))
        )
    }

    /* ================= STATS ================= */
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'PENDING').length,
        approved: requests.filter(r => r.status === 'APPROVED').length,
        rejected: requests.filter(r => r.status === 'REJECTED').length
    }

    const statusColors: Record<Request['status'], { label: string; color: string }> = {
        PENDING: { label: 'Chờ duyệt', color: 'bg-yellow-400/10 text-yellow-400 ring-yellow-400/20' },
        APPROVED: { label: 'Đã duyệt', color: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' },
        REJECTED: { label: 'Từ chối', color: 'bg-red-400/10 text-red-400 ring-red-400/20' }
    }

    /* ================= UI ================= */

    return (
        <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 ">

            <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
                <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />

                <div className="relative z-10 p-6">
                    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
                            <StatsCard title="Tổng" value={stats.total} icon='description' accentColor='emerald' />
                            <StatsCard title="Chờ duyệt" value={stats.pending} icon='pending' accentColor='primary' />
                            <StatsCard title="Đã duyệt" value={stats.approved} icon='check' accentColor='orange' />
                            <StatsCard title="Từ chối" value={stats.rejected} icon='close' accentColor='purple' />
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
                                        onChange={(e) => setFilter(e.target.value as Request['status'] | 'all')}
                                        className="px-3 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm"
                                    >
                                        <option value="all">Tất cả</option>
                                        <option value="approved">Đã duyệt</option>
                                        <option value="rejected">Từ chối</option>
                                        <option value="pending">Chờ duyệt</option>
                                    </select>

                                </div>
                            </div>
                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-[#131b29] text-xs uppercase text-slate-400 border-b border-white/5 ">
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
                                                <td className="p-3 text-cyan-400 font-mono">{r.id}</td>
                                                <td>{r.customer}</td>
                                                <td>{r.warehouse}</td>
                                                <td>
                                                    {r.type === 'rent' ? 'Thuê mới' : 'Gia hạn'}
                                                </td>
                                                <td>
                                                    {r.startDate} → {r.endDate}
                                                </td>

                                                <td>
                                                    {r.status === 'PENDING' ? (
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors[r.status].color}`}>
                                                            {statusColors[r.status].label}
                                                        </span>
                                                    ) : r.status === 'APPROVED' ? (
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors[r.status].color}`}>
                                                            {statusColors[r.status].label}
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors[r.status].color}`}>
                                                            {statusColors[r.status].label}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-3 opacity-60 hover:opacity-100">

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
                            <div className="flex items-center justify-between border-t border-white/5 bg-[#131b29] px-6 py-2">
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
                <RequestDetailModal
                    data={modal.data}
                    onClose={() => setModal({ open: false })}
                    onApprove={() => {
                        setModal({ open: false })
                        setContractModal({
                            open: true,
                            data: modal.data
                        })
                    }}
                    onReject={(id) => {
                        updateStatus(id, 'REJECTED')
                        setModal({ open: false })
                    }}
                />
            )}

            {/* ===== CONTRACT MODAL ===== */}
            {contractModal.open && contractModal.data && (
                <ContractModal
                    mode="create"
                    data={contractModal.data}
                    onClose={() => setContractModal({ open: false })}
                    onSubmit={async (form) => {
                        await fetch('/api/contracts/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(form)
                        })

                        updateStatus(contractModal.data!.id, 'APPROVED')

                        setAlert({
                            open: true,
                            message: 'Đã tạo & gửi hợp đồng!'
                        })

                        setContractModal({ open: false })
                    }}
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