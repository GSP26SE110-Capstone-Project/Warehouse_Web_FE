import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ApiError } from '../../api/client'

import * as contractsApi from '../../api/contracts'
import * as contractAppendicesApi from '../../api/contractAppendices'
import type { ApiContractAppendix } from '../../api/contractAppendices'

import * as storageReservationsApi from '../../api/storageReservations'

import * as warehousesApi from '../../api/warehouses'

import { TenantContractSignModal } from '../../components/contracts/TenantContractSignModal'
import { TenantContractDetailModal } from '../../components/contracts/TenantContractDetailModal'
import { ContractAppendixRequestModal } from '../../components/contracts/ContractAppendixRequestModal'
import { ContractAppendixSignModal } from '../../components/contracts/ContractAppendixSignModal'
import { TenantContractAppendixActions } from '../../components/contracts/TenantContractAppendixActions'
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

import { formatDisplayDate, rentalRequestDateOnly } from '../../utils/datePicker'



function formatContractPeriod(start?: string, end?: string) {
  const fmt = (iso?: string) => {
    const dateOnly = rentalRequestDateOnly(iso)
    return dateOnly ? formatDisplayDate(dateOnly) : '—'
  }
  return `${fmt(start)} → ${fmt(end)}`
}



function statusBadgeClass(status: ApiContract['status']) {

  if (status === 'ACTIVE') return 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20'

  if (status === 'PENDING_APPROVAL') return 'bg-amber-400/10 text-amber-300 ring-amber-400/20'

  if (status === 'PENDING_PAYMENT') return 'bg-orange-400/10 text-orange-300 ring-orange-400/20'

  if (status === 'DRAFT') return 'bg-slate-400/10 text-slate-300 ring-slate-400/20'

  return 'bg-white/5 text-slate-400 ring-white/10'

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
  const [payingAppendixId, setPayingAppendixId] = useState<string | null>(null)
  const [appendixActionCount, setAppendixActionCount] = useState(0)
  const [appendixByContract, setAppendixByContract] = useState<
    Map<string, ApiContractAppendix[]>
  >(new Map())
  const [appendixRequestContractId, setAppendixRequestContractId] = useState<string | null>(null)
  const [appendixSignTarget, setAppendixSignTarget] = useState<{
    contractId: string
    appendix: ApiContractAppendix
  } | null>(null)
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

        const appendixMap = new Map<string, ApiContractAppendix[]>()
        let actionCount = 0
        const appendixResults = await Promise.allSettled(
          activeIds.map((id) => contractAppendicesApi.listContractAppendices(id, { limit: 50 }))
        )
        activeIds.forEach((id, i) => {
          const result = appendixResults[i]
          const items = result?.status === 'fulfilled' ? result.value.items : []
          if (items.length > 0) appendixMap.set(id, items)
          actionCount += items.filter(
            (a) => a.status === 'PENDING_APPROVAL' || a.status === 'PENDING_PAYMENT'
          ).length
        })
        setAppendixByContract(appendixMap)
        setAppendixActionCount(actionCount)
      } else {
        setPendingTerminationIds(new Set())
        setAppendixActionCount(0)
        setAppendixByContract(new Map())
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
    []
  )

  const handlePayAppendixWithPayOS = useCallback(
    async (contractId: string, appendix: ApiContractAppendix) => {
      if (payOsInFlightRef.current) return
      payOsInFlightRef.current = true
      setPayingAppendixId(appendix.appendixId)
      setError('')

      const payTab = window.open('about:blank', PAYOS_WINDOW_NAME)
      if (!payTab) {
        payOsInFlightRef.current = false
        setPayingAppendixId(null)
        setError('Trình duyệt chặn cửa sổ mới — cho phép popup cho site này rồi bấm lại.')
        return
      }

      try {
        const invoices = await contractAppendicesApi.listAppendixInvoices(
          contractId,
          appendix.appendixId
        )
        const initial =
          invoices.find((i) => i.invoiceCategory === 'APPENDIX_INITIAL') ?? invoices[0]
        if (!initial) {
          payTab.close()
          setError('Chưa có invoice phụ lục — liên hệ kho')
          return
        }
        const returnUrl = `${window.location.origin}/staff/contracts/payment/return?contractId=${encodeURIComponent(contractId)}&invoiceId=${encodeURIComponent(initial.invoiceId)}&appendixId=${encodeURIComponent(appendix.appendixId)}`
        const link = await contractAppendicesApi.createAppendixInvoicePayOSLink(
          contractId,
          appendix.appendixId,
          initial.invoiceId,
          { returnUrl, cancelUrl: returnUrl }
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
        const msg = e instanceof ApiError ? e.message : 'Không tạo được link PayOS phụ lục'
        setError(msg)
        if (e instanceof ApiError && e.code === 'INVOICE_ALREADY_PAID') {
          void load()
        }
      } finally {
        payOsInFlightRef.current = false
        setPayingAppendixId(null)
      }
    },
    [load]
  )

  return (

    <div className="overflow-y-auto overflow-x-hidden bg-[#0b101a] p-6 text-slate-100 md:p-8">

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">

        <h2 className="text-2xl font-bold text-white">Hợp đồng & vị trí đã cấp</h2>

        {error && (
          <InlineAlert message={error} onDismiss={() => setError('')} />
        )}



        {!loading && waitingStorageContracts.length > 0 && (
          <div className="rounded-xl border border-slate-500/30 bg-slate-500/10 px-5 py-4">
            <p className="flex items-start gap-2 text-sm text-slate-200">
              <span className="material-symbols-outlined shrink-0 text-lg text-slate-400">
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
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-5 py-4">
            <p className="flex items-start gap-2 text-sm text-orange-100">
              <span className="material-symbols-outlined shrink-0 text-lg text-orange-400">
                payments
              </span>
              <span>
                <strong>{pendingPaymentContracts.length}</strong> hợp đồng chờ thanh toán invoice
                đầu qua <strong className="text-white">PayOS</strong>. Sau khi trả, HĐ ACTIVE và mở
                inbound.
              </span>
            </p>
          </div>
        )}

        {!loading && isTenantAdmin && appendixActionCount > 0 && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-4">
            <p className="flex items-start gap-2 text-sm text-violet-100">
              <span className="material-symbols-outlined shrink-0 text-lg text-violet-400">
                notification_important
              </span>
              <span>
                <strong>{appendixActionCount}</strong> phụ lục cần xử lý — xem cột{' '}
                <strong className="text-white">Phụ lục</strong> trên bảng HĐ ACTIVE.
              </span>
            </p>
          </div>
        )}

        {!loading && pendingSignContracts.length > 0 && (

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">

            <p className="flex items-start gap-2 text-sm text-amber-100">

              <span className="material-symbols-outlined shrink-0 text-lg text-amber-400">

                draw

              </span>

              <span>

                Bạn có <strong>{pendingSignContracts.length}</strong> hợp đồng chờ ký (bước cuối

                của tenant).                 Ký xong cần thanh toán invoice đầu; khi đã trả, HĐ{' '}

                <strong className="text-white">ACTIVE</strong> và có thể tạo yêu cầu nhập kho.

              </span>

            </p>

          </div>

        )}



        <section className="glass-panel overflow-hidden rounded-xl border border-white/5">

          <div className="border-b border-white/5 px-6 py-4 text-sm font-semibold text-cyan-300">

            Hợp đồng của tenant

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-[#131b29] text-xs uppercase text-slate-400">

                <tr>

                  <th className="px-6 py-3">Mã HĐ</th>

                  <th className="px-6 py-3">Loại</th>

                  <th className="px-6 py-3">Kho</th>

                  <th className="px-6 py-3">Thời hạn</th>

                  <th className="px-6 py-3 text-right">Giá trị ước tính</th>

                  <th className="px-6 py-3">Trạng thái</th>

                  <th className="px-6 py-3">Tiến độ ký</th>

                  <th className="px-6 py-3">Phụ lục</th>

                  <th className="px-6 py-3" />

                </tr>

              </thead>

              <tbody className="divide-y divide-white/5">

                {contracts.map((c) => {

                  const ct = c.contractType as ContractTypeValue

                  const amount = parseContractAmount(c.estimatedTotalAmount)

                  const signCtx = signingContextFor(c.contractId)
                  const canSign = needsTenantSignature(c, signCtx)
                  const contractAppendices = appendixByContract.get(c.contractId) ?? []

                  return (

                    <tr key={c.contractId}>

                      <td className="px-6 py-3 font-mono text-cyan-300">{c.contractCode}</td>

                      <td className="px-6 py-3">{CONTRACT_TYPE_LABELS[ct] ?? c.contractType}</td>

                      <td className="px-6 py-3">

                        {warehouseNames.get(c.warehouseId) ?? c.warehouseId}

                      </td>

                      <td className="px-6 py-3 whitespace-nowrap">

                        {formatContractPeriod(c.startDate, c.endDate)}

                      </td>

                      <td className="px-6 py-3 text-right tabular-nums">

                        {amount != null ? (

                          <span className="font-medium text-cyan-300">{formatVnd(amount)}</span>

                        ) : (

                          <span className="text-slate-500">—</span>

                        )}

                      </td>

                      <td className="px-6 py-3">

                        <span

                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(c.status)}`}

                        >

                          {contractStatusLabel(c.status)}

                        </span>

                      </td>

                      <td className="px-6 py-3 text-xs text-slate-400">

                        {contractSigningStepLabel(c, signCtx)}

                      </td>

                      <td className="px-6 py-3 align-top">
                        <TenantContractAppendixActions
                          contract={c}
                          appendices={contractAppendices}
                          isTenantAdmin={isTenantAdmin}
                          payingAppendixId={payingAppendixId}
                          onRequest={() => setAppendixRequestContractId(c.contractId)}
                          onSign={(appendix) =>
                            setAppendixSignTarget({ contractId: c.contractId, appendix })
                          }
                          onPay={(appendix) =>
                            void handlePayAppendixWithPayOS(c.contractId, appendix)
                          }
                          onViewDetail={() => setDetailContractId(c.contractId)}
                        />
                      </td>

                      <td className="px-6 py-3 align-top text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {canSign ? (
                            <button
                              type="button"
                              onClick={() => setSignContractId(c.contractId)}
                              className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-cyan-400"
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
                              className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-orange-400 disabled:opacity-50"
                            >
                              {payingContractId === c.contractId
                                ? 'Đang mở PayOS…'
                                : 'Thanh toán PayOS'}
                            </button>
                          ) : null}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailContractId(c.contractId)}
                              title="Chi tiết hợp đồng"
                              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                visibility
                              </span>
                              Chi tiết
                            </button>
                            {isTenantAdmin && c.status === 'ACTIVE' ? (
                              <button
                                type="button"
                                onClick={() => setTerminationContractId(c.contractId)}
                                title="Chấm dứt hợp đồng"
                                className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 px-2.5 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  block
                                </span>
                                {pendingTerminationIds.has(c.contractId)
                                  ? 'Chờ duyệt'
                                  : 'Chấm dứt'}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </td>

                    </tr>

                  )

                })}

                {!loading && contracts.length === 0 && (

                  <tr>

                    <td colSpan={9} className="px-6 py-4 text-slate-500">

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
          isTenantAdmin={isTenantAdmin}
          payingAppendixId={payingAppendixId}
          onPayAppendix={(a) => void handlePayAppendixWithPayOS(detailContractId, a)}
          onClose={() => setDetailContractId(null)}
          onSign={() => setSignContractId(detailContractId)}
          onTerminationChange={load}
          onAppendixChange={load}
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

      {appendixRequestContractId && (() => {
        const contract = contracts.find((c) => c.contractId === appendixRequestContractId)
        if (!contract) return null
        return (
          <ContractAppendixRequestModal
            contract={contract}
            onClose={() => setAppendixRequestContractId(null)}
            onSubmitted={load}
          />
        )
      })()}

      {appendixSignTarget && (
        <ContractAppendixSignModal
          contractId={appendixSignTarget.contractId}
          appendix={appendixSignTarget.appendix}
          onClose={() => setAppendixSignTarget(null)}
          onSigned={load}
        />
      )}

    </div>

  )

}


