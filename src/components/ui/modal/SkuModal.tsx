import { useState, useEffect } from 'react'
import type {
    SkuRequest,
    SkuResponse,
    CategoryResponse,
    CollectionResponse,
    SeasonResponse,
    SkuStatus,
    movementCategory,
} from '../../../types/Product'
import { productApi } from '../../../service/productApi'

type Mode = 'view' | 'edit' | 'create'

type Props = {
    mode: Mode
    data?: SkuResponse
    onClose: () => void
    onSubmit?: (data: SkuRequest) => void
}

export const SkuModal: React.FC<Props> = ({
    mode,
    data,
    onClose,
    onSubmit,
}) => {
    const isView = mode === 'view'
    const isCreate = mode === 'create'

    const [categories, setCategories] = useState<CategoryResponse[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [collections, setCollections] = useState<CollectionResponse[]>([])
    const [loadingCollections, setLoadingCollections] = useState(false)
    const [seasons, setSeasons] = useState<SeasonResponse[]>([])
    const [loadingSeasons, setLoadingSeasons] = useState(false)

    // Fetch categories, collections, seasons on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}')
                const tenantId = user.tenantId || user.id

                // Fetch categories
                setLoadingCategories(true)
                const categoriesRes = await productApi.getAllCategories()
                if (categoriesRes.data.success && categoriesRes.data.data) {
                    setCategories(categoriesRes.data.data as unknown as CategoryResponse[])
                }

                // Fetch collections
                setLoadingCollections(true)
                const collectionsRes = await productApi.getAllCollections(tenantId)
                if (collectionsRes.data.success && collectionsRes.data.data) {
                    setCollections(collectionsRes.data.data as unknown as CollectionResponse[])
                }

                // Fetch seasons
                setLoadingSeasons(true)
                const seasonsRes = await productApi.getAllSeasons()
                if (seasonsRes.data.success && seasonsRes.data.data) {
                    setSeasons(seasonsRes.data.data as unknown as SeasonResponse[])
                }
            } catch (err) {
                console.error('Lỗi tải dữ liệu:', err)
            } finally {
                setLoadingCategories(false)
                setLoadingCollections(false)
                setLoadingSeasons(false)
            }
        }

        fetchData()
    }, [])

    const [form, setForm] = useState({
        tenantId: '',
        skuCode: '',
        productName: '',
        categoryId: '',
        collectionId: '',
        seasonId: '',
        color: '',
        size: '',
        material: '',
        movementCategory: 'NORMAL' as movementCategory,
        status: 'ACTIVE' as SkuStatus,
    })

    // Cập nhật form khi có dữ liệu (View/Edit mode)
    useEffect(() => {
        if (data) {
            setForm({
                tenantId: data.tenantId,
                skuCode: data.skuCode,
                productName: data.productName,
                categoryId: data.categoryId,
                collectionId: data.collectionId,
                seasonId: data.seasonId,
                color: data.color,
                size: data.size,
                material: data.material,
                movementCategory: data.movementCategory,
                status: data.status,
            })
        } else {
            // Get tenantId từ localStorage cho create mode
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            const tenantId = user.tenantId || user.id
            setForm(prev => ({ ...prev, tenantId }))
        }
    }, [data])

    const handleSubmit = () => {
        if (isView) return

        // Validation
        if (!form.skuCode) {
            alert('Vui lòng điền mã SKU')
            return
        }

        if (!form.productName) {
            alert('Vui lòng điền tên sản phẩm')
            return
        }

        if (!form.categoryId) {
            alert('Vui lòng chọn danh mục')
            return
        }

        if (!form.collectionId) {
            alert('Vui lòng chọn bộ sưu tập')
            return
        }

        if (!form.seasonId) {
            alert('Vui lòng chọn mùa')
            return
        }

        const submitData: SkuRequest = {
            tenantId: form.tenantId,
            skuCode: form.skuCode,
            productName: form.productName,
            categoryId: form.categoryId,
            collectionId: form.collectionId,
            seasonId: form.seasonId,
            color: form.color,
            size: form.size,
            material: form.material,
            movementCategory: form.movementCategory,
            status: form.status,
        }

        onSubmit?.(submitData)
        onClose()
    }

    const isEditMode = !isCreate && !isView

    const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block'
    const inputStyle = 'w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-600">
                                {isCreate ? 'add_box' : isView ? 'info' : 'edit'}
                            </span>
                            {isCreate ? 'Tạo sản phẩm mới' : isView ? 'Chi tiết sản phẩm' : 'Cập nhật sản phẩm'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">

                    {/* Section: Thông tin cơ bản */}
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-cyan-700 tracking-[2px]">THÔNG TIN CƠ BẢN</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Mã SKU *</label>
                                <input
                                    disabled={isView || isEditMode}
                                    className={inputStyle}
                                    placeholder="SKU-001"
                                    value={form.skuCode}
                                    onChange={(e) => setForm({ ...form, skuCode: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Tên sản phẩm *</label>
                                <input
                                    disabled={isView}
                                    className={inputStyle}
                                    placeholder="Tên sản phẩm"
                                    value={form.productName}
                                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Danh mục *</label>
                                <select
                                    disabled={isView || loadingCategories}
                                    className={inputStyle}
                                    value={form.categoryId}
                                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map((category) => (
                                        <option key={category.categoryId} value={category.categoryId}>
                                            {category.categoryName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelStyle}>Bộ sưu tập *</label>
                                <select
                                    disabled={isView || loadingCollections}
                                    className={inputStyle}
                                    value={form.collectionId}
                                    onChange={(e) => setForm({ ...form, collectionId: e.target.value })}
                                >
                                    <option value="">-- Chọn bộ sưu tập --</option>
                                    {collections.map((collection) => (
                                        <option key={collection.collectionId} value={collection.collectionId}>
                                            {collection.collectionName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelStyle}>Mùa *</label>
                                <select
                                    disabled={isView || loadingSeasons }
                                    className={inputStyle}
                                    value={form.seasonId}
                                    onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
                                >
                                    <option value="">-- Chọn mùa --</option>
                                    {seasons.map((season) => (
                                        <option key={season.seasonId} value={season.seasonId}>
                                            {season.seasonName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelStyle}>Trạng thái</label>
                                <select
                                    disabled={isView}
                                    className={inputStyle}
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value as SkuStatus })}
                                >
                                    <option value="ACTIVE">Hoạt động</option>
                                    <option value="INACTIVE">Không hoạt động</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section: Thông tin chi tiết */}
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-orange-700 tracking-[2px]">THÔNG TIN CHI TIẾT</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Màu sắc</label>
                                <input
                                    disabled={isView}
                                    className={inputStyle}
                                    placeholder="Màu sắc (VD: Đỏ, Xanh)"
                                    value={form.color}
                                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Kích cỡ</label>
                                <input
                                    disabled={isView}
                                    className={inputStyle}
                                    placeholder="Kích cỡ (VD: M, L, XL)"
                                    value={form.size}
                                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Chất liệu</label>
                                <input
                                    disabled={isView}
                                    className={inputStyle}
                                    placeholder="Chất liệu (VD: Cotton, Linen)"
                                    value={form.material}
                                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Danh mục chuyển động</label>
                                <select
                                    disabled={isView}
                                    className={inputStyle}
                                    value={form.movementCategory}
                                    onChange={(e) => setForm({ ...form, movementCategory: e.target.value as movementCategory })}
                                >
                                    <option value="FAST">Nhanh</option>
                                    <option value="NORMAL">Bình thường</option>
                                    <option value="SLOW">Chậm</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Nhật ký thời gian */}
                    {!isCreate && data && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <label className={labelStyle}>Ngày tạo</label>
                                <input
                                    disabled
                                    className={inputStyle}
                                    value={data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : '---'}
                                />
                            </div>
                            <div>
                                <label className={labelStyle}>Cập nhật cuối</label>
                                <input
                                    disabled
                                    className={inputStyle}
                                    value={data.updatedAt ? new Date(data.updatedAt).toLocaleString('vi-VN') : '---'}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                        Hủy bỏ
                    </button>
                    {!isView && (
                        <button
                            onClick={handleSubmit}
                            className="bg-cyan-600 hover:bg-cyan-700 px-6 py-2.5 rounded-lg text-sm font-bold text-white flex items-center gap-2 shadow-sm shadow-cyan-500/20 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            {isCreate ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}