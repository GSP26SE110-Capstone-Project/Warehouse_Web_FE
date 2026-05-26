import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  computeEstimatedBoxCount,
  formatBoxEstimateSummary,
  suggestBoxTypeLabel,
} from '../../utils/rentalBoxEstimate'
import { ApiError } from '../../api/client'
import {
  fetchLocationTree,
  fetchRegionWarehouses,
  type LocationCity,
  type RegionWarehousesResult,
} from '../../api/locations'
import { createRentalRequest } from '../../api/rentalRequests'
import { createTenant } from '../../api/tenants'
import {
  BILLING_CYCLE_GUEST_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  defaultPricingModel,
  requestedAreaFieldHint,
  requestedAreaFieldLabel,
  showsRequestedAreaField,
  type ContractTypeValue,
} from '../../data/contractTypes'
import { LoadingOverlay } from '../ui/LoadingOverlay'
import { SearchableSelect } from '../ui/SearchableSelect'

const ZONE_TYPES = [
  { value: '', label: '— Chưa rõ / để kho tư vấn —' },
  { value: 'SHARED', label: 'Khu chia sẻ (Shared)' },
  { value: 'FAST_MOVING', label: 'Hàng xoay nhanh (Fast moving)' },
  { value: 'PREMIUM', label: 'Hàng cao cấp (Premium)' },
  { value: 'RETURN', label: 'Hàng trả (Return)' },
] as const

const RACK_TYPES = [
  { value: '', label: '— Chưa rõ / để kho tư vấn —' },
  { value: 'STANDARD', label: 'Kệ tiêu chuẩn' },
] as const

const inputWrapStyle = { border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' } as const

function formatAreaM2(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null
  return `${value.toLocaleString('vi-VN')} m²`
}

function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="pl-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-200">
        {children}
      </label>
      {hint && <p className="text-xs text-[#9bb9bb] mt-0.5">{hint}</p>}
    </div>
  )
}

function TextInput({
  id,
  type = 'text',
  required,
  value,
  onChange,
  placeholder,
  min,
}: {
  id: string
  type?: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  placeholder?: string
  min?: number
}) {
  return (
    <div className="input-glow relative rounded-lg" style={inputWrapStyle}>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full px-4 py-3 bg-transparent border-0 text-white focus:outline-none text-base"
      />
    </div>
  )
}

function SelectInput({
  id,
  required,
  value,
  onChange,
  options,
}: {
  id: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  options: readonly { value: string; label: string }[]
}) {
  return (
    <div className="input-glow relative rounded-lg" style={inputWrapStyle}>
      <select
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full px-4 py-3 bg-transparent border-0 text-white focus:outline-none text-base appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value || '_empty'} value={opt.value} className="bg-[#0f2223] text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function RentalRequestForm({
  contractType,
  onContractTypeChange,
  onSubmitted,
}: {
  contractType: ContractTypeValue
  onContractTypeChange: (value: ContractTypeValue) => void
  onSubmitted?: (requestCode: string, contactEmail: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ requestCode: string; companyName: string } | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [taxCode, setTaxCode] = useState('')

  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [locationCities, setLocationCities] = useState<LocationCity[]>([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [locationsError, setLocationsError] = useState('')
  const [regionWarehouses, setRegionWarehouses] = useState<RegionWarehousesResult | null>(null)
  const [regionWarehousesLoading, setRegionWarehousesLoading] = useState(false)
  const [billingCycle, setBillingCycle] = useState('MONTHLY')
  const [requestedAreaM2, setRequestedAreaM2] = useState('')
  const [estimatedTotalPieces, setEstimatedTotalPieces] = useState('')
  const [piecesPerBox, setPiecesPerBox] = useState('25')
  const [estimatedBoxCount, setEstimatedBoxCount] = useState('')
  const [boxCountManual, setBoxCountManual] = useState(false)
  const [estimatedSkuCount, setEstimatedSkuCount] = useState('')
  const [estimatedInboundPerWeek, setEstimatedInboundPerWeek] = useState('')
  const [estimatedOutboundPerWeek, setEstimatedOutboundPerWeek] = useState('')
  const [suggestedZoneType, setSuggestedZoneType] = useState('')
  const [suggestedRackType, setSuggestedRackType] = useState('')
  const [requiresFastPicking, setRequiresFastPicking] = useState(false)
  const [requiresPremiumStorage, setRequiresPremiumStorage] = useState(false)
  const [expectedStartDate, setExpectedStartDate] = useState('')
  const [expectedEndDate, setExpectedEndDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleContractTypeChange = (value: ContractTypeValue) => {
    onContractTypeChange(value)
  }

  const computedBoxCount = useMemo(() => {
    const total = Number(estimatedTotalPieces)
    const perBox = Number(piecesPerBox)
    return computeEstimatedBoxCount(total, perBox)
  }, [estimatedTotalPieces, piecesPerBox])

  useEffect(() => {
    if (boxCountManual || computedBoxCount == null) return
    setEstimatedBoxCount(String(computedBoxCount))
  }, [computedBoxCount, boxCountManual])

  const boxEstimateSummary = useMemo(() => {
    if (computedBoxCount == null) return null
    const total = Number(estimatedTotalPieces)
    const perBox = Number(piecesPerBox)
    if (!Number.isFinite(total) || !Number.isFinite(perBox)) return null
    return formatBoxEstimateSummary(total, perBox, computedBoxCount)
  }, [computedBoxCount, estimatedTotalPieces, piecesPerBox])

  const suggestedBoxType = useMemo(
    () => suggestBoxTypeLabel(Number(piecesPerBox)),
    [piecesPerBox]
  )

  useEffect(() => {
    let cancelled = false
    setLocationsLoading(true)
    setLocationsError('')
    fetchLocationTree()
      .then((tree) => {
        if (cancelled) return
        const cities = tree.cities ?? []
        setLocationCities(cities)
        if (cities.length > 0) {
          const defaultCity = cities.find((c) => c.cityName === 'TP.HCM') ?? cities[0]
          setCity(defaultCity.cityName)
          setDistrict(defaultCity.districts[0]?.districtName ?? '')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocationsError('Không tải được danh sách khu vực. Vui lòng tải lại trang.')
        }
      })
      .finally(() => {
        if (!cancelled) setLocationsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const districtOptions = useMemo(() => {
    const selected = locationCities.find((c) => c.cityName === city)
    return selected?.districts ?? []
  }, [locationCities, city])

  const handleCityChange = (nextCity: string) => {
    setCity(nextCity)
    const selected = locationCities.find((c) => c.cityName === nextCity)
    setDistrict(selected?.districts[0]?.districtName ?? '')
  }

  const citySelectOptions = useMemo(
    () => locationCities.map((c) => ({ value: c.cityName, label: c.cityName })),
    [locationCities]
  )

  const districtSelectOptions = useMemo(
    () => districtOptions.map((d) => ({ value: d.districtName, label: d.districtName })),
    [districtOptions]
  )

  useEffect(() => {
    if (!city || !district) {
      setRegionWarehouses(null)
      return
    }

    let cancelled = false
    setRegionWarehousesLoading(true)
    fetchRegionWarehouses(city, district)
      .then((data) => {
        if (!cancelled) setRegionWarehouses(data)
      })
      .catch(() => {
        if (!cancelled) {
          setRegionWarehouses({ count: 0, city, district, items: [] })
        }
      })
      .finally(() => {
        if (!cancelled) setRegionWarehousesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [city, district])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!contactEmail.trim()) {
      setError('Vui lòng nhập email liên hệ để tra cứu yêu cầu sau này')
      return
    }
    if (!city || !district) {
      setError('Vui lòng chọn thành phố và quận/huyện')
      return
    }
    if (!expectedStartDate || !expectedEndDate) {
      setError('Vui lòng chọn ngày bắt đầu và ngày kết thúc thuê kho dự kiến')
      return
    }
    if (expectedEndDate <= expectedStartDate) {
      setError('Ngày kết thúc phải sau ngày bắt đầu')
      return
    }
    setLoading(true)

    try {
      const tenant = await createTenant({
        companyName: companyName.trim(),
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim() || undefined,
        taxCode: taxCode.trim() || undefined,
      })

      const rental = await createRentalRequest({
        tenantId: tenant.tenantId,
        city: city.trim(),
        district: district.trim(),
        contractType,
        pricingModel: defaultPricingModel(contractType),
        billingCycle,
        estimatedBoxCount: estimatedBoxCount ? Number(estimatedBoxCount) : undefined,
        estimatedSkuCount: estimatedSkuCount ? Number(estimatedSkuCount) : undefined,
        estimatedInboundPerWeek: estimatedInboundPerWeek
          ? Number(estimatedInboundPerWeek)
          : undefined,
        estimatedOutboundPerWeek: estimatedOutboundPerWeek
          ? Number(estimatedOutboundPerWeek)
          : undefined,
        requestedAreaM2:
          showsRequestedAreaField(contractType) && requestedAreaM2
            ? Number(requestedAreaM2)
            : undefined,
        suggestedZoneType: suggestedZoneType || undefined,
        suggestedRackType: suggestedRackType || undefined,
        requiresFastPicking,
        requiresPremiumStorage,
        expectedStartDate: new Date(expectedStartDate).toISOString(),
        expectedEndDate: new Date(expectedEndDate).toISOString(),
        notes: notes.trim() || undefined,
      })

      setSuccess({
        requestCode: rental.requestCode,
        companyName: tenant.companyName,
      })
      onSubmitted?.(rental.requestCode, contactEmail.trim().toLowerCase())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gửi yêu cầu thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="glass-panel rounded-2xl p-8 sm:p-10 border-[#06edf9]/30 text-center">
        <span className="material-symbols-outlined text-5xl text-[#06edf9] mb-4">check_circle</span>
        <h3 className="text-2xl font-bold text-white mb-2">Đã gửi yêu cầu thuê kho</h3>
        <p className="text-[#9bb9bb] mb-6 max-w-md mx-auto">
          Công ty <strong className="text-white">{success.companyName}</strong> đã đăng ký thành công.
          Mã yêu cầu: <strong className="text-[#06edf9] font-mono">{success.requestCode}</strong>
        </p>
        <p className="text-sm text-[#9bb9bb] max-w-lg mx-auto">
          Lưu mã yêu cầu và email liên hệ để tra cứu trạng thái bất cứ lúc nào — không cần đăng nhập.
          Warehouse admin sẽ xem xét theo khu vực bạn chọn; System Admin cấp tài khoản sau khi được duyệt.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => document.getElementById('lookup')?.scrollIntoView({ behavior: 'smooth' })}
            className="auth-btn rounded-lg font-semibold py-3 px-8 border-0 cursor-pointer"
          >
            Tra cứu trạng thái
          </button>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="rounded-lg font-semibold py-3 px-8 border border-white/10 text-white hover:border-[#06edf9]/40 transition-colors cursor-pointer bg-transparent"
          >
            Gửi yêu cầu khác
          </button>
        </div>
      </div>
    )
  }

  const contractSelectOptions = CONTRACT_TYPE_OPTIONS.map((c) => ({
    value: c.value,
    label: c.title,
  }))

  return (
    <>
      <LoadingOverlay show={loading} text="Đang gửi yêu cầu..." />
      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 space-y-8">
        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <div>
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#06edf9]">business</span>
            Thông tin doanh nghiệp
          </h3>
          <p className="text-sm text-[#9bb9bb] mb-4">
            Đăng ký hồ sơ công ty. Tài khoản đăng nhập sẽ do System Admin cấp sau khi yêu cầu được duyệt.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <FieldLabel htmlFor="companyName">Tên công ty *</FieldLabel>
              <TextInput
                id="companyName"
                required
                value={companyName}
                onChange={setCompanyName}
                placeholder="Công ty TNHH ABC"
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="contactName">Người liên hệ</FieldLabel>
              <TextInput id="contactName" value={contactName} onChange={setContactName} placeholder="Nguyễn Văn A" />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="contactPhone">Số điện thoại</FieldLabel>
              <TextInput
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={setContactPhone}
                placeholder="0901234567"
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="contactEmail" hint="Dùng để tra cứu mã yêu cầu sau này">
                Email liên hệ *
              </FieldLabel>
              <TextInput
                id="contactEmail"
                type="email"
                required
                value={contactEmail}
                onChange={setContactEmail}
                placeholder="contact@company.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="taxCode">Mã số thuế</FieldLabel>
              <TextInput id="taxCode" value={taxCode} onChange={setTaxCode} placeholder="0123456789" />
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8">
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#06edf9]">inventory_2</span>
            Nhu cầu thuê kho
          </h3>
          <p className="text-sm text-[#9bb9bb] mb-4">
            Chọn khu vực mong muốn — kho phù hợp sẽ tiếp nhận yêu cầu khi duyệt. Loại hình thuê đã chọn ở phần
            giải thích phía trên.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {locationsError && (
              <p className="text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-4 py-2 sm:col-span-2">
                {locationsError}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="city" hint="Chọn tỉnh/thành phố có kho phục vụ">
                Thành phố *
              </FieldLabel>
              <SearchableSelect
                id="city"
                required
                value={city}
                onChange={handleCityChange}
                loading={locationsLoading}
                placeholder="Gõ tên thành phố..."
                options={citySelectOptions}
                emptyMessage="Không tìm thấy thành phố"
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="district" hint="Danh sách quận/huyện theo thành phố đã chọn">
                Quận / Huyện *
              </FieldLabel>
              <SearchableSelect
                id="district"
                required
                value={district}
                onChange={setDistrict}
                disabled={!city || locationsLoading}
                loading={locationsLoading}
                placeholder={city ? 'Gõ tên quận/huyện...' : 'Chọn thành phố trước'}
                options={districtSelectOptions}
                emptyMessage="Không tìm thấy quận/huyện"
              />
            </div>
            {city && district && (
              <div className="sm:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                {regionWarehousesLoading ? (
                  <p className="text-sm text-[#9bb9bb] flex items-center gap-2">
                    <span className="material-symbols-outlined text-base animate-pulse">warehouse</span>
                    Đang kiểm tra kho trong khu vực...
                  </p>
                ) : regionWarehouses && regionWarehouses.count > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-white font-medium">
                      Có{' '}
                      <span className="text-[#06edf9]">{regionWarehouses.count}</span> kho đang phục vụ{' '}
                      <span className="text-[#06edf9]">
                        {regionWarehouses.district}, {regionWarehouses.city}
                      </span>
                    </p>
                    <ul className="space-y-2">
                      {regionWarehouses.items.map((wh) => {
                        const area = formatAreaM2(wh.totalAreaM2)
                        return (
                          <li
                            key={wh.warehouseName}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm border-t border-white/5 pt-2 first:border-0 first:pt-0"
                          >
                            <span className="text-white flex items-center gap-2">
                              <span className="material-symbols-outlined text-[#06edf9] text-lg">
                                warehouse
                              </span>
                              {wh.warehouseName}
                            </span>
                            {area && <span className="text-[#9bb9bb] sm:text-right">Diện tích: {area}</span>}
                          </li>
                        )
                      })}
                    </ul>
                    <p className="text-xs text-[#9bb9bb]">
                      Bạn không cần chọn kho — kho phù hợp sẽ tiếp nhận yêu cầu khi được duyệt.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[#9bb9bb]">
                    <span className="material-symbols-outlined text-base align-middle mr-1 text-amber-400/90">
                      info
                    </span>
                    Hiện chưa có kho hoạt động tại{' '}
                    <strong className="text-white">
                      {district}, {city}
                    </strong>
                    . Bạn vẫn có thể gửi yêu cầu — admin sẽ liên hệ khi có phương án phù hợp.
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <FieldLabel htmlFor="contractType">Loại hình thuê *</FieldLabel>
              <SelectInput
                id="contractType"
                required
                value={contractType}
                onChange={(v) => handleContractTypeChange(v as ContractTypeValue)}
                options={contractSelectOptions}
              />
            </div>
            {showsRequestedAreaField(contractType) && (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <FieldLabel
                  htmlFor="requestedAreaM2"
                  hint={requestedAreaFieldHint(contractType)}
                >
                  {requestedAreaFieldLabel(contractType)}
                </FieldLabel>
                <TextInput
                  id="requestedAreaM2"
                  type="number"
                  min={0}
                  value={requestedAreaM2}
                  onChange={setRequestedAreaM2}
                  placeholder="500"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="billingCycle" hint="Hóa đơn tổng hợp theo chu kỳ bạn chọn">
                Chu kỳ thanh toán *
              </FieldLabel>
              <SelectInput
                id="billingCycle"
                required
                value={billingCycle}
                onChange={setBillingCycle}
                options={BILLING_CYCLE_GUEST_OPTIONS}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="expectedStartDate">Ngày bắt đầu dự kiến *</FieldLabel>
              <div className="input-glow relative rounded-lg" style={inputWrapStyle}>
                <input
                  id="expectedStartDate"
                  type="date"
                  required
                  value={expectedStartDate}
                  onChange={(e) => {
                    setExpectedStartDate(e.target.value)
                    if (expectedEndDate && e.target.value >= expectedEndDate) {
                      setExpectedEndDate('')
                    }
                  }}
                  className="block w-full px-4 py-3 bg-transparent border-0 text-white focus:outline-none text-base [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel
                htmlFor="expectedEndDate"
                hint="Thời hạn thuê kho bạn mong muốn — kho sẽ căn cứ khi lập hợp đồng"
              >
                Ngày kết thúc dự kiến *
              </FieldLabel>
              <div className="input-glow relative rounded-lg" style={inputWrapStyle}>
                <input
                  id="expectedEndDate"
                  type="date"
                  required
                  min={expectedStartDate || undefined}
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  className="block w-full px-4 py-3 bg-transparent border-0 text-white focus:outline-none text-base [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-gray-200 mb-1">Quy mô hàng hóa (ước tính)</p>
              <p className="text-xs text-[#9bb9bb] mb-3">
                Số <strong className="text-gray-300">cái</strong> (chiếc sản phẩm) khác số{' '}
                <strong className="text-gray-300">thùng</strong> (carton/LPN). Hệ thống gợi ý số thùng
                từ tổng cái ÷ cái/thùng — kho sẽ xác nhận khi nhận hàng thật.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <FieldLabel
                    htmlFor="estimatedTotalPieces"
                    hint="VD: 100 áo thun trong kho (không phải số thùng)"
                  >
                    Tổng số cái (ước tính)
                  </FieldLabel>
                  <TextInput
                    id="estimatedTotalPieces"
                    type="number"
                    min={1}
                    value={estimatedTotalPieces}
                    onChange={(v) => {
                      setEstimatedTotalPieces(v)
                      setBoxCountManual(false)
                    }}
                    placeholder="100"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel
                    htmlFor="piecesPerBox"
                    hint="Trung bình mỗi thùng carton chứa bao nhiêu cái"
                  >
                    Cái / thùng (trung bình)
                  </FieldLabel>
                  <TextInput
                    id="piecesPerBox"
                    type="number"
                    min={1}
                    value={piecesPerBox}
                    onChange={(v) => {
                      setPiecesPerBox(v)
                      setBoxCountManual(false)
                    }}
                    placeholder="25"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <FieldLabel
                    htmlFor="estimatedBoxCount"
                    hint="Số thùng / pallet dự kiến lưu kho (≈ số LPN). Tự tính khi nhập tổng cái + cái/thùng; có thể sửa tay."
                  >
                    Số thùng hàng (ước tính)
                  </FieldLabel>
                  <TextInput
                    id="estimatedBoxCount"
                    type="number"
                    min={0}
                    value={estimatedBoxCount}
                    onChange={(v) => {
                      setEstimatedBoxCount(v)
                      setBoxCountManual(true)
                    }}
                    placeholder="4"
                  />
                  {boxEstimateSummary && (
                    <p className="text-xs text-[#06edf9]/90 pl-1">{boxEstimateSummary}</p>
                  )}
                  {Number(piecesPerBox) > 0 && (
                    <p className="text-xs text-[#9bb9bb] pl-1">
                      Gợi ý loại thùng khi nhập kho (kho chọn khi tạo LPN):{' '}
                      <span className="text-gray-300">{suggestedBoxType}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="estimatedSkuCount" hint="Số mã sản phẩm khác nhau (VD: 1 loại áo = 1)">
                    Số mã SKU
                  </FieldLabel>
                  <TextInput
                    id="estimatedSkuCount"
                    type="number"
                    min={0}
                    value={estimatedSkuCount}
                    onChange={setEstimatedSkuCount}
                    placeholder="50"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel
                    htmlFor="estimatedInboundPerWeek"
                    hint="Lượt hàng nhập kho trung bình mỗi tuần"
                  >
                    Lượt nhập kho / tuần
                  </FieldLabel>
                  <TextInput
                    id="estimatedInboundPerWeek"
                    type="number"
                    min={0}
                    value={estimatedInboundPerWeek}
                    onChange={setEstimatedInboundPerWeek}
                    placeholder="5"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel
                    htmlFor="estimatedOutboundPerWeek"
                    hint="Lượt hàng xuất kho trung bình mỗi tuần"
                  >
                    Lượt xuất kho / tuần
                  </FieldLabel>
                  <TextInput
                    id="estimatedOutboundPerWeek"
                    type="number"
                    min={0}
                    value={estimatedOutboundPerWeek}
                    onChange={setEstimatedOutboundPerWeek}
                    placeholder="8"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer text-sm text-[#9bb9bb]">
                <input
                  type="checkbox"
                  checked={requiresFastPicking}
                  onChange={(e) => setRequiresFastPicking(e.target.checked)}
                  className="rounded border-[#3a5455] bg-transparent text-[#06edf9] focus:ring-[#06edf9]"
                />
                Hàng cần lấy nhanh (gần khu xuất, fast-moving)
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-sm text-[#9bb9bb]">
                <input
                  type="checkbox"
                  checked={requiresPremiumStorage}
                  onChange={(e) => setRequiresPremiumStorage(e.target.checked)}
                  className="rounded border-[#3a5455] bg-transparent text-[#06edf9] focus:ring-[#06edf9]"
                />
                Yêu cầu bảo quản cao cấp (kiểm soát môi trường / bảo mật)
              </label>
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-2 text-sm text-[#06edf9] hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                <span className="material-symbols-outlined text-lg">
                  {showAdvanced ? 'expand_less' : 'expand_more'}
                </span>
                {showAdvanced ? 'Ẩn tùy chọn bố trí kho' : 'Thêm gợi ý bố trí kho (tuỳ chọn)'}
              </button>
              {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="suggestedZoneType">Loại khu vực mong muốn</FieldLabel>
                    <SelectInput
                      id="suggestedZoneType"
                      value={suggestedZoneType}
                      onChange={setSuggestedZoneType}
                      options={ZONE_TYPES}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="suggestedRackType">Loại kệ mong muốn</FieldLabel>
                    <SelectInput
                      id="suggestedRackType"
                      value={suggestedRackType}
                      onChange={setSuggestedRackType}
                      options={RACK_TYPES}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <FieldLabel htmlFor="notes">Ghi chú thêm</FieldLabel>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Mô tả ngắn loại hàng, mùa vụ, yêu cầu đặc biệt..."
                className="input-glow w-full rounded-lg px-4 py-3 bg-transparent border text-white focus:outline-none text-base resize-y"
                style={inputWrapStyle}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-btn w-full rounded-lg font-bold py-4 px-6 border-0 disabled:opacity-60 cursor-pointer"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">send</span>
            Gửi yêu cầu thuê kho
          </span>
        </button>
      </form>
    </>
  )
}
