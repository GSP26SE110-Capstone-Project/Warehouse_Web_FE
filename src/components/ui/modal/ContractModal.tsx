import { useState, useEffect } from 'react'
import type {
    ContractResponse,
    ContractRequest,
    status,
    pricingModel,
    billingCycle,
    contractType
} from '../../../types/Contract'
import type { TenantCompanyResponse } from '../../../types/TenantCompany'
import { tenantCompanyApi } from '../../../service/tenantCompany'
import { warehouseApi } from '../../../service/warehouseApi'
import type { RentalRequestResponse } from '../../../types/RentalRequest'
import { rentalRequestApi } from '../../../service/rentalRequestApi'

type Mode = 'view' | 'edit' | 'create'

type Props = {
    mode: Mode
    data?: ContractResponse
    onClose: () => void
    onSubmit?: (data: ContractRequest) => void
}

export const ContractModal: React.FC<Props> = ({
    mode,
    data,
    onClose,
    onSubmit,
}) => {
    const isView = mode === 'view'
    const isCreate = mode === 'create'

    const [tenants, setTenants] = useState<TenantCompanyResponse[]>([])
    const [loadingTenants, setLoadingTenants] = useState(false)
    const [warehouseName, setWarehouseName] = useState('')
    const [rentalRequests, setRentalRequests] = useState<RentalRequestResponse[]>([])
    const [loadingRequests, setLoadingRequests] = useState(false)
    // Fetch tenants on component mount
    useEffect(() => {
        const fetchTenants = async () => {
            try {
                setLoadingTenants(true)
                const response = await tenantCompanyApi.getAll()
                if (response.data.success && response.data.data) {
                    setTenants(response.data.data)
                }
            } catch (err) {
                console.error('Lỗi tải danh sách thương nhân:', err)
            } finally {
                setLoadingTenants(false)
            }
        }

        fetchTenants()
    }, [])

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
                        createdBy: user.userId,
                        updatedBy: user.userId,
                        approvedBy: user.userId,
                    }))

                    // Fetch warehouse name
                    const fetchWarehouse = async () => {
                        try {
                            const response = await warehouseApi.getById(user.warehouseId)
                            if (response.data.data?.warehouseName) {
                                setWarehouseName(response.data.data.warehouseName)
                            }
                        } catch (err) {
                            console.error('Lỗi tải thông tin kho hàng:', err)
                        }
                    }
                    fetchWarehouse()
                    // Fetch rental requests by warehouse
                    const fetchRequests = async () => {
                        try {
                            setLoadingRequests(true)
                            const response = await rentalRequestApi.getRentalRequestsByWarehouse(user.warehouseId)
                            if (response.data.success && response.data.data) {
                                setRentalRequests(response.data.data)
                            }
                        } catch (err) {
                            console.error('Lỗi tải danh sách yêu cầu thuê:', err)
                        } finally {
                            setLoadingRequests(false)
                        }
                    }
                    fetchRequests()
                }
            }
            catch (err) {
                console.error('Lỗi lấy warehouseId:', err)
            }
        }
    }, [])

    const [form, setForm] = useState({
        tenantId: '',
        warehouseId: '',
        rentalRequestId: '',
        contractCode: '',
        contractName: '',
        contractType: 'SHARED_STORAGE' as contractType,
        pricingModel: 'FIXED' as pricingModel,
        billingCycle: 'MONTHLY' as billingCycle,
        allowDynamicRelocation: true,
        autoRenew: false,
        startDate: '',
        endDate: '',
        minimumBillingDays: 0,
        minimumReservedCapacity: 0,
        estimatedTotalAmount: 0,
        status: 'DRAFT' as status,
        tenantSignature: '',
        warehouseSignature: '',
        createdBy: '',
        approvedBy: '',
    })

    // Cập nhật form khi có dữ liệu (View/Edit mode)
    useEffect(() => {
        if (data) {
            setForm({
                tenantId: data.tenantId,
                warehouseId: data.warehouseId,
                rentalRequestId: data.rentalRequestId,
                contractCode: data.contractCode,
                contractName: data.contractName,
                contractType: data.contractType,
                pricingModel: data.pricingModel,
                billingCycle: data.billingCycle,
                allowDynamicRelocation: data.allowDynamicRelocation,
                autoRenew: data.autoRenew,
                startDate: data.startDate.split('T')[0], // Format YYYY-MM-DD
                endDate: data.endDate.split('T')[0],
                minimumBillingDays: data.minimumBillingDays,
                minimumReservedCapacity: data.minimumReservedCapacity,
                estimatedTotalAmount: data.estimatedTotalAmount,
                status: data.status,
                tenantSignature: data.tenantSignature,
                warehouseSignature: data.warehouseSignature,
                createdBy: data.createdBy,
                approvedBy: data.approvedBy,
            })
        }
    }, [data])

    const handleSubmit = () => {
        if (isView) return

        if (!form.tenantId) {
            alert('Vui lòng chọn thương nhân')
            return
        }

        // Validation
        if (!form.contractCode || !form.contractName) {
            alert('Vui lòng điền mã và tên hợp đồng')
            return
        }

        if (!form.startDate || !form.endDate) {
            alert('Vui lòng chọn ngày bắt đầu và kết thúc')
            return
        }

        if (new Date(form.startDate) >= new Date(form.endDate)) {
            alert('Ngày bắt đầu phải trước ngày kết thúc')
            return
        }

        if (form.minimumBillingDays <= 0) {
            alert('Ngày thanh toán tối thiểu phải lớn hơn 0')
            return
        }

        const submitData: ContractRequest = {
            tenantId: form.tenantId,
            warehouseId: form.warehouseId,
            rentalRequestId: form.rentalRequestId,
            contractCode: form.contractCode,
            contractName: form.contractName,
            contractType: form.contractType,
            pricingModel: form.pricingModel,
            billingCycle: form.billingCycle,
            allowDynamicRelocation: form.allowDynamicRelocation,
            autoRenew: form.autoRenew,
            startDate: form.startDate,
            endDate: form.endDate,
            minimumBillingDays: form.minimumBillingDays,
            minimumReservedCapacity: form.minimumReservedCapacity,
            estimatedTotalAmount: form.estimatedTotalAmount,
            status: form.status,
            tenantSignature: form.tenantSignature,
            warehouseSignature: form.warehouseSignature,
            createdBy: form.createdBy,
            approvedBy: form.approvedBy,
        }

        onSubmit?.(submitData)
        onClose()
    }
      const isEditMode = !isCreate && !isView

    // Đổi màu label sang xám đậm hơn trên nền trắng
    const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block'
    // Đổi màu input sang trắng, viền xám, chữ đen
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
                                {isCreate ? 'description' : isView ? 'info' : 'edit'}
                            </span>
                            {isCreate ? 'Tạo hợp đồng mới' : isView ? 'Chi tiết hợp đồng' : 'Cập nhật hợp đồng'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">

                    {/* Section: Thông tin cơ bản - Nền và viền điều chỉnh */}
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

                        <div>
                            <label className={labelStyle}>Yêu cầu thuê</label>
                            <select
                                disabled={isView || loadingRequests || isEditMode}
                                className={inputStyle}
                                value={form.rentalRequestId}
                                onChange={(e) => setForm({ ...form, rentalRequestId: e.target.value })}
                            >
                                <option value="">-- Chọn yêu cầu --</option>
                                {rentalRequests.map((req) => (
                                    <option key={req.rentalRequestId} value={req.rentalRequestId}>
                                        {req.requestCode}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Thương nhân *</label>
                                <select
                                    disabled={isView || loadingTenants || isEditMode}
                                    className={inputStyle}
                                    value={form.tenantId}
                                    onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                                >
                                    <option value="">-- Chọn thương nhân --</option>
                                    {tenants.map((tenant) => (
                                        <option key={tenant.tenantId} value={tenant.tenantId}>
                                            {tenant.companyName} ({tenant.companyCode})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelStyle}>Mã hợp đồng *</label>
                                <input
                                    disabled={isView || isEditMode}
                                    className={inputStyle}
                                    placeholder="CT-001"
                                    value={form.contractCode}
                                    onChange={(e) => setForm({ ...form, contractCode: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Tên hợp đồng *</label>
                                <input
                                    disabled={isView || isEditMode}
                                    className={inputStyle}
                                    placeholder="Hợp đồng thuê kho"
                                    value={form.contractName}
                                    onChange={(e) => setForm({ ...form, contractName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Loại hợp đồng</label>
                                <select
                                    disabled={isView || isEditMode}
                                    className={inputStyle}
                                    value={form.contractType}
                                    onChange={(e) => setForm({ ...form, contractType: e.target.value as contractType })}
                                >
                                    <option value="SHARED_STORAGE">Kho chung</option>
                                    <option value="RESERVED_STORAGE">Kho dự trữ</option>
                                    <option value="DEDICATED_ZONE">Khu riêng</option>
                                    <option value="DEDICATED_WAREHOUSE">Kho riêng</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelStyle}>Trạng thái</label>
                                <select
                                    disabled={isView }
                                    className={inputStyle}
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value as status })}
                                >
                                    <option value="DRAFT">Chờ xử lý</option>
                                    <option value="PENDING_APPROVAL">Đang xem xét</option>
                                    <option value="ACTIVE">Đã phê duyệt</option>
                                    <option value="EXPIRED">Đã từ chối</option>
                                    <option value="TERMINATED">Đã chuyển đổi</option>
                                    <option value="CANCELLED">Đã hủy</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section: Mô hình thanh toán */}
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-emerald-700 tracking-[2px]">MÔ HÌNH THANH TOÁN</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Mô hình định giá</label>
                                <select
                                    disabled={isView || isEditMode}
                                    className={inputStyle}
                                    value={form.pricingModel}
                                    onChange={(e) => setForm({ ...form, pricingModel: e.target.value as pricingModel })}
                                >
                                    <option value="USAGE_BASED">Dựa trên sử dụng</option>
                                    <option value="HYBRID">Kết hợp</option>
                                    <option value="FIXED">Cố định</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelStyle}>Chu kỳ thanh toán</label>
                                <select
                                    disabled={isView || isEditMode}
                                    className={inputStyle}
                                    value={form.billingCycle}
                                    onChange={(e) => setForm({ ...form, billingCycle: e.target.value as billingCycle })}
                                >
                                    <option value="DAILY">Hàng ngày</option>
                                    <option value="MONTHLY">Hàng tháng</option>
                                    <option value="QUARTERLY">Hàng quý</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelStyle}>Ngày thanh toán tối thiểu *</label>
                                <input
                                    disabled={isView || isEditMode}
                                    type="number"
                                    className={inputStyle}
                                    placeholder="30"
                                    value={form.minimumBillingDays}
                                    onChange={(e) => setForm({ ...form, minimumBillingDays: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Số tiền thanh toán dự kiến</label>
                                <input
                                    disabled={isView || isEditMode}
                                    type="number"
                                    className={inputStyle}
                                    placeholder="0"
                                    value={form.estimatedTotalAmount}
                                    onChange={(e) => setForm({ ...form, estimatedTotalAmount: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Thời hạn */}
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-orange-700 tracking-[2px]">THỜI HẠN HỢP ĐỒNG</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Ngày bắt đầu *</label>
                                <input
                                    disabled={isView || isEditMode}
                                    type="date"
                                    className={inputStyle}
                                    value={form.startDate}
                                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Ngày kết thúc *</label>
                                <input
                                    disabled={isView || isEditMode}
                                    type="date"
                                    className={inputStyle}
                                    value={form.endDate}
                                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Cấu hình bổ sung */}
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-purple-700 tracking-[2px]">CẤU HÌNH BỔ SUNG</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Dung tích dự trữ tối thiểu (m²)</label>
                                <input
                                    disabled={isView || isEditMode}
                                    type="number"
                                    className={inputStyle}
                                    placeholder="0"
                                    value={form.minimumReservedCapacity}
                                    onChange={(e) => setForm({ ...form, minimumReservedCapacity: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="flex items-center gap-3 md:pt-6">
                                <input
                                    disabled={isView || isEditMode}
                                    type="checkbox"
                                    id="autoRenew"
                                    checked={form.autoRenew}
                                    onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })}
                                    className="w-5 h-5 cursor-pointer accent-cyan-600 border-slate-300 rounded"
                                />
                                <label htmlFor="autoRenew" className="text-sm font-medium text-slate-700 cursor-pointer">Gia hạn tự động</label>
                            </div>
                        </div>
                    </div>

                    {/* Section: Chữ ký */}
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-red-700 tracking-[2px]">CHỮ KÝ</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Chữ ký của thương nhân</label>
                                <input
                                    disabled={isView }
                                    className={inputStyle}
                                    placeholder="Nhập tên người ký"
                                    value={form.tenantSignature}
                                    onChange={(e) => setForm({ ...form, tenantSignature: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Chữ ký của kho</label>
                                <input
                                    disabled={isView}
                                    className={inputStyle}
                                    placeholder="Nhập tên người ký"
                                    value={form.warehouseSignature}
                                    onChange={(e) => setForm({ ...form, warehouseSignature: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Nhật ký thời gian */}
                    {!isCreate && data && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <label className={labelStyle}>Ngày tạo</label>
                                <input
                                    disabled
                                    className={inputStyle}
                                    value={data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : '---'}
                                />
                            </div>
                            <div>
                                <label className={labelStyle}>Cập nhật cuối</label>
                                <input
                                    disabled
                                    className={inputStyle}
                                    value={data.updatedAt ? new Date(data.updatedAt).toLocaleString('vi-VN') : '---'}
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
                            {isCreate ? 'Tạo hợp đồng' : 'Lưu thay đổi'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}