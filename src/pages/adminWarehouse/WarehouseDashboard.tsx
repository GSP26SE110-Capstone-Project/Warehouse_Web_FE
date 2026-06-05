import React, { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'

// Import các trang quản lý thành phần của bạn
import { SingleWarehouseDetail } from '../adminWarehouse/InformationWarehouse'
import { ZoneManagement } from '../admin/ZoneManagement'
import { RackLayoutManagement } from '../admin/RackLayoutManagement'

type ManagementTab = 'warehouse' | 'zone' | 'rack'

export const WarehouseDashboard: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ManagementTab>('warehouse')
  
  // SYSTEM_ADMIN giữ Dark Mode nguyên bản, các role khác áp dụng Light Mode
  const isDarkMode = user?.role === 'SYSTEM_ADMIN'

  // Cấu hình thông tin cho 3 ô nhỏ lựa chọn trên đầu trang
  const managementCards = [
    {
      id: 'warehouse' as ManagementTab,
      title: 'QUẢN LÝ KHO',
      subtitle: 'Warehouse Management',
      icon: 'warehouse',
      colorClass: 'from-emerald-500 to-teal-600',
      activeBg: isDarkMode ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300 shadow-sm shadow-emerald-100',
      iconColor: 'text-emerald-500',
    },
    {
      id: 'zone' as ManagementTab,
      title: 'QUẢN LÝ ZONE',
      subtitle: 'Zone Planning',
      icon: 'grid_view',
      colorClass: 'from-cyan-500 to-blue-600',
      activeBg: isDarkMode ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-cyan-50 border-cyan-300 shadow-sm shadow-cyan-100',
      iconColor: 'text-cyan-500',
    },
    {
      id: 'rack' as ManagementTab,
      title: 'QUẢN LÝ RACK & BIN',
      subtitle: 'Rack & Bin Layout',
      icon: 'shelves',
      colorClass: 'from-purple-500 to-indigo-600',
      activeBg: isDarkMode ? 'bg-purple-500/10 border-purple-500/40' : 'bg-purple-50 border-purple-300 shadow-sm shadow-purple-100',
      iconColor: 'text-purple-500',
    }
  ]

  return (
    <div className={`min-h-screen w-full p-8 transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0b101a] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <div className="mx-auto max-w-[1400px] space-y-8">

        {/* Khu vực 3 ô nhỏ chọn nhanh */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {managementCards.map((card) => {
            const isActive = activeTab === card.id
            return (
              <div
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-200 cursor-pointer select-none active:scale-[0.99] ${
                  isActive
                    ? card.activeBg
                    : isDarkMode
                      ? 'border-white/5 bg-[#111827]/40 hover:bg-[#111827]/80 hover:border-white/10'
                      : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                }`}
              >
                {/* Thanh màu chỉ thị trạng thái Active ở viền trên */}
                <div className={`absolute inset-x-0 top-0 h-1 transition-transform duration-200 ${
                  isActive ? `bg-gradient-to-r ${card.colorClass} scale-x-100` : 'bg-transparent scale-x-0'
                }`} />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Icon đại diện */}
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                      isActive 
                        ? isDarkMode ? 'bg-white/10' : 'bg-white shadow-sm'
                        : isDarkMode ? 'bg-white/[0.03]' : 'bg-slate-100'
                    }`}>
                      <span className={`material-symbols-outlined text-xl ${card.iconColor}`}>
                        {card.icon}
                      </span>
                    </div>

                    {/* Tiêu đề ô */}
                    <div>
                      <h3 className={`text-sm font-bold tracking-wide ${
                        isActive
                          ? isDarkMode ? 'text-white' : 'text-slate-900'
                          : isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {card.title}
                      </h3>
                      <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase mt-0.5">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Icon Check tròn hiển thị khi ô được chọn */}
                  <div className="flex items-center">
                    {isActive ? (
                      <span className={`material-symbols-outlined text-xl font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        check_circle
                      </span>
                    ) : (
                      <div className={`h-4 w-4 rounded-full border ${isDarkMode ? 'border-white/10' : 'border-slate-300'}`} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Phân vùng chứa Trang Quản Lý chi tiết hiển thị bên dưới */}
        <div className={`rounded-xl border transition-all duration-300 shadow-sm overflow-hidden ${
          isDarkMode ? 'border-white/5 bg-[#111827]/20' : 'border-slate-200 bg-white'
        }`}>
          <div className="transition-opacity duration-200 animate-fadeIn">
            {activeTab === 'warehouse' && <SingleWarehouseDetail />}
            {activeTab === 'zone' && <ZoneManagement />}
            {activeTab === 'rack' && <RackLayoutManagement />}
          </div>
        </div>

      </div>
    </div>
  )
}