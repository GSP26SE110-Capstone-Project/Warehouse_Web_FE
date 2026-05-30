import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError } from '../../api/client'
import { createRentalRequest, listRentalRequests } from '../../api/rentalRequests'
import type { ApiRentalRequest, RentalRequestStatus } from '../../api/types'
import { fetchLocationTree } from '../../api/locations'
import { useAuth } from '../../auth/AuthContext'
import { CONTRACT_TYPE_LABELS, CONTRACT_TYPE_OPTIONS } from '../../data/contractTypes'
import { DatePickerField } from '../../components/ui/DatePickerField'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import {
  estimateMonthCount,
  estimateRentalDays,
  meetsMinimumRentalMonths,
  minRentalEndDate,
} from '../../utils/rentalPeriod'
import { formatDisplayDate } from '../../utils/datePicker'

type CreateForm = {
  city: string
  district: string
  contractType: string
  estimatedBoxCount: string
  requestedAreaM2: string
  expectedStartDate: string
  expectedEndDate: string
  notes: string
}

const INITIAL_FORM: CreateForm = {
  city: '',
  district: '',
  contractType: 'NEEDS_CONSULTATION',
  estimatedBoxCount: '',
  requestedAreaM2: '',
  expectedStartDate: '',
  expectedEndDate: '',
  notes: '',
}

const INPUT_WRAP =
  'input-glow rounded-lg border border-white/10 bg-[#0f1728]/90 focus-within:border-cyan-500/40 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-colors'

const SELECT_CLASS =
  'block w-full appearance-none bg-transparent px-3 py-2.5 text-sm text-white focus:outline-none cursor-pointer'

const TEXT_INPUT_CLASS =
  'block w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none'

const RENTAL_STATUS_LABEL: Record<RentalRequestStatus, string> = {
  PENDING: 'Chờ xử lý',
  UNDER_REVIEW: 'Đang xem xét',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CONVERTED: 'Đã chuyển HĐ',
}

const RENTAL_STATUS_CLASS: Record<RentalRequestStatus, string> = {
  PENDING: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  UNDER_REVIEW: 'bg-sky-400/10 text-sky-300 ring-sky-400/25',
  APPROVED: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
  REJECTED: 'bg-red-400/10 text-red-300 ring-red-400/25',
  CONVERTED: 'bg-violet-400/10 text-violet-300 ring-violet-400/25',
}

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
        className="text-xs font-semibold uppercase tracking-wide text-slate-400"
      >
        {children}
      </label>
      {hint && <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{hint}</p>}
    </div>
  )
}

function RentalStatusBadge({ status }: { status: RentalRequestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        RENTAL_STATUS_CLASS[status] ?? RENTAL_STATUS_CLASS.PENDING
      }`}
    >
      {RENTAL_STATUS_LABEL[status] ?? status}
    </span>
  )
}

function contractTypeLabel(value?: string | null) {
  if (!value) return '—'
  return CONTRACT_TYPE_LABELS[value as keyof typeof CONTRACT_TYPE_LABELS] ?? value
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

  const cityDistrictOptions = useMemo(() => districtMap.get(form.city) ?? [], [districtMap, form.city])
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
      const [requests, locations] = await Promise.all([
        listRentalRequests({ tenantId, limit: 100 }),
        fetchLocationTree(),
      ])
      setItems(requests.items)
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
    const estimatedBoxCount = Number(form.estimatedBoxCount || 0)
    const requestedAreaM2 = Number(form.requestedAreaM2 || 0)
    if (estimatedBoxCount <= 0 && requestedAreaM2 <= 0) {
      setFormError('Cần nhập ít nhất một trong hai: thùng/tháng hoặc diện tích (m²).')
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
        estimatedBoxCount: estimatedBoxCount > 0 ? estimatedBoxCount : undefined,
        requestedAreaM2: requestedAreaM2 > 0 ? requestedAreaM2 : undefined,
        expectedStartDate: new Date(form.expectedStartDate).toISOString(),
        expectedEndDate: new Date(form.expectedEndDate).toISOString(),
        notes: form.notes.trim() || undefined,
      })
      setForm((prev) => ({
        ...INITIAL_FORM,
        city: prev.city,
        district: prev.district,
      }))
      await load()
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Không tạo được yêu cầu thuê mới.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="overflow-y-auto overflow-x-hidden bg-[#0b101a] p-6 text-slate-100 md:p-8">
      <LoadingOverlay show={loading || submitting} text={submitting ? 'Đang gửi yêu cầu...' : 'Đang tải...'} />

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-500/80">Tenant</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Yêu cầu thuê kho</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Gửi nhu cầu thuê kho theo khu vực — warehouse admin sẽ xem xét và liên hệ.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center min-w-[88px]">
              <p className="text-lg font-bold text-white">{stats.total}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Tổng</p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-2 text-center min-w-[88px]">
              <p className="text-lg font-bold text-amber-300">{stats.pending}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Đang chờ</p>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-center min-w-[88px]">
              <p className="text-lg font-bold text-emerald-300">{stats.approved}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Đã duyệt</p>
            </div>
          </div>
        </header>

        {error && (
          <InlineAlert variant="error" message={error} onDismiss={() => setError('')} />
        )}

        <section className="glass-panel rounded-xl border border-white/5 p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-white/5 pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <span className="material-symbols-outlined text-xl">add_circle</span>
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Tạo yêu cầu thuê mới</h3>
              <p className="text-xs text-slate-500">Điền thông tin ước tính — kho sẽ tư vấn chi tiết</p>
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
              <div className={`${INPUT_WRAP} relative`}>
                <select
                  id="rental-city"
                  className={SELECT_CLASS}
                  value={form.city}
                  onChange={(e) => {
                    const nextCity = e.target.value
                    const nextDistrict = districtMap.get(nextCity)?.[0] ?? ''
                    setForm((prev) => ({ ...prev, city: nextCity, district: nextDistrict }))
                  }}
                >
                  <option value="">Chọn thành phố</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">
                  expand_more
                </span>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="rental-district">Quận / huyện</FieldLabel>
              <div className={`${INPUT_WRAP} relative`}>
                <select
                  id="rental-district"
                  className={SELECT_CLASS}
                  value={form.district}
                  onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))}
                  disabled={!form.city}
                >
                  <option value="">Chọn quận/huyện</option>
                  {cityDistrictOptions.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">
                  expand_more
                </span>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="rental-contract-type" hint="Có thể để kho tư vấn nếu chưa chắc">
                Loại thuê mong muốn
              </FieldLabel>
              <div className={`${INPUT_WRAP} relative`}>
                <select
                  id="rental-contract-type"
                  className={SELECT_CLASS}
                  value={form.contractType}
                  onChange={(e) => setForm((prev) => ({ ...prev, contractType: e.target.value }))}
                >
                  {CONTRACT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.title}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">
                  expand_more
                </span>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="rental-boxes" hint="Tuỳ chọn nếu đã nhập diện tích">
                Thùng / tháng
              </FieldLabel>
              <div className={INPUT_WRAP}>
                <input
                  id="rental-boxes"
                  type="number"
                  min={0}
                  className={TEXT_INPUT_CLASS}
                  placeholder="VD: 120"
                  value={form.estimatedBoxCount}
                  onChange={(e) => setForm((prev) => ({ ...prev, estimatedBoxCount: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="rental-area" hint="Tuỳ chọn nếu đã nhập số thùng">
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
                  })
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
                className="btn-glow flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-[#0b101a] transition-opacity disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">send</span>
                {submitting ? 'Đang gửi...' : 'Tạo yêu cầu'}
              </button>
            </div>
          </form>
        </section>

        <section className="glass-panel overflow-hidden rounded-xl border border-white/5">
          <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
            <span className="material-symbols-outlined text-cyan-400">list_alt</span>
            <h3 className="text-sm font-semibold text-white">Danh sách yêu cầu đã tạo</h3>
            <span className="ml-auto rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">
              {items.length} yêu cầu
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#131b29] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Mã</th>
                  <th className="px-6 py-3 font-medium">Khu vực</th>
                  <th className="px-6 py-3 font-medium">Loại thuê</th>
                  <th className="px-6 py-3 font-medium">Quy mô</th>
                  <th className="px-6 py-3 font-medium">Thời hạn</th>
                  <th className="px-6 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((it) => (
                  <tr key={it.rentalRequestId} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-6 py-3.5 font-mono text-sm text-cyan-300">{it.requestCode}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-white">{it.city}</span>
                      <span className="text-slate-600"> · </span>
                      <span className="text-slate-400">{it.district}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-300">{contractTypeLabel(it.contractType)}</td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {(it.estimatedBoxCount ?? 0) > 0 && (
                        <span>{it.estimatedBoxCount?.toLocaleString('vi-VN')} thùng/tháng</span>
                      )}
                      {(it.estimatedBoxCount ?? 0) > 0 && (it.requestedAreaM2 ?? 0) > 0 && (
                        <span className="text-slate-600"> · </span>
                      )}
                      {(it.requestedAreaM2 ?? 0) > 0 && (
                        <span>{it.requestedAreaM2?.toLocaleString('vi-VN')} m²</span>
                      )}
                      {(it.estimatedBoxCount ?? 0) <= 0 && (it.requestedAreaM2 ?? 0) <= 0 && '—'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="text-slate-300">
                        {it.expectedStartDate
                          ? formatDisplayDate(String(it.expectedStartDate).slice(0, 10))
                          : '—'}
                      </span>
                      <span className="mx-1.5 text-slate-600">→</span>
                      <span className="text-slate-300">
                        {it.expectedEndDate
                          ? formatDisplayDate(String(it.expectedEndDate).slice(0, 10))
                          : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <RentalStatusBadge status={it.status} />
                    </td>
                  </tr>
                ))}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <span className="material-symbols-outlined mb-2 block text-4xl text-slate-600">
                        inbox
                      </span>
                      <p className="text-slate-500">Chưa có yêu cầu thuê nào.</p>
                      <p className="mt-1 text-xs text-slate-600">Tạo yêu cầu đầu tiên ở form phía trên.</p>
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
