import { useMemo, useEffect } from 'react'
import type { ApiInboundRequestItem } from '../../api/inboundRequests'
import type { ApiInboundApprovalReadiness } from '../../api/inboundRequests'
import type { ApiBatch } from '../../api/batches'
import type { ApiLpn, ApiLpnDetail, BoxType } from '../../api/lpns'
import type { ApiProductKind, ApiSizeFactor } from '../../api/productCatalog'
import { pickLargestBoxTypeForZoneTypes } from '../../data/binCapacityDefaults'
import { filterBoxTypeOptionsForMax } from '../../data/inboundStatus'
import { formatBoxTypeName } from '../../data/lpnTerminology'
import { computePiecesPerLpnForSku } from '../../utils/volumeUnits'

type Props = {
  inboundCode: string
  items: ApiInboundRequestItem[]
  batches: ApiBatch[]
  lpns: ApiLpn[]
  lpnDetails: ApiLpnDetail[]
  receivedDraft: Record<string, number>
  readiness: ApiInboundApprovalReadiness | null
  productCatalogByKind: Map<string, ApiProductKind>
  sizeFactors: ApiSizeFactor[]
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
  productCatalogByKind,
  sizeFactors,
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
  const maxBoxType = pickLargestBoxTypeForZoneTypes(
    readiness?.boxTypeSuggestion?.contractZoneTypes
  )
  const allowedBoxTypeOptions = useMemo(
    () => filterBoxTypeOptionsForMax(maxBoxType),
    [maxBoxType]
  )

  const selectedItem = useMemo(
    () => items.find((i) => i.skuId === detailSkuId),
    [items, detailSkuId]
  )

  const packInfo = useMemo(
    () =>
      computePiecesPerLpnForSku(
        boxType,
        selectedItem?.sku?.productKind,
        selectedItem?.sku?.size,
        productCatalogByKind,
        sizeFactors
      ),
    [boxType, selectedItem, productCatalogByKind, sizeFactors]
  )

  const piecesPerLpn = packInfo.pieces

  useEffect(() => {
    if (allowedBoxTypeOptions.some((o) => o.value === boxType)) return
    const fallback = allowedBoxTypeOptions[allowedBoxTypeOptions.length - 1]?.value as
      | BoxType
      | undefined
    if (fallback) onBoxTypeChange(fallback)
  }, [allowedBoxTypeOptions, boxType, onBoxTypeChange])

  useEffect(() => {
    if (!detailSkuId) return
    const rem = remainingForSku(detailSkuId)
    onDetailQtyChange(Math.min(piecesPerLpn, Math.max(rem, 1)))
  }, [boxType, piecesPerLpn, detailSkuId])

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

  const skuCodeById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const item of items) {
      if (item.sku?.skuCode) map[item.skuId] = item.sku.skuCode
    }
    for (const d of lpnDetails) {
      if (d.sku?.skuCode) map[d.skuId] = d.sku.skuCode
    }
    return map
  }, [items, lpnDetails])

  function formatDetailLabel(d: ApiLpnDetail) {
    const code = d.sku?.skuCode ?? skuCodeById[d.skuId] ?? d.skuId.slice(0, 8)
    return `${d.quantity}×${code}`
  }

  return (
    <section className="mb-8 grid gap-6 md:grid-cols-2 text-slate-800">
      {/* Cụm Batch */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Batch</h2>
        <div className="mb-2 flex gap-2">
          <input
            value={batchCode}
            onChange={(e) => onBatchCodeChange(e.target.value)}
            placeholder="BATCH-001"
            className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            type="button"
            onClick={onCreateBatch}
            className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 transition-colors"
          >
            Tạo
          </button>
        </div>
        <ul className="text-xs text-slate-500 divide-y divide-slate-100">
          {batches.map((b) => (
            <li key={b.batchId} className="py-2 font-mono text-slate-700">
              {b.batchCode}
            </li>
          ))}
        </ul>
      </div>

      {/* Cụm LPN & đóng thùng */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">LPN &amp; đóng thùng</h2>
        <p className="mb-3 text-xs text-slate-500 leading-relaxed">
          Gán SKU vào LPN theo số đã nhận.
          {detailSkuId ? (
            <>
              {' '}
              Mỗi thùng <strong className="text-slate-700">{formatBoxTypeName(boxType)}</strong>: ~
              <strong className="text-cyan-600 font-bold"> {piecesPerLpn}</strong> cái
              {packInfo.skuVolume ? (
                <>
                  {' '}
                  ({packInfo.skuVolume.finalVolumeUnitsPerPiece} U/cái
                  {selectedItem?.sku?.size ? ` · size ${selectedItem.sku.size}` : ''}
                  {packInfo.skuVolume.displayName
                    ? ` · ${packInfo.skuVolume.displayName}`
                    : ''}
                  )
                </>
              ) : (
                <span className="text-amber-700 font-medium"> (chưa có productKind/size — dùng ước tính cũ)</span>
              )}
              .
            </>
          ) : (
            <> Chọn SKU để xem số cái/thùng theo loại hàng + size.</>
          )}{' '}
          Tự dừng khi đủ số lượng SKU.
        </p>

        <select
          value={selectedBatchId}
          onChange={(e) => onSelectedBatchIdChange(e.target.value)}
          aria-label="Chọn batch"
          className="mb-2 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-cyan-500 focus:outline-none"
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
                className={`rounded border px-3 py-2 text-xs shadow-sm ${
                  rem === 0 && target > 0
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-slate-700">{item.sku?.skuCode ?? item.skuId.slice(0, 8)}</span>
                  <span className="text-slate-500 font-medium">
                    LPN: <strong className="text-slate-800 font-bold">{done}</strong> / {target} cái
                    {rem > 0 && <span className="text-amber-700 ml-1 font-bold">· còn {rem}</span>}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-slate-200">
                  <div
                    className="h-full bg-cyan-600 transition-all"
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
          className="mb-2 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-cyan-500 focus:outline-none"
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
            className="min-w-[140px] flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-cyan-500 focus:outline-none"
          />
          <select
            value={boxType}
            onChange={(e) => onBoxTypeChange(e.target.value as BoxType)}
            aria-label="Chọn box type"
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-cyan-500 focus:outline-none"
          >
            {allowedBoxTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {readiness?.boxTypeSuggestion?.contractZoneTypes?.length ? (
          <p className="mb-2 text-[11px] text-slate-500 font-medium">
            Zone HĐ: {readiness.boxTypeSuggestion.contractZoneTypes.join(', ')} — tối đa{' '}
            <strong className="text-slate-700">{formatBoxTypeName(maxBoxType)}</strong>
          </p>
        ) : null}

        {readiness?.boxTypeSuggestion?.recommendedBoxType &&
          allowedBoxTypeOptions.some(
            (o) => o.value === readiness.boxTypeSuggestion.recommendedBoxType
          ) && (
          <p className="mb-2 text-xs text-slate-600 font-medium">
            Gợi ý:{' '}
            <button
              type="button"
              onClick={onApplySuggestedBoxType}
              className="font-bold text-cyan-600 hover:text-cyan-700 hover:underline"
            >
              {readiness.boxTypeSuggestion.recommendedBoxType}
            </button>
          </p>
        )}

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!selectedBatchId || !detailSkuId || selectedRemaining <= 0}
            onClick={onCreateNextLpn}
            className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 disabled:opacity-40 transition-colors"
          >
            Tạo 1 LPN (+{suggestedQty} cái)
          </button>
          <button
            type="button"
            disabled={!selectedBatchId || !detailSkuId || selectedRemaining <= 0}
            onClick={onFillSkuLpns}
            className="rounded bg-cyan-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-800 disabled:opacity-40 transition-colors"
          >
            Tạo đủ LPN cho SKU
          </button>
        </div>

        <details className="mb-4 text-xs text-slate-500 border border-slate-200 bg-slate-50/50 p-2.5 rounded-lg">
          <summary className="cursor-pointer text-slate-700 font-medium hover:text-slate-900">Thêm SKU vào LPN có sẵn</summary>
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            Chọn LPN → nhập <strong className="text-slate-700 font-medium">số lượng SKU (cái)</strong> → Gán. SKU
            lấy từ dropdown &quot;SKU đóng thùng&quot; phía trên.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <select
              value={selectedLpnId}
              onChange={(e) => onSelectedLpnIdChange(e.target.value)}
              aria-label="Chọn LPN"
              className="min-w-[200px] flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:outline-none"
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
              aria-label="Số lượng SKU gán vào LPN"
              title="Số cái SKU bỏ vào thùng LPN đã chọn"
              placeholder="SL"
              value={detailQty}
              onChange={(e) => onDetailQtyChange(Number(e.target.value))}
              className="w-20 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 text-right focus:outline-none"
            />
            <span className="text-[11px] text-slate-500 font-medium">cái</span>
            <button
              type="button"
              disabled={!selectedLpnId || !detailSkuId || detailQty < 1}
              onClick={onAddLpnDetail}
              className="rounded bg-slate-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 shadow-sm disabled:opacity-40 transition-colors"
            >
              Gán
            </button>
          </div>
        </details>

        {lpns.length > 0 && (
          <div className="mb-4">
            <p className="mb-1 text-[11px] text-slate-500 font-medium">
              Định dạng: mã LPN · loại thùng ·{' '}
              <span className="text-slate-400">số lượng×mã SKU</span> (hàng đã gán vào thùng)
            </p>
            <ul className="max-h-32 overflow-y-auto text-xs text-slate-700 divide-y divide-slate-100 bg-slate-50 p-2 rounded-lg border border-slate-200">
              {lpns.map((l) => (
                <li key={l.lpnId} className="py-1.5 font-mono">
                  <span className="font-bold text-cyan-700">{l.lpnCode}</span> · <span className="text-slate-600">{l.boxType}</span>
                  {(lpnDetailsByLpn[l.lpnId] ?? []).map((d) => (
                    <span key={d.lpnDetailId} className="ml-2 font-sans font-medium text-slate-500" title="Số lượng × mã SKU">
                      {formatDetailLabel(d)}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}

        <h3 className="mb-2 text-sm font-semibold text-slate-900 border-t border-slate-200 pt-3">Putaway</h3>
        {putawaySlot}
      </div>
    </section>
  )
}