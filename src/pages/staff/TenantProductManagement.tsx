import { useCallback, useEffect, useMemo, useState } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { Pagination } from '../../components/ui/Pagination'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { SkuModal, type SkuFormPayload } from '../../components/ui/modal/SkuModal'
import { ProductMasterDataPanel } from '../../components/product/ProductMasterDataPanel'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as skusApi from '../../api/skus'
import type { ApiSku } from '../../api/skus'
import { fetchProductKindCatalogTree, fetchSizeFactors } from '../../api/productCatalog'
import type { ApiProductKindTreeNode, ApiSizeFactor } from '../../api/productCatalog'
import * as collectionsApi from '../../api/collections'
import * as seasonsApi from '../../api/seasons'
import { MOVEMENT_LABELS } from '../../data/skuOptions'
import { WhiteStatCard } from '../../components/ui/WhiteStatCard'

export const TenantProductManagement = () => {
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''
  const canEdit = user?.role === 'TENANT_ADMIN'

  const [skus, setSkus] = useState<ApiSku[]>([])
  const [catalogTree, setCatalogTree] = useState<ApiProductKindTreeNode[]>([])
  const [sizeFactors, setSizeFactors] = useState<ApiSizeFactor[]>([])
  const [collections, setCollections] = useState<
    Awaited<ReturnType<typeof collectionsApi.listCollections>>['items']
  >([])
  const [seasons, setSeasons] = useState<
    Awaited<ReturnType<typeof seasonsApi.listSeasons>>['items']
  >([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all')

  const [modal, setModal] = useState<{
    open: boolean
    mode: 'create' | 'edit' | 'view'
    data?: ApiSku
  }>({ open: false, mode: 'view' })

  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'confirm'
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', message: '' })

  const [pageTab, setPageTab] = useState<'skus' | 'master'>('skus')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const productKindMap = useMemo(() => {
    const map = new Map<string, { displayName: string; groupName: string }>()
    for (const group of catalogTree) {
      for (const kind of group.productKinds ?? []) {
        map.set(kind.productKind, {
          displayName: kind.displayName,
          groupName: group.displayNameVi,
        })
      }
    }
    return map
  }, [catalogTree])
  const collectionMap = useMemo(
    () => new Map(collections.map((c) => [c.collectionId, c.collectionName])),
    [collections]
  )
  const seasonMap = useMemo(
    () => new Map(seasons.map((s) => [s.seasonId, s.seasonName])),
    [seasons]
  )

  const loadData = useCallback(async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [skuRes, catalog, sizes, colRes, seasonRes] = await Promise.all([
        skusApi.listSkus({ tenantId, limit: 200 }),
        fetchProductKindCatalogTree(),
        fetchSizeFactors(),
        collectionsApi.listCollections({ tenantId, limit: 100 }),
        seasonsApi.listSeasons({ limit: 100 }),
      ])
      setSkus(skuRes.items)
      setCatalogTree(catalog.tree ?? [])
      setSizeFactors(sizes)
      setCollections(colRes.items)
      setSeasons(seasonRes.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách hàng hóa')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return skus.filter((s) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        s.skuCode.toLowerCase().includes(q) ||
        s.productName.toLowerCase().includes(q) ||
        (s.color ?? '').toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [skus, search, statusFilter])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  const activeCount = skus.filter((s) => s.status === 'ACTIVE').length
  const fastCount = skus.filter((s) => s.movementCategory === 'FAST').length

  const buildBody = (form: SkuFormPayload) => ({
    tenantId,
    skuCode: form.skuCode,
    productName: form.productName,
    productKind: form.productKind,
    collectionId: form.collectionId || undefined,
    seasonId: form.seasonId || undefined,
    color: form.color || undefined,
    size: form.size || undefined,
    material: form.material || undefined,
    movementCategory: form.movementCategory,
    status: form.status,
  })

  const handleSubmit = async (form: SkuFormPayload) => {
    if (!tenantId) return
    if (modal.mode === 'create') {
      await skusApi.createSku(buildBody(form))
      setAlert({ open: true, type: 'success', message: 'Đã thêm SKU' })
    } else if (modal.mode === 'edit' && modal.data) {
      await skusApi.updateSku(modal.data.skuId, {
        productName: form.productName,
        productKind: form.productKind || null,
        collectionId: form.collectionId || null,
        seasonId: form.seasonId || null,
        color: form.color || undefined,
        size: form.size || undefined,
        material: form.material || undefined,
        movementCategory: form.movementCategory,
        status: form.status,
      })
      setAlert({ open: true, type: 'success', message: 'Đã cập nhật SKU' })
    }
    await loadData()
  }

  const handleDelete = (sku: ApiSku) => {
    setAlert({
      open: true,
      type: 'confirm',
      message: `Xóa SKU ${sku.skuCode}?`,
      onConfirm: async () => {
        await skusApi.deleteSku(sku.skuId)
        await loadData()
        setAlert({ open: true, type: 'success', message: 'Đã xóa SKU' })
      },
    })
  }

  if (!tenantId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 font-medium text-amber-700">
        Tài khoản chưa gắn tenant. Liên hệ System Admin.
      </div>
    )
  }

  return (
    // Đổi màu nền bao quát thành màu xám sáng cực nhẹ của Layout
    <div className="flex min-h-full flex-col bg-slate-50/50 text-slate-700">
      <LoadingOverlay show={loading} text="Đang tải hàng hóa..." />

      <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý hàng hóa</h1>
          </div>
          
          {/* Tab Switcher - Màu sáng tinh tế */}
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setPageTab('skus')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                pageTab === 'skus' 
                  ? 'bg-sky-50 text-sky-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              SKU
            </button>
            <button
              type="button"
              onClick={() => setPageTab('master')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                pageTab === 'master' 
                  ? 'bg-sky-50 text-sky-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Danh mục & master
            </button>
          </div>
        </div>

        {error && (
          <InlineAlert message={error} onDismiss={() => setError('')} />
        )}

        {pageTab === 'master' ? (
          <ProductMasterDataPanel
            tenantId={tenantId}
            canEdit={canEdit}
            categories={categories} 
            collections={collections}
            seasons={seasons}
            onRefresh={loadData}
          />
        ) : (
          <>
            {/* Vùng Thẻ Thống Kê (StatsCard nội tại sẽ tự đổi màu sáng từ component của nó) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <WhiteStatCard title="Tổng SKU" value={skus.length} icon="inventory_2" accentColor="emerald" />
              <WhiteStatCard title="Đang active" value={activeCount} icon="check_circle" accentColor="primary" />
              <WhiteStatCard title="Hàng đi nhanh" value={fastCount} icon="speed" accentColor="orange" />
            </div>

            {/* Bảng Panel chính - Chuyển sang thẻ nền trắng đổ bóng thanh lịch */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Thanh Toolbar trên đầu bảng */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Ô tìm kiếm sáng */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm mã SKU, tên, màu..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  
                  {/* Dropdown Bộ lọc sáng */}
                  <select
                    aria-label="Lọc trạng thái"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all focus:border-sky-500 focus:outline-none"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as typeof statusFilter)
                      setCurrentPage(1)
                    }}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {/* Nút thêm mới - Chuyển thành xanh dương Corporate hiện đại */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setModal({ open: true, mode: 'create' })}
                    className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-sky-700 transition-all active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    THÊM SKU
                  </button>
                )}
              </div>

              {/* Khu vực Bảng dữ liệu */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    {/* Header Table đổi sang xám nhạt mịn */}
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3.5">Mã SKU</th>
                      <th className="px-6 py-3.5">Tên sản phẩm</th>
                      <th className="px-6 py-3.5">Loại hàng</th>
                      <th className="px-6 py-3.5">Màu / Size</th>
                      <th className="px-6 py-3.5">Luân chuyển</th>
                      <th className="px-6 py-3.5 text-center">Trạng thái</th>
                      <th className="px-6 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                          {loading ? 'Đang tải…' : 'Chưa có SKU. Thêm mã hàng để chuẩn bị nhập kho.'}
                        </td>
                      </tr>
                    ) : (
                      paginated.map((s) => (
                        <tr key={s.skuId} className="hover:bg-slate-50/80 transition-colors">
                          {/* Mã hàng đổi sang font chữ xanh dương đậm rõ ràng */}
                          <td className="px-6 py-4 font-mono font-semibold text-sky-700">{s.skuCode}</td>
                          <td className="px-6 py-4 font-medium text-slate-900">{s.productName}</td>
                          <td className="px-6 py-4 text-xs">
                            <span className="font-medium text-slate-800">
                              {productKindMap.get(s.productKind ?? '')?.displayName ?? s.productKind ?? '—'}
                            </span>
                            {s.productKind && productKindMap.get(s.productKind)?.groupName && (
                              <span className="block text-slate-400 mt-0.5">
                                {productKindMap.get(s.productKind)?.groupName}
                              </span>
                            )}
                            {s.collectionId && (
                              <span className="block font-mono text-[11px] text-slate-400 mt-0.5">
                                {collectionMap.get(s.collectionId) ?? ''}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {[s.color, s.size].filter(Boolean).join(' · ') || '—'}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {MOVEMENT_LABELS[s.movementCategory ?? ''] ?? s.movementCategory}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {/* Badge trạng thái chuẩn hóa màu sắc nền sáng */}
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                s.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          {/* Khối Actions sửa đổi nút nhấn mờ xám dịu */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setModal({ open: true, mode: 'view', data: s })}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                                title="Xem"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              {canEdit && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setModal({ open: true, mode: 'edit', data: s })}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                                    title="Sửa"
                                  >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(s)}
                                    className="rounded-lg p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                    title="Xóa"
                                  >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Phân trang với viền sáng */}
              {filtered.length > pageSize && (
                <div className="border-t border-slate-100 px-6 py-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filtered.length / pageSize)}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Modals kế thừa style thông qua props và cấu hình của hệ thống */}
      {modal.open && (
        <SkuModal
          mode={modal.mode}
          data={modal.data}
          catalogTree={catalogTree}
          sizeFactors={sizeFactors}
          collections={collections}
          seasons={seasons}
          onClose={() => setModal({ open: false, mode: 'view' })}
          onSubmit={canEdit ? handleSubmit : undefined}
        />
      )}

      {alert.open && alert.message && (
        <AlertModal
          title={alert.type === 'confirm' ? 'Xác nhận' : 'Thông báo'}
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ open: false, type: 'success', message: '' })}
          onConfirm={alert.onConfirm}
        />
      )}
    </div>
  )
}