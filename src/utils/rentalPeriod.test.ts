import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addCalendarMonthsToDateOnly,
  contractBillingMonths,
  resolveEffectiveContractDates,
} from './rentalPeriod'

describe('contractBillingMonths', () => {
  it('counts calendar months between start and end', () => {
    expect(contractBillingMonths('2026-06-12', '2026-10-12')).toBe(4)
    expect(contractBillingMonths('2026-06-05', '2027-06-05')).toBe(12)
  })
})

describe('resolveEffectiveContractDates', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps dates when expected start is on or after today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00'))

    const result = resolveEffectiveContractDates('2026-06-12', '2026-10-12')
    expect(result.shifted).toBe(false)
    expect(result.startDate).toBe('2026-06-12')
    expect(result.endDate).toBe('2026-10-12')
    expect(result.billingMonths).toBe(4)
  })

  it('shifts start to today and extends end to preserve month count', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-25T12:00:00'))

    const result = resolveEffectiveContractDates('2026-06-12', '2026-10-12')
    expect(result.shifted).toBe(true)
    expect(result.startDate).toBe('2026-06-25')
    expect(result.endDate).toBe(addCalendarMonthsToDateOnly('2026-06-25', 4))
    expect(result.requestedStartDate).toBe('2026-06-12')
    expect(result.requestedEndDate).toBe('2026-10-12')
    expect(result.billingMonths).toBe(4)
  })

  it('handles month-end calendar add', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01T12:00:00'))

    const result = resolveEffectiveContractDates('2026-01-31', '2026-02-28')
    expect(result.shifted).toBe(true)
    expect(result.startDate).toBe('2026-03-01')
    expect(result.billingMonths).toBe(1)
    expect(result.endDate).toBe(addCalendarMonthsToDateOnly('2026-03-01', 1))
  })
})
