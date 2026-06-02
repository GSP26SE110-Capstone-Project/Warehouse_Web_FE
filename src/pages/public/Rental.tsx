import { useState, useEffect } from 'react'
import type { WarehouseResponse } from '../../types/Warehouse'
import { warehouseApi } from '../../service/warehouseApi'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { PublicHeader } from '../../components/common/header/PublicHeader'

export const Rental = () => {
    const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
    const [loading, setLoading] = useState(false)

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


    if (loading) return <LoadingOverlay show={true} />

    return (
        <div className="min-h-screen bg-white">
            <PublicHeader mode="aboutus" showBackButton title="Thông tin kho" />

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

        </div>
    )
}