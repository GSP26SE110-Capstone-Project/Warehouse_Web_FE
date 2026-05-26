import type { InboundDeliveryPayload } from '../../api/inboundDeliveries'
import type { DeliveryMode } from '../../data/deliveryMode'

export type DeliveryFormState = InboundDeliveryPayload

type Props = {
  deliveryMode: DeliveryMode
  value: DeliveryFormState
  onChange: (next: DeliveryFormState) => void
  disabled?: boolean
  compact?: boolean
}

const inputClass =
  'w-full rounded border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-white disabled:opacity-50'

export function InboundDeliveryForm({
  deliveryMode,
  value,
  onChange,
  disabled,
  compact,
}: Props) {
  const set = (patch: Partial<DeliveryFormState>) => onChange({ ...value, ...patch })

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {deliveryMode === 'WAREHOUSE_TRANSPORT' && (
        <p className="text-xs text-slate-400">
          Kho sẽ bổ sung / cập nhật thông tin xe trước khi bấm <strong>Xe đã đến</strong>.
        </p>
      )}
      <div className={compact ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-4 sm:grid-cols-2'}>
        <div>
          <label className="mb-1 block text-xs text-slate-500" htmlFor="vehiclePlate">
            Biển số xe *
          </label>
          <input
            id="vehiclePlate"
            className={`${inputClass} font-mono uppercase`}
            value={value.vehiclePlate}
            disabled={disabled}
            placeholder="51F-12345"
            onChange={(e) => set({ vehiclePlate: e.target.value.toUpperCase() })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500" htmlFor="driverName">
            Tên tài xế
          </label>
          <input
            id="driverName"
            className={inputClass}
            value={value.driverName ?? ''}
            disabled={disabled}
            onChange={(e) => set({ driverName: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500" htmlFor="driverPhone">
            SĐT tài xế
          </label>
          <input
            id="driverPhone"
            className={inputClass}
            value={value.driverPhone ?? ''}
            disabled={disabled}
            onChange={(e) => set({ driverPhone: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500" htmlFor="driverIdNumber">
            CCCD (tùy chọn)
          </label>
          <input
            id="driverIdNumber"
            className={inputClass}
            value={value.driverIdNumber ?? ''}
            disabled={disabled}
            onChange={(e) => set({ driverIdNumber: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-slate-500" htmlFor="carrierName">
            Đơn vị vận chuyển / hãng xe
          </label>
          <input
            id="carrierName"
            className={inputClass}
            value={value.carrierName ?? ''}
            disabled={disabled}
            onChange={(e) => set({ carrierName: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-slate-500" htmlFor="deliveryNotes">
            Ghi chú cổng
          </label>
          <textarea
            id="deliveryNotes"
            rows={2}
            className={inputClass}
            value={value.notes ?? ''}
            disabled={disabled}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

export const emptyDeliveryForm = (): DeliveryFormState => ({
  vehiclePlate: '',
  driverName: '',
  driverPhone: '',
  driverIdNumber: '',
  carrierName: '',
  notes: '',
})
