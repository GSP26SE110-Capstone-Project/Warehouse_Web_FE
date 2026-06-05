export type PickupFormState = {
  pickupAddress: string
  pickupContactName: string
  pickupContactPhone: string
  pickupNotes?: string
}

export function emptyPickupForm(): PickupFormState {
  return {
    pickupAddress: '',
    pickupContactName: '',
    pickupContactPhone: '',
    pickupNotes: '',
  }
}

// Cập nhật class input sang phong cách Light Mode tiêu chuẩn
const inputClass =
  'w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:bg-slate-100 disabled:opacity-50 transition-colors'

type Props = {
  value: PickupFormState
  onChange: (next: PickupFormState) => void
  disabled?: boolean
}

export function InboundPickupForm({ value, onChange, disabled }: Props) {
  const set = (patch: Partial<PickupFormState>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-600">
        Tài xế kho sẽ đến địa chỉ này để lấy hàng, sau đó chuyển về kho trong hợp đồng.
      </p>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="pickupAddress">
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
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="pickupContactName">
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
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="pickupContactPhone">
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
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="pickupNotes">
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