import { useCallback, useEffect, useMemo, useState } from 'react'
import { InlineAlert } from '../ui/FeedbackAlert'
import { ApiError } from '../../api/client'
import * as contractItemsApi from '../../api/contractItems'
import * as contractsApi from '../../api/contracts'
import * as warehousesApi from '../../api/warehouses'
import type {
  ApiBoxAllocationRow,
  ApiContract,
  ApiContractTerminationRequest,
} from '../../api/types'
import * as rentalRequestsApi from '../../api/rentalRequests'
import { ContractTerminationModal } from './ContractTerminationModal'
import { TERMINATION_REQUEST_STATUS_LABELS } from '../../utils/contractTermination'
import type { ApiStorageReservation } from '../../api/storageReservations'
import {
  BILLING_CYCLE_GUEST_LABELS,
  CONTRACT_TYPE_LABELS,
  PRICING_MODEL_LABELS,
  type ContractTypeValue,
} from '../../data/contractTypes'
import { formatVnd } from '../../data/pricing'
import {
  CONTRACT_BILLING_UNIT_LABELS,
  CONTRACT_ITEM_TYPE_LABELS,
  formatLpnSize,
  LPN_SIZE_COLUMN_HEADER,
} from '../../data/lpnTerminology'
import {
  contractSigningStepLabel,
  contractStatusLabel,
  hasTenantSignature,
  hasWarehouseSignature,
  needsTenantSignature,
  type ContractSigningContext,
} from '../../utils/contractSigning'
import { groupReservationsForTenantView } from '../../utils/tenantReservationGroups'
import { formatReservedCapacityLabel } from '../../utils/rentalCapacitySummary'
import { resolveEffectiveContractDates } from '../../utils/rentalPeriod'
import { formatDisplayDate, rentalRequestDateOnly } from '../../utils/datePicker'
import { ContractPaymentSummary } from './ContractPaymentSummary'
import { ContractInvoicesPanel } from './ContractInvoicesPanel'
import { ContractAppendixListPanel } from './ContractAppendixListPanel'
import { ContractAppendixRequestModal } from './ContractAppendixRequestModal'
import type { ApiContractAppendix } from '../../api/contractAppendices'
import { canTenantRequestAppendix } from '../../utils/contractAppendix'

type Props = {
  contractId: string
  reservations: ApiStorageReservation[]
  signingContext: ContractSigningContext
  canRequestTermination?: boolean
  onClose: () => void
  onSign?: () => void
  onTerminationChange?: () => void
  onAppendixChange?: () => void
  onInvoicePaid?: () => void
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

function SignatureStatus({
  label,
  signed,
  preview,
}: {
  label: string
  signed: boolean
  preview?: string | null
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            signed ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
          }`}
        >
          {signed ? 'Đã ký' : 'Chưa ký'}
        </span>
      </div>
      {signed && preview?.startsWith('data:image') ? (
        <img src={preview} alt={`Chữ ký ${label}`} className="mt-2 h-14 max-w-full object-contain" />
      ) : signed ? (
        <p className="mt-2 text-xs text-slate-400">Đã xác nhận điện tử</p>
      ) : (
        <p className="mt-2 text-xs text-slate-600">—</p>
      )}
    </div>
  )
}

export function TenantContractDetailModal({
  contractId,
  reservations,
  signingContext,
  canRequestTermination = false,
  onClose,
  onSign,
  onTerminationChange,
  onAppendixChange,
  onInvoicePaid,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contract, setContract] = useState<ApiContract | null>(null)
  const [pendingTermination, setPendingTermination] =
    useState<ApiContractTerminationRequest | null>(null)
  const [showTerminationModal, setShowTerminationModal] = useState(false)
  const [warehouse, setWarehouse] = useState<Awaited<
    ReturnType<typeof warehousesApi.getWarehouse>
  > | null>(null)
  const [items, setItems] = useState<contractItemsApi.ApiContractItem[]>([])
  const [activationDate, setActivationDate] = useState<string | null>(null)
  const [boxAllocation, setBoxAllocation] = useState<ApiBoxAllocationRow[]>([])
  const [rentalDatesNote, setRentalDatesNote] = useState<string | null>(null)
  const [rentalRequestCode, setRentalRequestCode] = useState('')
  const loadDetail = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [c, itemRes] = await Promise.all([
        contractsApi.getContract(contractId),
        contractItemsApi.listContractItems(contractId),
      ])
      const wh = await warehousesApi.getWarehouse(c.warehouseId)
      setContract(c)
      setWarehouse(wh)
      setItems(itemRes.items)

      if (c.rentalRequestId) {
        try {
          const rr = await rentalRequestsApi.getRentalRequest(c.rentalRequestId)
          setRentalRequestCode(rr.requestCode ?? '')
          setBoxAllocation(rr.boxAllocation ?? rr.boxAllocationJson ?? [])

          const reqStart = rentalRequestDateOnly(rr.expectedStartDate)
          const reqEnd = rentalRequestDateOnly(rr.expectedEndDate)
          const contractStart = rentalRequestDateOnly(c.startDate)
          const contractEnd = rentalRequestDateOnly(c.endDate)
          if (reqStart && reqEnd && contractStart && contractEnd) {
            const resolved = resolveEffectiveContractDates(reqStart, reqEnd)
            if (
              resolved.shifted &&
              contractStart === resolved.startDate &&
              contractEnd === resolved.endDate
            ) {
              setRentalDatesNote(
                `Bạn yêu cầu ${formatDisplayDate(reqStart)} → ${formatDisplayDate(reqEnd)}. Do duyệt sau ngày bắt đầu dự kiến, HĐ áp dụng ${formatDisplayDate(contractStart)} → ${formatDisplayDate(contractEnd)} (giữ ${resolved.billingMonths} tháng thuê).`
              )
            } else {
              setRentalDatesNote(null)
            }
          } else {
            setRentalDatesNote(null)
          }
        } catch {
          setRentalRequestCode('')
          setBoxAllocation([])
          setRentalDatesNote(null)
        }
      } else {
        setRentalRequestCode('')
        setBoxAllocation([])
        setRentalDatesNote(null)
      }

      if (c.status === 'ACTIVE' || c.status === 'PENDING_PAYMENT') {
        const invoices = await contractsApi.listContractInvoices(contractId)
        const initial =
          invoices.find((i) => i.invoiceCategory === 'INITIAL') ?? invoices[0]
        if (initial?.paymentStatus === 'PAID' && initial.updatedAt) {
          setActivationDate(initial.updatedAt)
        } else if (c.status === 'ACTIVE' && c.updatedAt) {
          setActivationDate(c.updatedAt)
        } else {
          setActivationDate(null)
        }
      } else {
        setActivationDate(null)
      }

      if (c.status === 'ACTIVE') {
        const pending = await contractsApi.listContractTerminationRequests(contractId, {
          status: 'PENDING',
        })
        setPendingTermination(pending[0] ?? null)
      } else {
        setPendingTermination(null)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được chi tiết hợp đồng')
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const contractReservations = useMemo(
    () => reservations.filter((r) => r.contractId === contractId),
    [reservations, contractId]
  )

  const zoneGroups = useMemo(() => {
    if (!contract) return []
    const codeMap = new Map([[contract.contractId, contract.contractCode]])
    return groupReservationsForTenantView(contractReservations, codeMap)
  }, [contract, contractReservations])

  const ct = contract?.contractType as ContractTypeValue | undefined
  const canSign = contract ? needsTenantSignature(contract, signingContext) : false

  const groupedItems = useMemo(() => {
    const map = new Map<string, contractItemsApi.ApiContractItem[]>()
    for (const item of items) {
      const key = item.itemType
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return map
  }, [items])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b101a] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">Chi tiết hợp đồng</h2>
            {contract && (
              <p className="mt-1 font-mono text-sm text-cyan-300">{contract.contractCode}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded p-2 hover:bg-white/10">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="dark-scrollbar flex-1 space-y-5 overflow-y-auto p-6 pr-5 [scrollbar-gutter:stable]">
          {loading && <p className="text-sm text-slate-400">Đang tải...</p>}
          {error && <InlineAlert message={error} onDismiss={() => setError('')} />}

          {!loading && contract && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 ring-1 ring-cyan-500/30">
                  {contractStatusLabel(contract.status)}
                </span>
                <span className="text-xs text-slate-500">
                  {contractSigningStepLabel(contract, signingContext)}
                </span>
              </div>

              <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h3 className="text-sm font-semibold text-white">Thông tin chung</h3>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Tên hợp đồng</dt>
                    <dd className="text-slate-200">{contract.contractName ?? 'Hợp đồng thuê kho'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Loại thuê</dt>
                    <dd className="text-slate-200">
                      {ct ? CONTRACT_TYPE_LABELS[ct] ?? contract.contractType : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Cách tính giá</dt>
                    <dd className="text-slate-200">
                      {PRICING_MODEL_LABELS[contract.pricingModel] ?? contract.pricingModel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Chu kỳ thanh toán</dt>
                    <dd className="text-slate-200">
                      {BILLING_CYCLE_GUEST_LABELS[contract.billingCycle ?? ''] ??
                        contract.billingCycle ??
                        '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Thời hạn</dt>
                    <dd className="text-slate-200">
                      {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                      {rentalDatesNote && (
                        <p className="mt-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs font-normal text-amber-100">
                          {rentalDatesNote}
                        </p>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Ngày tạo</dt>
                    <dd className="text-slate-200">{formatDate(contract.createdAt)}</dd>
                  </div>
                  {rentalRequestCode && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">
                        Yêu cầu thuê (RR)
                      </dt>
                      <dd className="font-mono text-cyan-300">{rentalRequestCode}</dd>
                    </div>
                  )}
                </dl>
              </section>

              {warehouse && (
                <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <h3 className="text-sm font-semibold text-white">Kho phục vụ</h3>
                  <p className="mt-2 text-base font-medium text-cyan-300">
                    {warehouse.warehouseName}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {warehouse.address ?? `${warehouse.district}, ${warehouse.city}`}
                  </p>
                  {(warehouse.district || warehouse.city) && warehouse.address && (
                    <p className="mt-1 text-xs text-slate-500">
                      {warehouse.district}, {warehouse.city}
                    </p>
                  )}
                </section>
              )}

              <ContractPaymentSummary
                contract={contract}
                variant="detail"
                activationDate={activationDate}
              />

              {(contract.status === 'ACTIVE' || contract.status === 'PENDING_PAYMENT') && (
                <ContractInvoicesPanel
                  contractId={contractId}
                  onPaid={() => {
                    void loadDetail()
                    onInvoicePaid?.()
                  }}
                />
              )}

              <section>
                <h3 className="text-sm font-semibold text-white">Vị trí đã cấp trên HĐ</h3>
                {zoneGroups.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Chưa có phân bổ — kho sẽ cấp zone/bin trước khi bạn ký.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {zoneGroups.map((g) => (
                      <div
                        key={g.key}
                        className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm"
                      >
                        <p className="font-medium text-cyan-300">{g.zoneLabel}</p>
                        {g.totalReservedCapacity > 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            {formatReservedCapacityLabel(g.totalReservedCapacity, boxAllocation)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {items.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-white">Bảng đơn giá tham chiếu</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Đơn giá áp dụng trên hợp đồng — chi tiết theo loại dịch vụ.
                  </p>
                  <div className="mt-3 space-y-4">
                    {[...groupedItems.entries()].map(([itemType, rows]) => (
                      <div key={itemType} className="overflow-hidden rounded-lg border border-white/10">
                        <div className="bg-[#131b29] px-4 py-2 text-xs font-semibold uppercase text-slate-400">
                          {CONTRACT_ITEM_TYPE_LABELS[itemType] ?? itemType}
                        </div>
                        <table className="w-full text-left text-xs">
                          <thead className="text-slate-500">
                            <tr>
                              <th className="px-4 py-2">Đơn vị tính</th>
                              <th className="px-4 py-2">{LPN_SIZE_COLUMN_HEADER}</th>
                              <th className="px-4 py-2 text-right">Đơn giá</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {rows.map((row) => (
                              <tr key={row.contractItemId}>
                                <td className="px-4 py-2">
                                  {CONTRACT_BILLING_UNIT_LABELS[row.billingUnit] ?? row.billingUnit}
                                </td>
                                <td className="px-4 py-2">{formatLpnSize(row.boxType)}</td>
                                <td className="px-4 py-2 text-right tabular-nums text-cyan-300/90">
                                  {formatVnd(Number(row.unitPrice))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-sm font-semibold text-white">Tiến độ ký</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <SignatureStatus
                    label="Kho (Warehouse)"
                    signed={hasWarehouseSignature(contract)}
                    preview={contract.warehouseSignature}
                  />
                  <SignatureStatus
                    label="Tenant (bạn)"
                    signed={hasTenantSignature(contract)}
                    preview={contract.tenantSignature}
                  />
                </div>
              </section>

              {contract.status === 'ACTIVE' && (
                <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h3 className="text-sm font-semibold text-amber-200">Chấm dứt hợp đồng sớm</h3>
                  {pendingTermination ? (
                    <p className="mt-2 text-sm text-slate-300">
                      {TERMINATION_REQUEST_STATUS_LABELS[pendingTermination.status]} — chờ kho xử
                      lý.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Gửi yêu cầu để xem phí/hoàn dự kiến. Sau khi kho duyệt, HĐ chuyển TERMINATED;
                      bạn vẫn có thể xuất hết hàng còn trong kho.
                    </p>
                  )}
                </section>
              )}

              {contract.status === 'TERMINATED' && (
                <section className="rounded-xl border border-slate-500/30 bg-white/[0.02] p-4">
                  <p className="text-sm text-slate-300">
                    Hợp đồng đã chấm dứt. Không tạo nhập mới; có thể tạo phiếu xuất để lấy hết tồn.
                  </p>
                </section>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">
            Đóng
          </button>
          {canRequestTermination &&
            contract?.status === 'ACTIVE' &&
            !pendingTermination && (
              <button
                type="button"
                onClick={() => setShowTerminationModal(true)}
                className="rounded-lg border border-amber-500/40 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/10"
              >
                Yêu cầu chấm dứt
              </button>
            )}
          {canSign && onSign && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onSign()
              }}
              className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
            >
              Ký hợp đồng
            </button>
          )}
        </div>
      </div>

      {showTerminationModal && contract && (
        <ContractTerminationModal
          contractId={contractId}
          contractCode={contract.contractCode}
          onClose={() => setShowTerminationModal(false)}
          onSubmitted={() => {
            void loadDetail()
            onTerminationChange?.()
          }}
        />
      )}

    </div>
  )
}
