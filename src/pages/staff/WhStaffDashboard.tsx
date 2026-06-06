import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatsCard } from '../../components/ui/StatCard'
import { SystemLogs } from '../../components/ui/SystemLogs'
import { ZoneUtilization, computeZoneLayoutUtil } from '../../components/ui/ZoneUtilization'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { BarcodeScanPanel } from '../../components/warehouse/BarcodeScanPanel'
import { ApiError } from '../../api/client'
import * as inboundApi from '../../api/inboundRequests'
import * as outboundApi from '../../api/outboundRequests'
import * as staffNotificationsApi from '../../api/staffNotifications'
import * as inventoriesApi from '../../api/inventories'
import * as warehousesApi from '../../api/warehouses'
import * as zonesApi from '../../api/zones'
import type { ApiInboundRequest } from '../../api/inboundRequests'
import type { ApiOutboundRequest } from '../../api/outboundRequests'
import type { ApiZone } from '../../api/zones'
import { InboundStatusBadge } from '../../components/inbound/InboundStatusBadge'
import { OutboundStatusBadge } from '../../components/outbound/OutboundStatusBadge'
import { useAuth } from '../../auth/AuthContext'
import { formatDate } from '../../mappers'

const QUICK_ACTIONS = [
  {
    href: '/staff/inbound-ops',
    icon: 'input',
    label: 'Nhập kho',
    desc: 'Nhận hàng, batch & LPN',
    color: 'border-cyan-500/30 hover:bg-cyan-500/10',
  },
  {
    href: '/staff/ai-putaway',
    icon: 'psychology',
    label: 'AI Putaway',
    desc: 'Gợi ý bin & cất hàng',
    color: 'border-violet-500/30 hover:bg-violet-500/10',
  },
  {
    href: '/staff/outbound-ops',
    icon: 'outbound',
    label: 'Xuất kho',
    desc: 'Pick được gán cho bạn',
    color: 'border-orange-500/30 hover:bg-orange-500/10',
  },
  {
    href: '/staff/inventory-ops',
    icon: 'inventory_2',
    label: 'Tồn kho',
    desc: 'SKU · batch · LPN · bin',
    color: 'border-emerald-500/30 hover:bg-emerald-500/10',
  },
] as const

export function WhStaffDashboard() {
  const { user } = useAuth()
  const warehouseId = user?.warehouseId ?? undefined

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [warehouseName, setWarehouseName] = useState('')
  const [inbounds, setInbounds] = useState<ApiInboundRequest[]>([])
  const [outbounds, setOutbounds] = useState<ApiOutboundRequest[]>([])
  const [inventoryTotal, setInventoryTotal] = useState(0)
  const [zoneItems, setZoneItems] = useState<ApiZone[]>([])
  const [zonePlanning, setZonePlanning] = useState<
    Awaited<ReturnType<typeof warehousesApi.getWarehouseZonePlanning>> | null
  >(null)
  const [pickAlerts, setPickAlerts] = useState<
    Awaited<ReturnType<typeof staffNotificationsApi.getWhStaffAssignedPickAlerts>> | null
  >(null)

  const load = useCallback(async () => {
    if (!warehouseId) {
      setLoading(false)
      setError('Tài khoản chưa gắn kho — liên hệ WH Admin.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const [wh, inboundRes, outboundRes, pickAlertRes, invRes, planning, zonesRes] =
        await Promise.all([
        warehousesApi.getWarehouse(warehouseId).catch(() => null),
        inboundApi.listInboundRequests({ warehouseId, limit: 200 }),
        outboundApi.listOutboundRequests({
          warehouseId,
          assignedPickerMe: true,
          limit: 200,
        }),
        staffNotificationsApi.getWhStaffAssignedPickAlerts().catch(() => null),
        inventoriesApi.listInventories({ warehouseId, limit: 1 }),
        warehousesApi.getWarehouseZonePlanning(warehouseId).catch(() => null),
        zonesApi.listZones({ warehouseId, limit: 50 }).catch(() => ({ items: [] as ApiZone[] })),
      ])

      setWarehouseName(wh?.warehouseName ?? wh?.warehouseCode ?? 'Kho')
      setInbounds(inboundRes.items)
      setOutbounds(outboundRes.items)
      setPickAlerts(pickAlertRes)
      setInventoryTotal(invRes.meta.total)
      setZonePlanning(planning)
      setZoneItems(zonesRes.items)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được dữ liệu vận hành')
    } finally {
      setLoading(false)
    }
  }, [warehouseId])

  useEffect(() => {
    void load()
  }, [load])

  const kpis = useMemo(() => {
    const arrived = inbounds.filter((i) => i.status === 'ARRIVED').length
    const receiving = inbounds.filter((i) => i.status === 'RECEIVING').length
    const outboundActive = outbounds.filter((i) =>
      ['RESERVED', 'PICKING'].includes(i.status)
    ).length
    const util = zonePlanning?.usableAreaM2
      ? Math.round(
          ((zonePlanning.usedZoneAreaM2 ?? 0) / zonePlanning.usableAreaM2) * 100
        )
      : 0
    return { arrived, receiving, outboundActive, util }
  }, [inbounds, outbounds, zonePlanning])

  const workQueueInbound = useMemo(
    () =>
      inbounds
        .filter((i) => ['ARRIVED', 'RECEIVING', 'APPROVED'].includes(i.status))
        .slice(0, 6),
    [inbounds]
  )

  const workQueueOutbound = useMemo(
    () =>
      outbounds
        .filter((i) => ['RESERVED', 'PICKING'].includes(i.status))
        .slice(0, 6),
    [outbounds]
  )

  const zoneUtilRows = useMemo(
    () =>
      [...zoneItems]
        .sort((a, b) => a.zoneCode.localeCompare(b.zoneCode))
        .map((z) => ({
          zoneId: z.zoneId,
          zoneCode: z.zoneCode,
          zoneName: z.zoneName,
          zoneType: z.zoneType,
          areaM2: z.areaM2,
          status: z.status,
          rackCount: z.rackCount,
          maxRacks: z.maxRacks,
          utilPct: computeZoneLayoutUtil(z),
        })),
    [zoneItems]
  )

  const logs = useMemo(
    () => [
      {
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        level: (kpis.arrived > 0 ? 'WARN' : 'INFO') as 'INFO' | 'WARN' | 'SYS',
        message:
          kpis.arrived > 0
            ? `${kpis.arrived} phiếu nhập đã đến kho — cần bắt đầu receiving.`
            : 'Không có phiếu nhập chờ receiving.',
      },
      {
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        level: (kpis.receiving > 0 ? 'INFO' : 'SYS') as 'INFO' | 'WARN' | 'SYS',
        message: `${kpis.receiving} phiếu đang nhận hàng (RECEIVING).`,
      },
      {
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        level: (kpis.outboundActive > 5 ? 'WARN' : 'INFO') as 'INFO' | 'WARN' | 'SYS',
        message: `${kpis.outboundActive} phiếu pick được gán (chờ pick / đang pick).`,
      },
    ],
    [kpis.arrived, kpis.receiving, kpis.outboundActive]
  )

  return (
    <div className="overflow-y-auto overflow-x-hidden bg-[#0b101a] p-6 md:p-8">
      <LoadingOverlay show={loading} text="Đang tải bảng điều khiển..." />
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        {error && <InlineAlert message={error} onDismiss={() => setError('')} />}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="glow-text mb-1 text-2xl font-bold text-white">Vận hành kho</h2>
            <p className="text-sm text-slate-400">
              {warehouseName} · receiving, putaway, picking theo API WH_STAFF
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-xs font-bold text-primary shadow-neon transition-all hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Cập nhật
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BarcodeScanPanel warehouseId={warehouseId} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className={`flex flex-col rounded-xl border bg-white/[0.02] p-4 transition-colors ${action.color}`}
              >
                <span className="material-symbols-outlined text-2xl text-white">{action.icon}</span>
                <span className="mt-2 text-sm font-semibold text-white">{action.label}</span>
                <span className="mt-0.5 text-xs text-slate-500">{action.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Chờ nhận (ARRIVED)"
            value={kpis.arrived}
            icon="local_shipping"
            accentColor="primary"
          />
          <StatsCard
            title="Đang receiving"
            value={kpis.receiving}
            icon="input"
            accentColor="orange"
          />
          <StatsCard
            title="Pick được gán"
            value={pickAlerts?.assignedCount ?? kpis.outboundActive}
            icon="outbound"
            accentColor="emerald"
          />
          <StatsCard
            title="Dòng tồn kho"
            value={inventoryTotal}
            icon="inventory_2"
            accentColor="purple"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="glass-panel rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <span className="material-symbols-outlined text-cyan-400">input</span>
                Hàng đang chờ xử lý
              </h3>
              <Link to="/staff/inbound-ops" className="text-xs text-cyan-400 hover:underline">
                Xem tất cả
              </Link>
            </div>
            {workQueueInbound.length === 0 ? (
              <p className="text-sm text-slate-500">Không có phiếu nhập cần thao tác.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {workQueueInbound.map((row) => (
                  <li key={row.inboundRequestId}>
                    <Link
                      to={`/staff/inbound-ops/${row.inboundRequestId}`}
                      className="flex items-center justify-between gap-3 py-3 hover:bg-white/[0.02]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm text-cyan-300">{row.inboundCode}</p>
                        <p className="text-xs text-slate-500">
                          Dự kiến: {formatDate(row.expectedArrivalDate)}
                        </p>
                      </div>
                      <InboundStatusBadge status={row.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <span className="material-symbols-outlined text-orange-400">outbound</span>
                Phiếu pick được gán
              </h3>
              {pickAlerts && pickAlerts.pickingCount > 0 && (
                <span className="text-xs text-cyan-300">{pickAlerts.pickingCount} đang pick</span>
              )}
              <Link to="/staff/outbound-ops" className="text-xs text-orange-400 hover:underline">
                Xem tất cả
              </Link>
            </div>
            {workQueueOutbound.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có phiếu pick được gán.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {workQueueOutbound.map((row) => (
                  <li key={row.outboundRequestId}>
                    <Link
                      to={`/staff/outbound-ops/${row.outboundRequestId}`}
                      className="flex items-center justify-between gap-3 py-3 hover:bg-white/[0.02]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm text-orange-300">
                          {row.outboundCode}
                        </p>
                        <p className="text-xs text-slate-500">
                          Xuất dự kiến: {formatDate(row.requestedShipDate)}
                        </p>
                      </div>
                      <OutboundStatusBadge status={row.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SystemLogs logs={logs} />
          </div>
          <ZoneUtilization
            capacityPct={kpis.util}
            zones={zoneUtilRows}
            usedAreaM2={zonePlanning?.usedZoneAreaM2}
            usableAreaM2={zonePlanning?.usableAreaM2}
            remainingAreaM2={zonePlanning?.remainingZoneAreaM2}
          />
        </div>
      </div>
    </div>
  )
}
