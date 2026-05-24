import React, { useState, useEffect } from 'react'
import { StatsCard } from '../../components/ui/StatCard'
import { SystemLogs } from '../../components/ui/SystemLogs'
import { ZoneUtilization } from '../../components/ui/ZoneUtilization'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { warehouseApi } from '../../service/warehouseApi'
import type { WarehouseResponse, ZoneResponse } from '../../types/Warehouse'

interface DashboardStats {
  totalZones: number
  activeZones: number
  capacityUsage: number
  totalItems: number
}

interface SystemLog {
  timestamp: string
  level: 'INFO' | 'WARN' | 'SYS' | 'ERROR'
  message: string
}

export const AdminWarehouseDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalZones: 0,
    activeZones: 0,
    capacityUsage: 0,
    totalItems: 0,
  })

  const [zones, setZones] = useState<ZoneResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')

  const [logs] = useState<SystemLog[]>([
    {
      timestamp: '14:30:25',
      level: 'INFO',
      message: 'Quét hàng hoàn tất Zone A. Tổng 245 sản phẩm.',
    },
    {
      timestamp: '14:25:10',
      level: 'WARN',
      message: 'Zone C gần đạt giới hạn dung lượng (95%). Cần kiểm tra trong 2 giờ.',
    },
    {
      timestamp: '14:20:55',
      level: 'INFO',
      message: 'Xác nhận nhập kho từ NCC A. Cập nhật hệ thống hoàn tất.',
    },
    {
      timestamp: '14:15:30',
      level: 'SYS',
      message: 'Sao lưu dữ liệu kho thành công. Thời gian: 2 phút 15 giây.',
    },
    {
      timestamp: '14:10:12',
      level: 'WARN',
      message: 'Phát hiện lỗi cân nặng ở quầy K5. Tạm dừng hoạt động.',
    },
  ])

  const gridCells: Array<'empty' | 'active' | 'stable' | 'alert'> = [
    'active', 'active', 'stable', 'active',
    'alert', 'active', 'active', 'stable',
    'active', 'active', 'stable', 'active',
    'empty', 'empty', 'empty', 'empty',
  ]

  // Fetch warehouse data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch warehouse data
        // const warehouseRes = await warehouseApi.getAll()
        // For now, we'll use mock data since we need to know the warehouseId
        
        // Simulate fetching warehouse zones
        // const zonesRes = await warehouseApi.getZones(warehouseId)
        
        // Set mock stats
        setStats({
          totalZones: 8,
          activeZones: 7,
          capacityUsage: 72,
          totalItems: 3450,
        })

        setZones([
          {
            zoneId: '1',
            warehouseId: 'wh-001',
            zoneCode: 'Z-A',
            zoneName: 'Zone A - Hàng nhanh',
            zoneType: 'FAST_MOVING',
            areaM2: 500,
            isDedicated: false,
            status: 'ACTIVE',
            createdAt: '2024-01-01',
            updatedAt: '2024-05-24',
          },
          {
            zoneId: '2',
            warehouseId: 'wh-001',
            zoneCode: 'Z-B',
            zoneName: 'Zone B - Hàng hóa chung',
            zoneType: 'SHARED',
            areaM2: 800,
            isDedicated: false,
            status: 'ACTIVE',
            createdAt: '2024-01-01',
            updatedAt: '2024-05-24',
          },
          {
            zoneId: '3',
            warehouseId: 'wh-001',
            zoneCode: 'Z-C',
            zoneName: 'Zone C - Hàng hóa nguyên khối',
            zoneType: 'BULK',
            areaM2: 1200,
            isDedicated: false,
            status: 'ACTIVE',
            createdAt: '2024-01-01',
            updatedAt: '2024-05-24',
          },
        ])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      // Handle AI chat message
      console.log('Message sent:', chatInput)
      setChatInput('')
    }
  }

  if (loading) {
    // return <LoadingOverlay />
  }

  return (
    <div className="overflow-y-auto overflow-x-hidden p-6 md:p-8 bg-[#0b101a]">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Bảng điều khiển kho</h1>
            <p className="text-slate-400">Quản lý và giám sát hoạt động kho hàng</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            title="Tổng Zone" 
            value={stats.totalZones} 
            icon="grid_view" 
            accentColor="primary"
            trend={{
              direction: 'up',
              percentage: 5,
              text: 'so với tuần trước',
            }}
          />
          <StatsCard 
            title="Zone Hoạt động" 
            value={stats.activeZones} 
            icon="check_circle" 
            accentColor="emerald"
            trend={{
              direction: 'up',
              percentage: 2,
              text: 'hoạt động bình thường',
            }}
          />
          <StatsCard 
            title="Dung lượng" 
            value={`${stats.capacityUsage}%`}
            icon="storage" 
            accentColor="orange"
            trend={{
              direction: 'up',
              percentage: 8,
              text: 'tăng trong 24h',
            }}
          />
          <StatsCard 
            title="Tổng Sản phẩm" 
            value={stats.totalItems} 
            icon="inventory_2" 
            accentColor="purple"
            trend={{
              direction: 'up',
              percentage: 12,
              text: 'tăng trong tháng',
            }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Zone Utilization */}
            <div className="glass-panel p-6 rounded-2xl bg-white/[0.03] border border-white/10">
              <ZoneUtilization capacity={stats.capacityUsage} gridCells={gridCells} />
            </div>

            {/* AI Assistant Chat */}
            <div className="flex-1 glass-panel p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400">smart_toy</span>
                  Trợ lý Kho thông minh
                </h3>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20 uppercase font-bold tracking-wider">
                  Phân tích thời gian thực
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar pr-2 min-h-[200px]">
                {/* AI Message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-cyan-400 text-sm">auto_awesome</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none max-w-md">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Hiệu suất kho hôm nay đạt 92%. Zone A và Zone B duy trì tốc độ cao. Khuyến nghị: kiểm tra Zone C vì gần đạt giới hạn dung lượng.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button className="text-[10px] bg-cyan-500 text-black font-bold px-3 py-1.5 rounded-lg hover:bg-cyan-400 transition-all">
                        Xem chi tiết
                      </button>
                      <button className="text-[10px] bg-white/10 text-white px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all">
                        Bỏ qua
                      </button>
                    </div>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex gap-3 justify-end">
                  <div className="bg-cyan-600/20 border border-cyan-500/30 p-3 rounded-2xl rounded-tr-none max-w-md">
                    <p className="text-sm text-cyan-50">Zone nào đang được sử dụng nhiều nhất?</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-cyan-400 text-sm">auto_awesome</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none max-w-md">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Zone A (Hàng nhanh) đang sử dụng cao nhất với 85% dung lượng. Theo xu hướng, dự báo sẽ đầy trong 3-4 ngày nếu không có sự điều chỉnh.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="relative mt-auto">
                <input 
                  type="text" 
                  placeholder="Hỏi AI về kho, zone, hoặc các gợi ý..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 p-1 transition-colors"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>

          {/* System Logs - Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 rounded-2xl bg-white/[0.03] border border-white/10 h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-400">history</span>
                  Hoạt động gần đây
                </h3>
              </div>
              {/* <SystemLogs logs={logs} /> */}
            </div>
          </div>
        </div>

        {/* Zone Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">layers</span>
              Thông tin Zone
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {zones.map((zone) => (
                <div key={zone.zoneId} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-white">{zone.zoneName}</p>
                      <p className="text-sm text-slate-400">{zone.zoneCode}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      zone.status === 'ACTIVE' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {zone.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Loại: <span className="text-white">{zone.zoneType}</span></span>
                    <span>Diện tích: <span className="text-white">{zone.areaM2} m²</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">insights</span>
              Thống kê & Hiệu suất
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-slate-400">Sử dụng dung lượng</p>
                  <p className="text-lg font-bold text-white">{stats.capacityUsage}%</p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary to-cyan-300 h-2 rounded-full"
                    style={{ width: `${stats.capacityUsage}%` }}
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-400">Tỷ lệ hiệu suất</p>
                    <p className="text-white font-bold">94%</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-400">Thời gian xử lý trung bình</p>
                    <p className="text-white font-bold">2m 15s</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-400">Tổng giao dịch hôm nay</p>
                    <p className="text-white font-bold">142</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-400">Lỗi phát hiện</p>
                    <p className="text-red-400 font-bold">2</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button className="w-full bg-gradient-to-r from-primary to-cyan-400 text-black font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">
                  Xem báo cáo chi tiết
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
