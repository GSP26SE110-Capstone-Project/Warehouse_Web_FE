import { useCallback, useEffect, useState } from 'react'
import { InlineAlert } from '../ui/FeedbackAlert'
import { ApiError } from '../../api/client'
import * as aiApi from '../../api/aiSlotRecommendations'
import type { AiSlotPreview, LlmProvider } from '../../api/aiSlotRecommendations'

type Props = {
  lpnId: string
  lpnCode?: string
  warehouseId: string
  inboundRequestId?: string
  /** LPN đã có ít nhất một SKU trong thùng */
  hasLpnDetails?: boolean
  disabled?: boolean
  onSelectRecommendedBin: (binId: string, recommendationId?: string) => void
}

function scorePercent(score?: number) {
  if (score == null || Number.isNaN(score)) return '—'
  return `${Math.round(score * 100)}%`
}

export function AiPutawayPanel({
  lpnId,
  lpnCode,
  warehouseId,
  inboundRequestId,
  hasLpnDetails = true,
  disabled,
  onSelectRecommendedBin,
}: Props) {
  const [provider, setProvider] = useState<LlmProvider>('gemini')
  const [geminiOk, setGeminiOk] = useState<boolean | null>(null)
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null)
  const [preview, setPreview] = useState<AiSlotPreview | null>(null)
  const [explanation, setExplanation] = useState('')
  const [explainModel, setExplainModel] = useState('')
  const [previewBusy, setPreviewBusy] = useState(false)
  const [explainBusy, setExplainBusy] = useState(false)
  const [applyBusy, setApplyBusy] = useState(false)
  const [error, setError] = useState('')
  const [showAlternatives, setShowAlternatives] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      aiApi.getGeminiHealth().catch(() => ({ reachable: false })),
      aiApi.getOllamaHealth().catch(() => ({ reachable: false })),
    ]).then(([g, o]) => {
      if (cancelled) return
      setGeminiOk(Boolean(g.reachable && g.modelAvailable !== false))
      setOllamaOk(Boolean(o.reachable && o.modelAvailable !== false))
      if (!g.reachable && o.reachable) setProvider('ollama')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const runPreview = useCallback(async () => {
    if (!lpnId || !warehouseId) return
    setPreviewBusy(true)
    setError('')
    setExplanation('')
    try {
      const result = await aiApi.previewSlotRecommendation({
        lpnId,
        warehouseId,
        inboundRequestId,
      })
      setPreview(result)
    } catch (err) {
      setPreview(null)
      setError(err instanceof ApiError ? err.message : 'Không tạo được gợi ý slot')
    } finally {
      setPreviewBusy(false)
    }
  }, [lpnId, warehouseId, inboundRequestId])

  useEffect(() => {
    if (!lpnId || !hasLpnDetails) {
      setPreview(null)
      setExplanation('')
      return
    }
    void runPreview()
  }, [lpnId, hasLpnDetails, runPreview])

  const runExplain = async () => {
    if (!preview) return
    const providerUp = provider === 'gemini' ? geminiOk : ollamaOk
    if (providerUp === false) {
      setError(
        provider === 'gemini'
          ? 'Gemini chưa sẵn sàng — kiểm tra GEMINI_API_KEY hoặc chọn Ollama.'
          : 'Ollama chưa chạy — khởi động Ollama và pull model.'
      )
      return
    }
    setExplainBusy(true)
    setError('')
    try {
      const result = await aiApi.explainSlotRecommendation({
        llmProvider: provider,
        slot: {
          lpnCode: preview.lpnCode,
          binCode: preview.binCode,
          zoneCode: preview.zoneCode,
          rackCode: preview.rackCode,
          levelNumber: preview.levelNumber,
          score: preview.score,
          reasons: preview.reasons,
          modelVersion: preview.modelVersion,
          suggestedRackType: preview.suggestedRackType,
        },
      })
      setExplanation(result.explanation ?? '')
      setExplainModel(result.llmModel ?? '')
    } catch (err) {
      setExplanation('')
      setError(
        err instanceof ApiError
          ? err.message
          : 'Không tạo được giải thích AI (LLM có thể đang tắt)'
      )
    } finally {
      setExplainBusy(false)
    }
  }

  const applyRecommendation = async () => {
    if (!preview?.recommendedBinId) {
      setError('Rule engine chưa gợi ý được bin phù hợp.')
      return
    }
    setApplyBusy(true)
    setError('')
    try {
      const saved = await aiApi.createSlotRecommendation({
        lpnId,
        warehouseId,
        inboundRequestId,
      })
      onSelectRecommendedBin(
        saved.recommendedBinId ?? preview.recommendedBinId,
        saved.recommendationId
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không lưu được gợi ý')
    } finally {
      setApplyBusy(false)
    }
  }

  if (!lpnId) {
    return (
      <p className="text-xs font-semibold text-slate-300">
        Chọn một LPN (đã gán SKU) để xem gợi ý putaway từ rule engine.
      </p>
    )
  }

  if (!hasLpnDetails) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200">
        Thêm ít nhất một SKU vào LPN trước khi dùng gợi ý AI putaway.
      </div>
    )
  }

  const providerReady = provider === 'gemini' ? geminiOk : ollamaOk

  return (
    <div className="space-y-3 rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-950/60 to-slate-900 p-4 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/5 pb-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="material-symbols-outlined text-lg text-violet-400">psychology</span>
            Gợi ý putaway (AI)
          </h3>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-300">
            Bin do rule engine chọn · LLM chỉ giải thích tiếng Việt
            {lpnCode ? (
              <>
                {' '}
                · <span className="font-mono font-bold text-cyan-200 bg-white/5 px-1 rounded">{lpnCode}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-slate-950 p-0.5 text-[11px] font-bold">
          {(['gemini', 'ollama'] as LlmProvider[]).map((p) => (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => setProvider(p)}
              className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
                provider === p
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              {p}
              <span
                className={`ml-1 inline-block h-1.5 w-1.5 rounded-full ${
                  p === 'gemini'
                    ? geminiOk
                      ? 'bg-emerald-400'
                      : geminiOk === false
                        ? 'bg-red-400'
                        : 'bg-slate-400'
                    : ollamaOk
                      ? 'bg-emerald-400'
                      : ollamaOk === false
                        ? 'bg-red-400'
                        : 'bg-slate-400'
                }`}
                title={p === 'gemini' ? 'Gemini health' : 'Ollama health'}
              />
            </button>
          ))}
        </div>
      </div>

      {error && (
        <InlineAlert compact hideTitle message={error} onDismiss={() => setError('')} />
      )}

      {previewBusy && !preview && (
        <p className="text-xs font-bold text-violet-300 animate-pulse">Đang chạy rule engine…</p>
      )}

      {preview && (
        <div className="space-y-3">
          {/* Box hiển thị Mã Bin chính */}
          <div className="rounded-lg border border-white/10 bg-slate-950/90 px-3 py-3 shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Bin gợi ý</p>
            <p className="mt-0.5 font-mono text-2xl font-black text-cyan-300 tracking-wide">
              {preview.binCode ?? '—'}
            </p>
            <p className="mt-1 text-xs font-bold text-white">
              {preview.zoneCode && <>Zone <span className="text-cyan-200">{preview.zoneCode}</span></>}
              {preview.rackCode && <> · Rack <span className="text-cyan-200">{preview.rackCode}</span></>}
              {preview.levelNumber != null && <> · Tầng <span className="text-cyan-200">{preview.levelNumber}</span></>}
              {preview.score != null && (
                <>
                  {' '}
                  · Điểm <span className="text-violet-300 font-extrabold">{scorePercent(preview.score)}</span>
                </>
              )}
              {preview.modelVersion && (
                <span className="text-slate-400 font-medium text-[11px]"> · {preview.modelVersion}</span>
              )}
            </p>
          </div>

          {/* Các lý do lựa chọn */}
          {preview.reasons && preview.reasons.length > 0 && (
            <ul className="space-y-1.5 text-xs font-semibold text-white bg-white/[0.03] p-2.5 rounded-lg border border-white/5 shadow-sm">
              {preview.reasons.map((r, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-violet-400 font-extrabold text-sm leading-none">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Phương án thay thế */}
          {preview.alternatives && preview.alternatives.length > 0 && (
            <div>
              <button
                type="button"
                className="text-xs font-bold text-violet-300 hover:text-white underline decoration-dashed"
                onClick={() => setShowAlternatives((v) => !v)}
              >
                {showAlternatives ? 'Ẩn' : 'Xem'} {preview.alternatives.length} phương án khác
              </button>
              {showAlternatives && (
                <ul className="mt-2 space-y-1.5 text-[11px] font-semibold text-slate-200">
                  {preview.alternatives.map((alt, i) => (
                    <li
                      key={i}
                      className="rounded border border-white/10 bg-slate-950 px-2.5 py-2 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-mono font-bold text-cyan-300 text-sm mr-2">{alt.binCode}</span>
                        {alt.zoneCode && <span className="text-slate-300">· Zone {alt.zoneCode}</span>}
                      </div>
                      {alt.score != null && <span className="text-violet-300 font-bold">{scorePercent(alt.score)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Khối text giải thích từ LLM */}
          {explanation && (
            <div className="rounded-lg border border-violet-500/40 bg-violet-950/50 px-3 py-2.5 text-sm font-semibold leading-relaxed text-white shadow-sm">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-violet-300">
                Giải thích AI{explainModel ? ` · ${explainModel}` : ''}
              </p>
              {explanation}
            </div>
          )}

          {/* Khu vực nút bấm Action */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={disabled || previewBusy}
              onClick={() => void runPreview()}
              className="rounded-lg border border-white/30 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15 disabled:opacity-40 transition-colors"
            >
              {previewBusy ? 'Đang tính…' : 'Tính lại'}
            </button>
            <button
              type="button"
              disabled={disabled || explainBusy || providerReady === false}
              onClick={() => void runExplain()}
              className="rounded-lg border border-violet-400 bg-violet-500/20 px-3 py-1.5 text-xs font-bold text-violet-200 hover:bg-violet-500/40 disabled:opacity-40 transition-colors"
            >
              {explainBusy ? 'Đang giải thích…' : 'Giải thích (LLM)'}
            </button>
            <button
              type="button"
              disabled={disabled || applyBusy || !preview.recommendedBinId}
              onClick={() => void applyRecommendation()}
              className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-extrabold text-white hover:bg-violet-500 shadow-md disabled:opacity-40 transition-colors"
            >
              {applyBusy ? 'Đang áp dụng…' : 'Dùng bin gợi ý'}
            </button>
          </div>
        </div>
      )}

      {!previewBusy && !preview && !error && (
        <p className="text-xs font-bold text-slate-300">Không có gợi ý — thử bấm Tính lại.</p>
      )}
    </div>
  )
}