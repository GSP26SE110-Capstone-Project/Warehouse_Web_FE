import { useState, useEffect, useCallback } from 'react'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import {
    WarehouseModal,
    type WarehouseFormPayload,
} from '../../components/ui/modal/WarehouseModal'
import { ApiError } from '../../api/client'
import * as warehousesApi from '../../api/warehouses'
import { warehouseToRow } from '../../mappers'
import { useAuth } from '../../auth/AuthContext'
import type { Warehouse } from '../../types/Warehouse'

function formatArea(m2?: number | null) {
    if (m2 == null || m2 === 0) return '—'
    return new Intl.NumberFormat('vi-VN').format(m2)
}

export const SingleWarehouseDetail: React.FC = () => {
    const { user } = useAuth()
    const isDarkMode = user?.role === 'SYSTEM_ADMIN'
    const fixedWarehouseId = user?.warehouseId ?? ''

    const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [modal, setModal] = useState<{ open: boolean; mode: 'edit'; data?: Warehouse }>({
        open: false,
        mode: 'edit',
    })

    const [alert, setAlert] = useState<{
        open: boolean
        type: 'success' | 'error' | 'warning'
        message: string
        title?: string
    }>({ open: false, type: 'success', message: '' })

    const loadWarehouseData = useCallback(async () => {
        if (!fixedWarehouseId) {
            setError('Tài khoản của bạn chưa được cấu hình liên kết với kho nào.')
            setLoading(false)
            return
        }

        setLoading(true)
        setError('')
        try {
            const data = await warehousesApi.getWarehouse(fixedWarehouseId)
            const rowData = warehouseToRow(data)

            if (user) {
                rowData.whAdmin = {
                    userId: user.userId,
                    fullName: user.fullName || '',
                    email: user.email || '',
                }
            }
            setWarehouse(rowData)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Không lấy được thông tin chi tiết kho')
        } finally {
            setLoading(false)
        }
    }, [fixedWarehouseId, user])

    useEffect(() => {
        loadWarehouseData()
    }, [loadWarehouseData])

    const handleSubmit = async (form: WarehouseFormPayload) => {
        if (!warehouse) return
        try {
            await warehousesApi.updateWarehouse(warehouse.warehouseId, {
                warehouseName: form.warehouseName,
                address: form.address || undefined,
                city: form.city,
                district: form.district,
                totalAreaM2: form.totalAreaM2 ?? undefined,
                usableAreaM2: form.usableAreaM2 ?? undefined,
                status: form.status,
            })

            setAlert({ open: true, type: 'success', message: 'Cập nhật thông tin biểu mẫu thành công.' })
            await loadWarehouseData()
        } catch (err) {
            setAlert({
                open: true,
                type: 'error',
                title: 'Thao tác thất bại',
                message: err instanceof ApiError ? err.message : 'Không thể lưu thay đổi',
            })
            throw err
        }
    }

    if (loading) {
        return <LoadingOverlay show={loading} text="Đang tải dữ liệu biểu mẫu..." />
    }

    if (!fixedWarehouseId || error) {
        return (
            <div className="p-6">
                <InlineAlert message={error || 'Yêu cầu quyền truy cập không hợp lệ.'} onDismiss={() => setError('')} />
            </div>
        )
    }

    if (!warehouse) return null

    return (
        <div className={`w-full p-6 transition-colors ${isDarkMode ? 'bg-[#0b101a] text-slate-100' : 'bg-slate-50 text-slate-800'
            }`}>
            <div className="mx-auto max-w-[1000px] space-y-6">

                {/* Header Tiêu đề chính */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/10">
                    <div className="space-y-1">
                        <h2 className={`text-xl font-bold tracking-wide uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Hồ Sơ Cấu Hình Nhà Kho
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={() => setModal({ open: true, mode: 'edit', data: warehouse })}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-all active:scale-[0.98] ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black'
                                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        THAY ĐỔI THÔNG TIN
                    </button>
                </div>

                {/* Khối Form thông tin cấu trúc dạng hồ sơ */}
                <div className={`rounded-xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-[#111827]/40 border-white/5' : 'bg-white border-slate-200'
                    }`}>

                    {/* Nhóm 1: Định danh hệ thống */}
                    <div className="pl-6 pt-2 pb-2 border-b border-slate-200/10 space-y-4">
                        <h3 className={`text-xs font-bold tracking-wider uppercase ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            1. Thông tin định danh chính
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                           
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide">Mã ký hiệu kho (Code)</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={warehouse.warehouseCode || 'CHƯA CÓ MÃ'}
                                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-xs font-mono font-bold focus:outline-none ${isDarkMode ? 'bg-white/[0.04] border-white/10 text-cyan-400' : 'bg-slate-50 border-slate-200 text-cyan-600'
                                        }`}
                                />
                            </div>

                            <div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide">Tên gọi cơ sở kho</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={warehouse.warehouseName}
                                        className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:outline-none ${isDarkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nhóm 2: Diện tích và Trạng thái */}
                    <div className="pl-6 border-b border-slate-200/10 space-y-4">
                        <h3 className={`text-xs font-bold tracking-wider uppercase ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            2. Quy mô diện tích & Trạng thái hoạt động
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide">Tổng diện tích thiết kế</label>
                                <div className="relative mt-1">
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${formatArea(warehouse.totalAreaM2)}`}
                                        className={`block w-full rounded-lg border pl-3 pr-8 py-2 text-xs font-bold focus:outline-none ${isDarkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                            }`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">m²</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide">Diện tích khả dụng thực tế</label>
                                <div className="relative mt-1">
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${formatArea(warehouse.usableAreaM2)}`}
                                        className={`block w-full rounded-lg border pl-3 pr-8 py-2 text-xs font-bold focus:outline-none ${isDarkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                            }`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">m²</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide">Trạng thái vận hành</label>
                                <div className="mt-1 flex h-8 items-center">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${warehouse.status === 'ACTIVE'
                                            ? isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                                            : isDarkMode ? 'bg-slate-500/10 text-slate-400' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${warehouse.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {warehouse.status === 'ACTIVE' ? 'Hệ thống đang hoạt động' : 'Tạm ngừng tiếp nhận'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nhóm 3: Địa chỉ & Quản lý */}
                    <div className="pl-6 pt-2 pb-2 space-y-4">
                        <h3 className={`text-xs font-bold tracking-wider uppercase ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            3. Phân vùng địa lý & Cán bộ phụ trách
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide">Quận / Huyện</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={warehouse.district || '—'}
                                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${isDarkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                        }`}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide">Thành phố / Tỉnh</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={warehouse.city || '—'}
                                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${isDarkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                        }`}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide">Quản trị viên (WH Admin)</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={warehouse.whAdmin?.fullName || 'Chưa phân bổ'}
                                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-xs font-semibold focus:outline-none ${isDarkMode ? 'bg-white/[0.02] border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                                        }`}
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide">Địa chỉ chi tiết cụ thể</label>
                                <textarea
                                    readOnly
                                    rows={2}
                                    value={warehouse.address || 'Chưa cập nhật dữ liệu vị trí'}
                                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none ${isDarkMode ? 'bg-white/[0.02] border-white/10 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            {/* Cấu trúc Modal Biểu mẫu chỉnh sửa */}
            {modal.open && (
                <WarehouseModal
                    mode={modal.mode}
                    data={modal.data}
                    onClose={() => setModal({ ...modal, open: false })}
                    onSubmit={handleSubmit}
                    isDarkMode={isDarkMode}
                />
            )}

            {/* Hộp thoại Alert báo trạng thái */}
            {alert.open && (
                <AlertModal
                    title={alert.title ?? 'Hệ thống'}
                    message={alert.message}
                    type={alert.type}
                    onConfirm={() => setAlert({ ...alert, open: false })}
                    onClose={() => setAlert({ ...alert, open: false })}
                />
            )}
        </div>
    )
}