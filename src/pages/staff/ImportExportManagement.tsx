import { useState, useMemo, useEffect } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import type { ImportExportDetail } from '../../types/ImportExport'
import { ImportExportModal } from '../../components/ui/modal/ImportExportModal'
import { importExportApi } from '../../service/importexportApi'

export const ImportExportManagement = () => {
    const [requests, setRequests] = useState<ImportExportDetail[]>([])
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<ImportExportDetail['status'] | 'all'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(false)

    const [modal, setModal] = useState<{ open: boolean; data?: ImportExportDetail }>({
        open: false
    })

    const [alert, setAlert] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

    // Hàm lấy danh sách dữ liệu từ API
    const getAllRequests = async () => {
        setLoading(true)
        try {
            const res = await importExportApi.getAll()
            if (res.data && res.data.records) {
                setRequests(res.data.records)
            }
        }
        catch (error) {
            console.error('Failed to fetch import/export records:', error)
            setAlert({ open: true, message: 'Không thể tải dữ liệu từ máy chủ.' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getAllRequests()
    }, [])

    /* ================= ACTION HANDLERS (CALL API) ================= */

    const handleApprove = async (id: string) => {
        try {
            setLoading(true);
            // Gọi API cập nhật trạng thái thành APPROVED
            await importExportApi.updateStatus(id, 'APPROVED');

            setAlert({
                open: true,
                message: 'Phê duyệt lệnh thành công!'
            });

            setModal({ open: false });
            getAllRequests(); // Tải lại danh sách để cập nhật UI
        } catch (error: any) {
            console.error('Lỗi khi phê duyệt:', error);
            setAlert({
                open: true,
                message: 'Không thể phê duyệt. Vui lòng thử lại!'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (id: string) => {
        try {
            setLoading(true);
            // Gọi API cập nhật trạng thái thành CANCELED (hoặc REJECTED tùy backend)
            await importExportApi.updateStatus(id, 'CANCELED');

            setAlert({
                open: true,
                message: 'Đã từ chối/hủy lệnh thành công.'
            });

            setModal({ open: false });
            getAllRequests();
        } catch (error: any) {
            console.error('Lỗi khi từ chối:', error);
            setAlert({
                open: true,
                message: 'Thao tác thất bại.'
            });
        } finally {
            setLoading(false);
        }
    };

    /* ================= LOGIC FILTER & PAGINATION ================= */

    const filtered = useMemo(() => {
        const term = search.toLowerCase().trim();
        return requests.filter(r => {
            const matchSearch =
                r.recordCode.toLowerCase().includes(search.toLowerCase()) ||
                r.contractId.toLowerCase().includes(search.toLowerCase())
            const matchFilter = filter === 'all' || r.status === filter
            return matchSearch && matchFilter
        })
    }, [requests, search, filter])

    const pageSize = 5
    const totalPages = Math.ceil(filtered.length / pageSize)
    const paginatedRequests = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const stats = {
        total: requests.length,
        approved: requests.filter(r => r.status === 'APPROVED').length,
        waiting: requests.filter(r => r.status === 'PENDING').length,
        canceled: requests.filter(r => r.status === 'CANCELED' || r.status === 'REJECTED').length,
    }

    return (
        <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 min-h-screen">
            <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">
                <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" />

                <div className="relative z-10 p-8">
                    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatsCard title="Tổng yêu cầu" value={stats.total} icon='description' accentColor='emerald' />
                            <StatsCard title="Chờ duyệt" value={stats.waiting} icon='pending' accentColor='primary' />
                            <StatsCard title="Đã duyệt" value={stats.approved} icon='task_alt' accentColor='orange' />
                            <StatsCard title="Đã hủy/Từ chối" value={stats.canceled} icon='cancel' accentColor='purple' />
                        </div>

                        {/* Table */}
                        <section className="glass-panel rounded-xl border border-white/5 overflow-hidden flex flex-col bg-[#131b29]/40 backdrop-blur-md">
                            <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-bold text-white tracking-widest uppercase">Quản lý lệnh Nhập/Xuất</h3>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                        <input
                                            type="text"
                                            placeholder="Tìm mã lệnh, hợp đồng..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-10 pr-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400 w-64"
                                        />
                                    </div>
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value as any)}
                                        className="px-3 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-slate-300 outline-none"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="PENDING">Chờ duyệt</option>
                                        <option value="APPROVED">Đã duyệt</option>
                                        <option value="CANCELED">Đã hủy</option>
                                        <option value="REJECTED">Đã từ chối</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-white/[0.02] text-xs uppercase text-slate-500 border-b border-white/5">
                                            <th className="px-6 py-4">Mã yêu cầu</th>
                                            <th className="px-6 py-4">Hợp đồng</th>
                                            <th className="px-6 py-4">Kho</th>
                                            <th className="px-6 py-4">Loại hình</th>
                                            <th className="px-6 py-4">Ngày dự kiến</th>
                                            <th className="px-6 py-4">Trạng thái</th>
                                            <th className="px-6 py-4 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {paginatedRequests.map(r => (
                                            <tr key={r.recordId} className="hover:bg-white/[0.01] transition-colors border-b border-white/5 last:border-0">
                                                <td className="px-6 py-4 font-mono text-cyan-400">{r.recordCode}</td>
                                                <td className="px-6 py-4 text-slate-300">{r.contractId}</td>
                                                <td className="px-6 py-4 text-slate-400">{r.warehouseId}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${r.recordType === 'IMPORT' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                                        {r.recordType === 'IMPORT' ? 'NHẬP KHO' : 'XUẤT KHO'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">
                                                    {r.scheduledDatetime ? new Date(r.scheduledDatetime).toLocaleDateString('vi-VN') : '---'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`flex items-center gap-1.5 ${r.status === 'APPROVED' ? 'text-emerald-400' : r.status === 'PENDING' ? 'text-amber-400' : 'text-red-400'}`}>
                                                        <span className="size-1.5 rounded-full bg-current"></span>
                                                        <span className="text-xs font-medium uppercase">{r.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setModal({ open: true, data: r })}
                                                        className="size-8 inline-flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">visibility</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center bg-white/[0.01]">
                                <p className="text-xs text-slate-500">
                                    Đang hiển thị {paginatedRequests.length} / {filtered.length} bản ghi
                                </p>
                                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Modal chi tiết & Xử lý duyệt/hủy */}
            {modal.open && modal.data && (
                <ImportExportModal
                    mode="view"
                    type={modal.data.recordType === 'IMPORT' ? 'import' : 'export'}
                    data={modal.data}
                    onClose={() => setModal({ open: false })}
                onApprove={() => handleApprove(modal.data!.recordId)}
                onReject={() => handleReject(modal.data!.recordId)}
                />
            )}

            {/* Alert thông báo */}
            {alert.open && (
                <AlertModal
                    title="Thông báo hệ thống"
                    message={alert.message}
                    onClose={() => setAlert({ open: false, message: '' })}
                />
            )}
        </div>
    )
}