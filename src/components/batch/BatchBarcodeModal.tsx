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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-barcode-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="batch-barcode-title" className="text-lg font-bold text-slate-900">
              Tem Code 128
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Chuỗi in trên tem = <span className="font-mono font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 px-1 py-0.5 rounded">{batch.batchCode}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined font-bold">close</span>
          </button>
        </div>

        {/* Khối bọc Barcode giữ nguyên bg-white bên trong nhưng đổi màu border bên ngoài */}
        <div ref={printRef} className="flex justify-center rounded-lg border border-slate-200 bg-white p-5 shadow-inner">
          <Code128Barcode value={batch.batchCode} height={80} />
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-sm transition-all"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-lg font-bold">print</span>
            In tem mã vạch
          </button>
        </div>
      </div>
    </div>
  )
}