import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError } from '../../api/client'
import { createRentalRequest, listRentalRequests } from '../../api/rentalRequests'
import { fetchProductKindCatalogTree, fetchSizeFactors } from '../../api/productCatalog'
import type { ApiProductKindTreeNode, ApiSizeFactor } from '../../api/productCatalog'
import type { ApiRentalRequest, RentalRequestStatus } from '../../api/types'
import { fetchLocationTree } from '../../api/locations'
import { useAuth } from '../../auth/AuthContext'
import { CONTRACT_TYPE_LABELS, CONTRACT_TYPE_OPTIONS } from '../../data/contractTypes'
import {
  RENTAL_REQUEST_STATUS_CLASS,
  RENTAL_REQUEST_STATUS_LABEL,
} from '../../data/rentalRequestStatus'
import { DatePickerField } from '../../components/ui/DatePickerField'
import { DarkDropdownSelect } from '../../components/ui/DarkDropdownSelect'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import {
  RentalProductLinesEditor,
  buildProductLinesPayload,
  createEmptyProductLine,
  type RentalProductLineDraft,
} from '../../components/rental/RentalProductLinesEditor'
import {
  estimateMonthCount,
  estimateRentalDays,
  meetsMinimumRentalMonths,
  minRentalEndDate,
} from '../../utils/rentalPeriod'
import { formatDisplayDate, rentalRequestDateOnly, toRentalRequestDateIso } from '../../utils/datePicker'
import { formatBoxAllocation } from '../../utils/volumeUnits'

type CreateForm = {
  city: string
  district: string
  contractType: string
  requestedAreaM2: string
  expectedStartDate: string
  expectedEndDate: string
  notes: string
}

const INITIAL_FORM: CreateForm = {
  city: '',
  district: '',
  contractType: 'NEEDS_CONSULTATION',
  requestedAreaM2: '',
  expectedStartDate: '',
  expectedEndDate: '',
  notes: '',
}

const INPUT_WRAP =
  'rounded-lg border border-slate-300 bg-slate-50 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500/20 transition-all shadow-sm'

const TEXT_INPUT_CLASS =
  'block w-full bg-transparent px-3 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none'

function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="mb-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-bold uppercase text-slate-500"
      >
        {children}
      </label>
      {hint && <p className="mt-0.5 text-[11px] leading-snug font-medium text-slate-400">{hint}</p>}
    </div>
  )
}

function RentalStatusBadge({ status }: { status: RentalRequestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        RENTAL_REQUEST_STATUS_CLASS[status] ?? RENTAL_REQUEST_STATUS_CLASS.PENDING
      }`}
    >
      {RENTAL_REQUEST_STATUS_LABEL[status] ?? status}
    </span>
  )
}

function contractTypeLabel(value?: string | null) {
  if (!value) return '—'
  return CONTRACT_TYPE_LABELS[value as keyof typeof CONTRACT_TYPE_LABELS] ?? value
}

function parsePiecesPerMonthFromNotes(notes?: string | null): number | null {
  if (!notes) return null
  const match = notes.match(/Tổng cái\/tháng \(ước tính\):\s*([\d.,]+)/i)
  if (!match) return null
  const normalized = match[1].replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) && n > 0 ? n : null
}

function formatRentalPeriod(start?: string | null, end?: string | null) {
  const startIso = rentalRequestDateOnly(start)
  const endIso = rentalRequestDateOnly(end)
  if (!startIso || !endIso) {
    return { label: '—', months: 0, days: 0 }
  }
  const months = estimateMonthCount(startIso, endIso)
  const days = estimateRentalDays(startIso, endIso)
  return {
    label: `${formatDisplayDate(startIso)} → ${formatDisplayDate(endIso)}`,
    months,
    days,
  }
}

function formatCapacitySummary(item: ApiRentalRequest): string {
  const totalU = item.totalCommittedVolumeUnits != null ? Number(item.totalCommittedVolumeUnits) : 0
  if (totalU > 0) {
    const allocation =
      item.boxAllocation ??
      (Array.isArray(item.boxAllocationJson) ? item.boxAllocationJson : [])
    const boxLabel = allocation.length ? formatBoxAllocation(allocation) : null
    const parts = [`${totalU.toLocaleString('vi-VN')} U`]
    if (item.estimatedBoxCount != null && item.estimatedBoxCount > 0) {
      parts.push(`~${item.estimatedBoxCount} thùng`)
    } else if (boxLabel) {
      parts.push(boxLabel)
    }
    return parts.join(' · ')
  }

  const pieces =
    parsePiecesPerMonthFromNotes(item.notes) ??
    (item.estimatedSkuCount != null && item.estimatedSkuCount > 0 ? item.estimatedSkuCount : null)
  const parts: string[] = []
  if (pieces != null) {
    parts.push(`${pieces.toLocaleString('vi-VN')} cái/tháng`)
  }
  if (item.requestedAreaM2 != null && item.requestedAreaM2 > 0) {
    parts.push(`${item.requestedAreaM2.toLocaleString('vi-VN')} m²`)
  }
  return parts.length ? parts.join(' · ') : '—'
}

export function TenantRentalRequestsPage() {
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [items, setItems] = useState<ApiRentalRequest[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [districtMap, setDistrictMap] = useState<Map<string, string[]>>(new Map())
  const [form, setForm] = useState<CreateForm>(INITIAL_FORM)
  const [productLines, setProductLines] = useState<RentalProductLineDraft[]>([
    createEmptyProductLine(),
  ])
  const [catalogTree, setCatalogTree] = useState<ApiProductKindTreeNode[]>([])
  const [sizeFactors, setSizeFactors] = useState<ApiSizeFactor[]>([])

  const cityDistrictOptions = useMemo(() => districtMap.get(form.city) ?? [], [districtMap, form.city])
  const cityOptions = useMemo(
    () => cities.map((city) => ({ value: city, label: city })),
    [cities]
  )
  const districtOptions = useMemo(
    () => cityDistrictOptions.map((district) => ({ value: district, label: district })),
    [cityDistrictOptions]
  )
  const contractTypeOptions = useMemo(
    () => CONTRACT_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.title })),
    []
  )
  const minEndDate = useMemo(() => minRentalEndDate(form.expectedStartDate), [form.expectedStartDate])
  const rentalMonths = useMemo(
    () => estimateMonthCount(form.expectedStartDate, form.expectedEndDate),
    [form.expectedStartDate, form.expectedEndDate]
  )
  const rentalDays = useMemo(
    () => estimateRentalDays(form.expectedStartDate, form.expectedEndDate),
    [form.expectedStartDate, form.expectedEndDate]
  )
  const periodValid = useMemo(
    () =>
      Boolean(
        form.expectedStartDate &&
          form.expectedEndDate &&
          meetsMinimumRentalMonths(form.expectedStartDate, form.expectedEndDate)
      ),
    [form.expectedStartDate, form.expectedEndDate]
  )

  const stats = useMemo(() => {
    const pending = items.filter((i) => ['PENDING', 'UNDER_REVIEW'].includes(i.status)).length
    const approved = items.filter((i) => ['APPROVED', 'CONVERTED'].includes(i.status)).length
    return { total: items.length, pending, approved }
  }, [items])

  const load = useCallback(async () => {
    if (!tenantId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [requests, locations, catalog, sizes] = await Promise.all([
        listRentalRequests({ tenantId, limit: 100 }),
        fetchLocationTree(),
        fetchProductKindCatalogTree(),
        fetchSizeFactors(),
      ])
      setItems(requests.items)
      setCatalogTree(catalog.tree ?? [])
      setSizeFactors(sizes)
      const byCity = new Map<string, string[]>()
      for (const city of locations.cities ?? []) {
        byCity.set(
          city.cityName,
          [...(city.districts ?? [])].map((d) => d.districtName).filter(Boolean)
        )
      }
      const cityNames = [...byCity.keys()].sort((a, b) => a.localeCompare(b, 'vi'))
      setDistrictMap(byCity)
      setCities(cityNames)
      setForm((prev) => {
        if (prev.city || !cityNames[0]) return prev
        return {
          ...prev,
          city: cityNames[0],
          district: byCity.get(cityNames[0])?.[0] ?? '',
        }
      })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách yêu cầu thuê.')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load()
  }, [load])

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!tenantId) return
    setFormError('')
    if (!form.city.trim() || !form.district.trim()) {
      setFormError('Vui lòng chọn thành phố và quận/huyện.')
      return
    }
    const productLinesPayload = buildProductLinesPayload(productLines)
    const requestedAreaM2 = Number(form.requestedAreaM2 || 0)
    if (productLinesPayload.length === 0 && requestedAreaM2 <= 0) {
      setFormError('Cần khai báo ít nhất một dòng hàng (loại + size + số lượng) hoặc diện tích (m²).')
      return
    }
    if (!form.expectedStartDate || !form.expectedEndDate) {
      setFormError('Vui lòng chọn ngày bắt đầu và ngày kết thúc dự kiến.')
      return
    }
    if (form.expectedEndDate <= form.expectedStartDate) {
      setFormError('Ngày kết thúc phải sau ngày bắt đầu.')
      return
    }
    if (!meetsMinimumRentalMonths(form.expectedStartDate, form.expectedEndDate)) {
      setFormError('Thời hạn thuê tối thiểu 1 tháng (ít nhất 30 ngày kể từ ngày bắt đầu).')
      return
    }
    setSubmitting(true)
    try {
      await createRentalRequest({
        tenantId,
        city: form.city.trim(),
        district: form.district.trim(),
        contractType: form.contractType,
        requestedAreaM2: requestedAreaM2 > 0 ? requestedAreaM2 : undefined,
        expectedStartDate: toRentalRequestDateIso(form.expectedStartDate),
        expectedEndDate: toRentalRequestDateIso(form.expectedEndDate),
        notes: form.notes.trim() || undefined,
        productLines: productLinesPayload.length > 0 ? productLinesPayload : undefined,
      })
      setForm((prev) => ({
        ...INITIAL_FORM,
        city: prev.city,
        district: prev.district,
      }))
      setProductLines([createEmptyProductLine()])
      await load()
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Không tạo được yêu cầu thuê mới.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="overflow-y-auto overflow-x-hidden bg-slate-50 p-6 text-slate-700 md:p-8">
      <LoadingOverlay show={loading || submitting} text={submitting ? 'Đang gửi yêu cầu...' : 'Đang tải...'} />

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="mt-1 text-2xl font-extrabold text-slate-900">Yêu cầu thuê kho</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-2 text-center min-w-[88px]">
              <p className="text-lg font-bold text-slate-800">{stats.total}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Tổng</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center min-w-[88px] shadow-sm">
              <p className="text-lg font-bold text-amber-700">{stats.pending}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-500">Đang chờ</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-center min-w-[88px] shadow-sm">
              <p className="text-lg font-bold text-emerald-700">{stats.approved}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">Đã duyệt</p>
            </div>
          </div>
        </header>

        {error && (
          <InlineAlert variant="error" message={error} onDismiss={() => setError('')} />
        )}

        <section className="relative z-20 overflow-visible rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100 shadow-sm">
              <span className="material-symbols-outlined text-xl">add_circle</span>
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Tạo yêu cầu thuê mới</h3>
              <p className="text-xs font-medium text-slate-400">Điền thông tin ước tính — kho sẽ tư vấn chi tiết</p>
            </div>
          </div>

          {formError && (
            <InlineAlert
              variant="warning"
              title="Không thể gửi yêu cầu"
              message={formError}
              onDismiss={() => setFormError('')}
              className="mb-4"
            />
          )}

          <form className="grid grid-cols-1 gap-4 md:grid-cols-3" onSubmit={onSubmit}>
            <div>
              <FieldLabel htmlFor="rental-city">Thành phố</FieldLabel>
              <DarkDropdownSelect
                id="rental-city"
                value={form.city}
                onChange={(nextCity) => {
                  const nextDistrict = districtMap.get(nextCity)?.[0] ?? ''
                  setForm((prev) => ({ ...prev, city: nextCity, district: nextDistrict }))
                }}
                options={cityOptions}
                placeholder="Chọn thành phố"
                searchable
              />
            </div>

            <div>
              <FieldLabel htmlFor="rental-district">Quận / huyện</FieldLabel>
              <DarkDropdownSelect
                id="rental-district"
                value={form.district}
                onChange={(district) => setForm((prev) => ({ ...prev, district }))}
                options={districtOptions}
                placeholder={form.city ? 'Chọn quận/huyện' : 'Chọn thành phố trước'}
                disabled={!form.city}
                searchable
                emptyMessage={form.city ? 'Không có quận/huyện' : 'Chọn thành phố trước'}
              />
            </div>

            <div>
              <FieldLabel htmlFor="rental-contract-type" hint="Có thể để kho tư vấn nếu chưa chắc">
                Loại thuê mong muốn
              </FieldLabel>
              <DarkDropdownSelect
                id="rental-contract-type"
                value={form.contractType}
                onChange={(contractType) => setForm((prev) => ({ ...prev, contractType }))}
                options={contractTypeOptions}
                placeholder="Chọn loại thuê"
              />
            </div>

            <div>
              <FieldLabel htmlFor="rental-area" hint="Tuỳ chọn nếu đã khai báo dòng hàng bên dưới">
                Diện tích thuê (m²)
              </FieldLabel>
              <div className={INPUT_WRAP}>
                <input
                  id="rental-area"
                  type="number"
                  min={0}
                  className={TEXT_INPUT_CLASS}
                  placeholder="VD: 500"
                  value={form.requestedAreaM2}
                  onChange={(e) => setForm((prev) => ({ ...prev, requestedAreaM2: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="expectedStartDate">Ngày bắt đầu dự kiến</FieldLabel>
              <DatePickerField
                id="expectedStartDate"
                compact
                required
                value={form.expectedStartDate}
                onChange={(next) => {
                  setForm((prev) => {
                    const patch: Partial<CreateForm> = { expectedStartDate: next }
                    if (prev.expectedEndDate && next >= prev.expectedEndDate) {
                      patch.expectedEndDate = ''
                    }
                    return { ...prev, ...patch }
                  });
                }}
                placeholder="Chọn ngày bắt đầu"
              />
            </div>

            <div>
              <FieldLabel
                htmlFor="expectedEndDate"
                hint={
                  periodValid
                    ? `Thời hạn ước tính ~${rentalMonths} tháng (${rentalDays} ngày)`
                    : 'Tối thiểu 30 ngày kể từ ngày bắt đầu'
                }
              >
                Ngày kết thúc dự kiến
              </FieldLabel>
              <DatePickerField
                id="expectedEndDate"
                compact
                required
                value={form.expectedEndDate}
                min={minEndDate ?? (form.expectedStartDate || undefined)}
                onChange={(next) => setForm((prev) => ({ ...prev, expectedEndDate: next }))}
                placeholder={form.expectedStartDate ? 'Chọn ngày kết thúc' : 'Chọn ngày bắt đầu trước'}
                disabled={!form.expectedStartDate}
              />
            </div>

            <div className="md:col-span-3 border-t border-slate-100 pt-5">
              <RentalProductLinesEditor
                lines={productLines}
                onChange={setProductLines}
                catalogTree={catalogTree}
                sizeFactors={sizeFactors}
              />
            </div>

            <div className="md:col-span-2">
              <FieldLabel htmlFor="rental-notes">Ghi chú thêm</FieldLabel>
              <div className={INPUT_WRAP}>
                <input
                  id="rental-notes"
                  className={TEXT_INPUT_CLASS}
                  placeholder="Yêu cầu đặc biệt, loại hàng, tần suất nhập/xuất..."
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="shadow-sm hover:shadow-md flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">send</span>
                {submitting ? 'Đang gửi...' : 'Tạo yêu cầu'}
              </button>
            </div>
          </form>
        </section>

        <section className="relative z-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/70 px-6 py-4">
            <span className="material-symbols-outlined text-sky-600">list_alt</span>
            <h3 className="text-sm font-bold text-slate-900">Danh sách yêu cầu đã tạo</h3>
            <span className="ml-auto rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {items.length} yêu cầu
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Mã</th>
                  <th className="px-6 py-3 font-semibold">Khu vực</th>
                  <th className="px-6 py-3 font-semibold">Loại thuê</th>
                  <th className="px-6 py-3 font-semibold">Quy mô</th>
                  <th className="px-6 py-3 font-semibold">Thời hạn</th>
                  <th className="px-6 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                {items.map((it) => {
                  const period = formatRentalPeriod(it.expectedStartDate, it.expectedEndDate)
                  return (
                    <tr key={it.rentalRequestId} className="transition-colors hover:bg-slate-50/40">
                      <td className="px-6 py-3.5 font-mono text-sm font-bold text-sky-700">{it.requestCode}</td>
                      <td className="px-6 py-3.5">
                        <span className="text-slate-900 font-semibold">{it.city}</span>
                        <span className="text-slate-300"> · </span>
                        <span className="text-slate-500 font-normal">{it.district}</span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">{contractTypeLabel(it.contractType)}</td>
                      <td className="px-6 py-3.5 text-slate-600 font-semibold">{formatCapacitySummary(it)}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <p className="text-slate-800 font-semibold">{period.label}</p>
                        {period.months > 0 && (
                          <p className="mt-0.5 text-xs font-medium text-slate-400">
                            ~{period.months} tháng ({period.days} ngày)
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <RentalStatusBadge status={it.status} />
                      </td>
                    </tr>
                  )
                })}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center bg-slate-50/30">
                      <span className="material-symbols-outlined mb-2 block text-4xl text-slate-300">
                        inbox
                      </span>
                      <p className="text-slate-400 font-semibold">Chưa có yêu cầu thuê nào.</p>
                      <p className="mt-0.5 text-xs text-slate-400">Tạo yêu cầu đầu tiên ở form phía trên.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}