import type { ApiInboundApprovalReadiness } from '../../api/inboundRequests'

type Props = {
  readiness: ApiInboundApprovalReadiness
}

export function InboundApprovalPanel({ readiness }: Props) {
  const { warehouseStorage: ws, assumptions: a } = readiness

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
        Trước khi duyệt: so sánh hàng dự kiến với bin còn trống trong kho. Giả định{' '}
        <strong className="text-slate-300">{a.piecesPerLpn} cái/thùng</strong>, thùng{' '}
        <strong className="text-slate-300">{a.boxType}</strong> ({a.volumeUnitsPerLpn} volume
        units/thùng).
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-xs text-slate-500">Hàng inbound</p>
          <p className="mt-1 text-slate-200">
            <strong>{readiness.totalExpectedPieces.toLocaleString('vi-VN')}</strong> cái ·{' '}
            {readiness.inboundLineCount} dòng SKU
          </p>
          <p className="mt-1 text-xs text-cyan-300/90">
            ≈ {readiness.estimatedLpnNeeded} thùng (LPN) · ≈ {readiness.estimatedVolumeUnitsNeeded}{' '}
            volume units
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
    </section>
  )
}
