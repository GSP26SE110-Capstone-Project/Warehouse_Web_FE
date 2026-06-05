import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ApiError } from '../../api/client'

import * as contractsApi from '../../api/contracts'

import * as storageReservationsApi from '../../api/storageReservations'

import * as warehousesApi from '../../api/warehouses'

import { TenantContractSignModal } from '../../components/contracts/TenantContractSignModal'
import { TenantContractDetailModal } from '../../components/contracts/TenantContractDetailModal'
import { ContractTerminationModal } from '../../components/contracts/ContractTerminationModal'
import { TenantStorageAllocationPanel } from '../../components/contracts/TenantStorageAllocationPanel'
import { InlineAlert } from '../../components/ui/FeedbackAlert'

import { useAuth } from '../../auth/AuthContext'

import { CONTRACT_TYPE_LABELS, type ContractTypeValue } from '../../data/contractTypes'

import { formatVnd } from '../../data/pricing'

import type { ApiContract } from '../../api/types'

import {
  contractSigningStepLabel,
  contractStatusLabel,
  needsTenantSignature,
  parseContractAmount,
  waitingForStorageAssignment,
} from '../../utils/contractSigning'


function formatContractPeriod(start?: string, end?: string) {
  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('vi-VN') : '—'
  return `${fmt(start)} → ${fmt(end)}`
}


// Cấu hình lại mã màu Badge Trạng thái cho giao diện sáng (Light Mode)
function statusBadgeClass(status: ApiContract['status']) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  if (status === 'PENDING_APPROVAL') return 'bg-amber-50 text-amber-700 ring-amber-600/20'
  if (status === 'PENDING_PAYMENT') return 'bg-orange-50 text-orange-700 ring-orange-600/20'
  if (status === 'DRAFT') return 'bg-slate-100 text-slate-700 ring-slate-600/10'
  return 'bg-slate-50 text-slate-500 ring-slate-600/10'
}

const PAYOS_WINDOW_NAME = 'smartwarehouse_payos_checkout'

export function TenantContractsPage() {
  const { user } = useAuth()

  const tenantId = user?.tenantId ?? ''
  const isTenantAdmin = user?.role === 'TENANT_ADMIN'

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [contracts, setContracts] = useState<ApiContract[]>([])

  const [reservations, setReservations] = useState<Awaited<
    ReturnType<typeof storageReservationsApi.listStorageReservations>
  >['items']>([])

  const [warehouseNames, setWarehouseNames] = useState<Map<string, string>>(new Map())

  const [signContractId, setSignContractId] = useState<string | null>(null)
  const [payingContractId, setPayingContractId] = useState<string | null>(null)
  const payOsInFlightRef = useRef(false)
  const [detailContractId, setDetailContractId] = useState<string | null>(null)
  const [terminationContractId, setTerminationContractId] = useState<string | null>(null)
  const [pendingTerminationIds, setPendingTerminationIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    if (!tenantId) {
      setContracts([])
      setReservations([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const [contractRes, reservationRes, whRes] = await Promise.all([
        contractsApi.listContracts({ tenantId, limit: 100 }),
        storageReservationsApi.listStorageReservations({ tenantId, limit: 200 }),
        warehousesApi.listWarehouses({ limit: 100 }),
      ])

      setContracts(contractRes.items)
      setReservations(reservationRes.items)
      setWarehouseNames(new Map(whRes.items.map((w) => [w.warehouseId, w.warehouseName])))

      const activeIds = contractRes.items
        .filter((c) => c.status === 'ACTIVE')
        .map((c) => c.contractId)

      if (activeIds.length > 0) {
        const pendingLists = await Promise.all(
          activeIds.map((id) =>
            contractsApi.listContractTerminationRequests(id, { status: 'PENDING' })
          )
        )
        const pending = new Set<string>()
        activeIds.forEach((id, i) => {
          if (pendingLists[i]?.length) pending.add(id)
        })
        setPendingTerminationIds(pending)
      } else {
        setPendingTerminationIds(new Set())
      }

    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được hợp đồng / phân bổ kho')
    } finally {
      setLoading(false)
    }
  }, [tenantId])


  useEffect(() => {
    load()
  }, [load])


  const contractCodeById = useMemo(
    () => new Map(contracts.map((c) => [c.contractId, c.contractCode])),
    [contracts]
  )


  const activeReservationByContract = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of reservations) {
      if (r.status !== 'ACTIVE') continue
      map.set(r.contractId, (map.get(r.contractId) ?? 0) + 1)
    }
    return map
  }, [reservations])

  const signingContextFor = useCallback(
    (contractId: string) => ({
      hasStorageReservation: (activeReservationByContract.get(contractId) ?? 0) > 0,
    }),
    [activeReservationByContract]
  )

  const pendingSignContracts = useMemo(
    () =>
      contracts.filter((c) => needsTenantSignature(c, signingContextFor(c.contractId))),
    [contracts, signingContextFor]
  )

  const waitingStorageContracts = useMemo(
    () =>
      contracts.filter((c) => waitingForStorageAssignment(c, signingContextFor(c.contractId))),
    [contracts, signingContextFor]
  )

  const pendingPaymentContracts = useMemo(
    () => contracts.filter((c) => c.status === 'PENDING_PAYMENT'),
    [contracts]
  )

  const handlePayWithPayOS = useCallback(
    async (contractId: string) => {
      if (payOsInFlightRef.current) return
      payOsInFlightRef.current = true
      setPayingContractId(contractId)
      setError('')

      const payTab = window.open('about:blank', PAYOS_WINDOW_NAME)
      if (!payTab) {
        payOsInFlightRef.current = false
        setPayingContractId(null)
        setError('Trình duyệt chặn cửa sổ mới — cho phép popup cho site này rồi bấm lại.')
        return
      }

      try {
        const invoices = await contractsApi.listContractInvoices(contractId)
        const initial =
          invoices.find((i) => i.invoiceCategory === 'INITIAL') ?? invoices[0]
        if (!initial) {
          payTab.close()
          setError('Chưa có invoice đầu — liên hệ kho')
          return
        }
        const link = await contractsApi.createContractInvoicePayOSLink(
          contractId,
          initial.invoiceId
        )
        if (!link.checkoutUrl) {
          payTab.close()
          setError('PayOS không trả checkout URL')
          return
        }
        payTab.location.href = link.checkoutUrl
        payTab.focus()
      } catch (e) {
        payTab.close()
        const msg = e instanceof ApiError ? e.message : 'Không tạo được link PayOS'
        setError(msg)
        if (e instanceof ApiError && e.code === 'INVOICE_ALREADY_PAID') {
          void load()
        }
      } finally {
        payOsInFlightRef.current = false
        setPayingContractId(null)
      }
    },
    [load]
  )


  return (
    <div className="overflow-y-auto overflow-x-hidden bg-slate-50 p-6 text-slate-700 md:p-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <h2 className="text-2xl font-bold text-slate-900">Hợp đồng & vị trí đã cấp</h2>

        {error && (
          <InlineAlert message={error} onDismiss={() => setError('')} />
        )}


        {!loading && waitingStorageContracts.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-4">
            <p className="flex items-start gap-2 text-sm text-slate-700">
              <span className="material-symbols-outlined shrink-0 text-lg text-slate-500">
                inventory_2
              </span>
              <span>
                Kho đã ký <strong>{waitingStorageContracts.length}</strong> hợp đồng nhưng chưa cấp
                vị trí lưu trữ. Bạn chỉ ký được sau khi kho hoàn tất bước cấp bin/zone.
              </span>
            </p>
          </div>
        )}

        {!loading && pendingPaymentContracts.length > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
            <p className="flex items-start gap-2 text-sm text-orange-800">
              <span className="material-symbols-outlined shrink-0 text-lg text-orange-500">
                payments
              </span>
              <span>
                <strong>{pendingPaymentContracts.length}</strong> hợp đồng chờ thanh toán invoice
                đầu qua <strong className="text-orange-950">PayOS</strong>. Sau khi trả, HĐ ACTIVE và mở
                inbound.
              </span>
            </p>
          </div>
        )}

        {!loading && pendingSignContracts.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="flex items-start gap-2 text-sm text-amber-800">
              <span className="material-symbols-outlined shrink-0 text-lg text-amber-500">
                draw
              </span>
              <span>
                Bạn có <strong>{pendingSignContracts.length}</strong> hợp đồng chờ ký (bước cuối
                của tenant). Ký xong cần thanh toán invoice đầu; khi đã trả, HĐ{' '}
                <strong className="text-amber-950">ACTIVE</strong> và có thể tạo yêu cầu nhập kho.
              </span>
            </p>
          </div>
        )}


        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-semibold text-sky-700">
            Hợp đồng của tenant
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Mã HĐ</th>
                  {/* <th className="px-6 py-3">Kho</th> */}
                  <th className="px-6 py-3">Thời hạn</th>
                  <th className="px-6 py-3 text-right">Giá trị ước tính</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Tiến độ ký</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {contracts.map((c) => {
                  const ct = c.contractType as ContractTypeValue
                  const amount = parseContractAmount(c.estimatedTotalAmount)

                  const signCtx = signingContextFor(c.contractId)
                  const canSign = needsTenantSignature(c, signCtx)

                  return (
                    <tr key={c.contractId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono font-medium text-sky-600">{c.contractCode}</td>
                      {/* <td className="px-6 py-3 text-slate-600">
                        {warehouseNames.get(c.warehouseId) ?? c.warehouseId}
                      </td> */}
                      <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                        {formatContractPeriod(c.startDate, c.endDate)}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums">
                        {amount != null ? (
                          <span className="font-semibold text-slate-900">{formatVnd(amount)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(c.status)}`}
                        >
                          {contractStatusLabel(c.status)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {contractSigningStepLabel(c, signCtx)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailContractId(c.contractId)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                          >
                            Chi tiết
                          </button>
                          {canSign ? (
                            <button
                              type="button"
                              onClick={() => setSignContractId(c.contractId)}
                              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 shadow-sm transition-colors"
                            >
                              Ký HĐ
                            </button>
                          ) : null}
                          {c.status === 'PENDING_PAYMENT' ? (
                            <button
                              type="button"
                              disabled={payingContractId === c.contractId}
                              onClick={(e) => {
                                e.preventDefault()
                                void handlePayWithPayOS(c.contractId)
                              }}
                              className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50 shadow-sm transition-colors"
                            >
                              {payingContractId === c.contractId
                                ? 'Đang mở PayOS…'
                                : 'Thanh toán PayOS'}
                            </button>
                          ) : null}
                          {isTenantAdmin && c.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => setTerminationContractId(c.contractId)}
                              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 shadow-sm transition-colors"
                            >
                              {pendingTerminationIds.has(c.contractId)
                                ? 'Chờ duyệt CD'
                                : 'Chấm dứt'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!loading && contracts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400 bg-slate-50/30">
                      Chưa có hợp đồng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>


        <TenantStorageAllocationPanel
          tenantId={tenantId}
          reservations={reservations}
          contractCodeById={contractCodeById}
        />
      </div>


      {detailContractId && (
        <TenantContractDetailModal
          contractId={detailContractId}
          reservations={reservations}
          signingContext={signingContextFor(detailContractId)}
          canRequestTermination={isTenantAdmin}
          onClose={() => setDetailContractId(null)}
          onSign={() => setSignContractId(detailContractId)}
          onTerminationChange={load}
        />
      )}

      {terminationContractId && (
        <ContractTerminationModal
          contractId={terminationContractId}
          contractCode={contractCodeById.get(terminationContractId) ?? terminationContractId}
          onClose={() => setTerminationContractId(null)}
          onSubmitted={load}
        />
      )}

      {signContractId && (
        <TenantContractSignModal
          contractId={signContractId}
          onClose={() => setSignContractId(null)}
          onSigned={load}
        />
      )}
    </div>
  )
}