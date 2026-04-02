import { useState, useEffect } from 'react'
import type { ImportExportRequest } from '../../../types/ImportExport'

type Mode = 'create' | 'edit' | 'view'

type Props = {
  mode: Mode
  type: 'import' | 'export'
  data?: ImportExportRequest
  onClose: () => void

  onSubmit?: (data: ImportExportRequest & { hasTransport?: boolean }) => void
  onApprove?: (data: ImportExportRequest & { hasTransport?: boolean }) => void
  onReject?: (id: number) => void
}

const warehouses = ['Kho A', 'Kho B', 'Kho C']

export const ImportExportModal: React.FC<Props> = ({
  mode,
  type,
  data,
  onClose,
  onSubmit,
  onApprove,
  onReject,
}) => {
  const isView = mode === 'view'

  const [form, setForm] = useState<
    ImportExportRequest & { hasTransport?: boolean }
  >({
    id: 0,
    customer: '',
    warehouse: warehouses[0],
    description: '',
    weight: 0,
    origin: '',
    destination: '',
    type,
    status: 'WAITING',
    createdAt: new Date().toISOString().split('T')[0],
    scheduledTime: '',
    hasTransport: false,
  })

  useEffect(() => {
    if (data) {
      setForm({
        ...data,
        hasTransport: (data as any).hasTransport ?? false,
      })
    }
  }, [data])

  /* ================= ACTION ================= */

  const handleSubmit = () => {
    if (!form.customer || !form.weight || !form.origin || !form.destination) {
      alert('Vui lòng nhập đầy đủ thông tin')
      return
    }

    onSubmit?.({
      ...form,
      type,
    })

    onClose()
  }

  const handleApprove = () => {
    onApprove?.(form)
    onClose()
  }

  const handleReject = () => {
    onReject?.(form.id)
    onClose()
  }

  /* ================= STYLE ================= */

  const labelStyle =
    'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'

  const inputStyle =
    'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400'

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400">
              {type === 'import' ? 'download' : 'upload'}
            </span>
            {type === 'import' ? 'Nhập kho' : 'Xuất kho'}
          </h2>

          <button onClick={onClose}>
            <span className="material-symbols-outlined text-slate-400">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Customer */}
          <div>
            <label className={labelStyle}>Khách hàng</label>
            <input
              disabled={isView}
              className={inputStyle}
              value={form.customer}
              onChange={(e) =>
                setForm({ ...form, customer: e.target.value })
              }
            />
          </div>

          {/* Warehouse */}
          <div>
            <label className={labelStyle}>Kho</label>
            <select
              disabled={isView}
              className={inputStyle}
              value={form.warehouse}
              onChange={(e) =>
                setForm({ ...form, warehouse: e.target.value })
              }
            >
              {warehouses.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Origin + Destination */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Nguồn (From)</label>
              <input
                disabled={isView}
                className={inputStyle}
                value={form.origin}
                onChange={(e) =>
                  setForm({ ...form, origin: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelStyle}>Đích (To)</label>
              <input
                disabled={isView}
                className={inputStyle}
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
              />
            </div>
          </div>

          {/* Weight + Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Khối lượng (kg)</label>
              <input
                type="number"
                disabled={isView}
                className={inputStyle}
                value={form.weight}
                onChange={(e) =>
                  setForm({ ...form, weight: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className={labelStyle}>Thời gian dự kiến</label>
              <input
                type="date"
                disabled={isView}
                className={inputStyle}
                value={form.scheduledTime}
                onChange={(e) =>
                  setForm({ ...form, scheduledTime: e.target.value })
                }
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelStyle}>Mô tả</label>
            <textarea
              disabled={isView}
              className={inputStyle}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* Has Transport */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              disabled={isView}
              checked={form.hasTransport || false}
              onChange={(e) =>
                setForm({ ...form, hasTransport: e.target.checked })
              }
            />
            <label className="text-sm text-slate-300">
              Có yêu cầu vận chuyển
            </label>
          </div>

          {/* Status */}
          <div>
            <label className={labelStyle}>Trạng thái</label>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${form.status === 'WAITING'
                ? 'text-yellow-400 bg-yellow-400/10 ring-yellow-400/20'
                : form.status === 'APPROVED'
                  ? 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20'
                  : 'text-red-400 bg-red-400/10 ring-red-400/20'
                }`}
            >
              {form.status}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-white/[0.02]">
          <span className="text-xs text-slate-500">
            NEXSPACE
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="text-sm text-slate-400 hover:text-white"
            >
              Đóng
            </button>

            {/* CREATE / EDIT */}
            {!isView && (
              <button
                onClick={handleSubmit}
                className="btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-black font-bold flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-black text-[18px]">
                  save
                </span>
                Lưu
              </button>
            )}

            {/* VIEW MODE */}
            {isView && form.status === 'WAITING' && (
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  className="px-4 py-2 rounded bg-red-500 text-white"
                >
                  Từ chối
                </button>

                <button
                  onClick={handleApprove}
                  className="px-4 py-2 rounded bg-green-500 text-white"
                >
                  Duyệt
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}