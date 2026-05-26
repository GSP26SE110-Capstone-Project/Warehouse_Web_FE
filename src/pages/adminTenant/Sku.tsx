import { useState, useEffect } from 'react'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import type { movementCategory, SkuRequest, SkuResponse, SkuStatus } from '../../types/Product'
import { productApi } from '../../service/productApi'
import { SkuModal } from '../../components/ui/modal/SkuModal'
import { WPagination } from '../../components/ui/WhitePagination'

export const Sku = () => {
    const [sku, setSku] = useState<SkuResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
    const [selectedSku, setSelectedSku] = useState<SkuResponse>()
    const [currentPage, setCurrentPage] = useState(1)
    const [confirmAlert, setConfirmAlert] = useState<{ open: boolean; message: string; action?: () => void }>({
        open: false,
        message: ''
    })

    const [categories, setCategories] = useState<Map<string, string>>(new Map())
    const [collections, setCollections] = useState<Map<string, string>>(new Map())

    // Fetch sku on mount
    useEffect(() => {
        fetchSku()
    }, [])

    const fetchSku = async () => {
        try {
            setIsLoading(true)
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            const tenantId = user.tenantId
            const response = await productApi.getAllSkus(tenantId)
            const resData = response.data

            if (resData.data && Array.isArray(resData.data)) {
                setSku(resData.data)
            } else {
                setSku([])
            }
        } catch (error) {
            console.error('Error fetching sku:', error)
            setConfirmAlert({
                open: true,
                message: 'Lỗi khi tải sản phẩm'
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}')
                const tenantId = user.tenantId || user.id

                // Fetch categories
                const categoriesRes = await productApi.getAllCategories()
                if (categoriesRes.data?.data && Array.isArray(categoriesRes.data.data)) {
                    const categoryMap = new Map(
                        categoriesRes.data.data.map((cat: any) => [cat.categoryId, cat.categoryName])
                    )
                    setCategories(categoryMap)
                }

                // Fetch collections
                const collectionsRes = await productApi.getAllCollections(tenantId)
                if (collectionsRes.data?.data && Array.isArray(collectionsRes.data.data)) {
                    const collectionMap = new Map(
                        collectionsRes.data.data.map((col: any) => [col.collectionId, col.collectionName])
                    )
                    setCollections(collectionMap)
                }
            } catch (err) {
                console.error('Lỗi tải dữ liệu:', err)
            }
        }

        fetchMasterData()
    }, [])

    const handleOpenModal = (mode: 'create' | 'edit' | 'view', sku?: SkuResponse) => {
        setModalMode(mode)
        setSelectedSku(sku)
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setSelectedSku(undefined)
    }

    const handleSubmit = async (data: SkuRequest) => {
        try {
            if (modalMode === 'create') {
                await productApi.createSku(data)
                setConfirmAlert({
                    open: true,
                    message: 'Tạo sản phẩm thành công'
                })
            } else if (modalMode === 'edit' && selectedSku) {
                await productApi.updateSku(selectedSku.skuId, data)
                setConfirmAlert({
                    open: true,
                    message: 'Cập nhật sản phẩm thành công'
                })
            }
            fetchSku()
            handleCloseModal()
        } catch (error) {
            console.error('Error submitting sku:', error)
            setConfirmAlert({
                open: true,
                message: 'Lỗi khi lưu sản phẩm'
            })
        }
    }

    const handleDeleteSku = (sku: SkuResponse) => {
        setConfirmAlert({
            open: true,
            message: `Bạn có chắc chắn muốn xóa sản phẩm "${sku.productName}" không?`,
            action: async () => {
                try {
                    await productApi.deleteSku(sku.skuId)
                    setConfirmAlert({
                        open: true,
                        message: 'Xóa sản phẩm thành công'
                    })
                    fetchSku()
                } catch (error) {
                    console.error('Error deleting sku:', error)
                    setConfirmAlert({
                        open: true,
                        message: 'Lỗi khi xóa sản phẩm'
                    })
                }
            }
        })
    }

    const getStatusBadge = (status: SkuStatus) => {
        const statusMap = {
            ACTIVE: { label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
            INACTIVE: { label: 'Không hoạt động', color: 'bg-red-100 text-red-800' },
        }
        return statusMap[status] || statusMap.ACTIVE
    }

    const pageSize = 5

    const totalItems = sku.length

    const totalPages = Math.ceil(totalItems / pageSize)

    const paginatedSku = sku.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    const start =
        totalItems === 0
            ? 0
            : (currentPage - 1) * pageSize + 1

    const end = Math.min(
        currentPage * pageSize,
        totalItems
    )

    return (
        <div>
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-lg font-bold text-slate-800">
                    SẢN PHẨM
                </h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleOpenModal('create')}
                        className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-bold hover:bg-cyan-600 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        thêm sản phẩm
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-6 py-3">Mã sku</th>
                            <th className="px-6 py-3">Tên sản phẩm</th>
                            <th className="px-6 py-3">Bộ sưu tập</th>
                            <th className="px-6 py-3">Chất liệu</th>
                            <th className="px-6 py-3">Danh mục</th>
                            <th className="px-6 py-3">Trạng thái</th>
                            <th className="px-6 py-3 text-right">
                                Hành động
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5 text-sm">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined animate-spin">autorenew</span>
                                        Đang tải...
                                    </div>
                                </td>
                            </tr>
                        ) : sku.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    Không có sản phẩm nào
                                </td>
                            </tr>
                        ) : (
                            paginatedSku.map(sku => (
                                <tr key={sku.skuId} className="bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                                    <td className="px-6 py-3 font-medium font-bold text-slate-900">
                                        {sku.skuCode}
                                    </td>
                                    <td className="px-6 py-3 font-medium text-slate-600">
                                        {sku.productName}
                                    </td>

                                    <td className="px-6 py-3">
                                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                                            {collections.get(sku.collectionId) || sku.collectionId}
                                        </span>
                                    </td>

                                    <td className="px-6 py-3">
                                        <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                                            {sku.material}
                                        </span>
                                    </td>

                                    <td className="px-6 py-3 text-slate-800">
                                        {categories.get(sku.categoryId) || sku.categoryId || '------'}
                                    </td>

                                     <td className="px-6 py-3 text-slate-400">
                                        {getStatusBadge(sku.status) && (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(sku.status).color}`}>
                                                {getStatusBadge(sku.status).label}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-2 opacity-80 hover:opacity-500 transition-opacity">
                                            <button
                                                onClick={() => handleOpenModal('view', sku)}
                                                className="p-1.5 hover:bg-cyan-500/10 rounded transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <span className="material-symbols-outlined">visibility</span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal('edit', sku)}
                                                className="p-1.5 hover:bg-cyan-500/10 rounded transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSku(sku)}
                                                className="p-1.5 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                                                title="Xóa"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 px-6 py-2">
                <p className="font-mono text-xs text-slate-600">
                    Showing <span className="text-slate-800">{start}-{end}</span> of{' '}
                    <span className="text-slate-800">{totalItems}</span> items
                </p>

                <WPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
            {modalOpen && (
                <SkuModal
                    mode={modalMode}
                    data={selectedSku}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmit}
                />
            )}

            {confirmAlert.open && (
                <AlertModal
                    title={confirmAlert.action ? 'Xác nhận' : 'Thông báo'}
                    message={confirmAlert.message}
                    type={confirmAlert.action ? 'confirm' : 'success'}
                    onConfirm={() => {
                        confirmAlert.action?.()
                        setConfirmAlert({ open: false, message: '' })
                    }}
                    onClose={() => setConfirmAlert({ open: false, message: '' })}
                />
            )}
        </div>
    )
}
