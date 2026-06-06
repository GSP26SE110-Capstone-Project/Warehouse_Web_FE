import { AlertModal } from '../ui/modal/AlertModal'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  addCalendarMonthsToDateOnly,
  estimateRentalDays,
  isRentalStartOnOrAfterToday,
  minRentalStartDate,
} from '../../utils/rentalPeriod'
import { ApiError } from '../../api/client'
import {
  fetchLocationTree,
  fetchRegionWarehouses,
  type LocationCity,
  type RegionWarehousesResult,
} from '../../api/locations'
import { createRentalRequest } from '../../api/rentalRequests'
import { fetchProductKindCatalogTree, fetchSizeFactors } from '../../api/productCatalog'
import type { ApiProductKindTreeNode, ApiSizeFactor } from '../../api/productCatalog'
import { createTenant } from '../../api/tenants'
import {
  BILLING_CYCLE_GUEST_OPTIONS,
  defaultPricingModel,
  guestRegionWarehouseCopy,
  type ContractTypeValue,
} from '../../data/contractTypes'
import { LoadingOverlay } from '../ui/LoadingOverlay'
import { DatePickerField } from '../ui/DatePickerField'
import { SearchableSelect } from '../ui/SearchableSelect'
import {
  RentalProductLinesEditor,
  buildProductLinesPayload,
  createEmptyProductLine,
  type RentalProductLineDraft,
} from '../rental/RentalProductLinesEditor'
import {
  countEstimatedSkusFromProductLines,
  deriveSuggestedZoneType,
  type DedicatedZonePreference,
} from '../../utils/rentalRequestGuest'
import { formatVnd, getZonePricePerM2 } from '../../data/pricing'
import { recommendGuestContractType } from '../../utils/contractTypeRecommendation'
import {
  allocateBoxesUpTo,
  buildProductKindMap,
  computeProductLinesSummary,
  dedicatedZoneBoxAllocationHint,
  formatBoxAllocationVi,
  maxBoxTypeForDedicatedZonePreference,
} from '../../utils/volumeUnits'
import { ContractTypeGuide } from './ContractTypeGuide'
import { WarehouseUtilizationBar } from './WarehouseUtilizationBar'
import {
  dedicatedLeaseBadge,
  dedicatedLeaseNoVacancyMessage,
  hasWarehouseAvailableForDedicated,
} from '../../utils/guestDedicatedWarehouse'

const inputWrapStyle = { border: '1px solid #3a5455', background: 'rgba(11,22,23,0.8)' } as const

function guestSubmitErrorMeta(err: unknown): {
  message: string
  variant: 'error' | 'warning'
} {
  if (!(err instanceof ApiError)) {
    return { message: 'Gửi yêu cầu thất bại. Vui lòng thử lại.', variant: 'error' }
  }
  const isDuplicateLike =
    err.code === 'DUPLICATE' ||
    err.code === 'GUEST_TENANT_TAX_EXISTS' ||
    err.status === 409
  return {
    message: err.message,
    variant: isDuplicateLike ? 'warning' : 'error',
  }
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
  disabled,
}: {
  id: string
  type?: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  placeholder?: string
  min?: number
  disabled?: boolean
}) {
  return (
    <div className="input-glow relative rounded-lg" style={inputWrapStyle}>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        min={min}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full px-4 py-3 bg-transparent border-0 text-white focus:outline-none text-base disabled:cursor-not-allowed disabled:opacity-60"
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

function GuestStorageOption({
  id,
  checked,
  onChange,
  icon,
  title,
  description,
  zoneHint,
  allocationPreview,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  icon: string
  title: string
  description: string
  zoneHint?: string
  allocationPreview?: string | null
}) {
  return (
    <label
      htmlFor={id}
      className={[
        'group relative flex cursor-pointer gap-4 rounded-xl border p-4 transition-all',
        checked
          ? 'border-[#06edf9]/45 bg-[#06edf9]/10 ring-1 ring-[#06edf9]/25 shadow-[0_0_20px_rgba(6,237,249,0.08)]'
          : 'border-white/10 bg-white/[0.02] hover:border-[#06edf9]/25 hover:bg-white/[0.04]',
      ].join(' ')}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={[
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors',
          checked
            ? 'border-[#06edf9]/50 bg-[#06edf9]/15 text-[#06edf9]'
            : 'border-white/10 bg-[#0b1617]/80 text-[#7a9496] group-hover:text-[#9bb9bb]',
        ].join(' ')}
      >
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-white">{title}</span>
          <span
            className={[
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all',
              checked
                ? 'border-[#06edf9] bg-[#06edf9] text-[#0f2223]'
                : 'border-[#3a5455] bg-transparent',
            ].join(' ')}
            aria-hidden
          >
            {checked && (
              <span className="material-symbols-outlined text-[14px] font-bold">check</span>
            )}
          </span>
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-[#9bb9bb]">{description}</span>
        {zoneHint && (
          <span
            className={[
              'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
              checked ? 'bg-[#06edf9]/15 text-[#06edf9]' : 'bg-white/5 text-[#6b8586]',
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-xs">location_on</span>
            {zoneHint}
          </span>
        )}
        {allocationPreview && (
          <span
            className={[
              'mt-2 flex items-start gap-1.5 rounded-lg border px-2.5 py-2 text-xs leading-snug',
              checked
                ? 'border-[#06edf9]/30 bg-[#06edf9]/10 text-[#c8f7fa]'
                : 'border-white/10 bg-black/20 text-[#9bb9bb]',
            ].join(' ')}
          >
            <span className="material-symbols-outlined shrink-0 text-base text-[#06edf9]">
              inventory_2
            </span>
            <span>
              <span className="font-medium text-white/90">Gợi ý phân bổ / tháng:</span>{' '}
              <span className="tabular-nums">{allocationPreview}</span>
            </span>
          </span>
        )}
      </span>
    </label>
  )
}

export function RentalRequestForm({
  tenantId: authenticatedTenantId,
  onSubmitted,
}: {
  /** Khi đăng nhập tenant — bỏ bước tạo hồ sơ công ty, dùng tenantId sẵn có */
  tenantId?: string
  onSubmitted?: (requestCode: string, contactEmail?: string) => void
}) {
  const isTenantMode = Boolean(authenticatedTenantId)
  const [contractType, setContractType] = useState<ContractTypeValue>('NEEDS_CONSULTATION')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorVariant, setErrorVariant] = useState<'error' | 'warning'>('error')
  const [success, setSuccess] = useState<{
    requestCode: string
    companyName: string
    reusedExistingProfile: boolean
  } | null>(null)

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
  const [preferredZoneType, setPreferredZoneType] = useState<DedicatedZonePreference>('')
  const [expectedStartDate, setExpectedStartDate] = useState('')
  const [rentalMonthCount, setRentalMonthCount] = useState('')
  const [notes, setNotes] = useState('')
  const [productLines, setProductLines] = useState<RentalProductLineDraft[]>([
    createEmptyProductLine(),
  ])
  const [catalogTree, setCatalogTree] = useState<ApiProductKindTreeNode[]>([])
  const [sizeFactors, setSizeFactors] = useState<ApiSizeFactor[]>([])
  const [userOverrodeContractType, setUserOverrodeContractType] = useState(false)
  const [lastScaleSignature, setLastScaleSignature] = useState('')

  const catalogByKind = useMemo(() => {
    const kinds = catalogTree.flatMap((group) => group.productKinds ?? [])
    return buildProductKindMap(kinds)
  }, [catalogTree])

  const readyDrafts = useMemo(
    () =>
      productLines
        .filter((line) => line.productKind && line.quantity)
        .map((line) => ({
          productKind: line.productKind,
          size: line.size,
          quantity: Number(line.quantity),
        })),
    [productLines]
  )

  const dedicatedMaxBoxType = useMemo(() => {
    if (contractType !== 'DEDICATED_ZONE') return undefined
    return maxBoxTypeForDedicatedZonePreference(preferredZoneType)
  }, [contractType, preferredZoneType])

  const dedicatedBoxAllocationHint = useMemo(() => {
    if (contractType !== 'DEDICATED_ZONE') return null
    return (
      dedicatedZoneBoxAllocationHint(preferredZoneType) ??
      'Chọn Private hoặc Premium bên dưới để xem gợi ý phân bổ thùng theo loại khu'
    )
  }, [contractType, preferredZoneType])

  const productLinesSummary = useMemo(() => {
    if (!catalogTree.length || !sizeFactors.length) return null
    return computeProductLinesSummary(
      readyDrafts,
      catalogByKind,
      sizeFactors,
      dedicatedMaxBoxType
    )
  }, [readyDrafts, catalogByKind, sizeFactors, catalogTree.length, dedicatedMaxBoxType])

  const dedicatedPrivateBoxPreview = useMemo(() => {
    const totalU = productLinesSummary?.totalCommittedVolumeUnits
    if (!totalU || totalU <= 0) return null
    return formatBoxAllocationVi(allocateBoxesUpTo('EXTRA', totalU))
  }, [productLinesSummary])

  const dedicatedPremiumBoxPreview = useMemo(() => {
    const totalU = productLinesSummary?.totalCommittedVolumeUnits
    if (!totalU || totalU <= 0) return null
    return formatBoxAllocationVi(allocateBoxesUpTo('LARGE', totalU))
  }, [productLinesSummary])

  const requestedAreaNum = useMemo(() => {
    const n = Number(requestedAreaM2)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [requestedAreaM2])

  const recommendation = useMemo(
    () =>
      recommendGuestContractType({
        estimatedBoxCount: productLinesSummary?.estimatedBoxCount,
        totalCommittedVolumeUnits: productLinesSummary?.totalCommittedVolumeUnits,
        requestedAreaM2: requestedAreaNum,
      }),
    [productLinesSummary, requestedAreaNum]
  )

  const scaleSignature = useMemo(
    () =>
      JSON.stringify({
        boxes: productLinesSummary?.estimatedBoxCount ?? null,
        area: requestedAreaNum,
      }),
    [productLinesSummary?.estimatedBoxCount, requestedAreaNum]
  )

  const handleContractTypeChange = (value: ContractTypeValue) => {
    if (value !== recommendation.contractType) {
      setUserOverrodeContractType(true)
    }
    setContractType(value)
  }

  useEffect(() => {
    if (scaleSignature !== lastScaleSignature) {
      setLastScaleSignature(scaleSignature)
      setUserOverrodeContractType(false)
    }
  }, [scaleSignature, lastScaleSignature])

  useEffect(() => {
    if (!userOverrodeContractType && recommendation.contractType !== contractType) {
      setContractType(recommendation.contractType)
    }
  }, [userOverrodeContractType, recommendation.contractType, contractType])

  useEffect(() => {
    if (contractType !== 'DEDICATED_ZONE') {
      setPreferredZoneType('')
    }
  }, [contractType])

  const rentalMonthsNum = useMemo(() => {
    const n = Number(rentalMonthCount)
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 0
  }, [rentalMonthCount])

  const expectedEndDate = useMemo(
    () =>
      expectedStartDate && rentalMonthsNum > 0
        ? addCalendarMonthsToDateOnly(expectedStartDate, rentalMonthsNum)
        : '',
    [expectedStartDate, rentalMonthsNum]
  )

  const rentalDays = useMemo(
    () => estimateRentalDays(expectedStartDate, expectedEndDate),
    [expectedStartDate, expectedEndDate]
  )

  const minStartDate = useMemo(() => minRentalStartDate(), [])

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

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchProductKindCatalogTree(), fetchSizeFactors()])
      .then(([catalog, sizes]) => {
        if (cancelled) return
        setCatalogTree(catalog.tree ?? [])
        setSizeFactors(sizes)
      })
      .catch(() => {
        /* catalog optional — legacy estimate fields still work */
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
    setErrorVariant('error')
    if (!isTenantMode && !contactEmail.trim()) {
      setError('Vui lòng nhập email liên hệ để tra cứu yêu cầu sau này')
      return
    }
    if (!city || !district) {
      setError('Vui lòng chọn thành phố và quận/huyện')
      return
    }
    if (!expectedStartDate) {
      setError('Vui lòng chọn ngày bắt đầu thuê kho dự kiến')
      return
    }
    if (!isRentalStartOnOrAfterToday(expectedStartDate)) {
      setError('Ngày bắt đầu dự kiến không được trước hôm nay')
      return
    }
    if (rentalMonthsNum < 1) {
      setError('Vui lòng nhập số tháng muốn thuê (tối thiểu 1 tháng)')
      return
    }
    if (!expectedEndDate) {
      setError('Không tính được ngày kết thúc dự kiến. Vui lòng kiểm tra lại ngày bắt đầu và số tháng thuê')
      return
    }

    const areaNum = Number(requestedAreaM2)
    const hasArea = Number.isFinite(areaNum) && areaNum > 0
    const productLinesPayload = buildProductLinesPayload(productLines)
    const hasProductLines = productLinesPayload.length > 0
    if (!hasArea && !hasProductLines) {
      setError('Vui lòng khai báo hàng theo loại + size hoặc diện tích (m²) để kho ước tính sức chứa')
      return
    }

    setLoading(true)

    try {
      let resolvedTenantId = authenticatedTenantId ?? ''
      let resolvedCompanyName = companyName.trim()
      let reusedExistingProfile = false

      if (!isTenantMode) {
        const tenant = await createTenant({
          companyName: companyName.trim(),
          contactName: contactName.trim() || undefined,
          contactEmail: contactEmail.trim().toLowerCase(),
          contactPhone: contactPhone.trim() || undefined,
          taxCode: taxCode.trim() || undefined,
        })
        resolvedTenantId = tenant.tenantId
        resolvedCompanyName = tenant.companyName
        reusedExistingProfile = Boolean(tenant.reusedExistingProfile)
      }

      const mergedNotes = notes.trim() || undefined

      const rental = await createRentalRequest({
        tenantId: resolvedTenantId,
        city: city.trim(),
        district: district.trim(),
        contractType,
        pricingModel: defaultPricingModel(contractType),
        billingCycle,
        estimatedSkuCount: hasProductLines
          ? countEstimatedSkusFromProductLines(productLinesPayload)
          : undefined,
        requestedAreaM2: hasArea ? areaNum : undefined,
        suggestedZoneType:
          contractType === 'DEDICATED_ZONE'
            ? deriveSuggestedZoneType(preferredZoneType)
            : undefined,
        requiresPremiumStorage:
          contractType === 'DEDICATED_ZONE' && preferredZoneType === 'PREMIUM',
        expectedStartDate: new Date(expectedStartDate).toISOString(),
        expectedEndDate: new Date(expectedEndDate).toISOString(),
        notes: mergedNotes,
        productLines: hasProductLines ? productLinesPayload : undefined,
      })

      setSuccess({
        requestCode: rental.requestCode,
        companyName: resolvedCompanyName,
        reusedExistingProfile,
      })
      onSubmitted?.(
        rental.requestCode,
        isTenantMode ? undefined : contactEmail.trim().toLowerCase()
      )
    } catch (err) {
      const meta = guestSubmitErrorMeta(err)
      setError(meta.message)
      setErrorVariant(meta.variant)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSuccess(null)
    setContractType('NEEDS_CONSULTATION')
    setCompanyName('')
    setContactName('')
    setContactEmail('')
    setContactPhone('')
    setTaxCode('')
    setBillingCycle('MONTHLY')
    setRequestedAreaM2('')
    setPreferredZoneType('')
    setExpectedStartDate('')
    setRentalMonthCount('')
    setNotes('')
    setProductLines([createEmptyProductLine()])
    setUserOverrodeContractType(false)
    setLastScaleSignature('')
    setError('')
    setErrorVariant('error')
  }

  if (success) {
    return (
      <div className="glass-panel rounded-2xl p-8 sm:p-10 border-[#06edf9]/30 text-center">
        <span className="material-symbols-outlined text-5xl text-[#06edf9] mb-4">check_circle</span>
        <h3 className="text-2xl font-bold text-white mb-2">Đã gửi yêu cầu thuê kho</h3>
        <p className="text-[#9bb9bb] mb-6 max-w-md mx-auto">
          {isTenantMode ? (
            <>
              Yêu cầu của bạn đã được ghi nhận. Mã yêu cầu:{' '}
              <strong className="text-[#06edf9] font-mono">{success.requestCode}</strong>
            </>
          ) : success.reusedExistingProfile ? (
            <>
              Email <strong className="text-white">{contactEmail.trim()}</strong> đã có hồ sơ công ty{' '}
              <strong className="text-white">{success.companyName}</strong>. Hệ thống đã tạo{' '}
              <strong className="text-white">yêu cầu thuê mới</strong> — mã{' '}
              <strong className="text-[#06edf9] font-mono">{success.requestCode}</strong>.
            </>
          ) : (
            <>
              Công ty <strong className="text-white">{success.companyName}</strong> đã đăng ký thành công.
              Mã yêu cầu: <strong className="text-[#06edf9] font-mono">{success.requestCode}</strong>
            </>
          )}
        </p>
        <p className="text-sm text-[#9bb9bb] max-w-lg mx-auto">
          {isTenantMode
            ? 'Warehouse admin sẽ xem xét theo khu vực bạn chọn. Theo dõi trạng thái trong danh sách bên dưới.'
            : 'Lưu mã yêu cầu và email liên hệ để tra cứu trạng thái bất cứ lúc nào — không cần đăng nhập. Warehouse admin sẽ xem xét theo khu vực bạn chọn; System Admin cấp tài khoản sau khi được duyệt.'}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isTenantMode ? (
            <button
              type="button"
              onClick={() => document.getElementById('tenant-rental-list')?.scrollIntoView({ behavior: 'smooth' })}
              className="auth-btn rounded-lg font-semibold py-3 px-8 border-0 cursor-pointer"
            >
              Xem danh sách yêu cầu
            </button>
          ) : (
            <button
              type="button"
              onClick={() => document.getElementById('lookup')?.scrollIntoView({ behavior: 'smooth' })}
              className="auth-btn rounded-lg font-semibold py-3 px-8 border-0 cursor-pointer"
            >
              Tra cứu trạng thái
            </button>
          )}
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg font-semibold py-3 px-8 border border-white/10 text-white hover:border-[#06edf9]/40 transition-colors cursor-pointer bg-transparent"
          >
            Gửi yêu cầu khác
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <LoadingOverlay show={loading} text="Đang gửi yêu cầu..." />
      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 space-y-8">
        {!isTenantMode && (
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
        )}

        <div className={isTenantMode ? '' : 'border-t border-white/5 pt-8'}>
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#06edf9]">inventory_2</span>
            Nhu cầu thuê kho
          </h3>
          <p className="text-sm text-[#9bb9bb] mb-4">
            Khai báo quy mô hàng hóa trước — hệ thống sẽ gợi ý loại hình thuê. Sau đó chọn khu vực và thời hạn
            dự kiến.
          </p>

          <div className="mb-8">
            <p className="text-sm font-medium text-gray-200 mb-3 pl-1">Quy mô hàng hóa</p>
            {catalogTree.length > 0 ? (
              <div className="overflow-visible rounded-xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
                <RentalProductLinesEditor
                  lines={productLines}
                  onChange={setProductLines}
                  catalogTree={catalogTree}
                  sizeFactors={sizeFactors}
                  theme="guest"
                  maxBoxType={dedicatedMaxBoxType}
                  boxAllocationHint={
                    contractType === 'DEDICATED_ZONE' ? dedicatedBoxAllocationHint : null
                  }
                  hideBoxAllocation={contractType === 'DEDICATED_ZONE'}
                />
              </div>
            ) : (
              <p className="text-sm text-[#9bb9bb] pl-1">
                Đang tải danh mục loại hàng… Bạn vẫn có thể nhập diện tích (m²) bên dưới.
              </p>
            )}
            <div className="mt-4 max-w-md flex flex-col gap-2">
              <FieldLabel
                htmlFor="requestedAreaM2"
                hint="Không bắt buộc nếu đã khai báo loại hàng + size. Dùng để gợi ý thuê khu riêng hoặc nguyên kho."
              >
                Diện tích mong muốn (m²) — nếu biết
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
          </div>

          <div className="mb-8">
            <ContractTypeGuide
              selected={contractType}
              onSelect={handleContractTypeChange}
              recommendation={recommendation}
            />
          </div>

          {contractType === 'DEDICATED_ZONE' && (
            <div className="mb-8 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-200 pl-1">Yêu cầu bố trí kho</p>
                <p className="mt-1 text-xs text-[#9bb9bb] pl-1">
                  Chọn loại khu — gợi ý phân bổ thùng hiển thị ngay trên từng lựa chọn (theo quy mô
                  hàng bạn khai báo phía trên).
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <GuestStorageOption
                  id="preferredZonePrivate"
                  checked={preferredZoneType === 'PRIVATE'}
                  onChange={(checked) => setPreferredZoneType(checked ? 'PRIVATE' : '')}
                  icon="lock"
                  title="Private Zone"
                  description="Khu riêng tách biệt dành cho thương hiệu của bạn trong kho."
                  zoneHint={`${formatVnd(getZonePricePerM2('PRIVATE'))}/m²/tháng · tối đa thùng Extra`}
                  allocationPreview={dedicatedPrivateBoxPreview}
                />
                <GuestStorageOption
                  id="preferredZonePremium"
                  checked={preferredZoneType === 'PREMIUM'}
                  onChange={(checked) => setPreferredZoneType(checked ? 'PREMIUM' : '')}
                  icon="diamond"
                  title="Premium Zone"
                  description="Kiểm soát môi trường và bảo mật cao hơn khu private thường."
                  zoneHint={`${formatVnd(getZonePricePerM2('PREMIUM'))}/m²/tháng · tối đa thùng Large`}
                  allocationPreview={dedicatedPremiumBoxPreview}
                />
              </div>
              {!dedicatedPrivateBoxPreview && !dedicatedPremiumBoxPreview && (
                <p className="text-xs text-[#9bb9bb] pl-1">
                  Nhập loại hàng và số lượng ở mục Quy mô hàng hóa để xem gợi ý phân bổ thùng.
                </p>
              )}
            </div>
          )}

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
                      {guestRegionWarehouseCopy(contractType).listIntro(
                        regionWarehouses.count,
                        regionWarehouses.district,
                        regionWarehouses.city
                      )}
                    </p>
                    {contractType === 'DEDICATED_WAREHOUSE' &&
                      !hasWarehouseAvailableForDedicated(regionWarehouses.items) && (
                        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-xs sm:text-sm text-amber-100 leading-relaxed">
                          <span className="material-symbols-outlined text-base align-middle mr-1 text-amber-300">
                            info
                          </span>
                          {dedicatedLeaseNoVacancyMessage(regionWarehouses.district, regionWarehouses.city)}
                        </div>
                      )}
                    <ul className="space-y-3">
                      {regionWarehouses.items.map((wh) => {
                        const dedicatedBadge =
                          contractType === 'DEDICATED_WAREHOUSE'
                            ? dedicatedLeaseBadge(wh.dedicatedLeaseAvailability)
                            : null
                        return (
                          <li
                            key={wh.warehouseName}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm border-t border-white/5 pt-3 first:border-0 first:pt-0"
                          >
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <span className="text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#06edf9] text-lg">
                                  warehouse
                                </span>
                                {wh.warehouseName}
                              </span>
                              {dedicatedBadge && (
                                <span
                                  className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-[10px] sm:text-xs font-medium ${dedicatedBadge.className}`}
                                >
                                  {dedicatedBadge.label}
                                </span>
                              )}
                            </div>
                            <WarehouseUtilizationBar item={wh} />
                          </li>
                        )
                      })}
                    </ul>
                    <p className="text-xs text-[#9bb9bb]">
                      {guestRegionWarehouseCopy(contractType).footer}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[#9bb9bb]">
                    <span className="material-symbols-outlined text-base align-middle mr-1 text-amber-400/90">
                      info
                    </span>
                    {guestRegionWarehouseCopy(contractType).empty(district, city)}
                  </p>
                )}
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
              <FieldLabel htmlFor="expectedStartDate" hint="Không chọn ngày trước hôm nay">
                Ngày bắt đầu dự kiến *
              </FieldLabel>
              <DatePickerField
                id="expectedStartDate"
                required
                value={expectedStartDate}
                min={minStartDate}
                onChange={setExpectedStartDate}
                placeholder="Chọn ngày bắt đầu"
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="rentalMonthCount" hint="Tối thiểu 1 tháng">
                Số tháng muốn thuê *
              </FieldLabel>
              <TextInput
                id="rentalMonthCount"
                type="number"
                required
                min={1}
                value={rentalMonthCount}
                onChange={setRentalMonthCount}
                placeholder="VD: 2"
                disabled={!expectedStartDate}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel
                htmlFor="expectedEndDate"
                hint={
                  expectedEndDate && rentalDays > 0
                    ? `Tự động tính từ ngày bắt đầu + ${rentalMonthsNum} tháng (${rentalDays} ngày)`
                    : 'Chọn ngày bắt đầu và nhập số tháng thuê để xem ngày kết thúc'
                }
              >
                Ngày kết thúc dự kiến
              </FieldLabel>
              <DatePickerField
                id="expectedEndDate"
                required
                value={expectedEndDate}
                onChange={() => {}}
                placeholder="—"
                disabled
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <FieldLabel htmlFor="notes">Ghi chú thêm</FieldLabel>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Mô tả ngắn loại hàng, mùa vụ, yêu cầu đặc biệt..."
                className="dark-scrollbar-inset input-glow w-full rounded-lg px-4 py-3 bg-transparent border text-white focus:outline-none text-base resize-y"
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

      {error && (
        <AlertModal
          type={errorVariant}
          title={
            errorVariant === 'warning'
              ? 'Thông tin đã đăng ký trước đó'
              : 'Không thể gửi yêu cầu'
          }
          message={
            errorVariant === 'warning'
              ? `${error} Bạn có thể tra cứu yêu cầu đã gửi (mã RR + email) ở mục Tra cứu trên trang.`
              : error
          }
          onConfirm={() => {
            if (errorVariant === 'warning') {
              document.getElementById('lookup')?.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          onClose={() => {
            setError('')
            setErrorVariant('error')
          }}
        />
      )}
    </>
  )
}
