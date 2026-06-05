import { InlineAlert } from '../ui/FeedbackAlert'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import * as inventoriesApi from '../../api/inventories'
import * as inboundApi from '../../api/inboundRequests'
import type { ApiInboundRequest } from '../../api/inboundRequests'
import { INBOUND_STATUS_LABELS } from '../../data/inboundStatus'
import type { ApiStorageReservation } from '../../api/storageReservations'
import {
  aggregateInventoryByBin,
  groupReservationsForTenantView,
  type ContractZoneGroup,
} from '../../utils/tenantReservationGroups'

const STORAGE_LEVEL_LABELS: Record<string, string> = {
  WAREHOUSE: 'Toàn kho',
  ZONE: 'Theo zone',
  RACK: 'Theo rack',
  RACK_LEVEL: 'Theo tầng',
  BIN: 'Bin cố định',
}

const RESERVATION_TYPE_LABELS: Record<string, string> = {
  SHARED: 'Chia sẻ',
  RESERVED: 'Giữ chỗ',
  DEDICATED: 'Riêng',
}

type Tab = 'overview' | 'bins'

type Props = {
  tenantId: string
  reservations: ApiStorageReservation[]
  contractCodeById: Map<string, string>
}

function ZoneGroupCard({
  group,
  expanded,
  onToggle,
}: {
  group: ContractZoneGroup
  expanded: boolean
  onToggle: () => void
}) {
  const hasDetails = group.detailReservations.length > 0
  const levelLabel = STORAGE_LEVEL_LABELS[group.primaryLevel] ?? group.primaryLevel
  const typeLabel = RESERVATION_TYPE_LABELS[group.primaryType] ?? group.primaryType

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={hasDetails ? onToggle : undefined}
        className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${hasDetails ? 'hover:bg-slate-100/70' : ''}`}
      >
        <div>
          <p className="font-mono text-sm font-semibold text-sky-600">{group.contractCode}</p>
          <p className="mt-0.5 text-base font-bold text-slate-800">
            {group.warehouseName} · <span className="text-sky-700">{group.zoneCode}</span>
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {levelLabel} · {typeLabel}
            {group.totalReservedCapacity > 0 && (
              <span className="text-slate-400">
                {' '}
                · Giữ ~{' '}
                <strong className="text-slate-600 font-semibold">
                  {group.totalReservedCapacity.toLocaleString('vi-VN')} LPN
                </strong>
              </span>
            )}
          </p>
          {!hasDetails && group.primaryLevel === 'ZONE' && (
            <p className="mt-1.5 text-xs text-slate-400">
              Rack/bin cụ thể do kho xếp khi putaway — xem tab{' '}
              <strong className="text-slate-500 font-semibold">Bin đang chứa hàng</strong>.
            </p>
          )}
        </div>
        {hasDetails && (
          <span className="material-symbols-outlined shrink-0 text-slate-400 transition-transform">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        )}
      </button>

      {hasDetails && expanded && (
        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <p className="mb-2 text-xs font-medium text-slate-400">
            {group.detailReservations.length} vị trí chi tiết (rack / tầng / bin) trên HĐ:
          </p>
          <div className="max-h-48 overflow-y-auto rounded border border-slate-200 light-scrollbar shadow-inner">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 font-semibold">Cấp</th>
                  <th className="px-3 py-2 font-semibold">Rack</th>
                  <th className="px-3 py-2 font-semibold">Tầng</th>
                  <th className="px-3 py-2 font-semibold">Bin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {group.detailReservations.map((r) => (
                  <tr key={r.reservationId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-2">
                      {STORAGE_LEVEL_LABELS[r.storageLevel] ?? r.storageLevel}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{r.rackCode ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {r.levelNumber != null ? `T${r.levelNumber}` : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-sky-700">{r.binCode ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export function TenantStorageAllocationPanel({
  tenantId,
  reservations,
  contractCodeById,
}: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [binLoading, setBinLoading] = useState(false)
  const [binError, setBinError] = useState('')
  const [binRows, setBinRows] = useState<ReturnType<typeof aggregateInventoryByBin>>([])
  const [binSearch, setBinSearch] = useState('')
  const [inboundFilterId, setInboundFilterId] = useState('')
  const [inbounds, setInbounds] = useState<ApiInboundRequest[]>([])
  const [inboundsLoading, setInboundsLoading] = useState(false)

  const zoneGroups = useMemo(
    () => groupReservationsForTenantView(reservations, contractCodeById),
    [reservations, contractCodeById]
  )

  const detailCount = useMemo(
    () => reservations.filter((r) => r.storageLevel !== 'ZONE' && r.storageLevel !== 'WAREHOUSE').length,
    [reservations]
  )

  const loadInbounds = useCallback(async () => {
    if (!tenantId) return
    setInboundsLoading(true)
    try {
      const { items } = await inboundApi.listInboundRequests({ tenantId, limit: 100 })
      const sorted = [...items].sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return tb - ta
      })
      setInbounds(sorted)
    } catch {
      setInbounds([])
    } finally {
      setInboundsLoading(false)
    }
  }, [tenantId])

  const loadBinUsage = useCallback(async () => {
    if (!tenantId) return
    setBinLoading(true)
    setBinError('')
    try {
      const { items } = await inventoriesApi.listInventories({
        tenantId,
        inboundRequestId: inboundFilterId || undefined,
        status: 'AVAILABLE',
        limit: 500,
      })
      setBinRows(aggregateInventoryByBin(items))
    } catch (e) {
      setBinError(e instanceof ApiError ? e.message : 'Không tải được tồn kho theo bin')
      setBinRows([])
    } finally {
      setBinLoading(false)
    }
  }, [tenantId, inboundFilterId])

  useEffect(() => {
    if (tab === 'bins' && inbounds.length === 0 && !inboundsLoading) {
      void loadInbounds()
    }
  }, [tab, inbounds.length, inboundsLoading, loadInbounds])

  useEffect(() => {
    if (tab === 'bins') {
      void loadBinUsage()
    }
  }, [tab, inboundFilterId, loadBinUsage])

  const selectedInbound = inbounds.find((i) => i.inboundRequestId === inboundFilterId)

  const inventoryLink = inboundFilterId
    ? `/staff/inventory?inboundRequestId=${encodeURIComponent(inboundFilterId)}`
    : '/staff/inventory'

  const filteredBins = useMemo(() => {
    const q = binSearch.trim().toLowerCase()
    if (!q) return binRows
    return binRows.filter(
      (b) =>
        b.binCode.toLowerCase().includes(q) ||
        b.lpnCodes.some((c) => c.toLowerCase().includes(q))
    )
  }, [binRows, binSearch])

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden text-slate-700">
      <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
        <p className="text-sm font-bold text-sky-700">Vị trí đã được cấp</p>
        <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-500 font-semibold">Tổng quan HĐ</strong> gom theo zone (ít dòng, dễ đọc).{' '}
          <strong className="text-slate-500 font-semibold">Bin đang chứa hàng</strong> chỉ hiện sau putaway — gom theo
          bin, không liệt kê từng dòng inventory.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
              tab === 'overview'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            Tổng quan phân bổ HĐ
            {zoneGroups.length > 0 ? ` (${zoneGroups.length} zone)` : ''}
          </button>
          <button
            type="button"
            onClick={() => setTab('bins')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
              tab === 'bins'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            Bin đang chứa hàng
            {binRows.length > 0 ? ` (${binRows.length} bin)` : ''}
          </button>
          <Link
            to={inventoryLink}
            className="ml-auto text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline transition-colors"
          >
            Xem tồn kho chi tiết{inboundFilterId ? ' (đợt này)' : ''} →
          </Link>
        </div>
      </div>

      <div className="p-6">
        {tab === 'overview' && (
          <>
            {zoneGroups.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có phân bổ kho trên hợp đồng.</p>
            ) : (
              <div className="space-y-3">
                {detailCount > 0 && (
                  <p className="text-xs font-semibold text-amber-700 bg-amber-50 rounded px-3 py-1.5 border border-amber-100">
                    Có {detailCount} dòng rack/bin trên HĐ — mở từng zone để xem chi tiết (không trải
                    hết ra bảng).
                  </p>
                )}
                {zoneGroups.map((g) => (
                  <ZoneGroupCard
                    key={g.key}
                    group={g}
                    expanded={expandedKeys.has(g.key)}
                    onToggle={() => toggleExpand(g.key)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'bins' && (
          <>
            <div className="mb-4 space-y-3">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
                <label className="min-w-[220px] flex-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Lọc theo đợt nhập kho
                  <select
                    value={inboundFilterId}
                    onChange={(e) => setInboundFilterId(e.target.value)}
                    disabled={inboundsLoading}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors"
                    aria-label="Lọc theo đợt nhập kho"
                  >
                    <option value="">Tất cả đợt nhập (đã putaway)</option>
                    {inbounds.map((ib) => (
                      <option key={ib.inboundRequestId} value={ib.inboundRequestId}>
                        {ib.inboundCode} — {INBOUND_STATUS_LABELS[ib.status] ?? ib.status}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-1 gap-2 items-center min-w-[160px]">
                  <input
                    type="search"
                    value={binSearch}
                    onChange={(e) => setBinSearch(e.target.value)}
                    placeholder="Lọc mã bin hoặc LPN..."
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors"
                    aria-label="Tìm bin hoặc LPN"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => loadBinUsage()}
                  disabled={binLoading}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm disabled:opacity-50"
                >
                  {binLoading ? 'Đang tải...' : 'Tải lại'}
                </button>
              </div>
              {selectedInbound && (
                <p className="text-xs text-amber-700 font-medium">
                  Đang xem bin của đợt{' '}
                  <strong className="font-mono font-bold text-amber-800">{selectedInbound.inboundCode}</strong>{' '}
                  ({INBOUND_STATUS_LABELS[selectedInbound.status] ?? selectedInbound.status}). Chỉ hiện
                  hàng thuộc phiếu nhập này.
                </p>
              )}
            </div>
            {binError && (
              <InlineAlert className="mb-3" message={binError} onDismiss={() => setBinError('')} />
            )}
            {binLoading && <p className="text-sm text-slate-400">Đang tải tồn kho...</p>}
            {!binLoading && filteredBins.length === 0 && (
              <p className="text-sm text-slate-400 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-4">
                Chưa có hàng trong bin (hoặc chưa putaway). Sau khi nhập kho và putaway, bin sẽ hiện ở
                đây.
              </p>
            )}
            {!binLoading && filteredBins.length > 0 && (
              <>
                <p className="mb-3 text-xs text-slate-400">
                  Hiển thị <strong className="text-slate-600 font-semibold">{filteredBins.length}</strong> bin
                  {inboundFilterId ? ' cho đợt nhập đã chọn' : ' (mọi đợt)'} — gom theo vị trí. Bấm
                  &quot;Xem tồn kho chi tiết&quot; để xem từng SKU/LPN.
                </p>
                <div className="max-h-[420px] overflow-y-auto rounded-lg border border-slate-200 shadow-sm light-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 z-10">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Bin</th>
                        <th className="px-4 py-3 text-right font-semibold">LPN</th>
                        <th className="px-4 py-3 text-right font-semibold">Dòng SKU</th>
                        <th className="px-4 py-3 font-semibold">LPN (tối đa 3)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                      {filteredBins.map((b) => (
                        <tr key={b.binId} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-sky-700 font-bold">{b.binCode}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-800 font-semibold">{b.lpnCount}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-400">
                            {b.skuLines}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-500 leading-normal">
                            {b.lpnCodes.slice(0, 3).join(', ')}
                            {b.lpnCodes.length > 3 ? ` +${b.lpnCodes.length - 3}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}