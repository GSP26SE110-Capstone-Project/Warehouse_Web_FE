import React, { useState } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { SystemLogs } from '../../components/ui/SystemLogs'
import { ZoneUtilization } from '../../components/ui/ZoneUtilization'

export const Dashboard: React.FC = () => {
  const [logs] = useState([
    {
      timestamp: '10:42:05',
      level: 'INFO' as const,
      message: 'AI Optimization complete. Route 4B updated. Efficiency gain: 12%.',
    },
    {
      timestamp: '10:41:55',
      level: 'SYS' as const,
      message: 'Drone Fleet #7 returning to charging station. Battery at 15%.',
    },
    {
      timestamp: '10:41:12',
      level: 'WARN' as const,
      message: 'Zone C temperature variance detected (+2°C). Alerting facility manager.',
    },
  ])

  const gridCells: Array<'empty' | 'active' | 'stable' | 'alert'> = [
    'active', 'active', 'stable', 'active', 'alert', 'active',
    'active', 'stable', 'active', 'active', 'stable', 'active',
    'empty', 'empty', 'empty', 'empty',
  ]

  return (
    <div className="overflow-y-auto overflow-x-hidden p-6 md:p-8 bg-[#0b101a]">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        
        {/* Page Title */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-2xl font-bold text-white glow-text mb-1">
              Tổng quan kho hàng
            </h2>
            <p className="text-slate-400 text-sm">
              Cập nhật mới nhất: 10 phút trước
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
            title="Tổng hàng trong kho"
            value={14205}
            unit="units"
            icon="inventory_2"
            accentColor="primary"
            trend={{ direction: 'up', percentage: 2.5, text: 'vs last week' }}
          />
          <StatsCard
            title="Đơn hàng đang vận chuyển"
            value={42}
            unit="active"
            icon="local_shipping"
            accentColor="primary"
            trend={{ direction: 'up', percentage: 0, text: '12 arriving today' }}
          />
          <StatsCard
            title="Hàng tồn kho"
            value="98.4%"
            icon="memory"
            accentColor="primary"
            trend={{ direction: 'up', percentage: 0.8, text: 'optimization' }}
          />
          <StatsCard
            title="Hợp đồng sắp hết hạn"
            value={3}
            unit="critical"
            icon="warning"
            accentColor="orange"
            trend={{ direction: 'down', percentage: 0, text: 'Action required' }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">ssid_chart</span>
              Gợi ý bố cục kho & dự báo nhu cầu
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Biểu đồ này hiển thị bố cục kho được đề xuất dựa trên phân tích AI về dữ liệu kho, đơn hàng và xu hướng vận chuyển. 
              Các khu vực màu sắc khác nhau đại diện cho các mức độ sử dụng và hiệu suất khác nhau, giúp bạn nhanh chóng xác định các khu vực cần tối ưu hóa hoặc chú ý đặc biệt.
            </p>
            <div className="h-64 bg-black/20 rounded flex items-center justify-center text-slate-500">
              [Chart Component]
            </div>
          </div>

          <ZoneUtilization capacity={85} gridCells={gridCells} />
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