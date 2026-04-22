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
    
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard title="Tổng hàng hóa" value={10} icon="inventory_2" accentColor="emerald" />
          {/* <StatsCard title="đang vận chuyển" value={42} icon="local_shipping" accentColor="primary" /> */}
          <StatsCard title="Tổng hợp đồng" value="10" icon="memory" accentColor="orange" />
          <StatsCard title="HĐ sắp hết hạn" value={3} icon="warning" accentColor="purple" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
          <div className="lg:col-span-2 flex flex-col gap-4">
  {/* Thẻ AI Chat Box chính */}
  <div className="flex-1 glass-panel p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col min-h-[400px]">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="material-symbols-outlined text-cyan-400">smart_toy</span>
        AI Logistic Assistant
      </h3>
      <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20 uppercase font-bold tracking-wider">
        Phân tích thời gian thực
      </span>
    </div>

    {/* Khu vực nội dung Chat/Insights */}
    <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar pr-2">
      {/* Tin nhắn từ AI về gợi ý bố cục */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-cyan-400 text-sm">auto_awesome</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none">
          <p className="text-sm text-slate-300 leading-relaxed">
            Dựa trên dữ liệu ** hàng hóa, tôi gợi ý tối ưu lại **Zone B**. 
            Tần suất lấy hàng tại đây tăng 25% trong 24h qua. Bạn có muốn xem sơ đồ luồng đi mới không?
          </p>
          <div className="mt-3 flex gap-2">
            <button className="text-[10px] bg-cyan-500 text-black font-bold px-3 py-1.5 rounded-lg hover:bg-cyan-400 transition-all">
              Xem sơ đồ gợi ý
            </button>
            <button className="text-[10px] bg-white/10 text-white px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all">
              Bỏ qua
            </button>
          </div>
        </div>
      </div>

      {/* Tin nhắn từ User (Ví dụ) */}
      <div className="flex gap-3 justify-end">
        <div className="bg-cyan-600/20 border border-cyan-500/30 p-3 rounded-2xl rounded-tr-none">
          <p className="text-sm text-cyan-50">Tại sao hiệu suất kho quận 7 lại giảm?</p>
        </div>
      </div>
    </div>

    {/* Thanh Input Chat */}
    <div className="relative mt-auto">
      <input 
        type="text" 
        placeholder="Hỏi AI về bố cục, dự báo hoặc điều hành..."
        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
      />
      <button className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 p-1">
        <span className="material-symbols-outlined">send</span>
      </button>
    </div>
  </div>

  {/* Thẻ gợi ý nhanh dưới Chat (Quick Suggestions) */}
  <div className="grid grid-cols-3 gap-3">
    {[
      { label: 'Dự báo tuần tới', icon: 'online_prediction' },
      { label: 'Tối ưu Zone B', icon: 'grid_view' },
      { label: 'Báo cáo hàng tồn', icon: 'description' }
    ].map((item, i) => (
      <button key={i} className="glass-panel p-3 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all flex items-center gap-2 group text-left">
        <span className="material-symbols-outlined text-sm text-slate-500 group-hover:text-cyan-400 transition-colors">{item.icon}</span>
        <span className="text-[10px] text-slate-400 group-hover:text-white font-medium">{item.label}</span>
      </button>
    ))}
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