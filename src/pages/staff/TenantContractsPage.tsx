import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/client'
import * as contractsApi from '../../api/contracts'
import * as storageReservationsApi from '../../api/storageReservations'
import * as warehousesApi from '../../api/warehouses'
import { useAuth } from '../../auth/AuthContext'
import { CONTRACT_TYPE_LABELS, type ContractTypeValue } from '../../data/contractTypes'

export function TenantContractsPage() {
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contracts, setContracts] = useState<Awaited<
    ReturnType<typeof contractsApi.listContracts>
  >['items']>([])
  const [reservations, setReservations] = useState<Awaited<
    ReturnType<typeof storageReservationsApi.listStorageReservations>
  >['items']>([])
  const [warehouseNames, setWarehouseNames] = useState<Map<string, string>>(new Map())

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

  const contractById = useMemo(
    () => new Map(contracts.map((c) => [c.contractId, c])),
    [contracts]
  )

  return (
    <div className="overflow-y-auto overflow-x-hidden bg-[#0b101a] p-6 text-slate-100 md:p-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <h2 className="text-2xl font-bold text-white">Hợp đồng & vị trí đã cấp</h2>
        {error && (
          <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
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
                  <th className="px-6 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {contracts.map((c) => {
                  const ct = c.contractType as ContractTypeValue
                  return (
                    <tr key={c.contractId}>
                      <td className="px-6 py-3 font-mono text-cyan-300">{c.contractCode}</td>
                      <td className="px-6 py-3">{CONTRACT_TYPE_LABELS[ct] ?? c.contractType}</td>
                      <td className="px-6 py-3">
                        {warehouseNames.get(c.warehouseId) ?? c.warehouseId}
                      </td>
                      <td className="px-6 py-3">
                        {c.startDate} → {c.endDate}
                      </td>
                      <td className="px-6 py-3">{c.status}</td>
                    </tr>
                  )
                })}
                {!loading && contracts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-slate-500">
                      Chưa có hợp đồng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass-panel overflow-hidden rounded-xl border border-white/5">
          <div className="border-b border-white/5 px-6 py-4 text-sm font-semibold text-cyan-300">
            Vị trí đã được cấp (warehouse / zone / rack / level / bin)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#131b29] text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-3">HĐ</th>
                  <th className="px-6 py-3">Kho</th>
                  <th className="px-6 py-3">Zone</th>
                  <th className="px-6 py-3">Rack</th>
                  <th className="px-6 py-3">Tầng</th>
                  <th className="px-6 py-3">Bin</th>
                  <th className="px-6 py-3">Dung lượng giữ</th>
                  <th className="px-6 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reservations.map((r) => (
                  <tr key={r.reservationId}>
                    <td className="px-6 py-3 font-mono text-cyan-300">
                      {contractById.get(r.contractId)?.contractCode ?? r.contractId}
                    </td>
                    <td className="px-6 py-3">{r.warehouseName ?? r.warehouseCode ?? '—'}</td>
                    <td className="px-6 py-3">{r.zoneCode ?? r.zoneName ?? '—'}</td>
                    <td className="px-6 py-3">{r.rackCode ?? '—'}</td>
                    <td className="px-6 py-3">
                      {r.levelNumber != null ? `Tầng ${r.levelNumber}` : '—'}
                    </td>
                    <td className="px-6 py-3">{r.binCode ?? '—'}</td>
                    <td className="px-6 py-3">{r.reservedCapacity ?? '—'}</td>
                    <td className="px-6 py-3">{r.status}</td>
                  </tr>
                ))}
                {!loading && reservations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-slate-500">
                      Chưa có phân bổ kho nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

