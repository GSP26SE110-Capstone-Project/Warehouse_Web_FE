import React, { useEffect, useMemo, useState } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { SystemLogs } from '../../components/ui/SystemLogs'
import { ZoneUtilization } from '../../components/ui/ZoneUtilization'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { ApiError } from '../../api/client'
import * as contractsApi from '../../api/contracts'
import * as inboundApi from '../../api/inboundRequests'
import * as rentalRequestsApi from '../../api/rentalRequests'
import * as warehousesApi from '../../api/warehouses'
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
  const [logs, setLogs] = useState<
    Array<{ timestamp: string; level: 'INFO' | 'WARN' | 'SYS'; message: string }>
  >([])

  const gridCells: Array<'empty' | 'active' | 'stable' | 'alert'> = [
    'active', 'active', 'stable', 'active', 'alert', 'active',
    'active', 'stable', 'active', 'active', 'stable', 'active',
    'empty', 'empty', 'empty', 'empty',
  ]

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const contractParams = isWhAdmin && warehouseId ? { warehouseId, limit: 200 } : { limit: 200 }
        const rentalParams = isWhAdmin && warehouseId ? { warehouseId, limit: 200 } : { limit: 200 }
        const inboundParams = isWhAdmin && warehouseId ? { warehouseId, limit: 200 } : { limit: 200 }

        const [contractsRes, rentalRes, inboundRes, planningRes] = await Promise.all([
          contractsApi.listContracts(contractParams),
          rentalRequestsApi.listRentalRequests(rentalParams),
          inboundApi.listInboundRequests(inboundParams),
          isWhAdmin && warehouseId
            ? warehousesApi.getWarehouseZonePlanning(warehouseId).catch(() => null)
            : Promise.resolve(null),
        ])

        const activeContracts = contractsRes.items.filter((c) => c.status === 'ACTIVE').length
        const inboundOpen = inboundRes.items.filter((i) =>
          ['DRAFT', 'PENDING', 'APPROVED', 'ARRIVED', 'RECEIVING'].includes(i.status)
        ).length
        const util = planningRes?.usableAreaM2
          ? Math.round(((planningRes.usedZoneAreaM2 ?? 0) / planningRes.usableAreaM2) * 100)
          : 0

        if (!cancelled) {
          setKpis({
            rentalRequests: rentalRes.items.length,
            contractsActive: activeContracts,
            inboundOpen,
            zoneUtilizationPct: Math.max(0, Math.min(100, util)),
          })
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
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Không tải được dữ liệu dashboard')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isWhAdmin, warehouseId])

  const utilizationForCard = useMemo(
    () => `${kpis.zoneUtilizationPct}%`,
    [kpis.zoneUtilizationPct]
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
            <button className="px-4 py-2 rounded-lg glass-panel hover:bg-white/10 text-xs font-bold text-primary border border-primary/30 shadow-neon transition-all flex items-center gap-2">
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
              Dashboard cho Warehouse Admin lấy số liệu từ yêu cầu thuê, hợp đồng, nhập kho và quy hoạch zone
              hiện tại. Dùng để theo dõi tải kho và quyết định cấp chỗ nhanh hơn.
            </p>
            <div className="h-64 bg-black/20 rounded flex items-center justify-center text-slate-500">
              [Biểu đồ KPI theo ngày - đang triển khai]
            </div>
          </div>

          <ZoneUtilization capacity={kpis.zoneUtilizationPct || 0} gridCells={gridCells} />
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