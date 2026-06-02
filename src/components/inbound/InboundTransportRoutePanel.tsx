import type { ApiWarehouse } from '../../api/types'
import type { ApiInboundDelivery } from '../../api/inboundDeliveries'

type Props = {
  delivery?: ApiInboundDelivery | null
  warehouse?: ApiWarehouse | null
  loading?: boolean
}

function formatWarehouseAddress(warehouse?: ApiWarehouse | null) {
  if (!warehouse) return '—'
  return [warehouse.address, warehouse.district, warehouse.city].filter(Boolean).join(', ') || '—'
}

export function InboundTransportRoutePanel({ delivery, warehouse, loading }: Props) {
  if (loading) {
    return <p className="text-xs text-slate-500">Đang tải tuyến vận chuyển...</p>
  }

  const pickupReady = Boolean(delivery?.pickupAddress?.trim())

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-300">
          <span className="material-symbols-outlined text-base">location_on</span>
          Điểm lấy hàng (tenant)
        </p>
        {pickupReady ? (
          <>
            <p className="mt-2 text-sm text-slate-200">{delivery?.pickupAddress}</p>
            <p className="mt-1 text-xs text-slate-400">
              {delivery?.pickupContactName}
              {delivery?.pickupContactPhone ? ` · ${delivery.pickupContactPhone}` : ''}
            </p>
            {delivery?.pickupNotes && (
              <p className="mt-2 text-xs text-slate-500">{delivery.pickupNotes}</p>
            )}
          </>
        ) : (
          <p className="mt-2 text-xs text-amber-300">
            Tenant chưa khai báo địa chỉ lấy hàng — liên hệ tenant trước khi điều xe.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300">
          <span className="material-symbols-outlined text-base">warehouse</span>
          Đích — kho nhận hàng
        </p>
        <p className="mt-2 text-sm font-medium text-slate-200">
          {warehouse?.warehouseName ?? '—'}
          {warehouse?.warehouseCode ? (
            <span className="ml-1 font-mono text-xs text-slate-500">({warehouse.warehouseCode})</span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-slate-400">{formatWarehouseAddress(warehouse)}</p>
      </div>
    </div>
  )
}
