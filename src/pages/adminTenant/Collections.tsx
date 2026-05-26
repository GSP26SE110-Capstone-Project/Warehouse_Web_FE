import { useState, useEffect } from 'react'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { productApi } from '../../service/productApi'
import { SkuModal } from '../../components/ui/modal/SkuModal'
import { WPagination } from '../../components/ui/WhitePagination'
import type { CollectionRequest, CollectionResponse } from '../../types/Product'
import { CollectionModal } from '../../components/ui/modal/CollectionModal'

export const Collections = () => {
    const [collections, setCollections] = useState<CollectionResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
    const [selectedCollection, setSelectedCollection] = useState<CollectionResponse>()
    const [currentPage, setCurrentPage] = useState(1)
    const [confirmAlert, setConfirmAlert] = useState<{ open: boolean; message: string; action?: () => void }>({
        open: false,
        message: ''
    })


    // Fetch collections on mount
    useEffect(() => {
        fetchCollections()
    }, [])

    const fetchCollections = async () => {
        try {
            setIsLoading(true)
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            const tenantId = user.tenantId
            const response = await productApi.getAllCollections(tenantId)
            const resData = response.data

            if (resData.data && Array.isArray(resData.data)) {
                setCollections(resData.data)
            } else {
                setCollections([])
            }
        } catch (error) {
            console.error('Error fetching collections:', error)
            setConfirmAlert({
                open: true,
                message: 'Lỗi khi tải sản phẩm'
            })
        } finally {
            setIsLoading(false)
        }
    }


    const handleOpenModal = (mode: 'create' | 'edit' | 'view', collection?: CollectionResponse) => {
        setModalMode(mode)
        setSelectedCollection(collection)
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setSelectedCollection(undefined)
    }

    const handleSubmit = async (data: CollectionRequest) => {
        try {
            if (modalMode === 'create') {
                await productApi.createCollection(data)
                setConfirmAlert({
                    open: true,
                    message: 'Tạo bộ sưu tập thành công'
                })
            } else if (modalMode === 'edit' && selectedCollection) {
                await productApi.updateCollection(selectedCollection.collectionId, data)
                setConfirmAlert({
                    open: true,
                    message: 'Cập nhật bộ sưu tập thành công'
                })
            }
            fetchCollections()
            handleCloseModal()
        } catch (error) {
            console.error('Error submitting collection:', error)
            setConfirmAlert({
                open: true,
                message: 'Lỗi khi lưu bộ sưu tập'
            })
        }
    }

    const handleDeleteCollection = (collection: CollectionResponse) => {
        setConfirmAlert({
            open: true,
            message: `Bạn có chắc chắn muốn xóa bộ sưu tập "${collection.collectionName}" không?`,
            action: async () => {
                try {
                    await productApi.deleteCollection(collection.collectionId)
                    setConfirmAlert({
                        open: true,
                        message: 'Xóa bộ sưu tập thành công'
                    })
                    fetchCollections()
                } catch (error) {
                    console.error('Error deleting collection:', error)
                    setConfirmAlert({
                        open: true,
                        message: 'Lỗi khi xóa bộ sưu tập'
                    })
                }
            }
        })
    }


    const pageSize = 5

    const totalItems = collections.length

    const totalPages = Math.ceil(totalItems / pageSize)

    const paginatedCollections = collections.slice(
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
                    BỘ SƯU TẬP
                </h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleOpenModal('create')}
                        className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-bold hover:bg-cyan-600 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        thêm bộ sưu tập
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-20 py-3">Tên bộ sưu tập</th>
                            <th className="px-20 py-3 text-right">
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
                        ) : collections.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    Không có bộ sưu tập nào
                                </td>
                            </tr>
                        ) : (
                            paginatedCollections.map(collection => (
                                <tr key={collection.collectionId} className="bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                                    <td className="px-6 font-medium font-bold text-slate-900">
                                        {collection.collectionName}
                                    </td>

                                    <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-2 opacity-80 hover:opacity-500 transition-opacity">
                                            <button
                                                onClick={() => handleOpenModal('view', collection)}
                                                className="p-1.5 hover:bg-cyan-500/10 rounded transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <span className="material-symbols-outlined">visibility</span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal('edit', collection)}
                                                className="p-1.5 hover:bg-cyan-500/10 rounded transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCollection(collection)}
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
                <CollectionModal
                    mode={modalMode}
                    data={selectedCollection}
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
