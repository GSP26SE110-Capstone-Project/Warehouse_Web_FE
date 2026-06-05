import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  unit?: string
  icon: string
  trend?: {
    direction: 'up' | 'down'
    percentage: number
    text: string
  }
  accentColor?: 'primary' | 'orange' | 'purple' | 'emerald'
  borderColor?: string
  isDarkMode?: boolean // Thêm prop để nhận biết trạng thái giao diện
}

export const WhiteStatCard: React.FC<StatsCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  accentColor = 'primary',
  isDarkMode = false, // Mặc định là Light Mode nếu không truyền vào
}) => {
  // Bản đồ màu sắc linh hoạt theo cả màu chủ đạo lẫn theme hệ thống
  const colorMap = {
    primary: { 
      bg: 'from-cyan-500', 
      text: isDarkMode ? 'text-cyan-400' : 'text-cyan-600',
      iconColor: isDarkMode ? 'text-cyan-700' : 'text-cyan-800'
    },
    orange: { 
      bg: 'from-orange-500', 
      text: isDarkMode ? 'text-orange-400' : 'text-orange-600',
      iconColor: isDarkMode ? 'text-orange-700' : 'text-orange-800'
    },
    purple: { 
      bg: 'from-purple-500', 
      text: isDarkMode ? 'text-purple-400' : 'text-purple-600',
      iconColor: isDarkMode ? 'text-purple-700' : 'text-purple-800'
    },
    emerald: { 
      bg: 'from-emerald-500', 
      text: isDarkMode ? 'text-emerald-400' : 'text-emerald-600',
      iconColor: isDarkMode ? 'text-emerald-700' : 'text-emerald-800'
    },
  }

  const { bg, text, iconColor } = colorMap[accentColor]

  return (
    <div className={`p-6 rounded-2xl relative overflow-hidden group border transition-all duration-200 ${
      isDarkMode 
        ? 'bg-[#0b101a]/40 border-white/5 backdrop-blur-md shadow-none' 
        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
    }`}>
      
      {/* Icon nền mờ phía sau */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity">
        {/* Đã sửa lỗi chính tả class thành 'material-symbols-outlined' */}
        <span className={`material-symbols-outlined text-6xl ${iconColor}`}>
          {icon}
        </span>
      </div>

      <div className="relative z-10">
        <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </p>
        <h3 className={`text-2xl font-bold tracking-tight transition-colors duration-200 ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {value} <span className="text-sm text-slate-400 font-normal">{unit}</span>
        </h3>

        {trend && (
          <div className={`flex items-center gap-1 mt-4 text-xs font-semibold ${text}`}>
            <span className="material-symbols-outlined text-sm">
              {trend.direction === 'up' ? 'trending_up' : 'trending_down'}
            </span>
            <span>
              {trend.direction === 'up' ? '+' : '-'}
              {trend.percentage}% {trend.text}
            </span>
          </div>
        )}
      </div>

      {/* Thanh line trang trí ở đáy Card */}
      <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${bg} to-transparent`}></div>
    </div>
  )
}