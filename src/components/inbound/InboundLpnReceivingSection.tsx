import { useMemo } from 'react'
import type { ApiInboundRequestItem } from '../../api/inboundRequests'
import type { ApiInboundApprovalReadiness } from '../../api/inboundRequests'
import type { ApiBatch } from '../../api/batches'
import type { ApiLpn, ApiLpnDetail, BoxType } from '../../api/lpns'
import { BOX_TYPE_OPTIONS } from '../../data/inboundStatus'

type Props = {
  inboundCode: string
  items: ApiInboundRequestItem[]
  batches: ApiBatch[]
  lpns: ApiLpn[]
  lpnDetails: ApiLpnDetail[]
  receivedDraft: Record<string, number>
  readiness: ApiInboundApprovalReadiness | null
  batchCode: string
  onBatchCodeChange: (v: string) => void
  onCreateBatch: () => void
  selectedBatchId: string
  onSelectedBatchIdChange: (v: string) => void
  lpnCode: string
  onLpnCodeChange: (v: string) => void
  boxType: BoxType
  onBoxTypeChange: (v: BoxType) => void
  onApplySuggestedBoxType: () => void
  detailSkuId: string
  onDetailSkuIdChange: (v: string) => void
  detailQty: number
  onDetailQtyChange: (v: number) => void
  selectedLpnId: string
  onSelectedLpnIdChange: (v: string) => void
  onCreateNextLpn: () => void
  onFillSkuLpns: () => void
  onAddLpnDetail: () => void
  putawaySlot: React.ReactNode
}

function allocatedBySkuId(details: ApiLpnDetail[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const d of details) {
    map[d.skuId] = (map[d.skuId] ?? 0) + Number(d.quantity ?? 0)
  }
  return map
}

export function InboundLpnReceivingSection({
  inboundCode,
  items,
  batches,
  lpns,
  lpnDetails,
  receivedDraft,
  readiness,
  batchCode,
  onBatchCodeChange,
  onCreateBatch,
  selectedBatchId,
  onSelectedBatchIdChange,
  lpnCode,
  onLpnCodeChange,
  boxType,
  onBoxTypeChange,
  onApplySuggestedBoxType,
  detailSkuId,
  onDetailSkuIdChange,
  detailQty,
  onDetailQtyChange,
  selectedLpnId,
  onSelectedLpnIdChange,
  onCreateNextLpn,
  onFillSkuLpns,
  onAddLpnDetail,
  putawaySlot,
}: Props) {
  const piecesPerLpn = readiness?.assumptions.piecesPerLpn ?? 25
  const allocated = useMemo(() => allocatedBySkuId(lpnDetails), [lpnDetails])

  const targetQty = (item: ApiInboundRequestItem) =>
    receivedDraft[item.inboundRequestItemId] ?? item.receivedQuantity ?? 0

  const remainingForSku = (skuId: string) => {
    const item = items.find((i) => i.skuId === skuId)
    if (!item) return 0
    return Math.max(0, targetQty(item) - (allocated[skuId] ?? 0))
  }

  const selectedRemaining = detailSkuId ? remainingForSku(detailSkuId) : 0
  const suggestedQty = Math.min(piecesPerLpn, selectedRemaining)

  const lpnDetailsByLpn = useMemo(() => {
    const map: Record<string, ApiLpnDetail[]> = {}
    for (const d of lpnDetails) {
      if (!map[d.lpnId]) map[d.lpnId] = []
      map[d.lpnId].push(d)
    }
    return map
  }, [lpnDetails])

  return (
    <section className="mb-8 grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-3 font-semibold">Batch</h2>
        <div className="mb-2 flex gap-2">
          <input
            value={batchCode}
            onChange={(e) => onBatchCodeChange(e.target.value)}
            placeholder="BATCH-001"
            className="flex-1 rounded border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={onCreateBatch}
            className="rounded bg-cyan-600 px-3 py-2 text-sm"
          >
            Tạo
          </button>
        </div>
        <ul className="text-xs text-slate-400">
          {batches.map((b) => (
            <li key={b.batchId} className="py-1 font-mono">
              {b.batchCode}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-3 font-semibold">LPN &amp; đóng thùng</h2>
        <p className="mb-3 text-xs text-slate-500">
          Gán SKU vào LPN theo số đã nhận. Mỗi thùng ~{piecesPerLpn} cái (theo box type). Tự dừng khi
          đủ số lượng SKU.
        </p>

        <select
          value={selectedBatchId}
          onChange={(e) => onSelectedBatchIdChange(e.target.value)}
          aria-label="Chọn batch"
          className="mb-2 w-full rounded border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
        >
          <option value="">— Batch —</option>
          {batches.map((b) => (
            <option key={b.batchId} value={b.batchId}>
              {b.batchCode}
            </option>
          ))}
        </select>

        <div className="mb-3 space-y-2">
          {items.map((item) => {
            const target = targetQty(item)
            const done = allocated[item.skuId] ?? 0
            const rem = Math.max(0, target - done)
            const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0
            return (
              <div
                key={item.inboundRequestItemId}
                className={`rounded border px-2 py-1.5 text-xs ${
                  rem === 0 && target > 0
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-white/10 bg-black/20'
                }`}
              >
                <div className="flex justify-between gap-2">
                  <span className="text-slate-300">{item.sku?.skuCode ?? item.skuId.slice(0, 8)}</span>
                  <span className="text-slate-400">
                    LPN: <strong className="text-slate-200">{done}</strong> / {target} cái
                    {rem > 0 && <span className="text-amber-300"> · còn {rem}</span>}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded bg-white/10">
                  <div
                    className="h-full bg-cyan-500/70 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <select
          value={detailSkuId}
          onChange={(e) => {
            onDetailSkuIdChange(e.target.value)
            const rem = remainingForSku(e.target.value)
            onDetailQtyChange(Math.min(piecesPerLpn, rem || 1))
          }}
          aria-label="Chọn SKU đóng thùng"
          className="mb-2 w-full rounded border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
        >
          <option value="">— SKU đóng thùng —</option>
          {items.map((item) => {
            const rem = remainingForSku(item.skuId)
            return (
              <option key={item.skuId} value={item.skuId} disabled={rem <= 0}>
                {item.sku?.skuCode} (còn {rem})
              </option>
            )
          })}
        </select>

        <div className="mb-2 flex flex-wrap gap-2">
          <input
            value={lpnCode}
            onChange={(e) => onLpnCodeChange(e.target.value)}
            placeholder={`${inboundCode}-LPN-001 (tự sinh nếu trống)`}
            className="min-w-[140px] flex-1 rounded border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
          />
          <select
            value={boxType}
            onChange={(e) => onBoxTypeChange(e.target.value as BoxType)}
            aria-label="Chọn box type"
            className="rounded border border-white/10 bg-[#0f172a] px-2 text-sm"
          >
            {BOX_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {readiness?.boxTypeSuggestion?.recommendedBoxType && (
          <p className="mb-2 text-xs text-slate-400">
            Gợi ý:{' '}
            <button
              type="button"
              onClick={onApplySuggestedBoxType}
              className="font-medium text-cyan-300 hover:underline"
            >
              {readiness.boxTypeSuggestion.recommendedBoxType}
            </button>
          </p>
        )}

        <div className="mb-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!selectedBatchId || !detailSkuId || selectedRemaining <= 0}
            onClick={onCreateNextLpn}
            className="rounded bg-cyan-600 px-3 py-2 text-sm disabled:opacity-40"
          >
            Tạo 1 LPN (+{suggestedQty} cái)
          </button>
          <button
            type="button"
            disabled={!selectedBatchId || !detailSkuId || selectedRemaining <= 0}
            onClick={onFillSkuLpns}
            className="rounded bg-cyan-700/80 px-3 py-2 text-sm disabled:opacity-40"
          >
            Tạo đủ LPN cho SKU
          </button>
        </div>

        <details className="mb-3 text-xs text-slate-500">
          <summary className="cursor-pointer text-slate-400">Thêm SKU vào LPN có sẵn</summary>
          <div className="mt-2 flex gap-2">
            <select
              value={selectedLpnId}
              onChange={(e) => onSelectedLpnIdChange(e.target.value)}
              aria-label="Chọn LPN"
              className="flex-1 rounded border border-white/10 bg-[#0f172a] px-2 py-1.5 text-sm"
            >
              <option value="">— LPN —</option>
              {lpns.map((l) => (
                <option key={l.lpnId} value={l.lpnId}>
                  {l.lpnCode} ({l.status})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={selectedRemaining || undefined}
              aria-label="Số lượng"
              value={detailQty}
              onChange={(e) => onDetailQtyChange(Number(e.target.value))}
              className="w-16 rounded border border-white/10 bg-[#0f172a] px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              disabled={!selectedLpnId || !detailSkuId || detailQty < 1}
              onClick={onAddLpnDetail}
              className="rounded bg-slate-600 px-2 text-sm disabled:opacity-40"
            >
              Gán
            </button>
          </div>
        </details>

        {lpns.length > 0 && (
          <ul className="mb-3 max-h-32 overflow-y-auto text-xs text-slate-400">
            {lpns.map((l) => (
              <li key={l.lpnId} className="border-t border-white/5 py-1 font-mono">
                {l.lpnCode} · {l.boxType}
                {(lpnDetailsByLpn[l.lpnId] ?? []).map((d) => (
                  <span key={d.lpnDetailId} className="ml-2 text-slate-500">
                    {d.quantity}×{d.skuId.slice(0, 6)}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}

        <h3 className="mb-2 text-sm font-medium text-slate-300">Putaway</h3>
        {putawaySlot}
      </div>
    </section>
  )
}
