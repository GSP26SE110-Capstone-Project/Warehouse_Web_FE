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

    // Các biến style cho Dark Mode
    const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block'
    const inputStyle = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop phủ mờ */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col text-slate-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                    <div>
                        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-500 text-xl">
                                {isCreate ? 'add_box' : isView ? 'info' : 'edit'}
                            </span>
                            {isCreate ? 'Tạo mùa mới' : isView ? 'Chi tiết mùa vụ' : 'Cập nhật mùa vụ'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900">

                    {/* Section: Thông tin cơ bản */}
                    <div className="p-5 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-4">
                        <h3 className="text-[10px] font-black text-cyan-500 tracking-[2px]">THÔNG TIN CƠ BẢN</h3>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div>
                                <label className={labelStyle}>Tên mùa *</label>
                                <input
                                    disabled={isView}
                                    className={inputStyle}
                                    placeholder="Nhập tên mùa (Ví dụ: Mùa Xuân 2026)..."
                                    value={form.seasonName}
                                    onChange={(e) => setForm({ ...form, seasonName: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
                        Hủy bỏ
                    </button>
                    {!isView && (
                        <button
                            onClick={handleSubmit}
                            className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 px-5 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            {isCreate ? 'Tạo mùa vụ' : 'Lưu thay đổi'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}