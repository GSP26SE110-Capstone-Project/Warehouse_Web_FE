import type { ApiInboundApprovalReadiness } from '../../api/inboundRequests'
import { formatBoxTypeName } from '../../data/lpnTerminology'
import { formatBoxAllocation } from '../../utils/volumeUnits'

type Props = {
  readiness: ApiInboundApprovalReadiness
}

export function InboundApprovalPanel({ readiness }: Props) {
  const { warehouseStorage: ws, assumptions: a } = readiness
  const p = readiness.pricingEstimate
  const formatMoney = (value: number | null | undefined) =>
    value == null
      ? '—'
      : `${value.toLocaleString('vi-VN')} ${p.currency}`

  const days = p.billingDaysPerMonth ?? 30
  const pricingBoxLabel = formatBoxTypeName(a.boxType)
  const lpnCount = readiness.estimatedLpnNeeded
  const lpnBreakdown =
    readiness.boxAllocation?.length &&
    formatBoxAllocation(readiness.boxAllocation, formatBoxTypeName)
  const totalLpnFromBreakdown = readiness.boxAllocation?.reduce((s, r) => s + r.count, 0) ?? 0
  const inboundLpnUnit = p.inboundLpnUnitPrice ?? 0
  const handlingUnit = p.handlingUnitPrice ?? 0
  const storageDayUnit = p.storageBoxDayUnitPrice ?? 0
  const avgLpnMonth = p.estimatedAvgBoxesForMonth ?? lpnCount

  const inboundLpnSubtotal =
    p.estimatedInboundLpnCost ?? (lpnCount > 0 ? lpnCount * inboundLpnUnit : null)
  const handlingSubtotal =
    p.estimatedHandlingCost ?? (lpnCount > 0 ? lpnCount * handlingUnit : null)
  const oneTimeTotal = p.estimatedOneTimeOpsCost ?? p.estimatedTotalCost
  const storageSubtotal =
    p.estimatedMonthlyStorageCost ??
    (avgLpnMonth > 0 ? avgLpnMonth * storageDayUnit * days : null)
  const firstMonthTotal = p.estimatedFirstMonthTotal

  const formatSubtotal = (value: number | null | undefined) =>
    value == null ? '—' : formatMoney(value)

  return (
    <section
      className={`mb-6 rounded-xl border p-4 text-sm ${
        readiness.sufficient
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-amber-500/40 bg-amber-500/10'
      }`}
    >
      <h2 className="mb-2 font-semibold text-white">Kiểm tra chỗ trống (ước tính)</h2>
      <p className="mb-3 text-xs text-slate-400">
        Trước khi duyệt: so sánh hàng dự kiến với bin còn trống.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-xs text-slate-500">Hàng inbound</p>
          <p className="mt-1 text-slate-200">
            <strong>{readiness.totalExpectedPieces.toLocaleString('vi-VN')}</strong> cái ·{' '}
            {readiness.inboundLineCount} dòng SKU
          </p>
          <p className="mt-1 text-xs text-cyan-300/90">
            {lpnBreakdown ? (
              <>
                <strong className="text-cyan-200">{lpnBreakdown}</strong>
                <span className="text-slate-400">
                  {' '}
                  — {totalLpnFromBreakdown} LPN · {readiness.estimatedVolumeUnitsNeeded} U hàng
                </span>
              </>
            ) : (
              <>
                {lpnCount} LPN ({formatBoxTypeName(a.boxType)}) · {readiness.estimatedVolumeUnitsNeeded}{' '}
                volume units
              </>
            )}
            {a.volumeBasedEstimate && (a.totalVolumeUnitsFromPieces ?? 0) > 0 && (
              <span className="block mt-1 text-slate-500">
                Tổng U = Σ(cái × U/cái){' '}
                {a.avgVolumeUnitsPerPiece
                  ? ` · ~${a.avgVolumeUnitsPerPiece} U/cái trung bình`
                  : ''}
              </span>
            )}
            {readiness.estimatedBinsNeeded != null && (
              <span className="block mt-0.5 text-slate-500">
                Cần {readiness.estimatedBinsNeeded} bin putaway
              </span>
            )}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-xs text-slate-500">Kho hiện tại (bin EMPTY / PARTIAL)</p>
          <p className="mt-1 text-slate-200">
            <strong>{ws.freeLpnSlots.toLocaleString('vi-VN')}</strong> slot LPN còn ·{' '}
            <strong>{ws.freeVolumeUnits.toLocaleString('vi-VN')}</strong> volume còn
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {ws.putawayEligibleBins} bin khả dụng / {ws.totalBins} bin tổng ({ws.emptyBins} trống
            hoàn toàn)
          </p>
        </div>
      </div>

      <p
        className={`mt-3 text-sm font-medium ${
          readiness.sufficient ? 'text-emerald-300' : 'text-amber-300'
        }`}
      >
        {readiness.sufficient
          ? 'Ước tính: đủ chỗ để nhận đợt hàng này (vẫn nên xác nhận khi xe tới).'
          : 'Cảnh báo: có thể thiếu chỗ — cân nhắc từ chối hoặc mở rộng rack/bin trước khi duyệt.'}
      </p>

      {readiness.warnings.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-xs text-amber-200/90">
          {readiness.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-lg border border-white/10 bg-black/20 px-3 py-3">
        <p className="text-xs text-slate-500">Ước tính chi phí (tham khảo, theo hợp đồng)</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Dùng thùng {pricingBoxLabel} — loại lớn nhất mà zone trong HĐ có thể chứa (tối ưu số
          LPN / chi phí cho tenant).
        </p>
        {p.hasPricing ? (
          <>
            <p className="mt-2 text-xs font-medium text-slate-400">Nhập kho — một lần</p>
            <ul className="mt-2 space-y-2 text-xs text-slate-300">
              <li className="rounded border border-white/5 bg-black/20 px-3 py-2">
                <p className="text-slate-400">
                  Phí nhập LPN ({lpnBreakdown ?? formatBoxTypeName(a.boxType)})
                </p>
                <p className="mt-1 font-mono text-slate-200">
                  {lpnCount} LPN × {inboundLpnUnit.toLocaleString('vi-VN')} {p.currency}
                  {' = '}
                  <strong className="text-white">{formatSubtotal(inboundLpnSubtotal)}</strong>
                </p>
              </li>
              <li className="rounded border border-white/5 bg-black/20 px-3 py-2">
                <p className="text-slate-400">Phí xử lý hàng (mỗi LPN)</p>
                <p className="mt-1 font-mono text-slate-200">
                  {lpnCount} LPN × {handlingUnit.toLocaleString('vi-VN')} {p.currency}
                  {' = '}
                  <strong className="text-white">{formatSubtotal(handlingSubtotal)}</strong>
                </p>
              </li>
            </ul>
            <p className="mt-2 text-sm text-slate-200">
              <span className="text-slate-400">Tổng nhập kho: </span>
              {inboundLpnSubtotal != null && handlingSubtotal != null ? (
                <span className="font-mono text-xs text-slate-400">
                  {inboundLpnSubtotal.toLocaleString('vi-VN')} +{' '}
                  {handlingSubtotal.toLocaleString('vi-VN')} {p.currency} ={' '}
                </span>
              ) : null}
              <strong className="text-cyan-300">{formatSubtotal(oneTimeTotal)}</strong>
            </p>

            <p className="mt-3 text-xs font-medium text-slate-400">Lưu kho — ước tính 1 tháng</p>
            <div className="mt-2 rounded border border-white/5 bg-black/20 px-3 py-2 text-xs text-slate-300">
              <p className="text-slate-400">
                Phí lưu LPN/ngày ({lpnBreakdown ?? formatBoxTypeName(a.boxType)})
              </p>
              <p className="mt-1 font-mono text-slate-200">
                {avgLpnMonth} LPN × {storageDayUnit.toLocaleString('vi-VN')} {p.currency}/ngày ×{' '}
                {days} ngày
                {' = '}
                <strong className="text-violet-300">{formatSubtotal(storageSubtotal)}</strong>
              </p>
            </div>

            <p className="mt-3 border-t border-white/10 pt-2 text-sm text-slate-200">
              <span className="text-slate-400">Tổng tháng đầu (nhập + lưu): </span>
              {oneTimeTotal != null && storageSubtotal != null ? (
                <span className="font-mono text-xs text-slate-400">
                  {oneTimeTotal.toLocaleString('vi-VN')} +{' '}
                  {storageSubtotal.toLocaleString('vi-VN')} {p.currency} ={' '}
                </span>
              ) : null}
              <strong className="text-emerald-300">{formatSubtotal(firstMonthTotal)}</strong>
            </p>
            {p.usedFallback && (
              <p className="mt-1 text-[10px] text-amber-300/80">
                Một phần đơn giá lấy từ docs/pricing.md — cập nhật contract_items để chính xác.
              </p>
            )}
          </>
        ) : (
          <p className="mt-1 text-xs text-amber-300/90">
            Chưa có đơn giá nhập kho / lưu kho / xử lý hàng trong hợp đồng để ước tính.
          </p>
        )}
      </div>
    </section>
  )
}
