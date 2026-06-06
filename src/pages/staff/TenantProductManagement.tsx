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
import * as categoriesApi from '../../api/categories'
import * as skusApi from '../../api/skus'
import type { ApiSku } from '../../api/skus'
import { fetchProductKindCatalogTree, fetchSizeFactors } from '../../api/productCatalog'
import type { ApiProductKindTreeNode, ApiSizeFactor } from '../../api/productCatalog'
import * as collectionsApi from '../../api/collections'
import * as seasonsApi from '../../api/seasons'
import { MOVEMENT_LABELS } from '../../data/skuOptions'

export const TenantProductManagement = () => {
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''
  const canEdit = user?.role === 'TENANT_ADMIN'

  const [skus, setSkus] = useState<ApiSku[]>([])
  const [catalogTree, setCatalogTree] = useState<ApiProductKindTreeNode[]>([])
  const [sizeFactors, setSizeFactors] = useState<ApiSizeFactor[]>([])
  const [categories, setCategories] = useState<
    Awaited<ReturnType<typeof categoriesApi.listCategories>>['items']
  >([])
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
  const loadData = useCallback(async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [skuRes, catalog, sizes, catRes, colRes, seasonRes] = await Promise.all([
        skusApi.listSkus({ tenantId, limit: 200 }),
        fetchProductKindCatalogTree(),
        fetchSizeFactors(),
        categoriesApi.listCategories({ limit: 100 }),
        collectionsApi.listCollections({ tenantId, limit: 100 }),
        seasonsApi.listSeasons({ limit: 100 }),
      ])
      setSkus(skuRes.items)
      setCatalogTree(catalog.tree ?? [])
      setSizeFactors(sizes)
      setCategories(catRes.items)
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
      <div className="p-8 text-amber-300">
        Tài khoản chưa gắn tenant. Liên hệ System Admin.
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading} text="Đang tải hàng hóa..." />

      <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Quản lý hàng hóa</h1>
            <p className="mt-1 text-sm text-slate-400">
              SKU và master data (danh mục, bộ sưu tập, mùa) — dùng cho nhập / xuất kho
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setPageTab('skus')}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                pageTab === 'skus' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
              }`}
            >
              SKU
            </button>
            <button
              type="button"
              onClick={() => setPageTab('master')}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                pageTab === 'master' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatsCard title="Tổng SKU" value={skus.length} icon="inventory_2" accentColor="emerald" />
          <StatsCard title="Đang active" value={activeCount} icon="check_circle" accentColor="primary" />
          <StatsCard title="Hàng đi nhanh" value={fastCount} icon="speed" accentColor="orange" />
        </div>

        <section className="glass-panel overflow-hidden rounded-xl border border-white/5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
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
                  className="rounded-lg border border-white/10 bg-[#1a2333] py-2 pl-10 pr-4 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <select
                aria-label="Lọc trạng thái"
                className="rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm text-white"
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
            {canEdit && (
              <button
                type="button"
                onClick={() => setModal({ open: true, mode: 'create' })}
                className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-black"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                THÊM SKU
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#131b29] text-xs uppercase text-slate-400">
                  <th className="px-6 py-4">Mã SKU</th>
                  <th className="px-6 py-4">Tên sản phẩm</th>
                  <th className="px-6 py-4">Loại hàng</th>
                  <th className="px-6 py-4">Màu / Size</th>
                  <th className="px-6 py-4">Luân chuyển</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      {loading ? 'Đang tải…' : 'Chưa có SKU. Thêm mã hàng để chuẩn bị nhập kho.'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((s) => (
                    <tr key={s.skuId} className="hover:bg-white/5">
                      <td className="px-6 py-4 font-mono text-cyan-400">{s.skuCode}</td>
                      <td className="px-6 py-4 text-white">{s.productName}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {productKindMap.get(s.productKind ?? '')?.displayName ??
                          s.productKind ??
                          '—'}
                        {s.productKind && productKindMap.get(s.productKind)?.groupName && (
                          <span className="block text-slate-500">
                            {productKindMap.get(s.productKind)?.groupName}
                          </span>
                        )}
                        {s.collectionId && (
                          <span className="block text-slate-600">
                            {collectionMap.get(s.collectionId) ?? ''}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {[s.color, s.size].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {MOVEMENT_LABELS[s.movementCategory ?? ''] ?? s.movementCategory}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setModal({ open: true, mode: 'view', data: s })}
                            className="rounded p-1.5 hover:bg-white/10"
                            title="Xem"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => setModal({ open: true, mode: 'edit', data: s })}
                                className="rounded p-1.5 hover:bg-white/10"
                                title="Sửa"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(s)}
                                className="rounded p-1.5 hover:bg-red-500/10 text-red-400"
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

          {filtered.length > pageSize && (
            <div className="border-t border-white/5 px-6 py-4">
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

      {modal.open && (
        <SkuModal
          mode={modal.mode}
          data={modal.data}
          existingSkuCodes={skus.map((s) => s.skuCode)}
          catalogTree={catalogTree}
          sizeFactors={sizeFactors}
          collections={collections}
          seasons={seasons}
          tenantId={tenantId}
          onCollectionCreated={(c) =>
            setCollections((prev) =>
              prev.some((x) => x.collectionId === c.collectionId) ? prev : [...prev, c]
            )
          }
          onSeasonCreated={(s) =>
            setSeasons((prev) =>
              prev.some((x) => x.seasonId === s.seasonId) ? prev : [...prev, s]
            )
          }
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
