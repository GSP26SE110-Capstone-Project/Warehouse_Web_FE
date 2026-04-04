import { useState, useEffect, useMemo } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import type { InventoryItem } from '../../types/Warehouse'
import { Pagination } from '../../components/ui/Pagination'
import { InventoryModal } from '../../components/ui/modal/InventoryModal'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { initialInventory } from '../../data/initialData'

export const InventoryManagement: React.FC = () => {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'old'>('all')

    const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)

    const [modal, setModal] = useState<{
        open: boolean
        mode: 'create' | 'edit' | 'view'
        data?: InventoryItem
    }>({ open: false, mode: 'view' })

    const [alert, setAlert] = useState<{
        open: boolean
        type: 'success' | 'confirm'
        message: string
        onConfirm?: () => void
    }>({ open: false, type: 'success', message: '' })

    // const handleSubmit = (form: any) => {
    //     if (modal.mode === 'create') {
    //         const newItem: InventoryItem = {
    //             sku: `#SKU-${Math.floor(Math.random() * 1000)}`,
    //             importDate: new Date().toISOString().slice(0, 10),
    //             warehouse: 'Warehouse A',
    //             ...form,
    //         }

    //         setInventory([newItem, ...inventory])

    //         setAlert({ open: true, type: 'success', message: 'Tạo thành công' })
    //     }

    //     if (modal.mode === 'edit' && modal.data) {
    //         const updated = inventory.map((item) =>
    //             item.sku === modal.data!.sku ? { ...item, ...form } : item
    //         )

    //         setInventory(updated)

    //         setAlert({ open: true, type: 'success', message: 'Cập nhật thành công' })
    //     }
    // }

    // const handleDelete = (sku: string) => {
    //     setInventory(inventory.filter((item) => item.sku !== sku))
    //     setAlert({ open: true, type: 'success', message: 'Xóa thành công' })
    // }

    // ===== SEARCH =====
    const filteredInventory = useMemo(() => {
        return inventory.filter((item) => {
            const matchSearch =
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.location.toLowerCase().includes(search.toLowerCase()) ||
                item.warehouse.toLowerCase().includes(search.toLowerCase()) ||
                item.customer?.toLowerCase().includes(search.toLowerCase()) ||
                item.sku.toLowerCase().includes(search.toLowerCase())

            return matchSearch
        })
    }, [search, statusFilter, inventory])

    // ===== PAGINATION =====
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 4

    const totalItems = filteredInventory.length
    const totalPages = Math.ceil(totalItems / pageSize)

    const paginatedInventory = filteredInventory.slice(
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

            <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
                <div className="absolute inset-0 z-0 bg-[#0b101a]/90 backdrop-blur-sm" />
                <div className="relative z-10 flex-1 p-8">
                    <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
                            <StatsCard
                                title="Tổng hàng hóa"
                                value={14205}
                                icon="inventory_2"
                                accentColor="emerald"
                            />
            
                        </div>

                        <section className="glass-panel flex flex-col overflow-hidden rounded-xl border border-white/5">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-5">
                                <h3 className="text-lg font-bold tracking-wide text-white">HÀNG TRONG KHO HIỆN TẠI</h3>
                                <div className="flex gap-3">
                                    {/* Search */}
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            search
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Tìm theo tên,..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-10 pr-4 py-2 rounded-lg bg-[#1a2333] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                                        />
                                    </div>

                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-[#131b29] text-xs uppercase tracking-wider text-slate-400">
                                            <th className="px-6 py-4 font-medium">SKU</th>
                                            <th className="px-6 py-4 font-medium">Nhà kho</th>
                                            <th className="px-6 py-4 font-medium">Vị trí</th>
                                            <th className="px-6 py-4 font-medium">Ngày nhập kho</th>
                                            <th className="px-6 py-4 font-medium">Khách hàng</th>
                                            <th className="px-6 py-4 text-right font-medium">Hoạt động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {paginatedInventory.map((item) => {
                                            return (
                                                <tr
                                                    key={item.sku}
                                                    className={`group transition-colors ${item.sku ? 'bg-white/[0.02]' : 'bg-transparent'
                                                        }`}
                                                >
                                                     <td className="px-6 py-4 font-mono text-cyan-400">
                                                        {item.sku}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-cyan-400">
                                                        {item.warehouse}
                                                    </td>

                                                    <td className="px-6 py-4 font-medium text-white">
                                                        {item.location}
                                                    </td>

                                                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                                        {item.importDate}
                                                    </td>
                                                
                                                    <td className="px-6 py-4 text-slate-400">
                                                        {item.customer}
                                                    </td>

                                                    {/* ACTION */}
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-3 opacity-60 transition-opacity group-hover:opacity-100">
                                                            <button
                                                                onClick={() => {
                                                                    setModal({ open: true, mode: 'view', data: item })
                                                                }} className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white">
                                                                <span className="material-symbols-outlined text-lg">
                                                                    visibility
                                                                </span>
                                                            </button>
                                                          
                                                            <button className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white">
                                                                <span className="material-symbols-outlined text-lg">
                                                                    qr_code
                                                                </span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
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
                <InventoryModal
                    mode= "view"
                    data={modal.data}
                    onClose={() => setModal({ ...modal, open: false })}
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