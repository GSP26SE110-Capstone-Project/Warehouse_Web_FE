import { useState, useEffect } from 'react'
import type { UserRequest, UserResponse, Status, Role } from '../../../types/Account'
import { warehouseApi } from '../../../service/warehouseApi'
import { accountApi } from '../../../service/accountApi'

type Mode = 'view' | 'edit' | 'create'

type Props = {
    mode: Mode
    data?: UserResponse
    onClose: () => void
    onSubmit?: (data: UserRequest) => void
}

export const StaffModal: React.FC<Props> = ({
    mode,
    data,
    onClose,
    onSubmit,
}) => {
    const isView = mode === 'view'
    const isCreate = mode === 'create'

    const [warehouseName, setWarehouseName] = useState('')
    const [loadingWarehouse, setLoadingWarehouse] = useState(false)
    const [passwordError, setPasswordError] = useState('')

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        role: 'WH_STAFF' as Role,
        status: 'ACTIVE' as Status,
        warehouseId: '',
        password: '',
        createdAt: '',
        updatedAt: '',
    })

    // Lấy warehouseId từ localStorage và fetch warehouse name
    useEffect(() => {
        const userString = localStorage.getItem('user')
        if (userString) {
            try {
                const user = JSON.parse(userString)
                if (user.warehouseId) {
                    setForm(prev => ({
                        ...prev,
                        warehouseId: user.warehouseId,
                    }))

                    // Fetch warehouse name
                    const fetchWarehouse = async () => {
                        try {
                            setLoadingWarehouse(true)
                            const response = await warehouseApi.getById(user.warehouseId)
                            if (response.data.data?.warehouseName) {
                                setWarehouseName(response.data.data.warehouseName)
                            }
                        } catch (err) {
                            console.error('Lỗi tải thông tin kho hàng:', err)
                        } finally {
                            setLoadingWarehouse(false)
                        }
                    }
                    fetchWarehouse()
                }
            }
            catch (err) {
                console.error('Lỗi lấy warehouseId:', err)
            }
        }
    }, [])

    // Cập nhật form khi có dữ liệu (View/Edit mode)
    useEffect(() => {
        if (data) {
            setForm({
                fullName: data.fullName,
                email: data.email,
                phone: data.phone || '',
                role: data.role,
                status: data.status,
                warehouseId: data.warehouseId || '',
                password: '',
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            })
        }
    }, [data])

    const handleSubmit = () => {
        if (isView) return

        if (!form.fullName || !form.email) {
            alert('Vui lòng điền đầy đủ họ tên và email')
            return
        }

        let submitData: UserRequest

        if (isCreate) {
            if (!form.password || !form.password.trim()) {
                alert('Vui lòng nhập mật khẩu')
                return
            }

            if (form.password.length < 8) {
                alert('Password must be at least 8 characters')
                return
            }

            submitData = {
                fullName: form.fullName,
                email: form.email,
                password: form.password,
                phone: form.phone || '',
                role: form.role,
                status: form.status,
                warehouseId: form.warehouseId,
            }
        } else {
            submitData = {
                fullName: form.fullName,
                phone: form.phone || '',
                status: form.status,
            }
        }

        onSubmit?.(submitData)
        onClose()
    }

    const isEditMode = !isCreate && !isView

    const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block'
    const inputStyle = 'w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay tối vừa phải */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Container chính: nền trắng, viền nhẹ, đổ bóng đậm hơn */}
            <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl flex flex-col">

                {/* Header: nền xám rất nhẹ */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-600">
                                {isCreate ? 'person_add' : isView ? 'person' : 'edit'}
                            </span>
                            {isCreate ? 'Thêm nhân viên mới' : isView ? 'Chi tiết nhân viên' : 'Cập nhật nhân viên'}
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

                        <div>
                            <label className={labelStyle}>Kho hàng</label>
                            <input
                                disabled
                                className={inputStyle}
                                value={warehouseName || 'Đang tải...'}
                                placeholder="Sẽ tự động điền"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Họ và tên *</label>
                                <input
                                    disabled={isView}
                                    className={inputStyle}
                                    placeholder="Nguyễn Văn A"
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Email *</label>
                                <input
                                    disabled={isView || !isCreate}
                                    type="email"
                                    className={inputStyle}
                                    placeholder="staff@example.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Số điện thoại</label>
                                <input
                                    disabled={isView}
                                    type="tel"
                                    className={inputStyle}
                                    placeholder="0901234567"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Trạng thái</label>
                                <select
                                    disabled={isView}
                                    className={inputStyle}
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                                >
                                    <option value="ACTIVE">Hoạt động</option>
                                    <option value="INACTIVE">Không hoạt động</option>
                                    <option value="SUSPENDED">Tạm khóa</option>
                                    <option value="BLOCKED">Bị chặn</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section: Cấu hình vai trò */}
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-emerald-700 tracking-[2px]">CẤU HÌNH VAI TRÒ</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Vai trò</label>
                                <input
                                    disabled
                                    className={inputStyle}
                                    value="Nhân viên kho (WH_STAFF)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mật khẩu */}
                    {isCreate && (
                        <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                            <h3 className="text-[10px] font-black text-orange-700 tracking-[2px]">MẬT KHẨU KHỞI TẠO</h3>

                            <div>
                                <label className={labelStyle}>Mật khẩu *</label>
                                <input
                                    type="password"
                                    className={inputStyle}
                                    placeholder="Nhập mật khẩu bảo mật ban đầu"
                                    value={form.password}
                                    onChange={(e) => {
                                        setForm({ ...form, password: e.target.value })
                                        if (e.target.value && e.target.value.length < 8) {
                                            setPasswordError('Password must be at least 8 characters')
                                        } else {
                                            setPasswordError('')
                                        }
                                    }} />
                                {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
                            </div>
                        </div>
                    )}

                    {/* Nhật ký thời gian */}
                    {!isCreate && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <label className={labelStyle}>Ngày tạo</label>
                                <input
                                    disabled
                                    className={inputStyle}
                                    value={form.createdAt ? new Date(form.createdAt).toLocaleString('vi-VN') : '---'}
                                />
                            </div>
                            <div>
                                <label className={labelStyle}>Cập nhật cuối</label>
                                <input
                                    disabled
                                    className={inputStyle}
                                    value={form.updatedAt ? new Date(form.updatedAt).toLocaleString('vi-VN') : '---'}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer: Nền xám nhẹ */}
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
                            {isCreate ? 'Thêm nhân viên' : 'Lưu thay đổi'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}