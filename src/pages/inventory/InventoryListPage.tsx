import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { Pagination } from '../../components/ui/Pagination'
import { StatsCard } from '../../components/ui/StatCard'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as inventoriesApi from '../../api/inventories'
import type { ApiInventory, ApiInventoryMovement } from '../../api/inventories'
import { formatDate } from '../../mappers'
import { WhiteStatCard } from '../../components/ui/WhiteStatCard'

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng',
  RESERVED: 'Giữ chỗ',
  PICKED: 'Đã pick',
  DAMAGED: 'Hư hỏng',
  IN_TRANSIT: 'Đang chuyển',
  SHIPPED: 'Đã xuất',
}

const PAGE_SIZE = 10

type Props = {
  /** Tenant chỉ xem hàng của mình */
  scope: 'tenant' | 'warehouse'
}

export function InventoryListPage({ scope }: Props) {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const inboundRequestId = searchParams.get('inboundRequestId') ?? ''
  const batchId = searchParams.get('batchId') ?? ''
  const lpnId = searchParams.get('lpnId') ?? ''
  const statusFilter = searchParams.get('status') ?? ''

  const [items, setItems] = useState<ApiInventory[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [detail, setDetail] = useState<ApiInventory | null>(null)
  const [movements, setMovements] = useState<ApiInventoryMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)

  const warehouseId =
    scope === 'warehouse' &&
      (user?.role === 'WH_ADMIN' || user?.role === 'WH_STAFF')
      ? user.warehouseId ?? undefined
      : undefined
  const tenantId =
    scope === 'tenant' ? user?.tenantId ?? undefined : searchParams.get('tenantId') ?? undefined

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { items: rows, meta } = await inventoriesApi.listInventories({
        tenantId: tenantId || undefined,
        warehouseId: warehouseId || undefined,
        inboundRequestId: inboundRequestId || undefined,
        batchId: batchId || undefined,
        lpnId: lpnId || undefined,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: PAGE_SIZE,
      })
      setItems(rows)
      setTotal(meta.total)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải tồn kho')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [
    tenantId,
    warehouseId,
    inboundRequestId,
    batchId,
    lpnId,
    statusFilter,
    searchQuery,
    page,
  ])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [inboundRequestId, batchId, lpnId, statusFilter, tenantId, warehouseId, searchQuery])

  const totalQty = useMemo(
    () => items.reduce((sum, row) => sum + (row.quantity ?? 0), 0),
    [items]
  )

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, total)

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const clearInboundFilter = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('inboundRequestId')
    next.delete('batchId')
    next.delete('lpnId')
    setSearchParams(next)
  }

  const openDetail = async (row: ApiInventory) => {
    setDetail(row)
    setMovements([])
    setMovementsLoading(true)
    try {
      const { items: movs } = await inventoriesApi.listInventoryMovements(row.inventoryId, {
        limit: 50,
      })
      setMovements(movs)
    } catch {
      setMovements([])
    } finally {
      setMovementsLoading(false)
    }
  }

  const inventoryBase =
    scope === 'tenant' ? '/staff/inventory' : '/admin/inventory'

  return (
    /* Đổi nền trang từ tối sang xám sáng (bg-slate-50), màu chữ chủ đạo thành màu tối (text-slate-800) */
    <div className="relative flex min-h-full flex-col bg-slate-50 p-6 text-slate-800 lg:p-8">
      <LoadingOverlay show={loading} text="Đang tải tồn kho..." />

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {inboundRequestId && (
            <button
              type="button"
              onClick={clearInboundFilter}
              className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
            >
              Xóa lọc inbound
            </button>
          )}
        </div>

        {/* Khối lọc inbound đổi thành dạng banner Light Mode (Cyan Pastel) */}
        {inboundRequestId && (
          <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800">
            Đang lọc theo inbound:{' '}
            <span className="font-mono font-bold">{inboundRequestId.slice(0, 8)}…</span>
          </div>
        )}

        {error && (
          <InlineAlert message={error} onDismiss={() => setError('')} />
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <WhiteStatCard title="Dòng tồn (trang)" value={items.length} icon="inventory_2" accentColor="emerald" isDarkMode={false} />
          <WhiteStatCard title="Tổng SL (trang)" value={totalQty} icon="pin" accentColor="primary" isDarkMode={false} />
          <WhiteStatCard title="Tổng bản ghi" value={total} icon="database" accentColor="emerald" isDarkMode={false} />
        </div>

        {/* Khung panel chứa bảng đổi thành nền trắng đổ bóng nhẹ (shadow-sm) */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-4 bg-slate-50/50">
            <h3 className="text-lg font-bold tracking-wide">
              QUẢN LÝ HÀNG
            </h3>
            <input
              type="search"
              placeholder="Tìm SKU, LPN, batch, bin…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none placeholder-slate-400"
            />
            <select
              aria-label="Lọc trạng thái"
              value={statusFilter}
              onChange={(e) => setFilter('status', e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="">Mọi trạng thái</option>
              {Object.entries(STATUS_LABELS).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Header bảng nền xám nhẹ, chữ xám vừa đậm */}
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-right">SL</th>
                  <th className="px-4 py-3 text-left">Batch</th>
                  <th className="px-4 py-3 text-left">LPN</th>
                  <th className="px-4 py-3 text-left">Bin</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Nhận kho</th>
                  <th className="px-4 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400 bg-white">
                      Chưa có tồn kho
                      {inboundRequestId ? ' cho đợt inbound này (cần putaway xong).' : '.'}
                      {searchQuery ? ' Không khớp từ khóa tìm kiếm.' : ''}
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.inventoryId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-cyan-600">{row.sku?.skuCode}</span>
                        <span className="mt-0.5 block text-xs font-medium text-slate-500">
                          {row.sku?.productName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{row.quantity}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.batchCode ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.lpnCode ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.binCode ?? '—'}</td>
                      <td className="px-4 py-3">
                        {/* Huy hiệu trạng thái đổi sang định dạng Green Pastel có viền rõ ràng */}
                        <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          {STATUS_LABELS[row.status ?? ''] ?? row.status ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(row.receivedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(row)}
                          className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
                        >
                          Lịch sử
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Thanh phân trang nền xám nhẹ dịu, chữ xám sẫm màu */}
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <p className="font-mono text-xs text-slate-500">
                Hiển thị{' '}
                <span className="font-bold text-slate-800">
                  {rangeStart}–{rangeEnd}
                </span>{' '}
                trong số <span className="font-bold text-slate-800">{total}</span> 
                {totalPages > 1 && (
                  <>
                    {' '}
                    · Trang <span className="font-bold text-slate-800">{page}</span> / {totalPages}
                  </>
                )}
              </p>
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modal Chi Tiết Tồn Kho: Light Mode */}
      {detail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Backdrop mờ tối vừa phải */}
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            aria-label="Đóng"
            onClick={() => setDetail(null)}
          />
          {/* Khung nội dung modal: Nền trắng, viền mảnh xám sáng */}
          <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-800">
            <h2 className="text-lg font-bold text-slate-900">Chi tiết tồn kho</h2>

            <dl className="mt-4 grid gap-2 text-sm divide-y divide-slate-100">
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-slate-500 font-medium">SKU</dt>
                <dd className="font-mono font-bold text-cyan-600">{detail.sku?.skuCode}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-slate-500 font-medium">Số lượng</dt>
                <dd className="font-semibold text-slate-900">{detail.quantity}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-slate-500 font-medium">Batch</dt>
                <dd className="font-mono text-slate-700">{detail.batchCode ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-slate-500 font-medium">LPN</dt>
                <dd className="font-mono text-slate-700">{detail.lpnCode ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-slate-500 font-medium">Bin</dt>
                <dd className="font-mono text-slate-700">{detail.binCode ?? '—'}</dd>
              </div>
            </dl>

            <h3 className="mt-6 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Lịch sử di chuyển</h3>
            {movementsLoading ? (
              <p className="mt-2 text-xs text-slate-500">Đang tải…</p>
            ) : movements.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400 italic">Chưa có di chuyển (movement).</p>
            ) : (
              <ul className="mt-3 space-y-2 text-xs">
                {movements.map((m) => (
                  <li
                    key={m.movementId}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm"
                  >
                    <span className="font-bold text-cyan-700">{m.movementType}</span>
                    <span className="text-slate-600 font-medium"> · SL {m.quantity}</span>
                    <span className="block mt-1 text-slate-400 font-medium">{formatDate(m.movedAt)}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Các nút hành động cuối Modal */}
            <div className="mt-6 flex justify-end items-center gap-4 border-t border-slate-100 pt-4">
              <Link
                to={`${inventoryBase}?batchId=${detail.batchId}`}
                className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
                onClick={() => setDetail(null)}
              >
                Lọc cùng batch
              </Link>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition-colors border border-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}