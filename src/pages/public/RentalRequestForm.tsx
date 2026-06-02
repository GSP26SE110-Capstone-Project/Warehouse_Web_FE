import React, { useState, useEffect } from 'react'
import type { ContractType, RentalRequestRequest } from '../../types/RentalRequest'
import { rentalRequestApi } from '../../service/rentalRequestApi'
import { addressApi } from '../../service/AdrressApi'
import { tenantCompanyApi } from '../../service/tenantCompany'
import type { TenantRequest } from '../../types/TenantCompany'

interface RentalRequestFormProps {
  contractType: ContractType
  onContractTypeChange: (type: ContractType) => void
  onSubmitted: (requestCode: string, contactEmail: string) => void
}
interface District {
  districtId: string
  districtName: string
}
interface City {
  cityId: string
  cityName: string
  districts: District[]
}

interface RentalRequestFormProps {
  contractType: ContractType
  onContractTypeChange: (type: ContractType) => void
  onSubmitted: (requestCode: string, contactEmail: string) => void
}

export const RentalRequestForm: React.FC<RentalRequestFormProps> = ({
  contractType,
  onContractTypeChange,
  onSubmitted,
}) => {
  // Các state cơ bản của Tenant / Company
  const [name, setName] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')


  const [cities, setCities] = useState<City[]>([]) 
  const [city, setCity] = useState('')             
  const [district, setDistrict] = useState('')
  const [expectedStartDate, setExpectedStartDate] = useState(
    new Date().toISOString().split('T')[0] 
  )
  const [expectedEndDate, setExpectedEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Mặc định là +30 ngày sau
  )

  // Các state mới cho Rental Request bổ sung
  const [pricingModel, setPricingModel] = useState<'USAGE_BASED' | 'FIXED' | 'HYBRID'>('USAGE_BASED')
  const [billingCycle, setBillingCycle] = useState<'DAILY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('DAILY')

  const [estimatedSkuCount, setEstimatedSkuCount] = useState('0')
  const [estimatedBoxCount, setEstimatedBoxCount] = useState('0')
  const [area, setArea] = useState('')
  const [averageStorageDays, setAverageStorageDays] = useState('0')
  const [estimatedInboundPerWeek, setEstimatedInboundPerWeek] = useState('0')
  const [estimatedOutboundPerWeek, setEstimatedOutboundPerWeek] = useState('0')

  const [requiresFastPicking, setRequiresFastPicking] = useState(false)
  const [requiresPremiumStorage, setRequiresPremiumStorage] = useState(false)
  const [note, setNote] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. useEffect: Gọi API lấy toàn bộ danh sách City & District khi component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Thay bằng hàm gọi API thực tế của bạn, ví dụ: axios.get('/api/locations')
        const response = await addressApi.getAllLocations()
        if (response.data && response.data.success) {
          const listCities = response.data.data.cities
          setCities(listCities)

          // Thiết lập giá trị mặc định ban đầu là thành phố đầu tiên (nếu có dữ liệu)
          if (listCities.length > 0) {
            setCity(listCities[0].cityName)
            if (listCities[0].districts.length > 0) {
              setDistrict(listCities[0].districts[0].districtName)
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách địa điểm:', err)
      }
    }
    fetchLocations()
  }, [])

  // Tìm đối tượng City hiện tại đang được chọn để lấy ra mảng districts của nó
  const currentCityObj = cities.find(c => c.cityName === city)
  const availableDistricts = currentCityObj ? currentCityObj.districts : []

  // 2. Xử lý khi người dùng thay đổi Thành phố
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCityName = e.target.value
    setCity(selectedCityName)

    // Tự động cập nhật Quận/Huyện thành phần tử đầu tiên của Thành phố mới đó
    const targetCity = cities.find(c => c.cityName === selectedCityName)
    if (targetCity && targetCity.districts.length > 0) {
      setDistrict(targetCity.districts[0].districtName)
    } else {
      setDistrict('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !phone || !name) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc (*)')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. GỌI API TẠO TENANT COMPANY TRƯỚC
      const companyData: TenantRequest = {
        companyName: name,
        taxCode: taxCode || 'N/A',
        contactName: name,
        contactEmail: email,
        contactPhone: phone,
        address: address || 'N/A',
        companyCode: companyCode || undefined,
        status: 'ACTIVE'
      }

      const companyResponse = await tenantCompanyApi.create(companyData)

      // Giả sử API trả về ID của Tenant vừa tạo: companyResponse.data.tenantId
      const generatedTenantId = companyResponse?.data?.data.tenantId || '3fa85f64-5717-4562-b3fc-2c963f66afa6'

      // 2. CHUẨN BỊ DỮ LIỆU RENTAL REQUEST
      const requestCode = `RR-${Date.now()}`
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)

      const rentalRequestData: RentalRequestRequest = {
        tenantId: generatedTenantId,
        estimatedOutboundPerWeek: parseInt(estimatedInboundPerWeek) || 0,
        city,
        district,
        contractType, // Lấy từ props hoặc cập nhật trực tiếp qua button nhóm bên dưới
        pricingModel,
        billingCycle,
        estimatedSkuCount: parseInt(estimatedSkuCount) || 0,
        estimatedBoxCount: parseInt(estimatedBoxCount) || 0,
        estimatedVolume: parseFloat(area) || 0,
        requestedAreaM2: parseFloat(area) || 0,
        averageStorageDays: parseInt(averageStorageDays) || 0,
        estimatedInboundPerWeek: parseInt(estimatedInboundPerWeek) || 0,
        requiresFastPicking,
        requiresPremiumStorage,
        notes: note,
        suggestedZoneType: 'SHARED',
        suggestedRackType: 'STANDARD',
        expectedStartDate: startDate.toISOString(),
        expectedEndDate: endDate.toISOString(),
        status: 'PENDING',
        createdBy: ''
      }

      // 3. GỌI API TẠO RENTAL REQUEST
      const response = await rentalRequestApi.create(rentalRequestData)

      if (response.data.success) {
        onSubmitted(requestCode, email)
        // Reset form
        setName('')
        setArea('')
        setNote('')
        setEmail('')
        setPhone('')
        setCompanyCode('')
        setTaxCode('')
        setAddress('')
        setEstimatedSkuCount('0')
        setEstimatedBoxCount('0')
        setAverageStorageDays('0')
        setEstimatedInboundPerWeek('0')
        setRequiresFastPicking(false)
        setRequiresPremiumStorage(false)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi xử lý hệ thống'
      setError(errorMessage)
      console.error('Lỗi gửi chuỗi yêu cầu:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 max-w-4xl mx-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-3">
        <span className="material-symbols-outlined text-[#0077b6]">edit_note</span>
        Đăng ký Thông tin Doanh nghiệp & Thuê kho
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* PHẦN 1: THÔNG TIN CÔNG TY / TENANT */}
        <div>
          <h4 className="text-sm font-bold text-[#0077b6] uppercase mb-3 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">corporate_fare</span>
            1. Thông tin doanh nghiệp (Tenant)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Tên công ty / Người đại diện *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Công ty TNHH Giải Pháp Logistics XYZ"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Mã số thuế *
              </label>
              <input
                type="text"
                required
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                placeholder="0102345678"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email liên hệ *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Số điện thoại *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Địa chỉ đăng ký kinh doanh
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số 123, Đường ABC, Phường X..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* PHẦN 2: THÔNG TIN RENTAL REQUEST */}
        <div>
          <h4 className="text-sm font-bold text-[#0077b6] uppercase mb-3 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">warehouse</span>
            2. Nhu cầu cấu hình thuê kho (Rental Request)
          </h4>

          <div className="space-y-4">
            {/* Lựa chọn loại hợp đồng (Contract Type) bằng Button Group */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Loại hình thuê kho (Contract Type)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['SHARED_STORAGE', 'RESERVED_STORAGE', 'DEDICATED_ZONE', 'DEDICATED_WAREHOUSE'] as ContractType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onContractTypeChange(type)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${contractType === type
                      ? 'bg-[#0077b6] text-white border-[#0077b6] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Lựa chọn Mô hình giá (Pricing Model) bằng Button Group */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Mô hình tính giá (Pricing Model)
              </label>
              <div className="grid grid-cols-3 gap-2 max-w-md">
                {(['USAGE_BASED', 'FIXED', 'HYBRID'] as const).map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setPricingModel(model)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${pricingModel === model
                      ? 'bg-[#0077b6] text-white border-[#0077b6] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>

            {/* Lựa chọn Chu kỳ thanh toán (Billing Cycle) bằng Button Group */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Chu kỳ thanh toán (Billing Cycle)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['DAILY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBillingCycle(cycle)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${billingCycle === cycle
                      ? 'bg-[#0077b6] text-white border-[#0077b6] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {cycle}
                  </button>
                ))}
              </div>
            </div>

            {/* Vị trí địa lý & Gợi ý nhà kho */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Thành phố mong muốn *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
                >
                  <option value="">-- Chọn thành phố --</option>
                  {cities.map((c) => (
                    <option key={c.cityId} value={c.cityName}>
                      {c.cityName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Quận / Huyện mong muốn *
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={availableDistricts.length === 0}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors disabled:opacity-60"
                >
                  {availableDistricts.length === 0 && <option>Chọn thành phố trước</option>}
                  {availableDistricts.map((d) => (
                    <option key={d.districtId} value={d.districtName}>
                      {d.districtName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
              <div>
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Ngày bắt đầu thuê mong muốn *
                </label>
                <input
                  type="date"
                  required
                  value={expectedStartDate}
                  onChange={(e) => setExpectedStartDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#0077b6] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Ngày kết thúc hợp đồng mong muốn *
                </label>
                <input
                  type="date"
                  required
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#0077b6] transition-colors"
                />
              </div>
            </div>

            {/* Thông số kỹ thuật của hàng hóa vận hành */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Diện tích / Thể tích (m²/m³)
                </label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ví dụ: 100"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ước tính số SKU
                </label>
                <input
                  type="number"
                  value={estimatedSkuCount}
                  onChange={(e) => setEstimatedSkuCount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ước tính số Box (Thùng)
                </label>
                <input
                  type="number"
                  value={estimatedBoxCount}
                  onChange={(e) => setEstimatedBoxCount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ngày lưu kho TB (Ngày)
                </label>
                <input
                  type="number"
                  value={averageStorageDays}
                  onChange={(e) => setAverageStorageDays(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Lượng hàng nhập dự kiến / Tuần
                </label>
                <input
                  type="number"
                  value={estimatedInboundPerWeek}
                  onChange={(e) => setEstimatedInboundPerWeek(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
                />
              </div>
               <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Lượng hàng xuất dự kiến / Tuần
                </label>
                <input
                  type="number"
                  value={estimatedOutboundPerWeek}
                  onChange={(e) => setEstimatedOutboundPerWeek(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Phần Tick Chọn Boolean (Yêu cầu đặc biệt) */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={requiresFastPicking}
                  onChange={(e) => setRequiresFastPicking(e.target.checked)}
                  className="w-4 h-4 text-[#0077b6] border-gray-300 rounded focus:ring-[#0077b6]"
                />
                Yêu cầu lấy hàng nhanh (Fast Picking)
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={requiresPremiumStorage}
                  onChange={(e) => setRequiresPremiumStorage(e.target.checked)}
                  className="w-4 h-4 text-[#0077b6] border-gray-300 rounded focus:ring-[#0077b6]"
                />
                Lưu trữ cao cấp (Premium Storage)
              </label>
            </div>

            

            {/* Ghi chú thêm */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Ghi chú hệ thống & Mô tả thêm loại hàng
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Hàng giá trị cao, cần kiểm soát nhiệt độ..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Nút submit liên chuỗi 2 API */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0077b6] hover:bg-[#0096c7] text-white font-bold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">cloud_upload</span>
              Gửi yêu cầu & Khởi tạo tài khoản hệ thống
            </>
          )}
        </button>
      </form>
    </div>
  )
}