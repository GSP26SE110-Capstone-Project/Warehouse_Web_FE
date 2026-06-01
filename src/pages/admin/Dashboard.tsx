import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { SystemLogs } from '../../components/ui/SystemLogs'
import { ZoneUtilization, computeZoneLayoutUtil } from '../../components/ui/ZoneUtilization'
import { WarehouseOpsChart } from '../../components/dashboard/WarehouseOpsChart'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { ApiError } from '../../api/client'
import * as contractsApi from '../../api/contracts'
import * as inboundApi from '../../api/inboundRequests'
import * as rentalRequestsApi from '../../api/rentalRequests'
import * as warehousesApi from '../../api/warehouses'
import * as zonesApi from '../../api/zones'
import type { ApiZone } from '../../api/zones'
import { useAuth } from '../../auth/AuthContext'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const warehouseId = user?.warehouseId ?? undefined
  const isWhAdmin = user?.role === 'WH_ADMIN'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [kpis, setKpis] = useState({
    rentalRequests: 0,
    contractsActive: 0,
    inboundOpen: 0,
    zoneUtilizationPct: 0,
  })
  const [zoneItems, setZoneItems] = useState<ApiZone[]>([])
  const [zonePlanning, setZonePlanning] = useState<
    Awaited<ReturnType<typeof warehousesApi.getWarehouseZonePlanning>> | null
  >(null)
  const [chartRentals, setChartRentals] = useState<Array<{ createdAt?: string | null }>>([])
  const [chartInbounds, setChartInbounds] = useState<Array<{ createdAt?: string | null }>>([])
  const [chartContracts, setChartContracts] = useState<Array<{ createdAt?: string | null }>>([])
  const [logs, setLogs] = useState<
    Array<{ timestamp: string; level: 'INFO' | 'WARN' | 'SYS'; message: string }>
  >([])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const contractParams = isWhAdmin && warehouseId ? { warehouseId, limit: 200 } : { limit: 200 }
      const inboundParams = isWhAdmin && warehouseId ? { warehouseId, limit: 200 } : { limit: 200 }

      let rentalItems: Awaited<ReturnType<typeof rentalRequestsApi.listRentalRequests>>['items']
      if (isWhAdmin && warehouseId) {
        const [inbox, mine] = await Promise.all([
          rentalRequestsApi.listRentalRequests({
            warehouseId,
            regionMatch: true,
            limit: 100,
          }),
          rentalRequestsApi.listRentalRequests({ warehouseId, limit: 100 }),
        ])
        const byId = new Map<string, (typeof inbox.items)[0]>()
        for (const r of [...inbox.items, ...mine.items]) {
          byId.set(r.rentalRequestId, r)
        }
        rentalItems = [...byId.values()]
      } else {
        const res = await rentalRequestsApi.listRentalRequests({ limit: 200 })
        rentalItems = res.items
      }

      const [contractsRes, inboundRes, planningRes, zonesRes] = await Promise.all([
        contractsApi.listContracts(contractParams),
        inboundApi.listInboundRequests(inboundParams),
        isWhAdmin && warehouseId
          ? warehousesApi.getWarehouseZonePlanning(warehouseId).catch(() => null)
          : Promise.resolve(null),
        isWhAdmin && warehouseId
          ? zonesApi.listZones({ warehouseId, limit: 50 }).catch(() => ({ items: [] as ApiZone[] }))
          : Promise.resolve({ items: [] as ApiZone[] }),
      ])

      const activeContracts = contractsRes.items.filter((c) => c.status === 'ACTIVE').length
      const inboundOpen = inboundRes.items.filter((i) =>
        ['DRAFT', 'PENDING', 'APPROVED', 'ARRIVED', 'RECEIVING'].includes(i.status)
      ).length
      const util = planningRes?.usableAreaM2
        ? Math.round(((planningRes.usedZoneAreaM2 ?? 0) / planningRes.usableAreaM2) * 100)
        : 0

      setKpis({
        rentalRequests: rentalItems.length,
        contractsActive: activeContracts,
        inboundOpen,
        zoneUtilizationPct: Math.max(0, Math.min(100, util)),
      })
      setZonePlanning(planningRes)
      setZoneItems(zonesRes.items)
      setChartRentals(rentalItems)
      setChartInbounds(inboundRes.items)
      setChartContracts(contractsRes.items)
      setLogs([
        {
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          level: 'INFO',
          message: `Đang có ${activeContracts} hợp đồng ACTIVE.`,
        },
        {
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          level: inboundOpen > 20 ? 'WARN' : 'SYS',
          message: `${inboundOpen} phiếu nhập đang mở xử lý.`,
        },
        {
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          level: util >= 85 ? 'WARN' : 'INFO',
          message:
            util > 0
              ? `Mức sử dụng zone hiện tại: ${util}%.`
              : 'Chưa có dữ liệu quy hoạch zone/usableArea.',
        },
      ])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }, [isWhAdmin, warehouseId])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const utilizationForCard = useMemo(
    () => `${kpis.zoneUtilizationPct}%`,
    [kpis.zoneUtilizationPct]
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

  return (
    <div className="overflow-y-auto overflow-x-hidden p-6 md:p-8 bg-[#0b101a]">
      <LoadingOverlay show={loading} text="Đang tải dashboard..." />
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        {error && (
          <InlineAlert message={error} onDismiss={() => setError('')} />
        )}
        
        {/* Page Title */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-2xl font-bold text-white glow-text mb-1">
              Tổng quan kho hàng
            </h2>
            <p className="text-slate-400 text-sm">
              Dữ liệu theo thời gian thực từ hệ thống
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="px-4 py-2 rounded-lg glass-panel hover:bg-white/10 text-xs font-bold text-primary border border-primary/30 shadow-neon transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Cập nhật dữ liệu
            </button>
            <button className="px-4 py-2 rounded-lg glass-panel hover:bg-white/10 text-xs font-bold text-white transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">download</span>
              Báo cáo
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Yêu cầu thuê"
            value={kpis.rentalRequests}
            icon="inventory_2"
            accentColor="emerald"
          />
          <StatsCard
            title="Phiếu nhập đang mở"
            value={kpis.inboundOpen}
            icon="input"
            accentColor="primary"
          />
          <StatsCard
            title="Hợp đồng ACTIVE"
            value={kpis.contractsActive}
            icon="description"
            accentColor="orange"
          />
          <StatsCard
            title="Mức dùng zone"
            value={utilizationForCard}
            icon="grid_view"
            accentColor="purple"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">ssid_chart</span>
              Tình trạng vận hành kho
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Xu hướng 7–14 ngày: yêu cầu thuê mới, phiếu nhập và hợp đồng được tạo — giúp thấy tải
              vận hành theo thời gian.
            </p>
            <WarehouseOpsChart
              rentalRequests={chartRentals}
              inboundRequests={chartInbounds}
              contracts={chartContracts}
            />
          </div>

          <ZoneUtilization
            capacityPct={kpis.zoneUtilizationPct}
            zones={zoneUtilRows}
            usedAreaM2={zonePlanning?.usedZoneAreaM2}
            usableAreaM2={zonePlanning?.usableAreaM2}
            remainingAreaM2={zonePlanning?.remainingZoneAreaM2}
          />
        </div>

        {/* System Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <SystemLogs logs={logs} />
          </div>
        </div>
      </div>
    </div>
  )
}