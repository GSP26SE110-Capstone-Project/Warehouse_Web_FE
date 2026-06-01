import React, { useState } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { SystemLogs } from '../../components/ui/SystemLogs'
import { ZoneUtilization } from '../../components/ui/ZoneUtilization'

export const StaffDashboard: React.FC = () => {
  const [logs] = useState([
    {
      timestamp: '10:42:05',
      level: 'INFO' as const,
      message: 'Đã nhập kho lô hàng SKU-1023 (120 sản phẩm).',
    },
    {
      timestamp: '10:41:55',
      level: 'SYS' as const,
      message: 'Xuất kho đơn hàng #ORD-8891 thành công.',
    },
    {
      timestamp: '10:41:12',
      level: 'WARN' as const,
      message: 'Kệ B2 sắp đầy (90% công suất).',
    },
  ])

  const demoZones = [
    { zoneId: '1', zoneCode: 'Z-A01', zoneName: 'Zone A1', zoneType: 'SHARED', areaM2: 100, rackCount: 18, maxRacks: 23, utilPct: 78 },
    { zoneId: '2', zoneCode: 'Z-A02', zoneName: 'Zone A2', zoneType: 'SHARED', areaM2: 100, rackCount: 23, maxRacks: 23, utilPct: 100 },
    { zoneId: '3', zoneCode: 'Z-B01', zoneName: 'Khu riêng', zoneType: 'PRIVATE', areaM2: 150, rackCount: 8, maxRacks: 35, utilPct: 23 },
  ]

  return (
    <div className="overflow-y-auto overflow-x-hidden p-6 md:p-8 bg-[#0b101a]">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Tổng sản phẩm" value={14205} icon="inventory_2" accentColor="emerald" />
          <StatsCard title="Đơn đang xử lý" value={42} icon="local_shipping" accentColor="primary" />
          <StatsCard title="Kệ đang sử dụng" value="85%" icon="warehouse" accentColor="orange" />
          <StatsCard title="Sắp hết hàng" value={12} icon="warning" accentColor="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              Thống kê nhập / xuất kho
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Biểu đồ thể hiện số lượng hàng hóa nhập và xuất trong ngày.
            </p>
            <div className="h-64 bg-black/20 rounded flex items-center justify-center text-slate-500">
              [Chart nhập/xuất kho]
            </div>
          </div>

          <ZoneUtilization
            capacityPct={89}
            zones={demoZones}
            usedAreaM2={350}
            usableAreaM2={450}
            remainingAreaM2={100}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <SystemLogs logs={logs} />
          </div>
        </div>
      </div>
    </div>
  )
}
