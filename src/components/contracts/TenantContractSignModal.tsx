import { useEffect, useState } from 'react'
import { InlineAlert } from '../ui/FeedbackAlert'
import { ApiError } from '../../api/client'
import * as contractsApi from '../../api/contracts'
import * as storageReservationsApi from '../../api/storageReservations'
import * as warehousesApi from '../../api/warehouses'
import type { ApiContract } from '../../api/types'
import {
  BILLING_CYCLE_GUEST_LABELS,
  CONTRACT_TYPE_LABELS,
  type ContractTypeValue,
} from '../../data/contractTypes'
import { ContractPaymentSummary } from './ContractPaymentSummary'
import { SignaturePad } from './SignaturePad'

type Props = {
  contractId: string
  onClose: () => void
  onSigned: () => void
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

export function TenantContractSignModal({ contractId, onClose, onSigned }: Props) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [contract, setContract] = useState<ApiContract | null>(null)
  const [warehouseLabel, setWarehouseLabel] = useState('')
  const [storageSummary, setStorageSummary] = useState<string[]>([])
  const [signature, setSignature] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const c = await contractsApi.getContract(contractId)
        const [wh, reservationRes] = await Promise.all([
          warehousesApi.getWarehouse(c.warehouseId),
          storageReservationsApi.listStorageReservations({
            contractId,
            status: 'ACTIVE',
            limit: 50,
          }),
        ])
        if (cancelled) return
        setContract(c)
        setWarehouseLabel(
          `${wh.warehouseName} (${wh.warehouseCode}) — ${wh.district}, ${wh.city}`
        )
        const lines = reservationRes.items.map((r) => {
          if (r.storageLevel === 'WAREHOUSE') return `Toàn kho ${wh.warehouseCode}`
          if (r.zoneCode) {
            const cap =
              r.reservedCapacity != null && Number(r.reservedCapacity) > 0
                ? ` (~${Number(r.reservedCapacity).toLocaleString('vi-VN')} LPN)`
                : ''
            return `Zone ${r.zoneCode}${cap}`
          }
          if (r.binCode) return `Bin ${r.binCode}`
          return r.storageLevel
        })
        setStorageSummary([...new Set(lines)])
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
    if (!signature) {
      setError('Vui lòng ký trong khung chữ ký trước khi xác nhận')
      return
    }
    if (!agreed) {
      setError('Vui lòng đồng ý với điều khoản hợp đồng')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await contractsApi.updateContract(contractId, {
        tenantSignature: signature,
      })
      onSigned()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ký hợp đồng thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const ct = contract?.contractType as ContractTypeValue | undefined

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b101a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">Ký hợp đồng thuê kho</h2>
            <p className="mt-1 text-xs text-slate-400">
              Bước cuối — Tenant Admin ký; sau đó thanh toán{' '}
              <strong className="text-emerald-300/90">giá trị thực trả</strong> (invoice đầu) để HĐ
              ACTIVE
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-2 hover:bg-white/10">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="dark-scrollbar flex-1 space-y-4 overflow-y-auto p-6 pr-5 [scrollbar-gutter:stable]">
          {loading && <p className="text-sm text-slate-400">Đang tải...</p>}
          {error && (
            <InlineAlert message={error} onDismiss={() => setError('')} />
          )}

          {!loading && contract && (
            <>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm">
                <p className="font-mono text-cyan-300">{contract.contractCode}</p>
                <p className="mt-1 font-medium text-white">
                  {contract.contractName ?? 'Hợp đồng thuê kho'}
                </p>
                <dl className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                  <div>
                    <dt className="uppercase tracking-wide">Loại thuê</dt>
                    <dd className="text-slate-200">
                      {ct ? CONTRACT_TYPE_LABELS[ct] ?? contract.contractType : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wide">Kho</dt>
                    <dd className="text-slate-200">{warehouseLabel}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wide">Thời hạn</dt>
                    <dd className="text-slate-200">
                      {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wide">Chu kỳ thanh toán</dt>
                    <dd className="text-slate-200">
                      {BILLING_CYCLE_GUEST_LABELS[contract.billingCycle ?? ''] ??
                        contract.billingCycle ??
                        '—'}
                    </dd>
                  </div>
                </dl>
                <ContractPaymentSummary contract={contract} variant="sign" className="mt-4" />
              </div>

              {storageSummary.length > 0 && (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Vị trí đã cấp
                  </p>
                  <ul className="mt-2 space-y-1 text-slate-300">
                    {storageSummary.map((line) => (
                      <li key={line} className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-sm text-cyan-400/80">
                          inventory_2
                        </span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-slate-500">
                Kho đã ký trước. Sau khi bạn ký, hệ thống tạo invoice đầu theo{' '}
                <strong className="text-emerald-300">giá trị thực trả</strong> và HĐ ở trạng thái{' '}
                <strong className="text-amber-300">Chờ thanh toán PayOS</strong>. Khi invoice đầu được
                thanh toán, HĐ chuyển <strong className="text-emerald-400">ACTIVE</strong> — lúc đó
                mới tạo được yêu cầu nhập kho.
                {contract.billingCycle === 'MONTHLY' && (
                  <>
                    {' '}
                    Các kỳ tiền thuê sau sẽ đến hạn cùng ngày trong tháng kế tiếp ngày HĐ ACTIVE.
                  </>
                )}
              </p>

              <SignaturePad onChange={setSignature} />

              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 rounded border-white/20"
                />
                <span>
                  Tôi đại diện tenant đã đọc và đồng ý với điều khoản, giá trị thực trả, giá ước tính
                  toàn kỳ và thời hạn hợp đồng trên.
                </span>
              </label>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">
            Đóng
          </button>
          <button
            type="button"
            disabled={loading || submitting || !contract}
            onClick={handleSubmit}
            className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400 disabled:opacity-50"
          >
            {submitting ? 'Đang lưu...' : 'Xác nhận ký & kích hoạt'}
          </button>
        </div>
      </div>
    </div>
  )
}
