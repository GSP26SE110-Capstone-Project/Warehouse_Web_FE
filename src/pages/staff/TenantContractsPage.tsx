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
import { isPendingRecurringRent } from '../../utils/invoiceLabels'

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

const TENANT_CONTRACT_STATUS_FILTERS: { value: '' | ContractStatus; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hiệu lực' },
  { value: 'PENDING_APPROVAL', label: 'Chờ bạn ký' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'EXPIRED', label: 'Hết hạn' },
  { value: 'TERMINATED', label: 'Chấm dứt' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

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
  const [pendingInvoiceCountByContract, setPendingInvoiceCountByContract] = useState<
    Map<string, number>
  >(new Map())

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
      const activeContractIds = contractRes.items
        .filter((c) => c.status === 'ACTIVE')
        .map((c) => c.contractId)
      if (activeContractIds.length > 0) {
        const invoiceResults = await Promise.allSettled(
          activeContractIds.map((id) => contractsApi.listContractInvoices(id))
        )
        const pendingInvoices = new Map<string, number>()
        activeContractIds.forEach((id, i) => {
          const result = invoiceResults[i]
          const rows = result?.status === 'fulfilled' ? result.value : []
          const count = rows.filter(isPendingRecurringRent).length
          if (count > 0) pendingInvoices.set(id, count)
        })
        setPendingInvoiceCountByContract(pendingInvoices)
      } else {
        setPendingInvoiceCountByContract(new Map())
      }

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

  const contractsWithPendingInvoices = useMemo(
    () =>
      contracts.filter(
        (c) =>
          c.status === 'ACTIVE' &&
          (pendingInvoiceCountByContract.get(c.contractId) ?? 0) > 0
      ),
    [contracts, pendingInvoiceCountByContract]
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
        const pending =
          invoices.find(
            (i) => i.invoiceCategory === 'INITIAL' && i.paymentStatus === 'PENDING'
          ) ?? invoices.find((i) => i.invoiceCategory === 'INITIAL')
        if (!pending) {
          payTab.close()
          setError('Chưa có invoice cần thanh toán — liên hệ kho')
          return
        }
        const link = await contractsApi.createContractInvoicePayOSLink(
          contractId,
          pending.invoiceId
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

        {!loading && contractsWithPendingInvoices.length > 0 && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-4">
            <p className="flex items-start gap-2 text-sm text-cyan-100">
              <span className="material-symbols-outlined shrink-0 text-lg text-cyan-400">
                receipt_long
              </span>
              <span>
                <strong>{contractsWithPendingInvoices.length}</strong> hợp đồng ACTIVE có{' '}
                <strong className="text-white">tiền thuê tháng</strong> chưa trả. Mở{' '}
                <strong className="text-white">Chi tiết</strong> → <strong className="text-white">Hóa đơn</strong>{' '}
                để thanh toán RECURRING_RENT (phụ phí inbound/outbound trả tại phiếu nhập/xuất).
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

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-cyan-300">Hợp đồng của tenant</h3>
              {!loading && contracts.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Hiển thị {filteredContracts.length.toLocaleString('vi-VN')} /{' '}
                  {contracts.length.toLocaleString('vi-VN')} hợp đồng
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <span className="material-symbols-outlined text-lg">search</span>
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm mã HĐ, tên, kho, loại..."
                  aria-label="Tìm hợp đồng"
                  className="w-full rounded-lg border border-white/10 bg-[#1a2333] py-2 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>
              <select
                aria-label="Lọc trạng thái hợp đồng"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as '' | ContractStatus)}
                className="rounded-lg border border-white/10 bg-[#1a2333] px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              >
                {TENANT_CONTRACT_STATUS_FILTERS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {(search.trim() || statusFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('')
                  }}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Xóa lọc
                </button>
              )}
            </div>
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

                  <th className="px-6 py-3" />

                </tr>

              </thead>

              <tbody className="divide-y divide-white/5">

                {filteredContracts.map((c) => {

                  const ct = c.contractType as ContractTypeValue

                  const amount = parseContractAmount(c.estimatedTotalAmount)

                  const signCtx = signingContextFor(c.contractId)
                  const canSign = needsTenantSignature(c, signCtx)

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
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(c.status)}`}
                          >
                            {contractStatusLabel(c.status)}
                          </span>
                          {(pendingInvoiceCountByContract.get(c.contractId) ?? 0) > 0 && (
                            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-300 ring-1 ring-orange-500/25">
                              {pendingInvoiceCountByContract.get(c.contractId)} tiền thuê chưa trả
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-3 text-xs text-slate-400">

                        {contractSigningStepLabel(c, signCtx)}

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
                    <td colSpan={8} className="px-6 py-4 text-slate-500">
                      Chưa có hợp đồng nào.
                    </td>
                  </tr>
                )}

                {!loading && contracts.length > 0 && filteredContracts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      Không tìm thấy hợp đồng phù hợp. Thử đổi từ khóa hoặc bộ lọc trạng thái.
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
          onAppendixChange={load}
          onInvoicePaid={load}
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


