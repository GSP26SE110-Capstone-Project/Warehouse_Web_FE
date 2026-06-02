type Props = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function buildPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) pages.push('ellipsis')
  for (let p = start; p <= end; p += 1) pages.push(p)
  if (end < totalPages - 1) pages.push('ellipsis')
  pages.push(totalPages)

  return pages
}

export const Pagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = buildPageNumbers(currentPage, totalPages)

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Trang trước"
        className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
      </button>

      {pages.map((p, index) =>
        p === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1 py-1 text-xs text-slate-500">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`rounded-md px-3 py-1 text-xs ${
              currentPage === p
                ? 'border border-cyan-500/20 bg-cyan-500/10 font-bold text-cyan-400'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Trang sau"
        className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>
  )
}