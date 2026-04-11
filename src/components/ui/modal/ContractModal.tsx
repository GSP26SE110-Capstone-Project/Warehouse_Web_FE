import { useState, useEffect } from 'react'

type Mode = 'create' | 'edit' | 'view'

type ContractForm = {
  contractNumber: string
  providerName: string
  providerAddress: string
  customerName: string
  customerEmail: string
  customerTaxCode: string
  customerAddress: string
  warehouse: string
  palletQuantity: number
  pricePerPallet: number
  startDate: string
  endDate: string
  totalValue: number
  notes: string
}

type Props = {
  mode: Mode
  data: any
  onClose: () => void
  onSubmit?: (data: ContractForm) => void
}

export const ContractModal: React.FC<Props> = ({
  mode,
  data,
  onClose,
  onSubmit
}) => {
  const isView = mode === 'view'

  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    contractNumber: `WMS-${new Date().getFullYear()}-001`,
    providerName: 'CÔNG TY CP LOGISTICS THÔNG MINH',
    providerAddress: 'Lô 45, Khu Công Nghiệp Cao, TP. Thủ Đức',
    customerName: '',
    customerEmail: '',
    customerTaxCode: '',
    customerAddress: '',
    warehouse: '',
    palletQuantity: 0,
    pricePerPallet: 0,
    startDate: '',
    endDate: '',
    totalValue: 0,
    notes: '',
  })

  /* ===== MAP DATA TỪ REQUEST ===== */
  useEffect(() => {
    if (data) {
      setForm(prev => ({
        ...prev,
        customerName: data.customerName || '',
        customerEmail: data.customerEmail || '',
        warehouse: data.warehouse || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
      }))
    }
  }, [data])

  /* ===== AUTO TÍNH TIỀN ===== */
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      totalValue: prev.palletQuantity * prev.pricePerPallet,
    }))
  }, [form.palletQuantity, form.pricePerPallet])

  const handleSubmit = async () => {
    if (!onSubmit) return


    setLoading(true)
    try {
      await onSubmit(form)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const labelStyle =
    'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'

  const inputStyle =
    'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all disabled:opacity-50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">
                description
              </span>
              {mode === 'create'
                ? 'Tạo hợp đồng'
                : mode === 'edit'
                  ? 'Chỉnh sửa hợp đồng'
                  : 'Chi tiết hợp đồng'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Mã: <span className="text-cyan-400">{form.contractNumber}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-slate-400">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* BÊN A & B */}
          <div className="grid grid-cols-2 gap-6">

            {/* Bên A */}
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">
                BÊN CHO THUÊ
              </h3>

              <p className="text-sm text-white">{form.providerName}</p>
              <p className="text-xs text-slate-400">{form.providerAddress}</p>
            </div>

            {/* Bên B */}
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-emerald-400">
                KHÁCH HÀNG
              </h3>

              <div>
                <label className={labelStyle}>Tên khách hàng</label>
                <input
                  disabled
                  className={inputStyle}
                  value={form.customerName}
                />
              </div>

              <div>
                <label className={labelStyle}>Email</label>
                <input
                  disabled
                  className={inputStyle}
                  value={form.customerEmail}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  disabled={isView}
                  className={inputStyle}
                  placeholder="MST"
                  value={form.customerTaxCode}
                  onChange={(e) =>
                    setForm({ ...form, customerTaxCode: e.target.value })
                  }
                />
                <input
                  disabled={isView}
                  className={inputStyle}
                  placeholder="Địa chỉ"
                  value={form.customerAddress}
                  onChange={(e) =>
                    setForm({ ...form, customerAddress: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* CHI TIẾT */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className={labelStyle}>Kho</label>
              <input disabled className={inputStyle} value={form.warehouse} />
            </div>

            <input
              type="date"
              disabled={isView}
              className={inputStyle}
              value={form.startDate}
              onChange={(e) =>
                setForm({ ...form, startDate: e.target.value })
              }
            />

            <input
              type="date"
              disabled={isView}
              className={inputStyle}
              value={form.endDate}
              onChange={(e) =>
                setForm({ ...form, endDate: e.target.value })
              }
            />

            <input
              type="number"
              disabled={isView}
              className={inputStyle}
              placeholder="Pallet"
              value={form.palletQuantity}
              onChange={(e) =>
                setForm({ ...form, palletQuantity: +e.target.value })
              }
            />

            <input
              type="number"
              disabled={isView}
              className={inputStyle}
              placeholder="Giá"
              value={form.pricePerPallet}
              onChange={(e) =>
                setForm({ ...form, pricePerPallet: +e.target.value })
              }
            />

            {/* TOTAL */}
            <div className="col-span-2 flex items-end">
              <div className="w-full bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-4 py-2 text-cyan-400 font-bold">
                {new Intl.NumberFormat('vi-VN').format(form.totalValue)} ₫
              </div>
            </div>
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
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Đóng
            </button>

            {!isView && (
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50"
              >
                {loading ? 'Đang gửi...' : mode === 'create' ? 'Tạo & Gửi' : 'Cập nhật'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}