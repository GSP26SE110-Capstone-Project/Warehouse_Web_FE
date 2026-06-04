import { apiRequest, apiPaginated, buildQuery } from './client'

export type LlmProvider = 'gemini' | 'ollama'

export interface AiSlotAlternative {
  recommendedZoneId?: string
  recommendedRackId?: string
  recommendedRackLevelId?: string
  recommendedBinId?: string
  zoneCode?: string
  rackCode?: string
  levelNumber?: number | null
  binCode?: string
  score?: number
  reasons?: string[]
}

export interface AiSlotPreview {
  lpnId: string
  lpnCode?: string
  tenantId?: string
  warehouseId: string
  inboundRequestId?: string
  recommendedZoneId?: string
  recommendedRackId?: string
  recommendedRackLevelId?: string
  recommendedBinId?: string
  zoneCode?: string
  rackCode?: string
  levelNumber?: number | null
  binCode?: string
  score?: number
  reasons?: string[]
  featureSnapshot?: Record<string, unknown>
  modelVersion?: string
  suggestedRackType?: string
  alternatives?: AiSlotAlternative[]
}

export interface AiSlotRecommendation extends AiSlotPreview {
  recommendationId: string
  skuId?: string | null
  recommendationScore?: number | null
  reason?: string
  isApplied?: boolean
  createdAt?: string
  parsedReason?: {
    reasons?: string[]
    modelVersion?: string
    featureSnapshot?: Record<string, unknown>
  } | null
}

export interface LlmHealthStatus {
  reachable?: boolean
  enabled?: boolean
  baseUrl?: string
  model?: string
  modelAvailable?: boolean
  models?: string[]
  message?: string
}

export interface AiSlotLlmExplanation {
  recommendationId?: string
  lpnCode?: string | null
  zoneCode?: string | null
  rackCode?: string | null
  binCode?: string | null
  recommendationScore?: number | null
  score?: number | null
  reasons?: string[]
  explanation?: string
  llmModel?: string
  llmProvider?: LlmProvider
  ollamaBaseUrl?: string
  geminiModel?: string
  totalDurationNs?: number | null
}

export function getGeminiHealth() {
  return apiRequest<LlmHealthStatus>('/ai/slot-recommendations/gemini/health')
}

export function getOllamaHealth() {
  return apiRequest<LlmHealthStatus>('/ai/slot-recommendations/ollama/health')
}

export function previewSlotRecommendation(body: {
  lpnId: string
  warehouseId: string
  inboundRequestId?: string
}) {
  return apiRequest<AiSlotPreview>('/ai/slot-recommendations/preview', {
    method: 'POST',
    body,
  })
}

export function createSlotRecommendation(body: {
  lpnId: string
  warehouseId: string
  inboundRequestId?: string
}) {
  return apiRequest<AiSlotRecommendation>('/ai/slot-recommendations', {
    method: 'POST',
    body,
  })
}

export function explainSlotRecommendation(body: {
  llmProvider: LlmProvider
  recommendationId?: string
  lpnId?: string
  warehouseId?: string
  inboundRequestId?: string
  slot?: AiSlotPreview
}) {
  return apiRequest<AiSlotLlmExplanation>('/ai/slot-recommendations/explain', {
    method: 'POST',
    body,
  })
}

export function explainSlotRecommendationById(
  recommendationId: string,
  llmProvider: LlmProvider
) {
  return apiRequest<AiSlotLlmExplanation>(
    `/ai/slot-recommendations/${recommendationId}/explain${buildQuery({ llmProvider })}`
  )
}

export function listSlotRecommendations(params?: {
  lpnId?: string
  inboundRequestId?: string
  isApplied?: boolean
  page?: number
  limit?: number
}) {
  return apiPaginated<AiSlotRecommendation>(
    `/ai/slot-recommendations${buildQuery(params ?? {})}`
  )
}

export function getSlotRecommendation(recommendationId: string) {
  return apiRequest<AiSlotRecommendation>(
    `/ai/slot-recommendations/${recommendationId}`
  )
}

export function updateSlotRecommendation(
  recommendationId: string,
  body: { isApplied?: boolean }
) {
  return apiRequest<AiSlotRecommendation>(
    `/ai/slot-recommendations/${recommendationId}`,
    { method: 'PATCH', body }
  )
}
