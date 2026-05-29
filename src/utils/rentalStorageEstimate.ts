import { getBinDayPrice } from '../data/pricing'

export type GuestBoxTypeForEstimate = 'MEDIUM' | 'EXTRA'

export const REFERENCE_DAYS_PER_MONTH = 30

const GUEST_ESTIMATE_BOX_TYPES: GuestBoxTypeForEstimate[] = ['MEDIUM', 'EXTRA']

export interface GuestBoxStorageEstimate {
  boxType: GuestBoxTypeForEstimate
  label: string
  pricePerBoxDay: number
  feePerMonth: number
  feeFullPeriod: number
}

/** Phí lưu trữ BOX_DAY ≈ số thùng trung bình × số ngày × đơn giá/box/ngày. */
export function estimateBoxStorageFee(
  boxesPerMonth: number,
  days: number,
  pricePerBoxPerDay: number
): number {
  if (!Number.isFinite(boxesPerMonth) || boxesPerMonth <= 0) return 0
  if (!Number.isFinite(days) || days <= 0) return 0
  if (!Number.isFinite(pricePerBoxPerDay) || pricePerBoxPerDay <= 0) return 0
  return Math.round(boxesPerMonth * days * pricePerBoxPerDay)
}

export function buildGuestBoxStorageEstimates(
  boxesPerMonth: number,
  rentalDays: number
): GuestBoxStorageEstimate[] {
  return GUEST_ESTIMATE_BOX_TYPES.map((boxType) => {
    const pricePerBoxDay = getBinDayPrice(boxType)
    return {
      boxType,
      label: boxType === 'MEDIUM' ? 'Medium Box' : 'Extra Box',
      pricePerBoxDay,
      feePerMonth: estimateBoxStorageFee(
        boxesPerMonth,
        REFERENCE_DAYS_PER_MONTH,
        pricePerBoxDay
      ),
      feeFullPeriod: estimateBoxStorageFee(boxesPerMonth, rentalDays, pricePerBoxDay),
    }
  })
}
