import { describe, expect, it } from 'vitest'
import { recommendGuestContractType } from './contractTypeRecommendation'

describe('recommendGuestContractType', () => {
  it('returns NEEDS_CONSULTATION when no scale data', () => {
    const rec = recommendGuestContractType({})
    expect(rec.contractType).toBe('NEEDS_CONSULTATION')
    expect(rec.confidence).toBe('low')
  })

  it('recommends SHARED_STORAGE for ~15 boxes', () => {
    const rec = recommendGuestContractType({ estimatedBoxCount: 15 })
    expect(rec.contractType).toBe('SHARED_STORAGE')
    expect(rec.confidence).toBe('high')
  })

  it('recommends DEDICATED_ZONE for 55 boxes', () => {
    const rec = recommendGuestContractType({ estimatedBoxCount: 55 })
    expect(rec.contractType).toBe('DEDICATED_ZONE')
    expect(rec.confidence).toBe('high')
  })

  it('recommends DEDICATED_WAREHOUSE for 600 m²', () => {
    const rec = recommendGuestContractType({ requestedAreaM2: 600 })
    expect(rec.contractType).toBe('DEDICATED_WAREHOUSE')
    expect(rec.confidence).toBe('high')
  })

  it('recommends SHARED_STORAGE with medium confidence for grey zone 30 boxes', () => {
    const rec = recommendGuestContractType({ estimatedBoxCount: 30 })
    expect(rec.contractType).toBe('SHARED_STORAGE')
    expect(rec.confidence).toBe('medium')
  })

  it('recommends DEDICATED_ZONE when area is 80 m² even with few boxes', () => {
    const rec = recommendGuestContractType({
      estimatedBoxCount: 5,
      requestedAreaM2: 80,
    })
    expect(rec.contractType).toBe('DEDICATED_ZONE')
    expect(rec.confidence).toBe('high')
  })
})
