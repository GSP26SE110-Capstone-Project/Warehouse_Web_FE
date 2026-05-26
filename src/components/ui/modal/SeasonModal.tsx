import { useState, useEffect } from 'react'
import type { SeasonRequest, SeasonResponse } from '../../../types/Product'

type Mode = 'view' | 'edit' | 'create'

type Props = {
    mode: Mode
    data?: SeasonResponse
    onClose: () => void
    onSubmit?: (data: SeasonRequest) => void
}

export const SeasonModal: React.FC<Props> = ({
    mode,
    data,
    onClose,
    onSubmit,
}) => {
    const isView = mode === 'view'
    const isCreate = mode === 'create'
    const [form, setForm] = useState({
        seasonName: '',
    })

    // Cập nhật form khi có dữ liệu (View/Edit mode)
    useEffect(() => {
        if (data) {
            setForm({
                seasonName: data.seasonName,
            })
        } else {
            setForm({
                seasonName: '',
            })
        }
    }, [data])

    const handleSubmit = () => {
        if (isView) return

        // Validation
        if (!form.seasonName) {
            alert('Vui lòng điền tên mùa')
            return
        }

        const submitData: SeasonRequest = {
            seasonName: form.seasonName,
        }

        onSubmit?.(submitData)
        onClose()
    }


    const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block'
    const inputStyle = 'w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-600">
                                {isCreate ? 'add_box' : isView ? 'info' : 'edit'}
                            </span>
                            {isCreate ? 'Tạo sản phẩm mới' : isView ? 'Chi tiết sản phẩm' : 'Cập nhật sản phẩm'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">

                    {/* Section: Thông tin cơ bản */}
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-cyan-700 tracking-[2px]">THÔNG TIN CƠ BẢN</h3>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div>
                                <label className={labelStyle}>Tên mùa *</label>
                                <input
                                    disabled={isView}
                                    className={inputStyle}
                                    placeholder="Tên mùa"
                                    value={form.seasonName}
                                    onChange={(e) => setForm({ ...form, seasonName: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                        Hủy bỏ
                    </button>
                    {!isView && (
                        <button
                            onClick={handleSubmit}
                            className="bg-cyan-600 hover:bg-cyan-700 px-6 py-2.5 rounded-lg text-sm font-bold text-white flex items-center gap-2 shadow-sm shadow-cyan-500/20 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            {isCreate ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}