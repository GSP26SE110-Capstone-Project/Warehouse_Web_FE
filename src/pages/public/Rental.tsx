import { useState, useEffect } from 'react'
import type { WarehouseResponse } from '../../types/Warehouse'
import type { TenantRequest } from '../../types/TenantCompany'
import type { RentalRequestRequest } from '../../types/RentalRequest'
import { warehouseApi } from '../../service/warehouseApi'
import { tenantCompanyApi } from '../../service/tenantCompany'
import { rentalRequestApi } from '../../service/rentalRequestApi'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'

export const Rental = () => {
    const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [step, setStep] = useState(1)
    const [tenantId, setTenantId] = useState('')

    // Step 1: TenantCompany form
    const [tenantForm, setTenantForm] = useState({
        warehouseId: '',
        companyName: '',
        companyCode: '',
        taxCode: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
    })

    // Step 2: RentalRequest form
    const [rentalForm, setRentalForm] = useState({
        contractType: 'SHARED_STORAGE' as const,
        pricingModel: 'USAGE_BASED' as const,
        billingCycle: 'MONTHLY',
        estimatedSkuCount: 0,
        estimatedBoxCount: 0,
        estimatedVolume: 0,
        averageStorageDays: 0,
        estimatedInboundPerWeek: 0,
        estimatedOutboundPerWeek: 0,
        requiresFastPicking: false,
        requiresPremiumStorage: false,
        notes: '',
        suggestedZoneType: '',
        suggestedRackType: '',
        expectedStartDate: new Date().toISOString().split('T')[0],
        expectedEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                setLoading(true)
                const response = await warehouseApi.getAll()
                if (response.data && response.data.data) {
                    setWarehouses(Array.isArray(response.data.data) ? response.data.data : [response.data.data])
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchWarehouses()
    }, [])

    const handleTenantInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setTenantForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleRentalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        const checked = (e.target as HTMLInputElement).checked

        setRentalForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
        }))
    }

    // Step 1: Submit TenantCompany
    const handleTenantSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!tenantForm.warehouseId || !tenantForm.companyName || !tenantForm.contactName || !tenantForm.contactEmail || !tenantForm.contactPhone) {
            setError('Vui lòng điền các trường bắt buộc')
            return
        }

        try {
            setSubmitting(true)
            setError('')

            const tenantData: TenantRequest = {
                companyName: tenantForm.companyName,
                companyCode: tenantForm.companyCode || `COMP-${Date.now()}`,
                taxCode: tenantForm.taxCode || '',
                contactName: tenantForm.contactName,
                contactEmail: tenantForm.contactEmail,
                contactPhone: tenantForm.contactPhone,
                address: tenantForm.address || '',
                status: 'ACTIVE'
            }

            console.log('Creating TenantCompany:', tenantData)
            const tenantResponse = await tenantCompanyApi.create(tenantData)
            
            if (!tenantResponse.data.success || !tenantResponse.data.data) {
                throw new Error('Lỗi tạo công ty')
            }

            const newTenantId = tenantResponse.data.data.tenantId
            setTenantId(newTenantId)
            console.log('TenantCompany created:', newTenantId)
            
            setSuccess('✓ Thông tin công ty đã được lưu thành công!')
            setTimeout(() => {
                setSuccess('')
                setStep(2)
            }, 1500)
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Lỗi tạo công ty'
            setError(errorMsg)
            console.error('Error:', err)
        } finally {
            setSubmitting(false)
        }
    }

    // Step 2: Submit RentalRequest
  const handleRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
        setSubmitting(true)
        setError('')

        const rentalData: RentalRequestRequest = {
            tenantId: tenantId, // Thêm dòng này
            warehouseId: tenantForm.warehouseId,
            requestCode: `RR-${Date.now()}`,
            companyName: tenantForm.companyName,
            companyCode: tenantForm.companyCode || `COMP-${Date.now()}`,
            taxCode: tenantForm.taxCode || '',
            address: tenantForm.address || '',
            contactName: tenantForm.contactName,
            contactEmail: tenantForm.contactEmail,
            contactPhone: tenantForm.contactPhone,
            contractType: rentalForm.contractType,
            pricingModel: rentalForm.pricingModel,
            billingCycle: rentalForm.billingCycle,
            estimatedSkuCount: rentalForm.estimatedSkuCount,
            estimatedBoxCount: rentalForm.estimatedBoxCount,
            estimatedVolume: rentalForm.estimatedVolume,
            averageStorageDays: rentalForm.averageStorageDays,
            estimatedInboundPerWeek: rentalForm.estimatedInboundPerWeek,
            estimatedOutboundPerWeek: rentalForm.estimatedOutboundPerWeek,
            requiresFastPicking: rentalForm.requiresFastPicking,
            requiresPremiumStorage: rentalForm.requiresPremiumStorage,
            notes: rentalForm.notes,
            suggestedZoneType: rentalForm.suggestedZoneType,
            suggestedRackType: rentalForm.suggestedRackType,
            expectedStartDate: rentalForm.expectedStartDate,
            expectedEndDate: rentalForm.expectedEndDate,
            status: 'PENDING'
        }

        console.log('Creating RentalRequest:', rentalData)
        const rentalResponse = await rentalRequestApi.create(rentalData)
        
        if (!rentalResponse.data.success) {
            throw new Error('Lỗi tạo yêu cầu thuê kho')
        }

        console.log('RentalRequest created:', rentalResponse.data.data)

        setSuccess('✓ Yêu cầu thuê kho đã được gửi thành công! Chúng tôi sẽ liên hệ trong 24 giờ.')
        
        setTimeout(() => {
            setStep(1)
            setTenantId('')
            setTenantForm({
                warehouseId: '',
                companyName: '',
                companyCode: '',
                taxCode: '',
                contactName: '',
                contactEmail: '',
                contactPhone: '',
                address: '',
            })
            setRentalForm({
                contractType: 'SHARED_STORAGE',
                pricingModel: 'USAGE_BASED',
                billingCycle: 'MONTHLY',
                estimatedSkuCount: 0,
                estimatedBoxCount: 0,
                estimatedVolume: 0,
                averageStorageDays: 0,
                estimatedInboundPerWeek: 0,
                estimatedOutboundPerWeek: 0,
                requiresFastPicking: false,
                requiresPremiumStorage: false,
                notes: '',
                suggestedZoneType: '',
                suggestedRackType: '',
                expectedStartDate: new Date().toISOString().split('T')[0],
                expectedEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            })
            setSuccess('')
        }, 3000)
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Lỗi gửi yêu cầu'
        setError(errorMsg)
        console.error('Error:', err)
    } finally {
        setSubmitting(false)
    }
}

    const handleBackToStep1 = () => {
        setStep(1)
        setError('')
    }

    if (loading) return <LoadingOverlay show={true} />

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-600 to-blue-900 text-white py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-5xl font-bold mb-6 leading-tight">
                                Giải Pháp Kho Bãi Chuyên Nghiệp
                            </h1>
                            <p className="text-xl text-blue-100 mb-4">
                                Nền tảng quản lý kho thông minh với công nghệ hiện đại
                            </p>
                            <p className="text-lg text-blue-200">
                                Tối ưu hóa dung lượng, giảm chi phí vận hành, tăng hiệu suất logistics
                            </p>
                        </div>
                        <div className="bg-blue-500/30 rounded-lg p-8 backdrop-blur-sm border border-blue-400">
                            <img src="https://via.placeholder.com/400x300" alt="Warehouse" className="rounded-lg w-full" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">
                        Tại Sao Chọn Chúng Tôi?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-blue-600 text-4xl">warehouse</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Hệ Thống Kho Hiện Đại</h3>
                            <p className="text-slate-600">
                                Các kho bãi được trang bị công nghệ tự động hóa, hệ thống kiểm soát nhiệt độ và độ ẩm
                            </p>
                        </div>

                        <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-emerald-600 text-4xl">trending_up</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Quản Lý Tối Ưu</h3>
                            <p className="text-slate-600">
                                Theo dõi hàng hóa theo thời gian thực, tối ưu hóa vị trí lưu trữ, giảm thời gian picking
                            </p>
                        </div>

                        <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-rose-600 text-4xl">verified_user</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Bảo Mật Cao</h3>
                            <p className="text-slate-600">
                                Hệ thống giám sát 24/7, kiểm soát truy cập, bảo hiểm toàn bộ hàng hóa
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">
                        Các Dịch Vụ Của Chúng Tôi
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="border-l-4 border-blue-600 pl-6">
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Lưu Trữ Chung</h3>
                            <p className="text-slate-600 mb-4">
                                Chia sẻ không gian với các công ty khác, giá cả phải chăng, linh hoạt thời hạn
                            </p>
                            <ul className="text-slate-600 space-y-2">
                                <li>✓ Giá cạnh tranh</li>
                                <li>✓ Hợp đồng ngắn hạn</li>
                                <li>✓ Dịch vụ bổ sung</li>
                            </ul>
                        </div>

                        <div className="border-l-4 border-emerald-600 pl-6">
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Kho Dự Trữ</h3>
                            <p className="text-slate-600 mb-4">
                                Không gian dành riêng với dung lượng tối thiểu đảm bảo, quản lý bán tự động
                            </p>
                            <ul className="text-slate-600 space-y-2">
                                <li>✓ Dung lượng ưu tiên</li>
                                <li>✓ Quản lý chuyên biệt</li>
                                <li>✓ Báo cáo chi tiết</li>
                            </ul>
                        </div>

                        <div className="border-l-4 border-purple-600 pl-6">
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Khu Riêng Biệt</h3>
                            <p className="text-slate-600 mb-4">
                                Khu vực độc lập với quy trình nhập-xuất tối ưu cho sản phẩm đặc biệt
                            </p>
                            <ul className="text-slate-600 space-y-2">
                                <li>✓ Kiểm soát truy cập</li>
                                <li>✓ Quản lý hàng hóa</li>
                                <li>✓ Báo cáo theo yêu cầu</li>
                            </ul>
                        </div>

                        <div className="border-l-4 border-orange-600 pl-6">
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Kho Riêng</h3>
                            <p className="text-slate-600 mb-4">
                                Toàn bộ không gian cho một khách hàng, dịch vụ cao cấp và tùy chỉnh hoàn toàn
                            </p>
                            <ul className="text-slate-600 space-y-2">
                                <li>✓ Tùy chỉnh hoàn toàn</li>
                                <li>✓ Dịch vụ premium</li>
                                <li>✓ Hỗ trợ 24/7</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">
                        Quy Trình Đơn Giản
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                                1
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Gửi Yêu Cầu</h3>
                            <p className="text-slate-600 text-sm">Điền thông tin chi tiết về nhu cầu kho bãi</p>
                        </div>

                        <div className="hidden md:flex items-center justify-center text-blue-600">
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                                2
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Tư Vấn</h3>
                            <p className="text-slate-600 text-sm">Đội ngũ tư vấn liên hệ để thảo luận</p>
                        </div>

                        <div className="hidden md:flex items-center justify-center text-blue-600">
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                                3
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Ký Hợp Đồng</h3>
                            <p className="text-slate-600 text-sm">Ký hợp đồng thuê kho chính thức</p>
                        </div>

                        <div className="hidden md:flex items-center justify-center text-blue-600">
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                                4
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Vận Hành</h3>
                            <p className="text-slate-600 text-sm">Bắt đầu sử dụng dịch vụ kho bãi</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-5xl font-bold mb-2">15+</div>
                            <p className="text-blue-100">Kho Bãi Hoạt Động</p>
                        </div>
                        <div>
                            <div className="text-5xl font-bold mb-2">500+</div>
                            <p className="text-blue-100">Khách Hàng Hài Lòng</p>
                        </div>
                        <div>
                            <div className="text-5xl font-bold mb-2">99.9%</div>
                            <p className="text-blue-100">Độ Tin Cậy</p>
                        </div>
                        <div>
                            <div className="text-5xl font-bold mb-2">24/7</div>
                            <p className="text-blue-100">Hỗ Trợ Khách Hàng</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Form Section */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-8 mb-12">
                        <div className={`flex items-center gap-3 ${step === 1 ? 'opacity-100' : 'opacity-50'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${step === 1 ? 'bg-blue-600' : 'bg-slate-400'}`}>
                                1
                            </div>
                            <span className={`font-semibold ${step === 1 ? 'text-slate-900' : 'text-slate-500'}`}>Thông Tin Công Ty</span>
                        </div>
                        <div className={`w-12 h-1 ${step === 2 ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                        <div className={`flex items-center gap-3 ${step === 2 ? 'opacity-100' : 'opacity-50'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${step === 2 ? 'bg-blue-600' : 'bg-slate-400'}`}>
                                2
                            </div>
                            <span className={`font-semibold ${step === 2 ? 'text-slate-900' : 'text-slate-500'}`}>Yêu Cầu Thuê Kho</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
                            <span className="material-symbols-outlined flex-shrink-0">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-start gap-3">
                            <span className="material-symbols-outlined flex-shrink-0">check_circle</span>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* STEP 1: TenantCompany Form */}
                    {step === 1 && (
                        <>
                            <h2 className="text-3xl font-bold text-center mb-2 text-slate-900">
                                Thông Tin Công Ty
                            </h2>
                            <p className="text-center text-slate-600 mb-8">
                                Bước 1: Vui lòng điền thông tin công ty của bạn
                            </p>

                            <form onSubmit={handleTenantSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Chọn Kho <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="warehouseId"
                                            value={tenantForm.warehouseId}
                                            onChange={handleTenantInputChange}
                                            required
                                            className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">-- Chọn kho --</option>
                                            {warehouses.map(wh => (
                                                <option key={wh.warehouseId} value={wh.warehouseId}>
                                                    {wh.warehouseName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Tên Công Ty <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={tenantForm.companyName}
                                            onChange={handleTenantInputChange}
                                            required
                                            className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Tên công ty"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Mã Công Ty
                                        </label>
                                        <input
                                            type="text"
                                            name="companyCode"
                                            value={tenantForm.companyCode}
                                            onChange={handleTenantInputChange}
                                            className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Mã công ty"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Mã Số Thuế
                                        </label>
                                        <input
                                            type="text"
                                            name="taxCode"
                                            value={tenantForm.taxCode}
                                            onChange={handleTenantInputChange}
                                            className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Mã số thuế"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Địa Chỉ
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={tenantForm.address}
                                        onChange={handleTenantInputChange}
                                        className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Địa chỉ công ty"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-4">
                                        Thông Tin Liên Hệ <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-600 mb-2">Họ Tên</label>
                                            <input
                                                type="text"
                                                name="contactName"
                                                value={tenantForm.contactName}
                                                onChange={handleTenantInputChange}
                                                required
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Tên người liên hệ"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-600 mb-2">Email</label>
                                            <input
                                                type="email"
                                                name="contactEmail"
                                                value={tenantForm.contactEmail}
                                                onChange={handleTenantInputChange}
                                                required
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-600 mb-2">Số Điện Thoại</label>
                                            <input
                                                type="tel"
                                                name="contactPhone"
                                                value={tenantForm.contactPhone}
                                                onChange={handleTenantInputChange}
                                                required
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0123456789"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="animate-spin material-symbols-outlined text-sm">refresh</span>
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined">arrow_forward</span>
                                                Tiếp Tục
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* STEP 2: RentalRequest Form */}
                    {step === 2 && (
                        <>
                            <h2 className="text-3xl font-bold text-center mb-2 text-slate-900">
                                Yêu Cầu Thuê Kho
                            </h2>
                            <p className="text-center text-slate-600 mb-8">
                                Bước 2: Vui lòng điền thông tin chi tiết yêu cầu thuê kho
                            </p>

                            <form onSubmit={handleRentalSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-8">
                                
                                {/* Tenant Info Display */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                    <h3 className="font-bold text-slate-900 mb-3">Thông Tin Công Ty (Từ Bước 1)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-600">Tên Công Ty:</p>
                                            <p className="font-semibold text-slate-900">{tenantForm.companyName}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Người Liên Hệ:</p>
                                            <p className="font-semibold text-slate-900">{tenantForm.contactName}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Email:</p>
                                            <p className="font-semibold text-slate-900">{tenantForm.contactEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Điện Thoại:</p>
                                            <p className="font-semibold text-slate-900">{tenantForm.contactPhone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Loại Hợp Đồng & Mô Hình Giá */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Loại Hợp Đồng & Giá</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Loại Hợp Đồng
                                            </label>
                                            <select
                                                name="contractType"
                                                value={rentalForm.contractType}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="SHARED_STORAGE">Kho Chung</option>
                                                <option value="RESERVED_STORAGE">Kho Dự Trữ</option>
                                                <option value="DEDICATED_ZONE">Khu Riêng Biệt</option>
                                                <option value="DEDICATED_WAREHOUSE">Kho Riêng</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Mô Hình Giá
                                            </label>
                                            <select
                                                name="pricingModel"
                                                value={rentalForm.pricingModel}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="USAGE_BASED">Theo Lượng Sử Dụng</option>
                                                <option value="FIXED">Giá Cố Định</option>
                                                <option value="HYBRID">Kết Hợp</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Chu Kỳ & Ngày */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Chu Kỳ Thanh Toán & Thời Gian</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Chu Kỳ Thanh Toán
                                            </label>
                                            <input
                                                type="text"
                                                name="billingCycle"
                                                value={rentalForm.billingCycle}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="MONTHLY, QUARTERLY"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Ngày Bắt Đầu
                                            </label>
                                            <input
                                                type="date"
                                                name="expectedStartDate"
                                                value={rentalForm.expectedStartDate}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Ngày Kết Thúc
                                            </label>
                                            <input
                                                type="date"
                                                name="expectedEndDate"
                                                value={rentalForm.expectedEndDate}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dung Lượng & Lưu Trữ */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Dung Lượng & Lưu Trữ</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Số SKU Dự Kiến
                                            </label>
                                            <input
                                                type="number"
                                                name="estimatedSkuCount"
                                                value={rentalForm.estimatedSkuCount}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Số Hộp Dự Kiến
                                            </label>
                                            <input
                                                type="number"
                                                name="estimatedBoxCount"
                                                value={rentalForm.estimatedBoxCount}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Thể Tích Dự Kiến (m³)
                                            </label>
                                            <input
                                                type="number"
                                                name="estimatedVolume"
                                                value={rentalForm.estimatedVolume}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Nhập/Xuất & Lưu Trữ */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Nhập/Xuất & Thời Gian Lưu Trữ</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Ngày Lưu Trữ Trung Bình
                                            </label>
                                            <input
                                                type="number"
                                                name="averageStorageDays"
                                                value={rentalForm.averageStorageDays}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Lượt Nhập/Tuần
                                            </label>
                                            <input
                                                type="number"
                                                name="estimatedInboundPerWeek"
                                                value={rentalForm.estimatedInboundPerWeek}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Lượt Xuất/Tuần
                                            </label>
                                            <input
                                                type="number"
                                                name="estimatedOutboundPerWeek"
                                                value={rentalForm.estimatedOutboundPerWeek}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Yêu Cầu Đặc Biệt */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Yêu Cầu Đặc Biệt</h3>
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                name="requiresFastPicking"
                                                checked={rentalForm.requiresFastPicking}
                                                onChange={handleRentalInputChange}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="font-medium text-slate-700">Yêu Cầu Picking Nhanh</span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                name="requiresPremiumStorage"
                                                checked={rentalForm.requiresPremiumStorage}
                                                onChange={handleRentalInputChange}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="font-medium text-slate-700">Yêu Cầu Lưu Trữ Premium</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Loại Khu Vực & Giá Đơn Đề Xuất */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Đề Xuất Chi Tiết</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Loại Khu Vực Đề Xuất
                                            </label>
                                            <input
                                                type="text"
                                                name="suggestedZoneType"
                                                value={rentalForm.suggestedZoneType}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="SHARED, PREMIUM, BULK..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Loại Giá Đơn Đề Xuất
                                            </label>
                                            <input
                                                type="text"
                                                name="suggestedRackType"
                                                value={rentalForm.suggestedRackType}
                                                onChange={handleRentalInputChange}
                                                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="STANDARD, HIGH_CAPACITY..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Ghi Chú */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Ghi Chú Bổ Sung (Tùy Chọn)
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={rentalForm.notes}
                                        onChange={handleRentalInputChange}
                                        className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập ghi chú bổ sung về yêu cầu thuê kho của bạn..."
                                        rows={4}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={handleBackToStep1}
                                        className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                        Quay Lại
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="animate-spin material-symbols-outlined text-sm">refresh</span>
                                                Đang gửi...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined">check_circle</span>
                                                Gửi Yêu Cầu
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </section>

            {/* Footer CTA */}
            <section className="bg-slate-900 text-white py-12">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h3 className="text-2xl font-bold mb-4">Có Câu Hỏi?</h3>
                    <p className="text-slate-300 mb-6">
                        Liên hệ với chúng tôi qua email: info@warehouse.com hoặc gọi: +84 123 456 789
                    </p>
                </div>
            </section>
        </div>
    )
}