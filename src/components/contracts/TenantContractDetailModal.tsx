import { useCallback, useEffect, useMemo, useState } from 'react'
import { InlineAlert } from '../ui/FeedbackAlert'
import { ApiError } from '../../api/client'
import * as contractItemsApi from '../../api/contractItems'
import * as contractsApi from '../../api/contracts'
import * as warehousesApi from '../../api/warehouses'
import type { ApiContract, ApiContractTerminationRequest } from '../../api/types'
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
  parseContractAmount,
  type ContractSigningContext,
} from '../../utils/contractSigning'
import { groupReservationsForTenantView } from '../../utils/tenantReservationGroups'

type Props = {
  contractId: string
  reservations: ApiStorageReservation[]
  signingContext: ContractSigningContext
  canRequestTermination?: boolean
  onClose: () => void
  onSign?: () => void
  onTerminationChange?: () => void
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            signed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {signed ? 'Đã ký' : 'Chưa ký'}
        </span>
      </div>
      {signed && preview?.startsWith('data:image') ? (
        <div className="mt-2 flex h-14 items-center rounded border border-slate-200 bg-white p-1">
          <img src={preview} alt={`Chữ ký ${label}`} className="h-full max-w-full object-contain" />
        </div>
      ) : signed ? (
        <p className="mt-2 text-xs font-medium text-slate-600">Đã xác nhận điện tử</p>
      ) : (
        <p className="mt-2 text-xs text-slate-400">—</p>
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

  const amount = contract ? parseContractAmount(contract.estimatedTotalAmount) : null
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
      {/* Lớp nền overlay mờ sáng dịu hơn */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* Khung Modal Light Mode */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl text-slate-700">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Chi tiết hợp đồng</h2>
            {contract && (
              <p className="mt-1 font-mono text-sm font-medium text-sky-600">{contract.contractCode}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="light-scrollbar flex-1 space-y-5 overflow-y-auto p-6 pr-5 [scrollbar-gutter:stable]">
          {loading && <p className="text-sm text-slate-400">Đang tải...</p>}
          {error && <InlineAlert message={error} onDismiss={() => setError('')} />}

          {!loading && contract && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-500/20">
                  {contractStatusLabel(contract.status)}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {contractSigningStepLabel(contract, signingContext)}
                </span>
              </div>

              {/* Thông tin chung */}
              <section className="rounded-xl border border-slate-200 bg-slate-50/30 p-4">
                <h3 className="text-sm font-bold text-slate-900">Thông tin chung</h3>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Tên hợp đồng</dt>
                    <dd className="text-slate-800 font-medium">{contract.contractName ?? 'Hợp đồng thuê kho'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Loại thuê</dt>
                    <dd className="text-slate-800 font-medium">
                      {ct ? CONTRACT_TYPE_LABELS[ct] ?? contract.contractType : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Cách tính giá</dt>
                    <dd className="text-slate-800 font-medium">
                      {PRICING_MODEL_LABELS[contract.pricingModel] ?? contract.pricingModel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Chu kỳ thanh toán</dt>
                    <dd className="text-slate-800 font-medium">
                      {BILLING_CYCLE_GUEST_LABELS[contract.billingCycle ?? ''] ??
                        contract.billingCycle ??
                        '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Thời hạn</dt>
                    <dd className="text-slate-800 font-medium">
                      {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Ngày tạo</dt>
                    <dd className="text-slate-800 font-medium">{formatDate(contract.createdAt)}</dd>
                  </div>
                </dl>
              </section>

              {/* Kho phục vụ */}
              {warehouse && (
                <section className="rounded-xl border border-slate-200 bg-slate-50/30 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Kho phục vụ</h3>
                  <p className="mt-2 text-base font-semibold text-sky-700">
                    {warehouse.warehouseName}{' '}
                    <span className="font-mono text-sm font-medium text-slate-400">({warehouse.warehouseCode})</span>
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-600">
                    {warehouse.address ?? `${warehouse.district}, ${warehouse.city}`}
                  </p>
                  {(warehouse.district || warehouse.city) && warehouse.address && (
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {warehouse.district}, {warehouse.city}
                    </p>
                  )}
                </section>
              )}

              {/* Giá trị ước tính toàn kỳ */}
              <section className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3.5">
                <h3 className="text-sm font-bold text-sky-800">Giá trị ước tính toàn kỳ</h3>
                <p className="mt-1 text-2xl font-black text-sky-700">
                  {amount != null ? formatVnd(amount) : 'Chưa có — liên hệ kho'}
                </p>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Số tiền tham chiếu theo báo giá kho; hóa đơn thực tế có thể theo mức sử dụng trong kỳ.
                </p>
              </section>

              {/* Vị trí đã cấp */}
              <section>
                <h3 className="text-sm font-bold text-slate-900">Vị trí đã cấp trên HĐ</h3>
                {zoneGroups.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">
                    Chưa có phân bổ — kho sẽ cấp zone/bin trước khi bạn ký.
                  </p>
                ) : (
                  <div className="mt-2.5 space-y-2">
                    {zoneGroups.map((g) => (
                      <div
                        key={g.key}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
                      >
                        <p className="font-semibold text-slate-800">
                          {g.warehouseName} ·{' '}
                          <span className="font-mono font-medium text-sky-600">{g.zoneCode}</span>
                        </p>
                        {g.totalReservedCapacity > 0 && (
                          <p className="mt-0.5 text-xs font-medium text-slate-400">
                            Giữ ~{g.totalReservedCapacity.toLocaleString('vi-VN')} LPN
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Bảng đơn giá tham chiếu */}
              {items.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-slate-900">Bảng đơn giá tham chiếu</h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Đơn giá áp dụng trên hợp đồng — chi tiết theo loại dịch vụ.
                  </p>
                  <div className="mt-3 space-y-4">
                    {[...groupedItems.entries()].map(([itemType, rows]) => (
                      <div key={itemType} className="overflow-hidden rounded-lg border border-slate-200 shadow-sm bg-white">
                        <div className="bg-slate-100/80 border-b border-slate-200 px-4 py-2 text-xs font-bold uppercase text-slate-500">
                          {CONTRACT_ITEM_TYPE_LABELS[itemType] ?? itemType}
                        </div>
                        <table className="w-full text-left text-xs">
                          <thead className="text-slate-400 bg-slate-50/50 font-bold border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-2 font-semibold">Đơn vị tính</th>
                              <th className="px-4 py-2 font-semibold">{LPN_SIZE_COLUMN_HEADER}</th>
                              <th className="px-4 py-2 text-right font-semibold">Đơn giá</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {rows.map((row) => (
                              <tr key={row.contractItemId} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-4 py-2 text-slate-600">
                                  {CONTRACT_BILLING_UNIT_LABELS[row.billingUnit] ?? row.billingUnit}
                                </td>
                                <td className="px-4 py-2 text-slate-500">{formatLpnSize(row.boxType)}</td>
                                <td className="px-4 py-2 text-right tabular-nums text-sky-700 font-semibold">
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

              {/* Tiến độ ký */}
              <section>
                <h3 className="text-sm font-bold text-slate-900">Tiến độ ký</h3>
                <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
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

              {/* Chấm dứt sớm */}
              {contract.status === 'ACTIVE' && (
                <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <h3 className="text-sm font-bold text-amber-800">Chấm dứt hợp đồng sớm</h3>
                  {pendingTermination ? (
                    <p className="mt-1 text-sm font-medium text-amber-900">
                      {TERMINATION_REQUEST_STATUS_LABELS[pendingTermination.status]} — chờ kho xử lý.
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-amber-700/80 leading-relaxed">
                      Gửi yêu cầu để xem phí/hoàn dự kiến. Sau khi kho duyệt, HĐ chuyển TERMINATED;
                      bạn vẫn có thể xuất hết hàng còn trong kho.
                    </p>
                  )}
                </section>
              )}

              {/* Đã chấm dứt */}
              {contract.status === 'TERMINATED' && (
                <section className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    Hợp đồng đã chấm dứt. Không tạo nhập mới; có thể tạo phiếu xuất để lấy hết tồn.
                  </p>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="text-sm font-medium text-slate-500 hover:text-slate-800 rounded-lg px-4 py-2 transition-colors"
          >
            Đóng
          </button>
          {canRequestTermination &&
            contract?.status === 'ACTIVE' &&
            !pendingTermination && (
              <button
                type="button"
                onClick={() => setShowTerminationModal(true)}
                className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 shadow-sm transition-colors"
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
              className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 shadow-sm transition-colors"
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