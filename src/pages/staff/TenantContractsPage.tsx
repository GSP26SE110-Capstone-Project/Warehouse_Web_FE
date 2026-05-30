import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError } from '../../api/client'

import * as contractsApi from '../../api/contracts'

import * as storageReservationsApi from '../../api/storageReservations'

import * as warehousesApi from '../../api/warehouses'

import { TenantContractSignModal } from '../../components/contracts/TenantContractSignModal'
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

} from '../../utils/contractSigning'



function formatContractPeriod(start?: string, end?: string) {

  const fmt = (iso?: string) =>

    iso ? new Date(iso).toLocaleDateString('vi-VN') : '—'

  return `${fmt(start)} → ${fmt(end)}`

}



function statusBadgeClass(status: ApiContract['status']) {

  if (status === 'ACTIVE') return 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20'

  if (status === 'PENDING_APPROVAL') return 'bg-amber-400/10 text-amber-300 ring-amber-400/20'

  if (status === 'DRAFT') return 'bg-slate-400/10 text-slate-300 ring-slate-400/20'

  return 'bg-white/5 text-slate-400 ring-white/10'

}



export function TenantContractsPage() {

  const { user } = useAuth()

  const tenantId = user?.tenantId ?? ''

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [contracts, setContracts] = useState<ApiContract[]>([])

  const [reservations, setReservations] = useState<Awaited<

    ReturnType<typeof storageReservationsApi.listStorageReservations>

  >['items']>([])

  const [warehouseNames, setWarehouseNames] = useState<Map<string, string>>(new Map())

  const [signContractId, setSignContractId] = useState<string | null>(null)



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



  const pendingSignContracts = useMemo(

    () => contracts.filter((c) => needsTenantSignature(c)),

    [contracts]

  )



  return (

    <div className="overflow-y-auto overflow-x-hidden bg-[#0b101a] p-6 text-slate-100 md:p-8">

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">

        <h2 className="text-2xl font-bold text-white">Hợp đồng & vị trí đã cấp</h2>

        {error && (
          <InlineAlert message={error} onDismiss={() => setError('')} />
        )}



        {!loading && pendingSignContracts.length > 0 && (

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">

            <p className="flex items-start gap-2 text-sm text-amber-100">

              <span className="material-symbols-outlined shrink-0 text-lg text-amber-400">

                draw

              </span>

              <span>

                Bạn có <strong>{pendingSignContracts.length}</strong> hợp đồng chờ ký (bước cuối

                của tenant). Ký xong hợp đồng mới{' '}

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

                  <th className="px-6 py-3" />

                </tr>

              </thead>

              <tbody className="divide-y divide-white/5">

                {contracts.map((c) => {

                  const ct = c.contractType as ContractTypeValue

                  const amount = parseContractAmount(c.estimatedTotalAmount)

                  const canSign = needsTenantSignature(c)

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

                        {contractSigningStepLabel(c)}

                      </td>

                      <td className="px-6 py-3 text-right">

                        {canSign ? (

                          <button

                            type="button"

                            onClick={() => setSignContractId(c.contractId)}

                            className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-cyan-400"

                          >

                            Ký hợp đồng

                          </button>

                        ) : (

                          <span className="text-xs text-slate-600">—</span>

                        )}

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


