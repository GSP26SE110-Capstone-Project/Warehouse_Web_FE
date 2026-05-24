import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../../api/client'
import * as binsApi from '../../../api/bins'
import * as contractsApi from '../../../api/contracts'
import * as rackLevelsApi from '../../../api/rackLevels'
import * as racksApi from '../../../api/racks'
import * as rentalRequestsApi from '../../../api/rentalRequests'
import * as storageReservationsApi from '../../../api/storageReservations'
import * as zonesApi from '../../../api/zones'
import { getStoredUser } from '../../../auth/storage'
import {
  BILLING_CYCLE_GUEST_LABELS,
  CONTRACT_TYPE_LABELS,
  defaultPricingModel,
  type ContractTypeValue,
} from '../../../data/contractTypes'
import type { UserRole } from '../../../api/types'
import type { RentalRequestRow } from '../../../mappers'
import { getOnboardingStoragePlan } from '../../../utils/onboardingStorage'
import {
  filterWarehousesForRentalClaim,
  type WarehouseWithRegion,
} from '../../../utils/warehouseRegion'

export type OnboardingOperator = {
  role: UserRole
  warehouseId?: string | null
  warehouseName?: string
}

type Props = {
  row: RentalRequestRow
  warehouses: WarehouseWithRegion[]
  operator: OnboardingOperator
  resolveWarehouseId: (row: RentalRequestRow) => string
  onClose: () => void
  onComplete: () => void
}

const STEPS = ['Duyệt yêu cầu', 'Tạo hợp đồng', 'Cấp bin / zone'] as const

const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
const inputStyle =
  'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400'
const selectStyle = inputStyle

function toDateInput(iso?: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function initialStep(row: RentalRequestRow): number {
  if (row.apiStatus === 'APPROVED') return 1
  if (row.apiStatus === 'CONVERTED') return 2
  return 0
}

export function RentalOnboardingWizard({
  row,
  warehouses,
  operator,
  resolveWarehouseId,
  onClose,
  onComplete,
}: Props) {
  const isWhOperator = operator.role === 'WH_ADMIN' && Boolean(operator.warehouseId)
  const operatorWhId = operator.warehouseId ?? ''

  const [step, setStep] = useState(() => initialStep(row))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [rejectionReason, setRejectionReason] = useState('')
  const [warehouseId, setWarehouseId] = useState(
    () => row.warehouseId ?? (isWhOperator ? operatorWhId : '')
  )
  const [approved, setApproved] = useState(
    row.apiStatus === 'APPROVED' || row.apiStatus === 'CONVERTED'
  )

  const contractType = (row.contractType ?? 'SHARED_STORAGE') as ContractTypeValue
  const pricingModel = row.pricingModel ?? defaultPricingModel(contractType)
  const [contractId, setContractId] = useState<string | null>(null)
  const [contractStart, setContractStart] = useState(toDateInput(row.expectedStartDate))
  const [contractEnd, setContractEnd] = useState(toDateInput(row.expectedEndDate))
  const [estimatedAmount, setEstimatedAmount] = useState('')

  const storagePlan = useMemo(() => getOnboardingStoragePlan(contractType), [contractType])

  const claimableWarehouses = useMemo(() => {
    if (isWhOperator) return []
    return filterWarehousesForRentalClaim(warehouses, row.city, row.district, row.warehouseId)
  }, [isWhOperator, warehouses, row.city, row.district, row.warehouseId])

  useEffect(() => {
    if (isWhOperator && operatorWhId) setWarehouseId(operatorWhId)
  }, [isWhOperator, operatorWhId])

  useEffect(() => {
    if (isWhOperator || approved || row.warehouseId) return
    if (claimableWarehouses.length === 1) {
      setWarehouseId(claimableWarehouses[0].warehouseId)
    }
  }, [isWhOperator, approved, claimableWarehouses, row.warehouseId])

  const claimedByOther =
    isWhOperator &&
    Boolean(row.warehouseId) &&
    row.warehouseId !== operatorWhId
  const [zones, setZones] = useState<zonesApi.ApiZone[]>([])
  const [racks, setRacks] = useState<racksApi.ApiRack[]>([])
  const [rackLevels, setRackLevels] = useState<rackLevelsApi.ApiRackLevel[]>([])
  const [bins, setBins] = useState<binsApi.ApiBin[]>([])
  const [zoneId, setZoneId] = useState('')
  const [rackId, setRackId] = useState('')
  const [rackLevelId, setRackLevelId] = useState('')
  const [binId, setBinId] = useState('')
  const [reservedCapacity, setReservedCapacity] = useState(
    String(row.estimatedBoxCount ?? row.estimatedSkuCount ?? '')
  )

  const whId = isWhOperator
    ? operatorWhId
    : warehouseId || (approved ? resolveWarehouseId(row) : '')
  const whName =
    operator.warehouseName ??
    warehouses.find((w) => w.warehouseId === whId)?.warehouseName ??
    row.warehouse

  useEffect(() => {
    if (!approved || step < 2 || !whId) return
    let cancelled = false
    ;(async () => {
      try {
        const { items } = await zonesApi.listZones({ warehouseId: whId, limit: 100, status: 'ACTIVE' })
        if (!cancelled) setZones(items)
      } catch {
        if (!cancelled) setZones([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [approved, step, whId])

  useEffect(() => {
    if (!storagePlan.needsRack || !zoneId) {
      setRacks([])
      setRackId('')
      return
    }
    let cancelled = false
    ;(async () => {
      const { items } = await racksApi.listRacks({ zoneId, limit: 100 })
      if (!cancelled) setRacks(items)
    })()
    return () => {
      cancelled = true
    }
  }, [zoneId, storagePlan.needsRack])

  useEffect(() => {
    if (!storagePlan.needsBin || !rackId) {
      setRackLevels([])
      setRackLevelId('')
      return
    }
    let cancelled = false
    ;(async () => {
      const { items } = await rackLevelsApi.listRackLevels({ rackId, limit: 100 })
      if (!cancelled) setRackLevels(items)
    })()
    return () => {
      cancelled = true
    }
  }, [rackId, storagePlan.needsBin])

  useEffect(() => {
    if (!storagePlan.needsBin || !rackLevelId) {
      setBins([])
      setBinId('')
      return
    }
    let cancelled = false
    ;(async () => {
      const { items } = await binsApi.listBins({
        rackLevelId,
        limit: 100,
        reservationType: 'RESERVED',
      })
      if (!cancelled) setBins(items.filter((b) => b.status === 'EMPTY' || b.status === 'RESERVED'))
    })()
    return () => {
      cancelled = true
    }
  }, [rackLevelId, storagePlan.needsBin])

  const loadExistingContract = useCallback(async () => {
    const { items } = await contractsApi.listContracts({
      rentalRequestId: row.rentalRequestId,
      limit: 5,
    })
    const active = items.find((c) => c.status === 'ACTIVE') ?? items[0]
    if (active) {
      setContractId(active.contractId)
      setContractStart(toDateInput(active.startDate))
      setContractEnd(toDateInput(active.endDate))
      if (active.estimatedTotalAmount != null) {
        setEstimatedAmount(String(active.estimatedTotalAmount))
      }
      if (active.status === 'ACTIVE' && row.apiStatus !== 'CONVERTED') {
        setStep(2)
      }
    }
  }, [row.rentalRequestId, row.apiStatus])

  useEffect(() => {
    if (row.apiStatus === 'APPROVED' || row.apiStatus === 'CONVERTED') {
      loadExistingContract().catch(() => {})
    }
  }, [row.apiStatus, loadExistingContract])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Thao tác thất bại')
    } finally {
      setBusy(false)
    }
  }

  const handleApprove = () =>
    run(async () => {
      if (claimedByOther) {
        setError('Yêu cầu đã được kho khác trong khu vực duyệt trước. Tải lại danh sách.')
        return
      }
      if (isWhOperator) {
        if (!operatorWhId) {
          setError('Tài khoản chưa gắn kho — liên hệ System Admin')
          return
        }
      } else if (claimableWarehouses.length === 0) {
        setError(`Không có kho tại ${row.district}, ${row.city}`)
        return
      } else if (claimableWarehouses.length > 1 && !warehouseId) {
        setError('Chọn kho nhận yêu cầu trong danh sách')
        return
      }
      const wh = isWhOperator ? operatorWhId : warehouseId || resolveWarehouseId(row)
      const user = getStoredUser()
      await rentalRequestsApi.updateRentalRequest(row.rentalRequestId, {
        status: 'APPROVED',
        warehouseId: wh,
        reviewedBy: user?.userId,
        reviewedAt: new Date().toISOString(),
      })
      setWarehouseId(wh)
      setApproved(true)
      setStep(1)
    })

  const handleReject = () =>
    run(async () => {
      if (!rejectionReason.trim()) {
        setError('Vui lòng nhập lý do từ chối')
        return
      }
      await rentalRequestsApi.updateRentalRequest(row.rentalRequestId, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      })
      onComplete()
      onClose()
    })

  const handleCreateContract = () =>
    run(async () => {
      if (!contractStart || !contractEnd) {
        setError('Chọn ngày bắt đầu và kết thúc hợp đồng')
        return
      }
      const wh = whId || resolveWarehouseId(row)
      let cId = contractId

      if (!cId) {
        const draft = await contractsApi.createContract({
          tenantId: row.tenantId,
          warehouseId: wh,
          rentalRequestId: row.rentalRequestId,
          contractType,
          pricingModel,
          billingCycle: row.billingCycle ?? 'MONTHLY',
          startDate: contractStart,
          endDate: contractEnd,
          contractName: row.customer,
          estimatedTotalAmount: estimatedAmount ? Number(estimatedAmount) : undefined,
          status: 'DRAFT',
        })
        cId = draft.contractId
        setContractId(cId)
      }

      await contractsApi.updateContract(cId, {
        status: 'ACTIVE',
        tenantSignature: 'SIGNED_WH_ONBOARDING',
        warehouseSignature: 'SIGNED_WH_ONBOARDING',
        startDate: contractStart,
        endDate: contractEnd,
        estimatedTotalAmount: estimatedAmount ? Number(estimatedAmount) : undefined,
      })
      setStep(2)
    })

  const handleAssignStorage = () =>
    run(async () => {
      if (!contractId) {
        setError('Chưa có hợp đồng ACTIVE — hoàn tất bước 2 trước')
        return
      }
      const wh = whId || resolveWarehouseId(row)
      const body: Parameters<typeof storageReservationsApi.createStorageReservation>[0] = {
        contractId,
        reservationType: storagePlan.reservationType,
        storageLevel: storagePlan.storageLevel,
        warehouseId: wh,
        startDate: contractStart,
        endDate: contractEnd,
        status: 'ACTIVE',
      }

      if (storagePlan.storageLevel === 'ZONE' && !zoneId) {
        setError('Chọn zone')
        return
      }
      if (storagePlan.storageLevel === 'BIN' && !binId) {
        setError('Chọn bin')
        return
      }
      if (zoneId) body.zoneId = zoneId
      if (rackId) body.rackId = rackId
      if (rackLevelId) body.rackLevelId = rackLevelId
      if (binId) body.binId = binId
      if (reservedCapacity) body.reservedCapacity = Number(reservedCapacity)

      await storageReservationsApi.createStorageReservation(body)
      await rentalRequestsApi.updateRentalRequest(row.rentalRequestId, { status: 'CONVERTED' })
      onComplete()
      onClose()
    })

  const stepDone = row.apiStatus === 'CONVERTED'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/95 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b101a] shadow-2xl">
        <div className="border-b border-white/5 bg-white/[0.02] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <span className="material-symbols-outlined text-cyan-400">route</span>
                Onboarding tenant — {row.id}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {row.customer} · {row.district}, {row.city}
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded p-2 hover:bg-white/10">
              <span className="material-symbols-outlined text-slate-400">close</span>
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 rounded-lg border px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide ${
                  i === step
                    ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300'
                    : i < step
                      ? 'border-emerald-400/30 bg-emerald-400/5 text-emerald-400'
                      : 'border-white/5 text-slate-500'
                }`}
              >
                {i + 1}. {label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {error && (
            <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <SummaryBlock row={row} whName={whName} />
              {!approved && (
                <>
                  <div>
                    <label className={labelStyle}>
                      Kho nhận yêu cầu (claim) — {row.district}, {row.city}
                    </label>
                    {claimedByOther ? (
                      <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                        Yêu cầu đã được <strong>kho khác</strong> trong khu vực duyệt trước. Bạn không thể
                        claim lại.
                      </p>
                    ) : isWhOperator ? (
                      <div className="space-y-2">
                        <input
                          className={inputStyle}
                          disabled
                          value={`${whName} (${row.district}, ${row.city})`}
                        />
                        <p className="text-[11px] text-cyan-300/90">
                          Bạn đăng nhập với quyền Warehouse Admin — duyệt sẽ claim cho kho của bạn. Các kho
                          cùng khu vực cùng thấy yêu cầu chưa nhận; <strong>ai duyệt trước được nhận</strong>.
                        </p>
                      </div>
                    ) : claimableWarehouses.length === 0 ? (
                      <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
                        Không có kho nào cấu hình đúng khu vực <strong>{row.district}, {row.city}</strong>.
                      </p>
                    ) : claimableWarehouses.length === 1 ? (
                      <input
                        className={inputStyle}
                        disabled
                        value={`${claimableWarehouses[0].warehouseName} (${claimableWarehouses[0].district}, ${claimableWarehouses[0].city})`}
                      />
                    ) : (
                      <select
                        className={selectStyle}
                        value={warehouseId}
                        onChange={(e) => setWarehouseId(e.target.value)}
                        aria-label="Chọn kho nhận yêu cầu"
                      >
                        <option value="">— Chọn kho trong khu vực —</option>
                        {claimableWarehouses.map((w) => (
                          <option key={w.warehouseId} value={w.warehouseId}>
                            {w.warehouseName} ({w.district}, {w.city})
                          </option>
                        ))}
                      </select>
                    )}
                    {!isWhOperator && (
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        System Admin: chọn kho nhận yêu cầu trong vùng.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelStyle}>Lý do từ chối (nếu từ chối)</label>
                    <textarea
                      className={`${inputStyle} min-h-[80px]`}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do..."
                    />
                  </div>
                </>
              )}
              {approved && (
                <p className="text-sm text-emerald-400">
                  Yêu cầu đã được duyệt — kho: <strong>{whName}</strong>
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <SummaryBlock row={row} whName={whName} compact />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Loại HĐ</label>
                  <input
                    className={inputStyle}
                    disabled
                    value={CONTRACT_TYPE_LABELS[contractType] ?? contractType}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Billing</label>
                  <input
                    className={inputStyle}
                    disabled
                    value={
                      BILLING_CYCLE_GUEST_LABELS[row.billingCycle ?? ''] ??
                      row.billingCycle ??
                      'MONTHLY'
                    }
                  />
                </div>
                <div>
                  <label className={labelStyle}>Pricing model</label>
                  <input className={inputStyle} disabled value={pricingModel} />
                </div>
                <div>
                  <label className={labelStyle}>Ước tính giá trị (VND)</label>
                  <input
                    className={inputStyle}
                    type="number"
                    min={0}
                    value={estimatedAmount}
                    onChange={(e) => setEstimatedAmount(e.target.value)}
                    placeholder="Tùy chọn"
                  />
                </div>
                <div>
                  <label className={labelStyle}>Bắt đầu</label>
                  <input
                    type="date"
                    className={inputStyle}
                    value={contractStart}
                    onChange={(e) => setContractStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Kết thúc</label>
                  <input
                    type="date"
                    className={inputStyle}
                    value={contractEnd}
                    onChange={(e) => setContractEnd(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Hợp đồng tạo DRAFT rồi kích hoạt ACTIVE (chữ ký nội bộ WH). Sau đó cấp chỗ lưu trữ.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {stepDone ? (
                <p className="text-emerald-400 text-sm">Yêu cầu đã CONVERTED — onboarding hoàn tất.</p>
              ) : (
                <>
                  <p className="text-sm text-slate-300">{storagePlan.hint}</p>
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-400">
                    <span className="text-cyan-400">reservation:</span> {storagePlan.reservationType}{' '}
                    · <span className="text-cyan-400">level:</span> {storagePlan.storageLevel}
                  </div>

                  {storagePlan.needsZone && (
                    <div>
                      <label className={labelStyle}>Zone</label>
                      <select
                        className={selectStyle}
                        value={zoneId}
                        onChange={(e) => setZoneId(e.target.value)}
                      >
                        <option value="">— Chọn zone —</option>
                        {zones.map((z) => (
                          <option key={z.zoneId} value={z.zoneId}>
                            {z.zoneCode}
                            {z.zoneName ? ` — ${z.zoneName}` : ''} ({z.zoneType})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {storagePlan.needsRack && zoneId && (
                    <div>
                      <label className={labelStyle}>Rack</label>
                      <select
                        className={selectStyle}
                        value={rackId}
                        onChange={(e) => setRackId(e.target.value)}
                      >
                        <option value="">— Chọn rack —</option>
                        {racks.map((r) => (
                          <option key={r.rackId} value={r.rackId}>
                            {r.rackCode}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {storagePlan.needsBin && rackId && (
                    <>
                      <div>
                        <label className={labelStyle}>Tầng rack</label>
                        <select
                          className={selectStyle}
                          value={rackLevelId}
                          onChange={(e) => setRackLevelId(e.target.value)}
                        >
                          <option value="">— Chọn tầng —</option>
                          {rackLevels.map((l) => (
                            <option key={l.rackLevelId} value={l.rackLevelId}>
                              Tầng {l.levelNo}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelStyle}>Bin (RESERVED / EMPTY)</label>
                        <select
                          className={selectStyle}
                          value={binId}
                          onChange={(e) => setBinId(e.target.value)}
                        >
                          <option value="">— Chọn bin —</option>
                          {bins.map((b) => (
                            <option key={b.binId} value={b.binId}>
                              {b.binCode} — {b.status} ({b.reservationType})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className={labelStyle}>Dung lượng giữ (tùy chọn)</label>
                    <input
                      className={inputStyle}
                      type="number"
                      min={0}
                      value={reservedCapacity}
                      onChange={(e) => setReservedCapacity(e.target.value)}
                      placeholder="box / SKU"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-6 py-4">
          <button
            type="button"
            className="text-sm text-slate-400 hover:text-white disabled:opacity-40"
            disabled={busy || step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Quay lại
          </button>
          <div className="flex gap-2">
            {step === 0 && !approved && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleReject}
                  className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  disabled={busy || claimedByOther}
                  onClick={handleApprove}
                  className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
                >
                  Duyệt & tiếp
                </button>
              </>
            )}
            {step === 0 && approved && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep(1)}
                className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-bold text-black"
              >
                Tiếp — Hợp đồng
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateContract}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                Kích hoạt HĐ & tiếp
              </button>
            )}
            {step === 2 && !stepDone && (
              <button
                type="button"
                disabled={busy}
                onClick={handleAssignStorage}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                Cấp chỗ & hoàn tất
              </button>
            )}
            {stepDone && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryBlock({
  row,
  whName,
  compact,
}: {
  row: RentalRequestRow
  whName: string
  compact?: boolean
}) {
  const ct = row.contractType as ContractTypeValue | undefined
  return (
    <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={labelStyle}>Khách</span>
          <p className="text-white">{row.customer}</p>
          <p className="text-xs text-slate-500">{row.customerEmail}</p>
        </div>
        <div>
          <span className={labelStyle}>Kho / vùng</span>
          <p className="text-white">{whName}</p>
        </div>
        {ct && (
          <div>
            <span className={labelStyle}>Loại thuê</span>
            <p className="text-white">{CONTRACT_TYPE_LABELS[ct] ?? ct}</p>
          </div>
        )}
        {row.billingCycle && (
          <div>
            <span className={labelStyle}>Chu kỳ</span>
            <p className="text-white">
              {BILLING_CYCLE_GUEST_LABELS[row.billingCycle] ?? row.billingCycle}
            </p>
          </div>
        )}
      </div>
      {!compact && (
        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3 text-xs text-slate-400">
          {row.estimatedBoxCount != null && <p>Hộp ước tính: {row.estimatedBoxCount}</p>}
          {row.estimatedSkuCount != null && <p>SKU: {row.estimatedSkuCount}</p>}
          {row.estimatedInboundPerWeek != null && (
            <p>Nhập/tuần: {row.estimatedInboundPerWeek}</p>
          )}
          {row.estimatedOutboundPerWeek != null && (
            <p>Xuất/tuần: {row.estimatedOutboundPerWeek}</p>
          )}
          {row.requestedAreaM2 != null && <p>Diện tích: {row.requestedAreaM2} m²</p>}
          {row.requiresFastPicking && <p className="text-cyan-400">Fast picking</p>}
          {row.requiresPremiumStorage && <p className="text-cyan-400">Premium storage</p>}
          {row.notes && (
            <p className="col-span-2 text-slate-300">
              Ghi chú: {row.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
