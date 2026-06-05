import { useState } from 'react'
import type { ApiCategory } from '../../api/categories'
import type { ApiCollection } from '../../api/collections'
import type { ApiSeason } from '../../api/seasons'
import * as categoriesApi from '../../api/categories'
import * as collectionsApi from '../../api/collections'
import * as seasonsApi from '../../api/seasons'
import { ApiError } from '../../api/client'
import { AlertModal } from '../ui/modal/AlertModal'

type Tab = 'category' | 'collection' | 'season'

type Props = {
  tenantId: string
  canEdit: boolean
  categories: ApiCategory[]
  collections: ApiCollection[]
  seasons: ApiSeason[]
  onRefresh: () => Promise<void>
}

const inputStyle =
  'w-full rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none'

export function ProductMasterDataPanel({
  tenantId,
  canEdit,
  categories,
  collections,
  seasons,
  onRefresh,
}: Props) {
  const [tab, setTab] = useState<Tab>('category')
  const [nameInput, setNameInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error' | 'warning' | 'confirm'
    onConfirm?: () => void
  }>({
    open: false,
    message: '',
    type: 'success',
  })

  const resetForm = () => {
    setNameInput('')
    setEditingId(null)
  }

  const run = async (fn: () => Promise<unknown>, msg?: string) => {
    setBusy(true)
    try {
      await fn()
      if (msg) setAlert({ open: true, message: msg, type: 'success' })
      resetForm()
      await onRefresh()
    } catch (err) {
      setAlert({
        open: true,
        message: err instanceof ApiError ? err.message : 'Thao tác thất bại',
        type: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleSave = () => {
    const name = nameInput.trim()
    if (!name) return

    if (tab === 'category') {
      if (editingId) {
        return run(() => categoriesApi.updateCategory(editingId, { categoryName: name }), 'Đã cập nhật danh mục')
      }
      return run(() => categoriesApi.createCategory({ categoryName: name }), 'Đã thêm danh mục')
    }

    if (tab === 'collection') {
      if (!tenantId) return
      if (editingId) {
        return run(() => collectionsApi.updateCollection(editingId, { collectionName: name }), 'Đã cập nhật bộ sưu tập')
      }
      return run(() => collectionsApi.createCollection({ tenantId, collectionName: name }), 'Đã thêm bộ sưu tập')
    }

    if (tab === 'season') {
      if (editingId) {
        return run(() => seasonsApi.updateSeason(editingId, { seasonName: name }), 'Đã cập nhật mùa')
      }
      return run(() => seasonsApi.createSeason({ seasonName: name }), 'Đã thêm mùa')
    }
  }

  const handleEdit = (id: string, name: string) => {
    setEditingId(id)
    setNameInput(name)
  }

  const handleDelete = (id: string, label: string) => {
    const currentTab = tab
    setAlert({
      open: true,
      type: 'confirm',
      message: `Xóa "${label}"?`,
      onConfirm: () => {
        void run(async () => {
          if (currentTab === 'category') await categoriesApi.deleteCategory(id)
          else if (currentTab === 'collection') await collectionsApi.deleteCollection(id)
          else await seasonsApi.deleteSeason(id)
        }, 'Đã xóa')
      },
    })
  }

  const rows =
    tab === 'category'
      ? categories.map((c) => ({ id: c.categoryId, name: c.categoryName }))
      : tab === 'collection'
        ? collections.map((c) => ({ id: c.collectionId, name: c.collectionName }))
        : seasons.map((s) => ({ id: s.seasonId, name: s.seasonName }))

  const tabMeta: Record<Tab, { title: string; hint: string; placeholder: string }> = {
    category: {
      title: 'Danh mục',
      hint: 'Master data toàn hệ thống (Áo, Quần, …). Seed: npm run seed:product-master',
      placeholder: 'Tên danh mục',
    },
    collection: {
      title: 'Bộ sưu tập',
      hint: 'Theo tenant — mỗi brand có các collection riêng',
      placeholder: 'Tên bộ sưu tập',
    },
    season: {
      title: 'Mùa',
      hint: 'Master data toàn hệ thống (Xuân 2026, …)',
      placeholder: 'Tên mùa',
    },
  }

  return (
    <section className="glass-panel rounded-xl border border-white/5 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Danh mục & master data</h2>
          <p className="text-xs text-slate-500">Quản lý dropdown khi tạo SKU</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-white/10 p-1">
          {(['category', 'collection', 'season'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t)
                resetForm()
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                tab === t ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tabMeta[t].title}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-xs text-slate-500">{tabMeta[tab].hint}</p>

      {canEdit && (
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            className={`${inputStyle} max-w-xs flex-1`}
            placeholder={tabMeta[tab].placeholder}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            type="button"
            disabled={busy}
            onClick={handleSave}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {editingId ? 'Cập nhật' : 'Thêm'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300"
            >
              Hủy sửa
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#131b29] text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Tên</th>
              {canEdit && <th className="px-4 py-3 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 2 : 1} className="px-4 py-8 text-center text-slate-500">
                  Chưa có dữ liệu
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-white">{row.name}</td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(row.id, row.name)}
                        className="mr-2 text-cyan-400 hover:underline text-xs"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id, row.name)}
                        className="text-red-400 hover:underline text-xs"
                      >
                        Xóa
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {alert.open && (
        <AlertModal
          title={alert.type === 'confirm' ? 'Xác nhận' : 'Thông báo'}
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ open: false, message: '', type: 'success' })}
          onConfirm={alert.onConfirm}
        />
      )}
    </section>
  )
}
