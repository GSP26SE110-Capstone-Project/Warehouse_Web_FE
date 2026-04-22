import { useState, useEffect } from 'react'
import type { ImportExportDetail } from '../../../types/ImportExport'

type Mode = 'create' | 'edit' | 'view'

type Props = {
  mode: Mode
  type: 'import' | 'export'
  data?: any
  warehouseCodes: any[] // Danh sách mã kho từ API
  contractCodes: any[]  // Danh sách mã hợp đồng từ API
  onClose: () => void
  onSubmit?: (data: any) => void
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}

export const StockMovementModal: React.FC<Props> = ({
  mode,
  type,
  data,
  warehouseCodes,
  contractCodes,
  onClose,
  onSubmit,
  onApprove,
  onReject,
}) => {
  const isView = mode === 'view'


  const [form, setForm] = useState<any>({
    recordCode: '',
    contractCode: '', // Sử dụng Code thay vì ID
    warehouseCode: '', // Sử dụng Code thay vì ID
    recordType: type === 'import' ? 'IMPORT' : 'EXPORT',
    scheduledDatetime: '',
    quantity: 0,
    weight: 0,
    scopeType: 'PALLET',
    status: 'PENDING',
    notes: ''
  })
  const displayWhCode = warehouseCodes.find(w => w.warehouseId === form.warehouseId)?.warehouseCode || form.warehouseId;
  const displayCtCode = contractCodes.find(c => c.contractId === form.contractId)?.contractCode || form.contractId;
  useEffect(() => {
    if (data) {
      setForm({
        ...data,
        scheduledDatetime: data.scheduledDatetime?.split('T')[0] || '',
      })
    }
  }, [data])

  const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
  const inputStyle = 'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 disabled:opacity-50 transition-all'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400">
              {type === 'import' ? 'login' : 'logout'}
            </span>
            {mode === 'create' ? 'Tạo mới' : 'Chi tiết'} phiếu {type === 'import' ? 'nhập' : 'xuất'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full"><span className="material-symbols-outlined text-slate-400">close</span></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">

          <div className="grid grid-cols-2 gap-4">
            {/* Contract Code Select */}
            <div>
              <label className={labelStyle}>Mã hợp đồng</label>
              {isView ? (
                <div className={`${inputStyle} bg-white/[0.03] border-cyan-500/30 text-cyan-400 font-mono`}>
                  {displayCtCode}
                </div>
              ) : (
                <select
                  className={inputStyle}
                  value={form.contractId} // Lưu ý: Dùng contractId để đồng bộ với state
                  onChange={e => setForm({ ...form, contractId: e.target.value })}
                >
                  <option value="">Chọn hợp đồng</option>
                  {contractCodes.map((c: any) => (
                    <option key={c.contractId} value={c.contractId}>
                      {c.contractCode}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Kho lưu trữ */}
            <div>
              <label className={labelStyle}>Kho lưu trữ</label>
              {isView ? (
                <div className={`${inputStyle} bg-white/[0.03] border-cyan-500/30 text-cyan-400 font-mono`}>
                  {displayWhCode}
                </div>
              ) : (
                <select
                  className={inputStyle}
                  value={form.warehouseId} // Lưu ý: Dùng warehouseId để đồng bộ với state
                  onChange={e => setForm({ ...form, warehouseId: e.target.value })}
                >
                  <option value="">Chọn kho</option>
                  {warehouseCodes.map((w: any) => (
                    <option key={w.warehouseId} value={w.warehouseId}>
                      {w.warehouseCode}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Ngày dự kiến</label>
              <input
                type="date"
                disabled={isView}
                className={inputStyle}
                value={form.scheduledDatetime}
                onChange={e => setForm({ ...form, scheduledDatetime: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>Loại hình</label>
              <select
                disabled={isView}
                className={inputStyle}
                value={form.scopeType}
                onChange={e => setForm({ ...form, scopeType: e.target.value })}
              >
                <option value="PALLET">Theo Pallet</option>
                <option value="ZONE">Theo Khu vực (Zone)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Số lượng</label>
              <input
                type="number"
                disabled={isView}
                className={inputStyle}
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelStyle}>Tổng khối lượng (kg)</label>
              <input
                type="number"
                disabled={isView}
                className={inputStyle}
                value={form.weight}
                onChange={e => setForm({ ...form, weight: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className={labelStyle}>Ghi chú nội bộ</label>
            <textarea
              disabled={isView}
              rows={3}
              className={`${inputStyle} resize-none`}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Thông tin thêm về hàng hóa..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-white px-4">Đóng</button>

          {!isView ? (
            <button
              onClick={() => onSubmit?.(form)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-black hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              Xác nhận lệnh
            </button>
          ) : form.status === 'PENDING' && (
            <div className="flex gap-2">
              <button onClick={() => onReject?.(form.recordId)} className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-2 rounded-lg text-sm font-bold text-black hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]">Từ chối</button>
              <button onClick={() => onApprove?.(form.recordId)} className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-black hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">Duyệt lệnh</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}