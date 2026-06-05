import type { ContractTypeValue } from '../data/contractTypes'
import { REFERENCE_ZONE_AREA_M2 } from './warehouseCapacity'

/** Đồng bộ Warehouse_BE_V2/docs/pricing2.md */
export const CONTRACT_RECOMMENDATION_THRESHOLDS = {
  SHARED_MAX_BOXES: 20,
  DEDICATED_ZONE_MIN_BOXES: 50,
  DEDICATED_ZONE_MIN_AREA_M2: REFERENCE_ZONE_AREA_M2,
  DEDICATED_WAREHOUSE_MIN_AREA_M2: 500,
} as const

export type ContractRecommendationConfidence = 'high' | 'medium' | 'low'

export interface ContractTypeRecommendationInput {
  estimatedBoxCount?: number | null
  totalCommittedVolumeUnits?: number | null
  requestedAreaM2?: number | null
}

export interface ContractTypeRecommendation {
  contractType: ContractTypeValue
  confidence: ContractRecommendationConfidence
  reason: string
  metrics?: {
    estimatedBoxCount?: number
    totalU?: number
    effectiveAreaM2?: number
  }
}

function positiveNumber(value: number | null | undefined): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function recommendGuestContractType(
  input: ContractTypeRecommendationInput
): ContractTypeRecommendation {
  const boxes = positiveNumber(input.estimatedBoxCount)
  const totalU = positiveNumber(input.totalCommittedVolumeUnits)
  const area = positiveNumber(input.requestedAreaM2)

  const hasScale = boxes != null || totalU != null || area != null

  if (!hasScale) {
    return {
      contractType: 'NEEDS_CONSULTATION',
      confidence: 'low',
      reason:
        'Nhập loại hàng + số lượng hoặc diện tích (m²) để hệ thống gợi ý loại hình thuê phù hợp.',
    }
  }

  const effectiveAreaM2 = area ?? 0
  const metrics: ContractTypeRecommendation['metrics'] = {
    estimatedBoxCount: boxes ?? undefined,
    totalU: totalU ?? undefined,
    effectiveAreaM2: effectiveAreaM2 > 0 ? effectiveAreaM2 : undefined,
  }

  const T = CONTRACT_RECOMMENDATION_THRESHOLDS

  if (effectiveAreaM2 >= T.DEDICATED_WAREHOUSE_MIN_AREA_M2) {
    return {
      contractType: 'DEDICATED_WAREHOUSE',
      confidence: 'high',
      reason: `Diện tích từ ${effectiveAreaM2.toLocaleString('vi-VN')} m² phù hợp thuê nguyên một kho.`,
      metrics: { ...metrics, effectiveAreaM2 },
    }
  }

  if (
    effectiveAreaM2 >= T.DEDICATED_ZONE_MIN_AREA_M2 ||
    (boxes != null && boxes >= T.DEDICATED_ZONE_MIN_BOXES)
  ) {
    const parts: string[] = []
    if (boxes != null) {
      parts.push(`~${boxes.toLocaleString('vi-VN')} thùng/tháng`)
    }
    if (effectiveAreaM2 >= T.DEDICATED_ZONE_MIN_AREA_M2) {
      parts.push(`${effectiveAreaM2.toLocaleString('vi-VN')} m²`)
    }
    return {
      contractType: 'DEDICATED_ZONE',
      confidence: 'high',
      reason: `Quy mô ${parts.join(' · ')} — nên thuê một khu riêng trong kho.`,
      metrics,
    }
  }

  if (boxes != null && boxes <= T.SHARED_MAX_BOXES) {
    return {
      contractType: 'SHARED_STORAGE',
      confidence: 'high',
      reason: `~${boxes.toLocaleString('vi-VN')} thùng/tháng — phù hợp lưu hàng linh hoạt, trả theo mức dùng thực tế.`,
      metrics,
    }
  }

  if (boxes != null && boxes > T.SHARED_MAX_BOXES && boxes < T.DEDICATED_ZONE_MIN_BOXES) {
    return {
      contractType: 'SHARED_STORAGE',
      confidence: 'medium',
      reason: `~${boxes.toLocaleString('vi-VN')} thùng/tháng — quy mô trung bình; lưu hàng linh hoạt vẫn phù hợp, kho có thể tư vấn thêm khi duyệt.`,
      metrics,
    }
  }

  if (area != null && area < T.DEDICATED_ZONE_MIN_AREA_M2) {
    return {
      contractType: 'SHARED_STORAGE',
      confidence: 'medium',
      reason: `${area.toLocaleString('vi-VN')} m² — quy mô nhỏ, phù hợp lưu hàng linh hoạt nếu chưa cần khu riêng.`,
      metrics: { ...metrics, effectiveAreaM2: area },
    }
  }

  return {
    contractType: 'NEEDS_CONSULTATION',
    confidence: 'low',
    reason: 'Chưa đủ dữ liệu để gợi ý chắc chắn — kho sẽ đề xuất khi duyệt yêu cầu.',
    metrics,
  }
}
