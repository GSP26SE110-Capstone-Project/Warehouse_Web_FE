import { useState, useMemo, useEffect } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { useNavigate } from 'react-router-dom'
import type { ImportExportReport } from '../../types/ImportExport'
import { RequestShipmentModal } from '../../components/ui/modal/RequestTransportationModel'
import { AssignDriverModal } from '../../components/ui/modal/AssignDriverModal'
import { ImportExportModal } from '../../components/ui/modal/ImportExportModal'


/* ================= MOCK DATA ================= */

const initialReports: ImportExportReport[] = [
    {
        id: 1,
        customer: 'Công ty ABC',
        warehouse: 'Kho A1',
        description: 'Nhập 1000kg hàng hóa từ Kho Tổng về Kho A1',
        type: 'import',
        weight: 1000,
        origin: 'Kho Tổng',
        destination: 'Kho A1',
        driver: 'Nguyễn Văn A',
        createdAt: '2023-01-01',
    },
    {
        id: 2,
        customer: 'Công ty XYZ',
        warehouse: 'Kho B1',
        description: 'Xuất 500kg hàng hóa từ Kho B1 đến Khách hàng',
        type: 'export',
        weight: 500,
        origin: 'Kho B1',
        destination: 'Khách hàng',
        driver: 'Trần Văn B',
        createdAt: '2023-01-02',
    }
]

/* ================= COMPONENT ================= */

export const ReportManagement = () => {
    const [reports, setReports] = useState(initialReports)
    const [filter, setFilter] = useState<ImportExportReport['type'] | 'all'>('all')
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const navigate = useNavigate()

    /* ===== MODALS ===== */
    const [modal, setModal] = useState<{ open: boolean; data?: ImportExportReport }>({
        open: false
    })


    const [alert, setAlert] = useState<{
        open: boolean
        message: string
    }>({ open: false, message: '' })
    /* ================= FILTER ================= */

    const filtered = useMemo(() => {
        return reports.filter(r => {
            const matchSearch =
                r.customer.toLowerCase().includes(search.toLowerCase()) ||
                r.warehouse.toLowerCase().includes(search.toLowerCase())
const matchFilter = filter === 'all' || r.type === filter

            return matchSearch && matchFilter
        })
    }, [reports, search, filter])

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


    /* ================= STATS ================= */

    const stats = {
        total: reports.length,
        import: reports.filter(r => r.type === 'import').length,
        export: reports.filter(r => r.type === 'export').length,
    }

    const statusImportExport: Record<ImportExportReport['type'], { label: string; classname: string}> = {
        import: { label: 'Nhập kho', classname: 'bg-blue-400/10 text-blue-400 ring-blue-400/20' },
        export: { label: 'Xuất kho', classname: 'bg-orange-500/10 text-orange-500 ring-orange-500/20' },
    }
    /* ================= UI ================= */

    return (
        <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 ">

            <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
                <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />

                <div className="relative z-10 p-8">
                    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatsCard title="Tổng" value={stats.total} icon='description' accentColor='emerald' />
                            <StatsCard title="Nhập kho" value={stats.import} icon='local_shipping' accentColor='primary' />
                            <StatsCard title="Xuất kho" value={stats.export} icon='local_shipping' accentColor='orange' />

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
                                        onChange={(e) => setFilter(e.target.value as ImportExportReport['type'] | 'all')}
                                        className="px-3 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm"
                                    >
                                        <option value="all">Tất cả</option>
                                        <option value="import">Nhập kho</option>
                                        <option value="export">Xuất kho</option>
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
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-white/5">
                                        {paginatedRequests.map(r => (
                                            <tr key={r.id} className="border-t border-gray-700">
                                                <td className="p-3">{r.id}</td>
                                                <td>{r.customer}</td>
                                                <td>{r.warehouse}</td>
                                                <td>
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusImportExport[r.type].classname}`
                                                        
                                                        }
                                                        >
                                                            {statusImportExport[r.type].label}
                                                        </span>
                                                    </td>
                                                <td>
                                                    {r.createdAt}
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
            {/* {modal.open && modal.data && (
                <ImportExportModal
                    mode="view"
                    type={modal.data.type}
                    data={modal.data}
                    onClose={() => setModal({ open: false })}

                    onApprove={(data) => {
                        if (data.hasTransport) {
                            setAssignDriverModal({
                                open: true,
                                requestId: data.id
                            })
                        } else {
                            updateStatus(data.id, 'APPROVED')

                            setAlert({
                                open: true,
                                message: 'Đã duyệt yêu cầu'
                            })
                        }
                    }}

                    onReject={(id) => {
                        updateStatus(id, 'CANCELED')
                        setAlert({
                            open: true,
                            message: 'Đã hủy yêu cầu'
                        })
                    }}
                />
            )} */}

            {/* ===== ASSIGN DRIVER MODAL ===== */}
            {/* <AssignDriverModal
                open={assignDriverModal.open}
                request={assignDriverModal.requestId ? requests.find(r => r.id === assignDriverModal.requestId) : undefined}
                onClose={() => setAssignDriverModal({ open: false })}
                onSubmit={(driverId) => {

                    console.log('Driver:', driverId)
                    console.log('Request:', assignDriverModal.requestId)

                    // 👉 CALL API tạo vận chuyển ở đây

                    updateStatus(assignDriverModal.requestId!, 'APPROVED')

                    setAssignDriverModal({ open: false })

                    setAlert({
                        open: true,
                        message: 'Đã tạo vận chuyển & phân công tài xế'
                    })
                }}
            /> */}

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