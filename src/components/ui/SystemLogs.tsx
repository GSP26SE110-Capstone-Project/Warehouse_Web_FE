import React from 'react'

interface LogEntry {
  timestamp: string
  level: 'INFO' | 'SYS' | 'WARN'
  message: string
}

interface SystemLogsProps {
  logs: LogEntry[]
}

export const SystemLogs: React.FC<SystemLogsProps> = ({ logs }) => {
  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      INFO: 'text-emerald-400',
      SYS: 'text-primary',
      WARN: 'text-neon-orange',
    }
    return colors[level] || 'text-slate-400'
  }

  const getLogBgColor = (level: string) => {
    if (level === 'WARN') return 'bg-neon-orange/5 hover:bg-neon-orange/10'
    return 'hover:bg-white/5'
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-64 border-t-2 border-t-primary">
      <div className="bg-black/40 px-4 py-2 flex justify-between items-center border-b border-white/5">
        <h4 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">terminal</span>
          SYSTEM LOGS
        </h4>
        <div className="flex gap-1">
          <div className="size-2 rounded-full bg-red-500/20"></div>
          <div className="size-2 rounded-full bg-yellow-500/20"></div>
          <div className="size-2 rounded-full bg-green-500"></div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 bg-[#080d1a]">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`flex gap-3 text-slate-400 border-l-2 border-transparent pl-2 transition-colors ${getLogBgColor(
              log.level
            )}`}
          >
            <span className="text-slate-600">[{log.timestamp}]</span>
            <span className={getLevelColor(log.level)}>{log.level}</span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>

      <div className="bg-black/40 px-4 py-2 flex items-center gap-2 border-t border-white/5">
        <span className="text-primary font-mono text-xs">&gt;</span>
        <div className="h-4 w-2 bg-primary animate-pulse"></div>
        <span className="text-slate-500 font-mono text-xs opacity-50">Enter command...</span>
      </div>
    </div>
  )
}