import { useEffect, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import type { ApiSku } from '../../../api/skus'
import type { ApiCategory } from '../../../api/categories'
import type { ApiCollection } from '../../../api/collections'
import type { ApiSeason } from '../../../api/seasons'
import { MOVEMENT_CATEGORY_OPTIONS, SIZE_OPTIONS, SKU_STATUS_OPTIONS } from '../../../data/skuOptions'

type Mode = 'create' | 'edit' | 'view'

export type SkuFormPayload = {
  skuCode: string
  productName: string
  categoryId: string
  collectionId: string
  seasonId: string
  color: string
  size: string
  material: string
  movementCategory: string
  status: string
}

type Props = {
  mode: Mode
  data?: ApiSku
  categories: ApiCategory[]
  collections: ApiCollection[]
  seasons: ApiSeason[]
  onClose: () => void
  onSubmit?: (payload: SkuFormPayload) => void | Promise<void>
}

const labelStyle =
  'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
const inputStyle =
  'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400'

function toForm(data?: ApiSku): SkuFormPayload {
  return {
    skuCode: data?.skuCode ?? '',
    productName: data?.productName ?? '',
    categoryId: data?.categoryId ?? '',
    collectionId: data?.collectionId ?? '',
    seasonId: data?.seasonId ?? '',
    color: data?.color ?? '',
    size: data?.size ?? '',
    material: data?.material ?? '',
    movementCategory: data?.movementCategory ?? 'NORMAL',
    status: data?.status ?? 'ACTIVE',
  }
}

export function SkuModal({
  mode,
  data,
  categories,
  collections,
  seasons,
  onClose,
  onSubmit,
}: Props) {
  const isView = mode === 'view'
  const [form, setForm] = useState(() => toForm(data))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(toForm(data))
  }, [data])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.skuCode.trim() || !form.productName.trim()) {
      setError('Mã SKU và tên sản phẩm là bắt buộc')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit?.({
        ...form,
        skuCode: form.skuCode.trim(),
        productName: form.productName.trim(),
        categoryId: form.categoryId || '',
        collectionId: form.collectionId || '',
        seasonId: form.seasonId || '',
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const title =
    mode === 'create' ? 'Thêm SKU' : mode === 'edit' ? 'Sửa SKU' : 'Chi tiết SKU'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Đóng" />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-2 hover:bg-white/10">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle} htmlFor="sku-code">
                Mã SKU *
              </label>
              <input
                id="sku-code"
                className={inputStyle}
                disabled={isView || mode === 'edit'}
                value={form.skuCode}
                onChange={(e) => setForm((f) => ({ ...f, skuCode: e.target.value.toUpperCase() }))}
                placeholder="VD: AO-THUN-001"
              />
            </div>
            <div>
              <label className={labelStyle} htmlFor="sku-status">
                Trạng thái
              </label>
              <select
                id="sku-status"
                className={inputStyle}
                disabled={isView}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {SKU_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelStyle} htmlFor="sku-name">
              Tên sản phẩm *
            </label>
            <input
              id="sku-name"
              className={inputStyle}
              disabled={isView}
              value={form.productName}
              onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelStyle} htmlFor="sku-category">
                Danh mục
              </label>
              <select
                id="sku-category"
                className={inputStyle}
                disabled={isView}
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelStyle} htmlFor="sku-collection">
                Bộ sưu tập
              </label>
              <select
                id="sku-collection"
                className={inputStyle}
                disabled={isView}
                value={form.collectionId}
                onChange={(e) => setForm((f) => ({ ...f, collectionId: e.target.value }))}
              >
                <option value="">—</option>
                {collections.map((c) => (
                  <option key={c.collectionId} value={c.collectionId}>
                    {c.collectionName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelStyle} htmlFor="sku-season">
                Mùa
              </label>
              <select
                id="sku-season"
                className={inputStyle}
                disabled={isView}
                value={form.seasonId}
                onChange={(e) => setForm((f) => ({ ...f, seasonId: e.target.value }))}
              >
                <option value="">—</option>
                {seasons.map((s) => (
                  <option key={s.seasonId} value={s.seasonId}>
                    {s.seasonName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelStyle}>Màu</label>
              <input
                className={inputStyle}
                disabled={isView}
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelStyle} htmlFor="sku-size">
                Size
              </label>
              <select
                id="sku-size"
                className={inputStyle}
                disabled={isView}
                value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
              >
                {SIZE_OPTIONS.map((o) => (
                  <option key={o.value || 'empty'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelStyle}>Chất liệu</label>
              <input
                className={inputStyle}
                disabled={isView}
                value={form.material}
                onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className={labelStyle} htmlFor="sku-movement">
              Tốc độ luân chuyển
            </label>
            <select
              id="sku-movement"
              className={inputStyle}
              disabled={isView}
              value={form.movementCategory}
              onChange={(e) => setForm((f) => ({ ...f, movementCategory: e.target.value }))}
            >
              {MOVEMENT_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
          )}

          {!isView && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                {saving ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
