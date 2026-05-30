import { getBinDayPrice } from '../data/pricing'
import {
  PLANNING_PIECES_PER_EXTRA_BOX,
  PLANNING_PIECES_PER_MEDIUM_BOX,
} from './rentalBoxEstimate'

export type GuestBoxTypeForEstimate = 'MEDIUM' | 'EXTRA'

export const REFERENCE_DAYS_PER_MONTH = 30

const GUEST_ESTIMATE_BOX_TYPES: GuestBoxTypeForEstimate[] = ['MEDIUM', 'EXTRA']

export interface GuestBoxStorageEstimate {
  boxType: GuestBoxTypeForEstimate
  label: string
  boxesPerMonth: number
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

/** Quy đổi số thùng MEDIUM/tháng → EXTRA/tháng (cùng quy cách cái/thùng tham chiếu). */
export function estimateExtraBoxesFromMediumCount(mediumPerMonth: number): number {
  if (!Number.isFinite(mediumPerMonth) || mediumPerMonth <= 0) return 0
  return Math.ceil(
    (mediumPerMonth * PLANNING_PIECES_PER_MEDIUM_BOX) / PLANNING_PIECES_PER_EXTRA_BOX
  )
}

export function buildGuestBoxStorageEstimates(
  boxesPerMonthByType: Record<GuestBoxTypeForEstimate, number>,
  rentalDays: number
): GuestBoxStorageEstimate[] {
  return GUEST_ESTIMATE_BOX_TYPES.map((boxType) => {
    const boxesPerMonth = boxesPerMonthByType[boxType] ?? 0
    const pricePerBoxDay = getBinDayPrice(boxType)
    return {
      boxType,
      label: boxType === 'MEDIUM' ? 'Medium Box' : 'Extra Box',
      boxesPerMonth,
      pricePerBoxDay,
      feePerMonth: estimateBoxStorageFee(
        boxesPerMonth,
        REFERENCE_DAYS_PER_MONTH,
        pricePerBoxDay
      ),
      feeFullPeriod: estimateBoxStorageFee(boxesPerMonth, rentalDays, pricePerBoxDay),
    }
  }).filter((row) => row.boxesPerMonth > 0)
}
