export type PickupFormState = {
  pickupAddress: string
  pickupCity: string
  pickupDistrict: string
  pickupContactName: string
  pickupContactPhone: string
  pickupNotes?: string
}

export function emptyPickupForm(): PickupFormState {
  return {
    pickupAddress: '',
    pickupCity: '',
    pickupDistrict: '',
    pickupContactName: '',
    pickupContactPhone: '',
    pickupNotes: '',
  }
}

const inputClass =
  'w-full rounded border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-white disabled:opacity-50'

type Props = {
  value: PickupFormState
  onChange: (next: PickupFormState) => void
  disabled?: boolean
  /** Kho HĐ — chỉ cho phép lấy hàng cùng thành phố + quận với kho */
  warehouseCity?: string | null
  warehouseDistrict?: string | null
}

export function InboundPickupForm({
  value,
  onChange,
  disabled,
  warehouseCity,
  warehouseDistrict,
}: Props) {
  const set = (patch: Partial<PickupFormState>) => onChange({ ...value, ...patch })
  const lockedRegion = Boolean(warehouseCity?.trim() && warehouseDistrict?.trim())

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Tài xế kho sẽ đến địa chỉ này để lấy hàng (cùng thành phố và quận với kho — phí vận chuyển
        250.000 ₫/chuyến).
      </p>
      {lockedRegion ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Thành phố</label>
            <input disabled className={inputClass} value={warehouseCity ?? ''} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Quận / huyện</label>
            <input disabled className={inputClass} value={warehouseDistrict ?? ''} readOnly />
          </div>
        </div>
      ) : null}
      <div>
        <label className="mb-1 block text-xs text-slate-500" htmlFor="pickupAddress">
          Địa chỉ lấy hàng *
        </label>
        <textarea
          id="pickupAddress"
          rows={2}
          disabled={disabled}
          className={inputClass}
          value={value.pickupAddress}
          placeholder="Số nhà, đường, quận, thành phố"
          onChange={(e) => set({ pickupAddress: e.target.value })}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-500" htmlFor="pickupContactName">
            Người liên hệ tại điểm lấy *
          </label>
          <input
            id="pickupContactName"
            disabled={disabled}
            className={inputClass}
            value={value.pickupContactName}
            onChange={(e) => set({ pickupContactName: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500" htmlFor="pickupContactPhone">
            SĐT liên hệ *
          </label>
          <input
            id="pickupContactPhone"
            disabled={disabled}
            className={inputClass}
            value={value.pickupContactPhone}
            onChange={(e) => set({ pickupContactPhone: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500" htmlFor="pickupNotes">
          Ghi chú điểm lấy (cổng, giờ, hướng dẫn)
        </label>
        <textarea
          id="pickupNotes"
          rows={2}
          disabled={disabled}
          className={inputClass}
          value={value.pickupNotes ?? ''}
          onChange={(e) => set({ pickupNotes: e.target.value })}
        />
      </div>
    </div>
  )
}
