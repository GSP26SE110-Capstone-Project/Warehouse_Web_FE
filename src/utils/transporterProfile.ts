import type { ApiUser } from '../api/types'
import type { DeliveryFormState } from '../components/inbound/InboundDeliveryForm'

/** Điền form vận chuyển từ hồ sơ tài xế (chỉ các trường còn trống). */
export function fillDeliveryFromTransporterProfile(
  transporter: ApiUser,
  current: DeliveryFormState,
  { overwrite = false }: { overwrite?: boolean } = {}
): DeliveryFormState {
  const pick = (currentVal: string | undefined, profileVal: string | null | undefined) => {
    const cur = (currentVal ?? '').trim()
    const prof = (profileVal ?? '').trim()
    if (overwrite || !cur) return prof
    return cur
  }

  return {
    vehiclePlate: pick(current.vehiclePlate, transporter.defaultVehiclePlate),
    driverName: pick(current.driverName, transporter.fullName),
    driverPhone: pick(current.driverPhone, transporter.phone),
    driverIdNumber: pick(current.driverIdNumber, transporter.defaultDriverIdNumber),
    carrierName: pick(current.carrierName, transporter.defaultCarrierName),
    notes: current.notes ?? '',
  }
}
