import { useEffect, useState } from 'react'
import { InlineAlert } from '../FeedbackAlert'
import { ApiError } from '../../../api/client'
import * as contractsApi from '../../../api/contracts'
import * as rentalRequestsApi from '../../../api/rentalRequests'
import * as storageReservationsApi from '../../../api/storageReservations'
import * as tenantsApi from '../../../api/tenants'
import * as warehousesApi from '../../../api/warehouses'
import { groupReservationsForTenantView } from '../../../utils/tenantReservationGroups'
import type { ContractStatus } from '../../../api/types'
import { ContractTerminationReviewPanel } from '../../contracts/ContractTerminationReviewPanel'
import {
  BILLING_CYCLE_GUEST_LABELS,
  PRICING_MODEL_LABELS,
  CONTRACT_TYPE_LABELS,
  type ContractTypeValue,
} from '../../../data/contractTypes'
import { ContractStatusBadge } from '../../contracts/ContractStatusBadge'

type Mode = 'create' | 'edit' | 'view'

export type ContractFormPayload = {
  contractName: string
  startDate: string
  endDate: string
  estimatedTotalAmount: number | null
  status: ContractStatus
}

type Props = {
  mode: Mode
  contractId?: string
  onClose: () => void
  onSubmit?: (data: ContractFormPayload) => void | Promise<void>
}

const labelStyle =
  'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
const inputStyle =
  'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 disabled:opacity-60'

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Nháp (DRAFT)' },
  { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { value: 'ACTIVE', label: 'Đang hiệu lực' },
  { value: 'EXPIRED', label: 'Hết hạn' },
  { value: 'TERMINATED', label: 'Chấm dứt' },
  { value: 'CANCELLED', label: 'Hủy' },
]

function toDateInput(iso?: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export const ContractModal: React.FC<Props> = ({ mode, contractId, onClose, onSubmit }) => {
  const isView = mode === 'view'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [contractCode, setContractCode] = useState('')
  const [apiStatus, setApiStatus] = useState<ContractStatus>('DRAFT')
  const [contractType, setContractType] = useState('')
  const [pricingModel, setPricingModel] = useState('')
  const [billingCycle, setBillingCycle] = useState('')
  const [rentalRequestCode, setRentalRequestCode] = useState('')
  const [warehouseName, setWarehouseName] = useState('')
  const [zoneGroups, setZoneGroups] = useState<
    ReturnType<typeof groupReservationsForTenantView>
  >([])
  const [tenantCompany, setTenantCompany] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [tenantTaxCode, setTenantTaxCode] = useState('')
  const [tenantAddress, setTenantAddress] = useState('')

  const [contractName, setContractName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [status, setStatus] = useState<ContractStatus>('DRAFT')

  useEffect(() => {
    if (!contractId) {
      setLoading(false)
      setError('Thiếu mã hợp đồng')
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const contract = await contractsApi.getContract(contractId)
        const [tenant, warehouse, reservationRes, rentalRequest] = await Promise.all([
          tenantsApi.getTenant(contract.tenantId),
          warehousesApi.getWarehouse(contract.warehouseId),
          storageReservationsApi.listStorageReservations({
            contractId,
            limit: 100,
          }),
          contract.rentalRequestId
            ? rentalRequestsApi.getRentalRequest(contract.rentalRequestId).catch(() => null)
            : Promise.resolve(null),
        ])
        if (cancelled) return

        setContractCode(contract.contractCode)
        setApiStatus(contract.status)
        setContractType(contract.contractType)
        setPricingModel(contract.pricingModel)
        setBillingCycle(contract.billingCycle ?? '')
        setRentalRequestCode(rentalRequest?.requestCode ?? '')

        setWarehouseName(warehouse.warehouseName)
        setZoneGroups(
          groupReservationsForTenantView(reservationRes.items, new Map([[contractId, contract.contractCode]]))
        )
        setTenantCompany(tenant.companyName)
        setTenantEmail(tenant.contactEmail ?? '')
        setTenantTaxCode(tenant.taxCode ?? '')
        setTenantAddress(tenant.address ?? '')

        setContractName(contract.contractName ?? tenant.companyName)
        setStartDate(toDateInput(contract.startDate))
        setEndDate(toDateInput(contract.endDate))
        setAmountInput(
          contract.estimatedTotalAmount != null ? String(contract.estimatedTotalAmount) : ''
        )
        setStatus(contract.status)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Không tải được hợp đồng')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contractId])

  const handleSubmit = async () => {
    if (!onSubmit) return
    setSubmitting(true)
    try {
      const amount = amountInput.trim() ? Number(amountInput) : null
      await onSubmit({
        contractName: contractName.trim(),
        startDate,
        endDate,
        estimatedTotalAmount: amount,
        status,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const ct = contractType as ContractTypeValue
  const typeLabel = CONTRACT_TYPE_LABELS[ct] ?? contractType

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <span className="material-symbols-outlined text-cyan-400">description</span>
              {mode === 'edit' ? 'Chỉnh sửa hợp đồng' : 'Chi tiết hợp đồng'}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Mã: <span className="font-mono text-cyan-400">{contractCode || '—'}</span>
              {apiStatus && (
                <span className="ml-2 inline-flex align-middle">
                  <ContractStatusBadge status={apiStatus} />
                </span>
              )}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-2 hover:bg-white/10">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="dark-scrollbar flex-1 space-y-6 overflow-y-auto p-6 pr-5 [scrollbar-gutter:stable]">
          {loading && (
            <p className="text-center text-sm text-slate-400">Đang tải hợp đồng...</p>
          )}
          {error && (
            <InlineAlert message={error} onDismiss={() => setError('')} />
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4 rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-cyan-400">BÊN CHO THUÊ / KHO</h3>
                    <p className="text-sm font-medium text-white">{warehouseName || '—'}</p>
                  </div>
                  <div>
                    <p className={labelStyle}>Zone đã gán</p>
                    {zoneGroups.length === 0 ? (
                      <p className="text-sm text-slate-500">Chưa có phân bổ zone</p>
                    ) : (
                      <ul className="mt-1.5 space-y-1.5">
                        {zoneGroups.map((g) => (
                          <li
                            key={g.key}
                            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200"
                          >
                            {g.zoneLabel}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <h3 className="text-sm font-semibold text-emerald-400">KHÁCH HÀNG (TENANT)</h3>
                  <div>
                    <label className={labelStyle}>Tên công ty</label>
                    <input disabled className={inputStyle} value={tenantCompany} />
                  </div>
                  <div>
                    <label className={labelStyle}>Email</label>
                    <input disabled className={inputStyle} value={tenantEmail} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelStyle}>MST</label>
                      <input disabled className={inputStyle} value={tenantTaxCode} />
                    </div>
                    <div>
                      <label className={labelStyle}>Địa chỉ</label>
                      <input disabled className={inputStyle} value={tenantAddress} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
                <h3 className="text-sm font-semibold text-cyan-400">ĐIỀU KHOẢN HỢP ĐỒNG</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={labelStyle}>Loại hợp đồng</label>
                    <input disabled className={inputStyle} value={typeLabel || '—'} />
                  </div>
                  <div>
                    <label className={labelStyle}>Cách tính giá</label>
                    <input
                      disabled
                      className={inputStyle}
                      value={PRICING_MODEL_LABELS[pricingModel] ?? pricingModel ?? '—'}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Chu kỳ thanh toán</label>
                    <input
                      disabled
                      className={inputStyle}
                      value={
                        BILLING_CYCLE_GUEST_LABELS[billingCycle] ??
                        billingCycle ??
                        '—'
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelStyle}>Tên hợp đồng</label>
                    <input
                      disabled={isView}
                      className={inputStyle}
                      value={contractName}
                      onChange={(e) => setContractName(e.target.value)}
                    />
                  </div>
                  {rentalRequestCode && (
                    <div>
                      <label className={labelStyle}>Yêu cầu thuê (RR)</label>
                      <input
                        disabled
                        className={`${inputStyle} font-mono text-sm text-cyan-300`}
                        value={rentalRequestCode}
                      />
                    </div>
                  )}
                  <div>
                    <label className={labelStyle}>Ngày bắt đầu</label>
                    <input
                      type="date"
                      disabled={isView}
                      className={inputStyle}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Ngày kết thúc</label>
                    <input
                      type="date"
                      disabled={isView}
                      className={inputStyle}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Giá trị ước tính (VND)</label>
                    <input
                      type="number"
                      min={0}
                      disabled={isView}
                      className={inputStyle}
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                    />
                  </div>
                  {mode !== 'view' && (
                    <div>
                      <label className={labelStyle}>Trạng thái</label>
                      <select
                        className={inputStyle}
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ContractStatus)}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-lg font-bold text-cyan-400">
                  {new Intl.NumberFormat('vi-VN').format(Number(amountInput) || 0)} ₫
                </div>
              </div>

              {contractId && (
                <>
                  <ContractTerminationReviewPanel
                    contractId={contractId}
                    contractStatus={apiStatus}
                    onUpdated={() => {
                      if (!contractId) return
                      contractsApi.getContract(contractId).then((c) => {
                        setApiStatus(c.status)
                        setStatus(c.status)
                      })
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-6 py-4">
          <span className="text-xs text-slate-500">Hợp đồng thuê kho · db4</span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">
              Đóng
            </button>
            {!isView && !loading && !error && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
