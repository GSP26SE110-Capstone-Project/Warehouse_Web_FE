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
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-slate-50 p-6 text-slate-800 min-h-screen md:p-8">
      {loading && <LoadingOverlay show={loading} text="Đang tải dữ liệu tồn kho..." />}

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Trợ lý putaway AI</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Rule engine gợi ý vị trí ô kệ (bin); Gemini hoặc Ollama giải thích lý do bằng tiếng Việt. 
          Tích hợp luồng nhập kho — chọn phiếu và mã LPN đang ở trạng thái RECEIVING.
        </p>
      </header>

      {error && (
        <div className="mb-4">
          <InlineAlert variant="error" message={error} onDismiss={() => setError('')} />
        </div>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phiếu nhập kho</label>
            <select
              value={inboundId}
              onChange={(e) => setInboundId(e.target.value)}
              aria-label="Chọn phiếu nhập kho"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 focus:outline-none"
            >
              <option value="">— Chọn phiếu —</option>
              {inbounds.map((inb) => (
                <option key={inb.inboundRequestId} value={inb.inboundRequestId}>
                  {inb.inboundCode} · {inb.status}
                </option>
              ))}
            </select>
            {selectedInbound && (
              <div className="mt-1.5">
                <Link
                  to={`${inboundBasePath}/${selectedInbound.inboundRequestId}`}
                  className="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline"
                >
                  Mở chi tiết phiếu nhập →
                </Link>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">LPN (RECEIVING)</label>
            <select
              value={selectedLpnId}
              onChange={(e) => setSelectedLpnId(e.target.value)}
              disabled={!receivingLpns.length}
              aria-label="Chọn LPN receiving"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-mono text-slate-900 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 focus:outline-none disabled:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">— Chọn LPN —</option>
              {receivingLpns.map((l) => (
                <option key={l.lpnId} value={l.lpnId}>
                  {l.lpnCode} · {l.boxType}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-center min-h-[180px]">
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
            <div className="text-center p-4">
              <span className="material-symbols-outlined text-slate-300 text-4xl mb-2 block">info</span>
              <p className="text-sm font-medium text-slate-400">Vui lòng chọn phiếu nhập và mã LPN để xem gợi ý thông minh từ AI.</p>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <h2 className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-bold text-slate-800">
            Lịch sử gợi ý (phiếu này)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">LPN</th>
                  <th className="px-4 py-3">Bin</th>
                  <th className="px-4 py-3">Điểm số</th>
                  <th className="px-4 py-3">Đã putaway</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {history.map((row) => (
                  <tr key={row.recommendationId} className="hover:bg-slate-50/50 transition-colors bg-white">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {row.createdAt ? formatDate(row.createdAt) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 font-semibold">{row.lpnCode ?? row.lpnId}</td>
                    <td className="px-4 py-3 font-mono text-cyan-700 font-bold">{row.binCode ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {row.recommendationScore != null
                        ? `${Math.round(row.recommendationScore * 100)}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.isApplied ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          Đã áp dụng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500">
                          Chưa áp dụng
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}