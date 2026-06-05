import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import * as contractAppendicesApi from '../../api/contractAppendices'
import * as contractItemsApi from '../../api/contractItems'
import * as rentalRequestsApi from '../../api/rentalRequests'
import * as warehousesApi from '../../api/warehouses'
import type { ApiContract } from '../../api/types'
import { CONTRACT_TYPE_LABELS, type ContractTypeValue } from '../../data/contractTypes'
import { formatVnd } from '../../data/pricing'
import { estimateMonthCount } from '../../utils/rentalPeriod'
import { formatAppendixPeriod, STORAGE_LEVEL_LABELS } from '../../utils/contractAppendix'
import { InlineAlert } from '../ui/FeedbackAlert'
import {
  ContractStorageAssignmentPanel,
  type ContractStorageAssignmentPanelRef,
} from './ContractStorageAssignmentPanel'

type Props = {
  contract: ApiContract
  appendix: contractAppendicesApi.ApiContractAppendix
  onClose: () => void
  onApproved: () => void
}

const STEPS = ['Duyệt yêu cầu', 'Cấp bin / zone', 'Xác nhận giá'] as const
const ESTIMATE_BIN_SLOT_FOOTPRINT_M2 = 0.25
const ESTIMATE_DEFAULT_BIN_MAX_LPN_COUNT = 4

const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
const inputStyle =
  'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400'

function toDateInput(iso?: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function fmtM2(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} m²`
}

function estimateAreaFromBinCount(binCount: number | null) {
  if (binCount == null || binCount <= 0) return null
  return binCount * ESTIMATE_BIN_SLOT_FOOTPRINT_M2
}

type PriceHint = {
  monthlyAmount: number
  suggestedTotalAmount: number
  monthCount: number
  breakdown: Array<{ label: string; detail: string }>
  areaM2Used?: number | null
  unitPricePerM2Month?: number | null
}

function formatPriceFormula(estimate: PriceHint): string | null {
  const boxLines = estimate.breakdown.filter((b) => b.label?.startsWith('Thùng '))
  if (boxLines.length > 0) {
    return boxLines.map((b) => b.detail.replace(/ VND/g, ' ₫')).join(' + ')
  }
  if (estimate.areaM2Used != null && estimate.unitPricePerM2Month != null) {
    return `${estimate.areaM2Used.toLocaleString('vi-VN')} m² × ${estimate.unitPricePerM2Month.toLocaleString('vi-VN')} ₫/m²/tháng × ${estimate.monthCount} tháng`
  }
  if (estimate.monthlyAmount > 0) {
    return `~${estimate.monthlyAmount.toLocaleString('vi-VN')} ₫/tháng × ${estimate.monthCount} tháng`
  }
  return null
}

export function ContractAppendixApproveModal({
  contract,
  appendix,
  onClose,
  onApproved,
}: Props) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [estimatedDeltaAmount, setEstimatedDeltaAmount] = useState('')
  const [reviewNote, setReviewNote] = useState('')

  const [requestedQty, setRequestedQty] = useState(1)
  const [warehouseName, setWarehouseName] = useState('')
  const [capacitySnapshot, setCapacitySnapshot] =
    useState<warehousesApi.ApiWarehouseCapacitySnapshot | null>(null)
  const [capacityLoading, setCapacityLoading] = useState(true)

  const [priceEstimate, setPriceEstimate] = useState<PriceHint | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)

  const storageRef = useRef<ContractStorageAssignmentPanelRef>(null)
  const contractType = contract.contractType as ContractTypeValue
  const billMonths = estimateMonthCount(
    toDateInput(appendix.effectiveDate),
    toDateInput(appendix.endDate)
  )
  const estimatedAreaM2 = estimateAreaFromBinCount(requestedQty)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setCapacityLoading(true)
      try {
        const [itemsRes, wh] = await Promise.all([
          contractItemsApi.listContractItems(contract.contractId, { limit: 100 }),
          warehousesApi.getWarehouse(contract.warehouseId),
        ])
        if (cancelled) return
        setWarehouseName(wh.warehouseName)
        const appendixItems = itemsRes.items.filter(
          (it) => it.appendixId === appendix.appendixId
        )
        const qty = appendixItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
        setRequestedQty(qty > 0 ? qty : 1)

        const snap = await warehousesApi.getWarehouseCapacitySnapshot(contract.warehouseId)
        if (!cancelled) setCapacitySnapshot(snap)
      } catch {
        if (!cancelled) setCapacitySnapshot(null)
      } finally {
        if (!cancelled) setCapacityLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contract.contractId, contract.warehouseId, appendix.appendixId])

  const loadPriceRecommendation = useCallback(async () => {
    const reservations = storageRef.current?.buildReservations() ?? []
    const zoneIds = [
      ...new Set(reservations.map((r) => r.zoneId).filter((id): id is string => Boolean(id))),
    ]

    if (!contract.rentalRequestId) {
      const base = Number(contract.estimatedTotalAmount)
      if (Number.isFinite(base) && base > 0 && billMonths > 0) {
        const monthly = Math.round(base / billMonths)
        setPriceEstimate({
          suggestedTotalAmount: base,
          monthlyAmount: monthly,
          monthCount: billMonths,
          breakdown: [],
        })
        setEstimatedDeltaAmount((prev) => prev || String(monthly))
      }
      return
    }

    setPriceLoading(true)
    try {
      const estimate = await rentalRequestsApi.getContractPriceEstimate(contract.rentalRequestId, {
        warehouseId: contract.warehouseId,
        zoneIds: zoneIds.length > 0 ? zoneIds : undefined,
        contractType: contract.contractType,
      })
      setPriceEstimate({
        monthlyAmount: estimate.monthlyAmount,
        suggestedTotalAmount: estimate.suggestedTotalAmount,
        monthCount: estimate.monthCount,
        breakdown: estimate.breakdown,
        areaM2Used: estimate.areaM2Used,
        unitPricePerM2Month: estimate.unitPricePerM2Month,
      })
      if (estimate.monthlyAmount > 0) {
        setEstimatedDeltaAmount((prev) => prev || String(estimate.monthlyAmount))
      }
    } catch {
      setPriceEstimate(null)
    } finally {
      setPriceLoading(false)
    }
  }, [billMonths, contract])

  useEffect(() => {
    if (step !== 2) return
    void loadPriceRecommendation()
  }, [step, loadPriceRecommendation])

  const monthlyRateNum = Number(estimatedDeltaAmount)
  const projectedInvoiceAmount =
    Number.isFinite(monthlyRateNum) && monthlyRateNum > 0 && billMonths > 0
      ? monthlyRateNum * billMonths
      : null

  const handleApprove = async () => {
    const amount = Number(estimatedDeltaAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Nhập đơn giá/tháng > 0')
      return
    }
    const panelErr = storageRef.current?.validate() ?? null
    if (panelErr) {
      setError(panelErr)
      return
    }
    const reservations = storageRef.current?.buildReservations() ?? []

    setSubmitting(true)
    setError('')
    try {
      await contractAppendicesApi.approveContractAppendix(contract.contractId, appendix.appendixId, {
        estimatedDeltaAmount: amount,
        reviewNote: reviewNote.trim() || undefined,
        reservations,
      })
      onApproved()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không duyệt được phụ lục')
    } finally {
      setSubmitting(false)
    }
  }

  const goToPriceStep = () => {
    const panelErr = storageRef.current?.validate() ?? null
    if (panelErr) {
      setError(panelErr)
      return
    }
    setError('')
    setStep(2)
  }

  const recommendedBins = capacitySnapshot?.boxTypeSuggestion?.recommendedBoxType
    ? capacitySnapshot.warehouseStorage.emptyBins
    : null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b101a] shadow-2xl">
        <div className="border-b border-white/5 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Duyệt phụ lục {appendix.appendixCode}</h3>
          <p className="mt-1 text-xs text-slate-400">
            {appendix.title || '—'} · {formatAppendixPeriod(appendix.effectiveDate, appendix.endDate)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Sau khi duyệt → tenant ký → thanh toán → phụ lục ACTIVE
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                  i === step
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : i < step
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-white/5 text-slate-500'
                }`}
              >
                {i + 1}. {label}
              </span>
            ))}
          </div>
        </div>

        <div className="dark-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {error && <InlineAlert message={error} onDismiss={() => setError('')} />}

          {step === 0 && (
            <>
              <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className={labelStyle}>Hợp đồng gốc</span>
                    <p className="font-mono text-cyan-300">{contract.contractCode}</p>
                    <p className="text-xs text-slate-500">
                      {CONTRACT_TYPE_LABELS[contractType] ?? contract.contractType}
                    </p>
                  </div>
                  <div>
                    <span className={labelStyle}>Kho</span>
                    <p className="text-white">{warehouseName || contract.warehouseId}</p>
                  </div>
                  <div>
                    <span className={labelStyle}>Cấp lưu trữ yêu cầu</span>
                    <p className="text-white">
                      {appendix.requestedStorageLevel
                        ? STORAGE_LEVEL_LABELS[appendix.requestedStorageLevel]
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className={labelStyle}>Số lượng yêu cầu</span>
                    <p className="text-white">
                      {requestedQty.toLocaleString('vi-VN')}{' '}
                      {appendix.requestedStorageLevel === 'BIN' ? 'bin' : 'đơn vị'}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                  <p className="font-semibold">Quy mô hàng hóa (ước tính từ yêu cầu tenant)</p>
                  <p className="mt-1">
                    ~{requestedQty.toLocaleString('vi-VN')} bin/thùng tham chiếu · diện tích ~
                    {fmtM2(estimatedAreaM2)} ({ESTIMATE_DEFAULT_BIN_MAX_LPN_COUNT} thùng/bin,{' '}
                    {ESTIMATE_BIN_SLOT_FOOTPRINT_M2} m²/bin)
                  </p>
                  {billMonths > 0 && estimatedAreaM2 != null && (
                    <p className="mt-1 text-[11px] text-amber-200/90">
                      Thời hạn PL: {billMonths} tháng
                    </p>
                  )}
                </div>
              </div>

              {capacityLoading ? (
                <p className="text-xs text-slate-500">Đang tải sức chứa kho…</p>
              ) : capacitySnapshot ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                  <p className="font-semibold text-white">
                    Sức chứa kho — <span className="text-cyan-300">{warehouseName}</span>
                  </p>
                  <p className="mt-1">
                    Bin trống:{' '}
                    <strong className="text-white">
                      {capacitySnapshot.warehouseStorage.emptyBins}
                    </strong>{' '}
                    · free slot ~{' '}
                    <strong className="text-cyan-300">
                      {capacitySnapshot.warehouseStorage.freeLpnSlots.toLocaleString('vi-VN')}
                    </strong>{' '}
                    thùng/LPN
                  </p>
                  <p className="mt-1 text-slate-300">
                    Gợi ý box type:{' '}
                    <strong className="text-cyan-200">
                      {capacitySnapshot.boxTypeSuggestion.recommendedBoxType}
                    </strong>
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-200/80">
                    {requestedQty > capacitySnapshot.warehouseStorage.emptyBins ? (
                      <span className="text-amber-300">
                        Cảnh báo: tenant yêu cầu {requestedQty} bin nhưng kho chỉ còn{' '}
                        {capacitySnapshot.warehouseStorage.emptyBins} bin trống — cân nhắc từ chối
                        hoặc cấp zone thêm.
                      </span>
                    ) : (
                      <>
                        Có thể cấp ~{requestedQty} bin theo yêu cầu
                        {recommendedBins != null ? ` (kho còn ${recommendedBins} bin trống)` : ''}.
                      </>
                    )}
                  </p>
                </div>
              ) : null}
            </>
          )}

          {step === 1 && (
            <ContractStorageAssignmentPanel
              ref={storageRef}
              contractType={contract.contractType}
              warehouseId={contract.warehouseId}
              startDate={toDateInput(appendix.effectiveDate)}
              endDate={toDateInput(appendix.endDate)}
              requestedStorageLevel={appendix.requestedStorageLevel}
              reservedCapacityDefault={String(requestedQty)}
            />
          )}

          {step === 2 && (
            <>
              {priceLoading ? (
                <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-slate-400">
                  Đang tính giá gợi ý…
                </p>
              ) : priceEstimate ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                  <p className="font-medium text-emerald-200">
                    Giá gợi ý:{' '}
                    <strong className="text-white">
                      {formatVnd(priceEstimate.monthlyAmount)}/tháng
                    </strong>
                    {priceEstimate.suggestedTotalAmount > 0 && (
                      <>
                        {' '}
                        · tổng kỳ ~{formatVnd(priceEstimate.suggestedTotalAmount)}
                      </>
                    )}
                  </p>
                  {formatPriceFormula(priceEstimate) && (
                    <p className="mt-1 text-emerald-200/90">{formatPriceFormula(priceEstimate)}</p>
                  )}
                </div>
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
                  Nhập đơn giá thủ công theo chính sách kho.
                </p>
              )}

              <div>
                <label className={labelStyle}>Đơn giá / tháng (VND) — xác nhận</label>
                <input
                  type="number"
                  min={0}
                  className={inputStyle}
                  value={estimatedDeltaAmount}
                  onChange={(e) => setEstimatedDeltaAmount(e.target.value)}
                  placeholder="VD: 4000000"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Tenant thanh toán một lần = đơn giá × số tháng trong hạn phụ lục. Tenant sẽ ký sau
                  khi bạn duyệt.
                </p>
              </div>

              {projectedInvoiceAmount != null && (
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
                  <p>
                    Invoice dự kiến:{' '}
                    <strong className="text-white">{formatVnd(projectedInvoiceAmount)}</strong> (
                    {billMonths} tháng × {formatVnd(monthlyRateNum)}/tháng)
                  </p>
                </div>
              )}

              <div>
                <label className={labelStyle}>Ghi chú duyệt (tùy chọn)</label>
                <textarea
                  className={`${inputStyle} min-h-[72px]`}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="VD: Đã cấp bin A-01, A-02"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-6 py-4">
          <button
            type="button"
            disabled={step === 0 || submitting}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="text-sm text-slate-400 hover:text-white disabled:opacity-40"
          >
            Quay lại
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">
              Hủy
            </button>
            {step === 0 && (
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setStep(1)
                }}
                className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-bold text-black"
              >
                Tiếp — Cấp chỗ
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                onClick={goToPriceStep}
                className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-bold text-black"
              >
                Tiếp — Xác nhận giá
              </button>
            )}
            {step === 2 && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleApprove()}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                {submitting ? 'Đang duyệt…' : 'Duyệt phụ lục'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
