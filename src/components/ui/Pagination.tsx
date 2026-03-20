type Props = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const Pagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = []

  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between border-t border-white/5 bg-[#131b29] px-6">

      {/* Info */}
      <p className="font-mono text-xs text-slate-400">
        Page <span className="text-white">{currentPage}</span> / {totalPages}
      </p>

      {/* Controls */}
      <div className="flex gap-2">

        {/* Prev */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>

        {/* Page numbers */}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`rounded-md px-3 py-1 text-xs ${
              currentPage === p
                ? 'border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 font-bold'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            {p}
          </button>
        ))}

        {/* Next */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>

      </div>
    </div>
  )
}