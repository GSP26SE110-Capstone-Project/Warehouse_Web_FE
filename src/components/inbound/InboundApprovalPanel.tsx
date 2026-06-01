import type {
  ApiInboundApprovalReadiness,
  ApiInboundEstimateUsage,
} from '../../api/inboundRequests'
import { formatLpnSize } from '../../data/lpnTerminology'

type Props = {
  readiness: ApiInboundApprovalReadiness
}

const SEVERITY_STYLE: Record<
  ApiInboundEstimateUsage['severity'],
  { ring: string; bg: string; text: string; bar: string; label: string }
> = {
  ok: {
    ring: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-300',
    bar: 'bg-emerald-400',
    label: 'Trong ngưỡng estimate',
  },
  near: {
    ring: 'border-cyan-500/30',
    bg: 'bg-cyan-500/5',
    text: 'text-cyan-200',
    bar: 'bg-cyan-400',
    label: 'Sắp chạm trần estimate',
  },
  soft: {
    ring: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    text: 'text-amber-200',
    bar: 'bg-amber-400',
    label: 'Vượt estimate — cảnh báo mềm',
  },
  hard: {
    ring: 'border-red-500/40',
    bg: 'bg-red-500/10',
    text: 'text-red-200',
    bar: 'bg-red-500',
    label: 'Vượt xa estimate — cần xử lý',
  },
}

function EstimateUsagePanel({ usage }: { usage: ApiInboundEstimateUsage }) {
  const style = SEVERITY_STYLE[usage.severity]
  const boxPct = usage.boxUtilizationPercent ?? 0
  const barWidth = Math.min(100, boxPct)
  const overflow = Math.max(0, boxPct - 100)

  return (
    <div className={`mt-4 rounded-lg border ${style.ring} ${style.bg} px-3 py-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Mức sử dụng so với estimate hợp đồng
          </p>
          <p className={`mt-1 text-sm font-semibold ${style.text}`}>{style.label}</p>
        </div>
        {usage.requestCode && (
          <span className="rounded border border-white/10 bg-black/30 px-2 py-0.5 font-mono text-[10px] text-slate-400">
            {usage.requestCode}
          </span>
        )}
      </div>

      {usage.estimatedBoxCount != null && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between text-xs text-slate-300">
            <span>
              <strong className="text-white">
                {usage.cumulativePieces.toLocaleString('vi-VN')}
              </strong>
              {' / '}
              {usage.estimatedBoxCount.toLocaleString('vi-VN')} cái{' '}
              <span className="text-slate-500">(lũy kế / estimate)</span>
            </span>
            <span className={`font-mono font-semibold ${style.text}`}>{boxPct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full ${style.bar} transition-all`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          {overflow > 0 && (
            <p className={`mt-1 text-[11px] ${style.text}`}>
              Vượt thêm {usage.overageBoxes.toLocaleString('vi-VN')} cái so với estimate.
            </p>
          )}
        </div>
      )}

      <div className="mt-3 grid gap-2 text-[11px] text-slate-400 sm:grid-cols-3">
        <div>
          <p className="text-slate-500">Đợt inbound này</p>
          <p className="mt-0.5 text-slate-200">
            +{usage.currentInboundPieces.toLocaleString('vi-VN')} cái
          </p>
        </div>
        <div>
          <p className="text-slate-500">Các đợt trước</p>
          <p className="mt-0.5 text-slate-200">
            {usage.previousInboundPieces.toLocaleString('vi-VN')} cái
          </p>
        </div>
        <div>
          <p className="text-slate-500">SKU đang dùng</p>
          <p className="mt-0.5 text-slate-200">
            {usage.distinctSkus}
            {usage.estimatedSkuCount != null && ` / ${usage.estimatedSkuCount}`}
            {usage.skuUtilizationPercent != null && (
              <span className="ml-1 text-slate-500">
                ({usage.skuUtilizationPercent}%)
              </span>
            )}
          </p>
        </div>
      </div>

      {usage.severity === 'hard' && (
        <p className="mt-3 rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-200">
          Khuyến nghị: liên hệ tenant để ký phụ lục hợp đồng (mở rộng estimate) hoặc tạo
          rental request mới trước khi duyệt thêm inbound.
        </p>
      )}
      {usage.severity === 'soft' && (
        <p className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
          Vẫn cho phép duyệt, nhưng nên thông báo cho tenant để cập nhật quy mô lưu kho.
        </p>
      )}
    </div>
  )
}

export function InboundApprovalPanel({ readiness }: Props) {
  const { warehouseStorage: ws, assumptions: a } = readiness
  const p = readiness.pricingEstimate
  const formatMoney = (value: number | null | undefined) =>
    value == null
      ? '—'
      : `${value.toLocaleString('vi-VN')} ${p.currency}`

  const days = p.billingDaysPerMonth ?? 30

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
        Trước khi duyệt: so sánh hàng dự kiến với bin còn trống. Giả định{' '}
        <strong className="text-slate-300">{a.piecesPerLpn} cái/LPN</strong>, kích cỡ{' '}
        <strong className="text-slate-300">{formatLpnSize(a.boxType)}</strong> ({a.volumeUnitsPerLpn}{' '}
        volume units/LPN). Bin: tối đa{' '}
        <strong className="text-slate-300">{a.binMaxLpnCount ?? 4} LPN</strong> và{' '}
        <strong className="text-slate-300">{a.binMaxVolumeUnits ?? 16} volume</strong> — ví dụ tối
        đa 2 EXTRA hoặc 4 MEDIUM/bin.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-xs text-slate-500">Hàng inbound</p>
          <p className="mt-1 text-slate-200">
            <strong>{readiness.totalExpectedPieces.toLocaleString('vi-VN')}</strong> cái ·{' '}
            {readiness.inboundLineCount} dòng SKU
          </p>
          <p className="mt-1 text-xs text-cyan-300/90">
            ≈ {readiness.estimatedLpnNeeded} LPN · ≈ {readiness.estimatedVolumeUnitsNeeded}{' '}
            volume units
            {readiness.estimatedBinsNeeded != null && (
              <>
                {' '}
                · ≈ {readiness.estimatedBinsNeeded} bin cần putaway
              </>
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

      {readiness.estimateUsage && <EstimateUsagePanel usage={readiness.estimateUsage} />}

      <div className="mt-4 rounded-lg border border-white/10 bg-black/20 px-3 py-3">
        <p className="text-xs text-slate-500">Ước tính chi phí (tham khảo, theo hợp đồng)</p>
        {p.hasPricing ? (
          <>
            <p className="mt-2 text-xs font-medium text-slate-400">Nhập kho — một lần</p>
            <div className="mt-1 grid gap-1 text-xs text-slate-300 sm:grid-cols-2">
              <p>
                LPN/lần nhập ({formatLpnSize(a.boxType)}): {readiness.estimatedLpnNeeded} ×{' '}
                <strong>{formatMoney(p.inboundLpnUnitPrice)}</strong>
              </p>
              <p>
                Xử lý hàng: {readiness.estimatedLpnNeeded.toLocaleString('vi-VN')} LPN ×{' '}
                <strong>{formatMoney(p.handlingUnitPrice)}</strong>
              </p>
            </div>
            <p className="mt-1 text-sm text-slate-200">
              Tổng nhập kho:{' '}
              <strong className="text-cyan-300">
                {formatMoney(p.estimatedOneTimeOpsCost ?? p.estimatedTotalCost)}
              </strong>
            </p>

            <p className="mt-3 text-xs font-medium text-slate-400">Lưu kho — ước tính 1 tháng</p>
            <p className="mt-1 text-xs text-slate-300">
              LPN/ngày ({formatLpnSize(a.boxType)}): ~
              {p.estimatedAvgBoxesForMonth ?? readiness.estimatedLpnNeeded} LPN ×{' '}
              <strong>{formatMoney(p.storageBoxDayUnitPrice)}</strong>/ngày × {days} ngày
            </p>
            <p className="mt-1 text-sm text-slate-200">
              Phí lưu kho tháng:{' '}
              <strong className="text-violet-300">
                {formatMoney(p.estimatedMonthlyStorageCost)}
              </strong>
            </p>

            <p className="mt-3 border-t border-white/10 pt-2 text-sm font-medium text-emerald-300">
              Tổng tháng đầu (nhập + lưu): {formatMoney(p.estimatedFirstMonthTotal)}
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
