type Props = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const WPagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = []

  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6">

      {/* Info */}
      <p className="font-mono text-xs text-slate-500">
        Trang <span className="text-slate-800 font-semibold">{currentPage}</span> / {totalPages}
      </p>

      {/* Controls */}
      <div className="flex gap-1.5">

        {/* Prev */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <span className="material-symbols-outlined text-base flex items-center">chevron_left</span>
        </button>

        {/* Page numbers */}
        {pages.map((p) => {
          const isCurrent = currentPage === p;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                isCurrent
                  ? 'bg-cyan-50 border border-cyan-200 text-cyan-600 font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          )
        })}

        {/* Next */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <span className="material-symbols-outlined text-base flex items-center">chevron_right</span>
        </button>

      </div>
    </div>
  )
}