import { useState, useEffect } from 'react'
import type { ImportExportDetail } from '../../../types/ImportExport'

type Mode = 'create' | 'edit' | 'view'
type Props = {
  mode: Mode
  type: 'import' | 'export'
  data?: any
  onClose: () => void
  onSubmit?: (data: any) => void
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}

const warehouses = ['WH-HCMC-001', 'WH-HCMC-002', 'WH-DANANG-01']

export const ImportExportModal: React.FC<Props> = ({ mode, type, data, onClose, onSubmit, onApprove, onReject }) => {
  const isView = mode === 'view'
  const [form, setForm] = useState<ImportExportDetail>(data || {})

  useEffect(() => {
    if (data) {
        setForm({
            ...data,
            scheduledDatetime: data.scheduledDatetime?.split('T')[0] || ''
        })
    }
  }, [data])

  const labelStyle = 'text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block'
  const inputStyle = 'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-60 transition-all'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b101a] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center ${type === 'import' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                <span className="material-symbols-outlined">{type === 'import' ? 'login' : 'logout'}</span>
            </div>
            <div>
                <h2 className="text-base font-bold text-white uppercase tracking-tight">
                    {mode === 'create' ? 'Khởi tạo' : 'Chi tiết'} {type === 'import' ? 'Lệnh Nhập' : 'Lệnh Xuất'}
                </h2>
                <p className="text-[10px] text-slate-500 font-mono">{form.recordCode || 'NEW_RECORD'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-2 gap-5 max-h-[60vh] overflow-y-auto">
          <div className="col-span-2 grid grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                <div>
                    <label className={labelStyle}>Mã hợp đồng</label>
                    <input disabled className={inputStyle} value={form.contractId} />
                </div>
                <div>
                    <label className={labelStyle}>Trạng thái</label>
                    <div className="h-9 flex items-center px-4 rounded-lg bg-white/5 text-xs font-bold text-cyan-400 border border-white/5">
                        {form.status}
                    </div>
                </div>
          </div>

          <div>
            <label className={labelStyle}>Kho đích</label>
            <select disabled={isView} className={inputStyle} value={form.warehouseId}>
              {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div>
            <label className={labelStyle}>Ngày thực hiện</label>
            <input type="date" disabled={isView} className={inputStyle} value={form.scheduledDatetime} />
          </div>

          <div>
            <label className={labelStyle}>Số lượng (Pallets/Kiện)</label>
            <input type="number" disabled={isView} className={inputStyle} value={form.quantity} />
          </div>

          <div>
            <label className={labelStyle}>Tổng khối lượng (kg)</label>
            <input type="number" disabled={isView} className={inputStyle} value={form.weight} />
          </div>

          <div className="col-span-2">
            <label className={labelStyle}>Ghi chú từ khách hàng</label>
            <textarea disabled={isView} rows={2} className={`${inputStyle} resize-none`} value={form.notes || 'Không có ghi chú.'} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-xs font-bold text-slate-400 hover:text-white">ĐÓNG</button>
          
          {isView && form.status === 'PENDING' && (
            <>
              <button 
                onClick={() => onReject?.(form.recordId)}
                className="px-5 py-2 rounded-lg border border-red-500/50 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
              >
                TỪ CHỐI
              </button>
              <button 
                onClick={() => onApprove?.(form.recordId)}
                className="px-8 py-2 rounded-lg bg-cyan-500 text-black text-xs font-extrabold hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
              >
                DUYỆT LỆNH
              </button>
            </>
          )}

          {!isView && (
            <button onClick={() => onSubmit?.(form)} className="px-8 py-2 rounded-lg bg-cyan-500 text-black text-xs font-extrabold hover:bg-cyan-400 transition-all">
                LƯU THAY ĐỔI
            </button>
          )}
        </div>
      </div>
    </div>
  )
}