import { useRef } from 'react'
import type { ApiBatch } from '../../api/batches'
import { Code128Barcode } from './Code128Barcode'

type Props = {
  batch: ApiBatch | null
  open: boolean
  onClose: () => void
}

export function BatchBarcodeModal({ batch, open, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!open || !batch) return null

  const handlePrint = () => {
    const node = printRef.current
    if (!node) return
    const w = window.open('', '_blank', 'noopener,noreferrer')
    if (!w) return
    w.document.write(`
      <!DOCTYPE html><html><head><title>${batch.batchCode}</title>
      <style>body{font-family:Inter,sans-serif;text-align:center;padding:24px;}
      h1{font-size:14px;font-weight:600;margin:0 0 12px;}</style></head><body>
      <h1>Batch — ${batch.batchCode}</h1>
      ${node.innerHTML}
      </body></html>`)
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-barcode-title"
    >
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0f172a] p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="batch-barcode-title" className="text-lg font-semibold text-white">
              Tem Code 128
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Chuỗi in trên tem = <span className="font-mono text-cyan-300">{batch.batchCode}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div ref={printRef} className="flex justify-center rounded-lg border border-white/10 bg-white p-4">
          <Code128Barcode value={batch.batchCode} height={80} />
        </div>

        <p className="mt-3 text-xs text-slate-500 leading-relaxed">
          Mobile / máy in tự render Code 128 từ <code className="text-slate-400">batchCode</code>.
          Quét tem để resolve batch khi nhận hàng.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            In tem
          </button>
        </div>
      </div>
    </div>
  )
}
