export type FifoAllocationRow = {
  fifoOrder?: number
  skuCode?: string | null
  productName?: string | null
  size?: string | null
  lpnCode?: string | null
  batchCode?: string | null
  binCode?: string | null
  quantityToPick: number
  pickedQuantity?: number | null
}

type Props = {
  rows: FifoAllocationRow[]
  showPicked?: boolean
  emptyMessage?: string
}

export function FifoAllocationTable({
  rows,
  showPicked = false,
  emptyMessage = 'Chưa có dòng phân bổ',
}: Props) {
  if (rows.length === 0) {
    return <p className="mt-2 text-sm text-slate-500">{emptyMessage}</p>
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-black/30 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-3 py-2.5 text-center w-12">#</th>
            <th className="px-3 py-2.5">SKU</th>
            <th className="px-3 py-2.5">Sản phẩm</th>
            <th className="px-3 py-2.5">LPN</th>
            <th className="px-3 py-2.5">Batch</th>
            <th className="px-3 py-2.5">Bin</th>
            <th className="px-3 py-2.5 text-right">
              {showPicked ? 'Pick / đã pick' : 'SL pick'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, index) => (
            <tr key={`${row.fifoOrder ?? index}-${row.lpnCode ?? index}`} className="hover:bg-white/[0.02]">
              <td className="px-3 py-2 text-center tabular-nums text-slate-500">
                {row.fifoOrder ?? index + 1}
              </td>
              <td className="px-3 py-2 font-mono text-cyan-300">{row.skuCode ?? '—'}</td>
              <td className="px-3 py-2 text-slate-300">
                {row.productName ?? '—'}
                {row.size ? ` · ${row.size}` : ''}
              </td>
              <td className="px-3 py-2 font-mono text-violet-300">{row.lpnCode ?? '—'}</td>
              <td className="px-3 py-2 font-mono text-amber-300">{row.batchCode ?? '—'}</td>
              <td className="px-3 py-2 font-mono text-slate-300">{row.binCode ?? '—'}</td>
              <td className="px-3 py-2 text-right tabular-nums text-emerald-300">
                {showPicked && row.pickedQuantity != null
                  ? `${row.quantityToPick} / ${row.pickedQuantity}`
                  : row.quantityToPick}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
