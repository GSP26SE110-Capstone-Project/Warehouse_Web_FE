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
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  accentColor = 'primary',
}) => {
  const colorMap = {
    primary: { bg: 'from-primary', text: 'text-primary' },
    orange: { bg: 'from-orange-500', text: 'text-orange-500' },
    purple: { bg: 'from-purple-500', text: 'text-purple-500' },
    emerald: { bg: 'from-emerald-500', text: 'text-emerald-500' },
  }

  const { bg, text } = colorMap[accentColor]

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
        <span className="material-symbols-outlinedDashboard text-6xl text-emerald-500">
          {icon}
        </span>
      </div>

      <div className="relative z-10">
        <p className="text-slate-400 text-xl font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white tracking-tight">
          {value} <span className="text-lg text-slate-500 font-normal">{unit}</span>
        </h3>

        {trend && (
          <div className={`flex items-center gap-1 mt-4 ${text} text-sm font-medium`}>
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

      <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${bg} to-transparent`}></div>
    </div>
  )
}