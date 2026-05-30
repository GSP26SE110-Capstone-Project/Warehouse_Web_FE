import { useEffect, useMemo, useState } from 'react'
import { InlineAlert } from '../ui/FeedbackAlert'
import { ApiError } from '../../api/client'
import * as contractItemsApi from '../../api/contractItems'
import * as contractsApi from '../../api/contracts'
import * as warehousesApi from '../../api/warehouses'
import type { ApiContract } from '../../api/types'
import type { ApiStorageReservation } from '../../api/storageReservations'
import {
  BILLING_CYCLE_GUEST_LABELS,
  CONTRACT_TYPE_LABELS,
  type ContractTypeValue,
} from '../../data/contractTypes'
import { formatVnd } from '../../data/pricing'
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

const PRICING_MODEL_LABELS: Record<string, string> = {
  USAGE_BASED: 'Theo mức sử dụng',
  FIXED: 'Cố định',
  HYBRID: 'Kết hợp',
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  INBOUND: 'Nhập kho (LPN)',
  STORAGE: 'Lưu kho',
  HANDLING: 'Xử lý hàng',
}

const BILLING_UNIT_LABELS: Record<string, string> = {
  INBOUND_LPN: 'LPN nhập',
  BOX_DAY: 'Thùng/ngày',
  HANDLING_UNIT: 'Đơn vị xử lý',
}

const BOX_TYPE_LABELS: Record<string, string> = {
  SMALL: 'Nhỏ (S)',
  MEDIUM: 'Vừa (M)',
  LARGE: 'Lớn (L)',
  EXTRA: 'Cực lớn (XL)',
}

type Props = {
  contractId: string
  reservations: ApiStorageReservation[]
  signingContext: ContractSigningContext
  onClose: () => void
  onSign?: () => void
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
  onClose,
  onSign,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contract, setContract] = useState<ApiContract | null>(null)
  const [warehouse, setWarehouse] = useState<Awaited<
    ReturnType<typeof warehousesApi.getWarehouse>
  > | null>(null)
  const [items, setItems] = useState<contractItemsApi.ApiContractItem[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [c, itemRes] = await Promise.all([
          contractsApi.getContract(contractId),
          contractItemsApi.listContractItems(contractId),
        ])
        const wh = await warehousesApi.getWarehouse(c.warehouseId)
        if (cancelled) return
        setContract(c)
        setWarehouse(wh)
        setItems(itemRes.items)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Không tải được chi tiết hợp đồng')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contractId])

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

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
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
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Mô hình giá</dt>
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
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Ngày tạo</dt>
                    <dd className="text-slate-200">{formatDate(contract.createdAt)}</dd>
                  </div>
                </dl>
              </section>

              {warehouse && (
                <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <h3 className="text-sm font-semibold text-white">Kho phục vụ</h3>
                  <p className="mt-2 text-base font-medium text-cyan-300">
                    {warehouse.warehouseName}{' '}
                    <span className="font-mono text-sm text-slate-400">({warehouse.warehouseCode})</span>
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

              <section className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4">
                <h3 className="text-sm font-semibold text-cyan-200">Giá trị ước tính toàn kỳ</h3>
                <p className="mt-2 text-2xl font-bold text-cyan-300">
                  {amount != null ? formatVnd(amount) : 'Chưa có — liên hệ kho'}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Số tiền tham chiếu theo báo giá kho; hóa đơn thực tế có thể theo mức sử dụng trong kỳ.
                </p>
              </section>

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
                        <p className="font-medium text-white">
                          {g.warehouseName} ·{' '}
                          <span className="font-mono text-cyan-400">{g.zoneCode}</span>
                        </p>
                        {g.totalReservedCapacity > 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            Giữ ~{g.totalReservedCapacity.toLocaleString('vi-VN')} thùng/LPN
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
                          {ITEM_TYPE_LABELS[itemType] ?? itemType}
                        </div>
                        <table className="w-full text-left text-xs">
                          <thead className="text-slate-500">
                            <tr>
                              <th className="px-4 py-2">Đơn vị tính</th>
                              <th className="px-4 py-2">Loại thùng</th>
                              <th className="px-4 py-2 text-right">Đơn giá</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {rows.map((row) => (
                              <tr key={row.contractItemId}>
                                <td className="px-4 py-2">
                                  {BILLING_UNIT_LABELS[row.billingUnit] ?? row.billingUnit}
                                </td>
                                <td className="px-4 py-2">
                                  {row.boxType
                                    ? BOX_TYPE_LABELS[row.boxType] ?? row.boxType
                                    : '—'}
                                </td>
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
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">
            Đóng
          </button>
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
    </div>
  )
}
