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
    scope === 'tenant'
      ? '/staff/inventory'
      : user?.role === 'WH_STAFF'
        ? '/staff/inventory-ops'
        : '/admin/inventory'

  return (
    <div className="relative flex min-h-full flex-col bg-[#0b101a] p-6 text-slate-100 lg:p-8">
      <LoadingOverlay show={loading} text="Đang tải tồn kho..." />

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Tồn kho</h1>
            <p className="mt-1 text-sm text-slate-400">
              Theo LPN, batch, bin — sau putaway inbound
            </p>
          </div>
          {inboundRequestId && (
            <button
              type="button"
              onClick={clearInboundFilter}
              className="text-sm text-cyan-400 hover:underline"
            >
              Xóa lọc inbound
            </button>
          )}
        </div>

        {inboundRequestId && (
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
            Đang lọc theo inbound:{' '}
            <span className="font-mono">{inboundRequestId.slice(0, 8)}…</span>
          </div>
        )}

        {error && (
          <InlineAlert message={error} onDismiss={() => setError('')} />
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatsCard title="Dòng tồn (trang)" value={items.length} icon="inventory_2" accentColor="emerald" />
          <StatsCard title="Tổng SL (trang)" value={totalQty} icon="pin" accentColor="primary" />
          <StatsCard title="Tổng bản ghi" value={total} icon="database" accentColor="emerald" />
        </div>

        <section className="glass-panel overflow-hidden rounded-xl border border-white/5">
          <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-4">
            <input
              type="search"
              placeholder="Tìm SKU, LPN, batch, bin…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
            />
            <select
              aria-label="Lọc trạng thái"
              value={statusFilter}
              onChange={(e) => setFilter('status', e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
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
              <thead className="bg-[#131b29] text-xs uppercase text-slate-400">
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
              <tbody className="divide-y divide-white/5">
                {items.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      Chưa có tồn kho
                      {inboundRequestId ? ' cho đợt inbound này (cần putaway xong).' : '.'}
                      {searchQuery ? ' Không khớp từ khóa tìm kiếm.' : ''}
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.inventoryId} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <span className="font-mono text-cyan-400">{row.sku?.skuCode}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {row.sku?.productName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{row.quantity}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.batchCode ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.lpnCode ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.binCode ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                          {STATUS_LABELS[row.status ?? ''] ?? row.status ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDate(row.receivedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(row)}
                          className="text-cyan-400 hover:underline"
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

          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 bg-[#131b29] px-6 py-4">
              <p className="font-mono text-xs text-slate-400">
                Hiển thị{' '}
                <span className="text-white">
                  {rangeStart}–{rangeEnd}
                </span>{' '}
                / <span className="text-white">{total}</span> bản ghi
                {totalPages > 1 && (
                  <>
                    {' '}
                    · Trang <span className="text-white">{page}</span> / {totalPages}
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

      {detail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Đóng"
            onClick={() => setDetail(null)}
          />
          <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#0f172a] p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white">Chi tiết tồn kho</h2>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">SKU</dt>
                <dd className="font-mono text-cyan-300">{detail.sku?.skuCode}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Số lượng</dt>
                <dd>{detail.quantity}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Batch</dt>
                <dd className="font-mono">{detail.batchCode}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">LPN</dt>
                <dd className="font-mono">{detail.lpnCode}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Bin</dt>
                <dd className="font-mono">{detail.binCode}</dd>
              </div>
            </dl>

            <h3 className="mt-6 text-sm font-semibold text-slate-300">Lịch sử di chuyển</h3>
            {movementsLoading ? (
              <p className="mt-2 text-xs text-slate-500">Đang tải…</p>
            ) : movements.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">Chưa có movement.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-xs">
                {movements.map((m) => (
                  <li
                    key={m.movementId}
                    className="rounded border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <span className="font-medium text-cyan-300">{m.movementType}</span>
                    <span className="text-slate-400"> · SL {m.quantity}</span>
                    <span className="block text-slate-500">{formatDate(m.movedAt)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Link
                to={`${inventoryBase}?batchId=${detail.batchId}`}
                className="text-sm text-cyan-400 hover:underline"
                onClick={() => setDetail(null)}
              >
                Lọc cùng batch
              </Link>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm"
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
