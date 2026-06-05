import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AiPutawayPanel } from '../../components/ai/AiPutawayPanel'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as inboundApi from '../../api/inboundRequests'
import type { ApiInboundRequest, InboundStatus } from '../../api/inboundRequests'
import * as lpnsApi from '../../api/lpns'
import type { ApiLpn, ApiLpnDetail } from '../../api/lpns'
import * as batchesApi from '../../api/batches'
import * as aiApi from '../../api/aiSlotRecommendations'
import type { AiSlotRecommendation } from '../../api/aiSlotRecommendations'
import { formatDate } from '../../mappers'

const RECEIVING_STATUSES: InboundStatus[] = ['ARRIVED', 'RECEIVING']

type Props = {
  inboundBasePath: string
}

export function AiSlotAssistPage({ inboundBasePath }: Props) {
  const { user } = useAuth()
  const warehouseId = user?.warehouseId ?? ''

  const [inbounds, setInbounds] = useState<ApiInboundRequest[]>([])
  const [inboundId, setInboundId] = useState('')
  const [lpns, setLpns] = useState<ApiLpn[]>([])
  const [lpnDetails, setLpnDetails] = useState<ApiLpnDetail[]>([])
  const [history, setHistory] = useState<AiSlotRecommendation[]>([])
  const [selectedLpnId, setSelectedLpnId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const selectedInbound = useMemo(
    () => inbounds.find((i) => i.inboundRequestId === inboundId) ?? null,
    [inbounds, inboundId]
  )

  const receivingLpns = useMemo(
    () => lpns.filter((l) => l.status === 'RECEIVING'),
    [lpns]
  )

  const selectedLpn = useMemo(
    () => lpns.find((l) => l.lpnId === selectedLpnId) ?? null,
    [lpns, selectedLpnId]
  )

  const selectedHasDetails = useMemo(() => {
    if (!selectedLpnId) return false
    return lpnDetails.some((d) => d.lpnId === selectedLpnId)
  }, [selectedLpnId, lpnDetails])

  const loadInbounds = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Parameters<typeof inboundApi.listInboundRequests>[0] = { limit: 200 }
      if (warehouseId) params.warehouseId = warehouseId
      const res = await inboundApi.listInboundRequests(params)
      const active = res.items.filter((i) => RECEIVING_STATUSES.includes(i.status))
      setInbounds(active.length > 0 ? active : res.items.slice(0, 50))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải phiếu nhập')
    } finally {
      setLoading(false)
    }
  }, [warehouseId])

  const loadInboundData = useCallback(async (id: string) => {
    if (!id) {
      setLpns([])
      setLpnDetails([])
      setHistory([])
      return
    }
    setError('')
    try {
      const batchRes = await batchesApi.listBatches({ inboundRequestId: id, limit: 50 })
      const batchIds = batchRes.items.map((b) => b.batchId)
      const allLpns: ApiLpn[] = []
      for (const batchId of batchIds) {
        const { items } = await lpnsApi.listLpns({ batchId, limit: 100 })
        allLpns.push(...items)
      }
      setLpns(allLpns)

      const details: ApiLpnDetail[] = []
      for (const lpn of allLpns.filter((l) => l.status === 'RECEIVING').slice(0, 40)) {
        try {
          const withDetails = await lpnsApi.getLpnWithDetails(lpn.lpnId)
          details.push(...withDetails.details)
        } catch {
          /* skip */
        }
      }
      setLpnDetails(details)

      const histRes = await aiApi.listSlotRecommendations({
        inboundRequestId: id,
        limit: 30,
      })
      setHistory(histRes.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải LPN / lịch sử AI')
    }
  }, [])

  useEffect(() => {
    void loadInbounds()
  }, [loadInbounds])

  useEffect(() => {
    setSelectedLpnId('')
    void loadInboundData(inboundId)
  }, [inboundId, loadInboundData])

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-[#0b101a] p-6 text-slate-100 md:p-8">
      <LoadingOverlay show={loading} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Trợ lý putaway AI</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Rule engine gợi ý bin; Gemini hoặc Ollama giải thích lý do bằng tiếng Việt. Tích hợp
          luồng nhập kho — chọn phiếu và LPN đang RECEIVING.
        </p>
      </header>

      {error && (
        <div className="mb-4">
          <InlineAlert variant="error" message={error} onDismiss={() => setError('')} />
        </div>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <label className="block text-sm font-medium text-slate-300">Phiếu nhập kho</label>
          <select
            value={inboundId}
            onChange={(e) => setInboundId(e.target.value)}
            aria-label="Chọn phiếu nhập kho"
            className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
          >
            <option value="">— Chọn phiếu —</option>
            {inbounds.map((inb) => (
              <option key={inb.inboundRequestId} value={inb.inboundRequestId}>
                {inb.inboundCode} · {inb.status}
              </option>
            ))}
          </select>
          {selectedInbound && (
            <Link
              to={`${inboundBasePath}/${selectedInbound.inboundRequestId}`}
              className="text-xs text-cyan-400 hover:underline"
            >
              Mở chi tiết phiếu nhập →
            </Link>
          )}

          <label className="block text-sm font-medium text-slate-300">LPN (RECEIVING)</label>
          <select
            value={selectedLpnId}
            onChange={(e) => setSelectedLpnId(e.target.value)}
            disabled={!receivingLpns.length}
            aria-label="Chọn LPN receiving"
            className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm font-mono disabled:opacity-50"
          >
            <option value="">— Chọn LPN —</option>
            {receivingLpns.map((l) => (
              <option key={l.lpnId} value={l.lpnId}>
                {l.lpnCode} · {l.boxType}
              </option>
            ))}
          </select>
        </div>

        <div>
          {selectedInbound && selectedLpnId && warehouseId ? (
            <AiPutawayPanel
              lpnId={selectedLpnId}
              lpnCode={selectedLpn?.lpnCode}
              warehouseId={warehouseId}
              inboundRequestId={inboundId}
              hasLpnDetails={selectedHasDetails}
              onSelectRecommendedBin={() => {
                void loadInboundData(inboundId)
              }}
            />
          ) : (
            <p className="text-sm text-slate-500">Chọn phiếu nhập và LPN để xem gợi ý.</p>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <section className="rounded-xl border border-white/10 overflow-hidden">
          <h2 className="border-b border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold">
            Lịch sử gợi ý (phiếu này)
          </h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Thời gian</th>
                <th className="px-4 py-2">LPN</th>
                <th className="px-4 py-2">Bin</th>
                <th className="px-4 py-2">Điểm</th>
                <th className="px-4 py-2">Đã putaway</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.recommendationId} className="border-t border-white/5">
                  <td className="px-4 py-2 text-slate-400">
                    {row.createdAt ? formatDate(row.createdAt) : '—'}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{row.lpnCode ?? row.lpnId}</td>
                  <td className="px-4 py-2 font-mono text-cyan-300/90">{row.binCode ?? '—'}</td>
                  <td className="px-4 py-2">
                    {row.recommendationScore != null
                      ? `${Math.round(row.recommendationScore * 100)}%`
                      : '—'}
                  </td>
                  <td className="px-4 py-2">
                    {row.isApplied ? (
                      <span className="text-emerald-400">Có</span>
                    ) : (
                      <span className="text-slate-500">Chưa</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
