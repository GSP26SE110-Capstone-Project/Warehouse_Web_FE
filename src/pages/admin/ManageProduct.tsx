import { useState, useEffect } from 'react'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { productApi } from '../../service/productApi'
import { WPagination } from '../../components/ui/WhitePagination'
import type { CategoryRequest, CategoryResponse, SeasonRequest, SeasonResponse } from '../../types/Product'
import { SeasonModal } from '../../components/ui/modal/SeasonModal'
import { CategoryModal } from '../../components/ui/modal/CategoryModal'
import { Pagination } from '../../components/ui/Pagination'

export const ManageProduct = () => {
    const [seasons, setSeasons] = useState<SeasonResponse[]>([])
    const [categories, setCategories] = useState<CategoryResponse[]>([])
    
    // Separate loading states
    const [isLoadingSeason, setIsLoadingSeason] = useState(true)
    const [isLoadingCategory, setIsLoadingCategory] = useState(true)
    
    // Separate pagination states
    const [currentPageSeason, setCurrentPageSeason] = useState(1)
    const [currentPageCategory, setCurrentPageCategory] = useState(1)
    
    const [modalOpen, setModalOpen] = useState(false)
    const [modalOpenCategory, setModalOpenCategory] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
    const [modalModeCategory, setModalModeCategory] = useState<'create' | 'edit' | 'view'>('create')
    const [selectedSeason, setSelectedSeason] = useState<SeasonResponse>()
    const [selectedCategory, setSelectedCategory] = useState<CategoryResponse>()
    
    // Separate alert states
    const [confirmAlertSeason, setConfirmAlertSeason] = useState<{ open: boolean; message: string; action?: () => void }>({
        open: false,
        message: ''
    })
    const [confirmAlertCategory, setConfirmAlertCategory] = useState<{ open: boolean; message: string; action?: () => void }>({
        open: false,
        message: ''
    })

    useEffect(() => {
        fetchSeasons()
        fetchCategories()
    }, [])

    const fetchSeasons = async () => {
        try {
            setIsLoadingSeason(true)
            const response = await productApi.getAllSeasons()
            const resData = response.data
            setSeasons(resData.data && Array.isArray(resData.data) ? resData.data : [])
        } catch (error) {
            console.error('Error fetching seasons:', error)
            setConfirmAlertSeason({ open: true, message: 'Lỗi khi tải mùa vụ' })
        } finally {
            setIsLoadingSeason(false)
        }
    }

    const fetchCategories = async () => {
        try {
            setIsLoadingCategory(true)
            const response = await productApi.getAllCategories()
            const resData = response.data
            setCategories(resData.data && Array.isArray(resData.data) ? resData.data : [])
        } catch (error) {
            console.error('Error fetching categories:', error)
            setConfirmAlertCategory({ open: true, message: 'Lỗi khi tải danh mục' })
        } finally {
            setIsLoadingCategory(false)
        }
    }

    // Season handlers
    const handleOpenModal = (mode: 'create' | 'edit' | 'view', season?: SeasonResponse) => {
        setModalMode(mode)
        setSelectedSeason(season)
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setSelectedSeason(undefined)
    }

    const handleSubmit = async (data: SeasonRequest) => {
        try {
            if (modalMode === 'create') {
                await productApi.createSeason(data)
                setConfirmAlertSeason({ open: true, message: 'Tạo theo mùa thành công' })
            } else if (modalMode === 'edit' && selectedSeason) {
                await productApi.updateSeason(selectedSeason.seasonId, data)
                setConfirmAlertSeason({ open: true, message: 'Cập nhật theo mùa thành công' })
            }
            fetchSeasons()
            handleCloseModal()
        } catch (error) {
            console.error('Error submitting season:', error)
            setConfirmAlertSeason({ open: true, message: 'Lỗi khi lưu theo mùa' })
        }
    }

    const handleDeleteSeason = (season: SeasonResponse) => {
        setConfirmAlertSeason({
            open: true,
            message: `Bạn có chắc chắn muốn xóa theo mùa "${season.seasonName}" không?`,
            action: async () => {
                try {
                    await productApi.deleteSeason(season.seasonId)
                    setConfirmAlertSeason({ open: true, message: 'Xóa theo mùa thành công' })
                    fetchSeasons()
                } catch (error) {
                    console.error('Error deleting season:', error)
                    setConfirmAlertSeason({ open: true, message: 'Lỗi khi xóa theo mùa' })
                }
            }
        })
    }

    // Category handlers
    const handleOpenModalCategory = (mode: 'create' | 'edit' | 'view', category?: CategoryResponse) => {
        setModalModeCategory(mode)
        setSelectedCategory(category)
        setModalOpenCategory(true)
    }

    const handleCloseModalCategory = () => {
        setModalOpenCategory(false)
        setSelectedCategory(undefined)
    }

    const handleSubmitCategory = async (data: CategoryRequest) => {
        try {
            if (modalModeCategory === 'create') {
                await productApi.createCategory(data)
                setConfirmAlertCategory({ open: true, message: 'Tạo danh mục thành công' })
            } else if (modalModeCategory === 'edit' && selectedCategory) {
                await productApi.updateCategory(selectedCategory.categoryId, data)
                setConfirmAlertCategory({ open: true, message: 'Cập nhật danh mục thành công' })
            }
            fetchCategories()
            handleCloseModalCategory()
        } catch (error) {
            console.error('Error submitting category:', error)
            setConfirmAlertCategory({ open: true, message: 'Lỗi khi lưu danh mục' })
        }
    }

    const handleDeleteCategory = (category: CategoryResponse) => {
        setConfirmAlertCategory({
            open: true,
            message: `Bạn có chắc chắn muốn xóa danh mục "${category.categoryName}" không?`,
            action: async () => {
                try {
                    await productApi.deleteCategory(category.categoryId)
                    setConfirmAlertCategory({ open: true, message: 'Xóa danh mục thành công' })
                    fetchCategories()
                } catch (error) {
                    console.error('Error deleting category:', error)
                    setConfirmAlertCategory({ open: true, message: 'Lỗi khi xóa danh mục' })
                }
            }
        })
    }

    // Pagination calculations
    const pageSize = 5

    // Season pagination
    const totalItemsSeason = seasons.length
    const totalPagesSeason = Math.ceil(totalItemsSeason / pageSize)
    const paginatedSeasons = seasons.slice(
        (currentPageSeason - 1) * pageSize,
        currentPageSeason * pageSize
    )
    const startSeason = totalItemsSeason === 0 ? 0 : (currentPageSeason - 1) * pageSize + 1
    const endSeason = Math.min(currentPageSeason * pageSize, totalItemsSeason)

    // Category pagination
    const totalItemsCategory = categories.length
    const totalPagesCategory = Math.ceil(totalItemsCategory / pageSize)
    const paginatedCategories = categories.slice(
        (currentPageCategory - 1) * pageSize,
        currentPageCategory * pageSize
    )
    const startCategory = totalItemsCategory === 0 ? 0 : (currentPageCategory - 1) * pageSize + 1
    const endCategory = Math.min(currentPageCategory * pageSize, totalItemsCategory)

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-6 text-slate-100">
            {/* Season Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-slate-900/50">
                        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-500">calendar_month</span>
                            Quản lý mùa thời trang
                        </h3>
                        <button
                            onClick={() => handleOpenModal('create')}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-cyan-900/30 text-sm"
                        >
                            <span className="material-symbols-outlined text-base">add</span>
                            Thêm mùa
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold">
                                    <th className="px-6 py-3.5">Tên mùa</th>
                                    <th className="px-6 py-3.5 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-sm">
                                {isLoadingSeason ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined animate-spin text-cyan-500">autorenew</span>
                                                Đang tải dữ liệu...
                                            </div>
                                        </td>
                                    </tr>
                                ) : seasons.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center text-slate-500 italic">
                                            Không có dữ liệu mùa vụ nào
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedSeasons.map(season => (
                                        <tr key={season.seasonId} className="bg-transparent hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-300">{season.seasonName}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => handleOpenModal('view', season)} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all" title="Xem chi tiết">
                                                        <span className="material-symbols-outlined text-xl">visibility</span>
                                                    </button>
                                                    <button onClick={() => handleOpenModal('edit', season)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all" title="Chỉnh sửa">
                                                        <span className="material-symbols-outlined text-xl">edit</span>
                                                    </button>
                                                    <button onClick={() => handleDeleteSeason(season)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Xóa">
                                                        <span className="material-symbols-outlined text-xl">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/20">
                    <p className="font-mono text-xs text-slate-500">
                        Showing <span className="text-slate-300">{startSeason}-{endSeason}</span> of{' '}
                        <span className="text-slate-300">{totalItemsSeason}</span> items
                    </p>
                    <Pagination
                        currentPage={currentPageSeason}
                        totalPages={totalPagesSeason}
                        onPageChange={setCurrentPageSeason}
                    />
                </div>
                
                {modalOpen && (
                    <SeasonModal
                        mode={modalMode}
                        data={selectedSeason}
                        onClose={handleCloseModal}
                        onSubmit={handleSubmit}
                    />
                )}
                {confirmAlertSeason.open && (
                    <AlertModal
                        title={confirmAlertSeason.action ? 'Xác nhận yêu cầu' : 'Thông báo'}
                        message={confirmAlertSeason.message}
                        type={confirmAlertSeason.action ? 'confirm' : 'success'}
                        onConfirm={() => {
                            confirmAlertSeason.action?.()
                            setConfirmAlertSeason({ open: false, message: '' })
                        }}
                        onClose={() => setConfirmAlertSeason({ open: false, message: '' })}
                    />
                )}
            </div>

            {/* Category Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-slate-900/50">
                        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-500">category</span>
                            Quản lý danh mục
                        </h3>
                        <button
                            onClick={() => handleOpenModalCategory('create')}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-cyan-900/30 text-sm"
                        >
                            <span className="material-symbols-outlined text-base">add</span>
                            Thêm danh mục
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold">
                                    <th className="px-6 py-3.5">Tên danh mục</th>
                                    <th className="px-6 py-3.5 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-sm">
                                {isLoadingCategory ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined animate-spin text-cyan-500">autorenew</span>
                                                Đang tải dữ liệu...
                                            </div>
                                        </td>
                                    </tr>
                                ) : categories.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center text-slate-500 italic">
                                            Không có dữ liệu danh mục nào
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCategories.map(category => (
                                        <tr key={category.categoryId} className="bg-transparent hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-300">{category.categoryName}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => handleOpenModalCategory('view', category)} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all" title="Xem chi tiết">
                                                        <span className="material-symbols-outlined text-xl">visibility</span>
                                                    </button>
                                                    <button onClick={() => handleOpenModalCategory('edit', category)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all" title="Chỉnh sửa">
                                                        <span className="material-symbols-outlined text-xl">edit</span>
                                                    </button>
                                                    <button onClick={() => handleDeleteCategory(category)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Xóa">
                                                        <span className="material-symbols-outlined text-xl">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/20">
                    <p className="font-mono text-xs text-slate-500">
                        Showing <span className="text-slate-300">{startCategory}-{endCategory}</span> of{' '}
                        <span className="text-slate-300">{totalItemsCategory}</span> items
                    </p>
                    <Pagination
                        currentPage={currentPageCategory}
                        totalPages={totalPagesCategory}
                        onPageChange={setCurrentPageCategory}
                    />
                </div>
                
                {modalOpenCategory && (
                    <CategoryModal
                        mode={modalModeCategory}
                        data={selectedCategory}
                        onClose={handleCloseModalCategory}
                        onSubmit={handleSubmitCategory}
                    />
                )}
                {confirmAlertCategory.open && (
                    <AlertModal
                        title={confirmAlertCategory.action ? 'Xác nhận yêu cầu' : 'Thông báo'}
                        message={confirmAlertCategory.message}
                        type={confirmAlertCategory.action ? 'confirm' : 'success'}
                        onConfirm={() => {
                            confirmAlertCategory.action?.()
                            setConfirmAlertCategory({ open: false, message: '' })
                        }}
                        onClose={() => setConfirmAlertCategory({ open: false, message: '' })}
                    />
                )}
            </div>
        </div>
    )
}