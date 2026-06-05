import { useEffect, useMemo, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import type { ApiSku } from '../../../api/skus'
import type { ApiProductKindTreeNode, ApiSizeFactor } from '../../../api/productCatalog'
import type { ApiCollection } from '../../../api/collections'
import type { ApiSeason } from '../../../api/seasons'
import { DarkDropdownSelect } from '../DarkDropdownSelect' // Giữ nguyên import theo cấu trúc file, style bên trong được truyền qua props theme
import { buildFlatSizeOptions, buildSizeToGroupMap, roundVolumeUnits } from '../../../utils/volumeUnits'
import { MOVEMENT_CATEGORY_OPTIONS, SKU_STATUS_OPTIONS } from '../../../data/skuOptions'

type Mode = 'create' | 'edit' | 'view'

export type SkuFormPayload = {
  skuCode: string
  productName: string
  productKind: string
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
  catalogTree: ApiProductKindTreeNode[]
  sizeFactors: ApiSizeFactor[]
  collections: ApiCollection[]
  seasons: ApiSeason[]
  onClose: () => void
  onSubmit?: (payload: SkuFormPayload) => void | Promise<void>
}

// Cập nhật hệ thống Style sang màu sáng (Light Mode)
const labelStyle =
  'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
const inputStyle =
  'w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-500 transition-all'

function toForm(data?: ApiSku): SkuFormPayload {
  return {
    skuCode: data?.skuCode ?? '',
    productName: data?.productName ?? '',
    productKind: data?.productKind ?? '',
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
  catalogTree,
  sizeFactors,
  collections,
  seasons,
  onClose,
  onSubmit,
}: Props) {
  const isView = mode === 'view'
  const [form, setForm] = useState(() => toForm(data))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const productKindGroups = useMemo(
    () =>
      catalogTree.map((group) => ({
        label: group.displayNameVi,
        options: (group.productKinds ?? []).map((kind) => ({
          value: kind.productKind,
          label: kind.displayName,
          hint: `${Number(kind.baseVolumeUnitsPerPiece)} U`,
        })),
      })),
    [catalogTree]
  )

  const catalogByKind = useMemo(() => {
    const map = new Map<string, (typeof catalogTree)[0]['productKinds'][0]>()
    for (const group of catalogTree) {
      for (const kind of group.productKinds ?? []) {
        map.set(kind.productKind, kind)
      }
    }
    return map
  }, [catalogTree])

  const selectedKind = form.productKind ? catalogByKind.get(form.productKind) : null
  const requiresSize = selectedKind?.hasSize !== false

  const sizeMap = useMemo(() => buildSizeToGroupMap(sizeFactors), [sizeFactors])

  const selectedSizeMeta = useMemo(() => {
    if (!form.size?.trim()) return null
    return sizeMap.get(form.size.trim().toUpperCase()) ?? null
  }, [form.size, sizeMap])

  const finalVolumePerPiece = useMemo(() => {
    if (!selectedKind) return null
    const base = Number(selectedKind.baseVolumeUnitsPerPiece)
    if (!Number.isFinite(base) || base <= 0) return null
    let factor = 1
    if (selectedKind.hasSize !== false && form.size?.trim()) {
      factor = selectedSizeMeta?.factor ?? 1
    }
    return roundVolumeUnits(base * factor)
  }, [selectedKind, form.size, selectedSizeMeta])

  const sizeOptions = useMemo(() => {
    const options = buildFlatSizeOptions(sizeFactors).map((opt) => {
      const meta = sizeMap.get(opt.value.trim().toUpperCase())
      const factor = meta ? Number(meta.factor) : null
      return {
        value: opt.value,
        label: opt.value,
        hint:
          factor != null
            ? `×${factor} U`
            : opt.label.split('(')[1]?.replace(')', '') ?? opt.sizeGroup,
      }
    })
    if (
      form.size &&
      !options.some((opt) => opt.value === form.size) &&
      (mode === 'edit' || mode === 'view')
    ) {
      options.unshift({
        value: form.size,
        label: form.size,
        hint: 'legacy',
      })
    }
    return options
  }, [sizeFactors, sizeMap, form.size, mode])

  const defaultSize = sizeOptions.find((opt) => opt.value === 'M')?.value ?? sizeOptions[0]?.value ?? ''

  useEffect(() => {
    setForm(toForm(data))
  }, [data])

  useEffect(() => {
    if (isView || !requiresSize) return
    if (!form.size && defaultSize) {
      setForm((f) => ({ ...f, size: defaultSize }))
    }
  }, [requiresSize, defaultSize, form.size, isView])

  useEffect(() => {
    if (isView || !requiresSize || !form.size) return
    if (sizeOptions.length > 0 && !sizeOptions.some((opt) => opt.value === form.size)) {
      setForm((f) => ({ ...f, size: defaultSize }))
    }
  }, [form.productKind, requiresSize, sizeOptions, form.size, defaultSize, isView])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.skuCode.trim() || !form.productName.trim()) {
      setError('Mã SKU và tên sản phẩm là bắt buộc')
      return
    }
    if (!form.productKind) {
      setError('Vui lòng chọn loại hàng (T-Shirt, Jeans, …)')
      return
    }
    if (requiresSize && !form.size.trim()) {
      setError('Vui lòng chọn size cho loại hàng này')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit?.({
        ...form,
        skuCode: form.skuCode.trim(),
        productName: form.productName.trim(),
        productKind: form.productKind,
        collectionId: form.collectionId || '',
        seasonId: form.seasonId || '',
        size: requiresSize ? form.size : '',
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      {/* Lớp nền mờ chuyển sang màu xám mờ sáng dịu thay vì đen tối */}
      <button type="button" className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-label="Đóng" />
      
      {/* Khung nội dung chính: Đổi nền trắng, viền xám sáng, đổ bóng lớn sang trọng */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-visible p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle} htmlFor="sku-code">
                Mã SKU *
              </label>
              <input
                id="sku-code"
                className={`${inputStyle} font-mono uppercase tracking-wide disabled:opacity-75`}
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
              placeholder="Nhập tên sản phẩm..."
            />
          </div>

          <div>
            <label className={labelStyle} htmlFor="sku-product-kind">
              Loại hàng *
            </label>
            {isView ? (
              <p className={`${inputStyle} bg-slate-50 text-slate-800`}>
                <span className="font-medium">{selectedKind?.displayName ?? (form.productKind || '—')}</span>
                {selectedKind && (
                  <span className="ml-2 font-mono text-xs text-slate-400">
                    ({Number(selectedKind.baseVolumeUnitsPerPiece)} U)
                  </span>
                )}
              </p>
            ) : (
              <DarkDropdownSelect
                id="sku-product-kind"
                value={form.productKind}
                onChange={(productKind) => setForm((f) => ({ ...f, productKind }))}
                groups={productKindGroups}
                placeholder="Chọn loại hàng…"
                searchable
                searchPlaceholder="Tìm T-Shirt, Jeans…"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                placeholder="VD: Đen, Trắng"
              />
            </div>
            <div>
              <label className={labelStyle} htmlFor="sku-size">
                Size {requiresSize ? '*' : ''}
              </label>
              {isView ? (
                <p className={`${inputStyle} bg-slate-50 text-slate-800`}>
                  <span className="font-semibold">{form.size || 'One-size'}</span>
                  {selectedSizeMeta && (
                    <span className="ml-2 font-mono text-xs text-slate-400">
                      (×{Number(selectedSizeMeta.factor)} U)
                    </span>
                  )}
                </p>
              ) : (
                <DarkDropdownSelect
                  id="sku-size"
                  value={requiresSize ? form.size : ''}
                  onChange={(size) => setForm((f) => ({ ...f, size }))}
                  options={
                    requiresSize
                      ? sizeOptions
                      : [{ value: '', label: 'One-size' }]
                  }
                  placeholder={requiresSize ? 'Chọn size…' : 'One-size'}
                  disabled={!requiresSize}
                />
              )}
              {requiresSize && (
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Cùng bảng size với yêu cầu thuê (XS–S / M–L / XL–3XL).
                  {isView && finalVolumePerPiece != null && selectedKind && (
                    <span className="block text-slate-500 mt-0.5">
                      U/cái = {Number(selectedKind.baseVolumeUnitsPerPiece)} × hệ số size ={' '}
                      <span className="font-bold text-sky-600">{finalVolumePerPiece} U</span>.
                    </span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className={labelStyle}>Chất liệu</label>
              <input
                className={inputStyle}
                disabled={isView}
                value={form.material}
                onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
                placeholder="VD: Cotton"
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

          {/* Footer Action Buttons */}
          {!isView && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 transition-all active:scale-[0.98]"
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