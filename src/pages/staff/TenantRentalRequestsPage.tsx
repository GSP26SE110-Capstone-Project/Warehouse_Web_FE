import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/client'
import { createRentalRequest, listRentalRequests } from '../../api/rentalRequests'
import { fetchLocationTree } from '../../api/locations'
import { useAuth } from '../../auth/AuthContext'
import { CONTRACT_TYPE_OPTIONS } from '../../data/contractTypes'

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

export function TenantRentalRequestsPage() {
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [items, setItems] = useState<Awaited<ReturnType<typeof listRentalRequests>>['items']>([])
  const [cities, setCities] = useState<string[]>([])
  const [districtMap, setDistrictMap] = useState<Map<string, string[]>>(new Map())
  const [form, setForm] = useState<CreateForm>(INITIAL_FORM)

  const cityDistrictOptions = useMemo(() => districtMap.get(form.city) ?? [], [districtMap, form.city])

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
      if (!form.city && cityNames[0]) {
        setForm((prev) => ({
          ...prev,
          city: cityNames[0],
          district: byCity.get(cityNames[0])?.[0] ?? '',
        }))
      }
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
      setFormError('Cần nhập ít nhất 1 trong 2 trường: thùng/tháng hoặc diện tích (m2).')
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
        expectedStartDate: form.expectedStartDate || undefined,
        expectedEndDate: form.expectedEndDate || undefined,
        notes: form.notes.trim() || undefined,
      })
      setForm(INITIAL_FORM)
      await load()
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Không tạo được yêu cầu thuê mới.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="overflow-y-auto overflow-x-hidden bg-[#0b101a] p-6 text-slate-100 md:p-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <h2 className="text-2xl font-bold text-white">Yêu cầu thuê của tenant</h2>
        {error && (
          <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <section className="glass-panel rounded-xl border border-white/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-cyan-300">Tạo yêu cầu thuê mới</h3>
          {formError && (
            <p className="mb-3 rounded border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              {formError}
            </p>
          )}
          <form className="grid grid-cols-1 gap-3 md:grid-cols-3" onSubmit={onSubmit}>
            <select
              className="rounded border border-white/10 bg-[#0f1728] px-3 py-2 text-sm"
              value={form.city}
              onChange={(e) => {
                const nextCity = e.target.value
                const nextDistrict = districtMap.get(nextCity)?.[0] ?? ''
                setForm((prev) => ({ ...prev, city: nextCity, district: nextDistrict }))
              }}
              title="Chọn thành phố"
            >
              <option value="">Chọn thành phố</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select
              className="rounded border border-white/10 bg-[#0f1728] px-3 py-2 text-sm"
              value={form.district}
              onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))}
              title="Chọn quận/huyện"
            >
              <option value="">Chọn quận/huyện</option>
              {cityDistrictOptions.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <select
              className="rounded border border-white/10 bg-[#0f1728] px-3 py-2 text-sm"
              value={form.contractType}
              onChange={(e) => setForm((prev) => ({ ...prev, contractType: e.target.value }))}
              title="Chọn loại hợp đồng"
            >
              {CONTRACT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.title}
                </option>
              ))}
            </select>
            <input
              className="rounded border border-white/10 bg-[#0f1728] px-3 py-2 text-sm"
              placeholder="Thùng/tháng (ước tính)"
              value={form.estimatedBoxCount}
              onChange={(e) => setForm((prev) => ({ ...prev, estimatedBoxCount: e.target.value }))}
              title="Số thùng ước tính mỗi tháng"
            />
            <input
              className="rounded border border-white/10 bg-[#0f1728] px-3 py-2 text-sm"
              placeholder="Diện tích thuê (m2)"
              value={form.requestedAreaM2}
              onChange={(e) => setForm((prev) => ({ ...prev, requestedAreaM2: e.target.value }))}
              title="Diện tích thuê ước tính"
            />
            <input
              type="date"
              className="rounded border border-white/10 bg-[#0f1728] px-3 py-2 text-sm"
              value={form.expectedStartDate}
              onChange={(e) => setForm((prev) => ({ ...prev, expectedStartDate: e.target.value }))}
              title="Ngày bắt đầu dự kiến"
            />
            <input
              type="date"
              className="rounded border border-white/10 bg-[#0f1728] px-3 py-2 text-sm"
              value={form.expectedEndDate}
              onChange={(e) => setForm((prev) => ({ ...prev, expectedEndDate: e.target.value }))}
              title="Ngày kết thúc dự kiến"
            />
            <input
              className="rounded border border-white/10 bg-[#0f1728] px-3 py-2 text-sm md:col-span-2"
              placeholder="Ghi chú thêm"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              title="Ghi chú"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Đang gửi...' : 'Tạo yêu cầu'}
            </button>
          </form>
        </section>

        <section className="glass-panel overflow-hidden rounded-xl border border-white/5">
          <div className="border-b border-white/5 px-6 py-4 text-sm font-semibold text-cyan-300">
            Danh sách yêu cầu đã tạo
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#131b29] text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-3">Mã</th>
                  <th className="px-6 py-3">Khu vực</th>
                  <th className="px-6 py-3">Loại hợp đồng</th>
                  <th className="px-6 py-3">Dung lượng</th>
                  <th className="px-6 py-3">Thời gian</th>
                  <th className="px-6 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((it) => (
                  <tr key={it.rentalRequestId}>
                    <td className="px-6 py-3 font-mono text-cyan-300">{it.requestCode}</td>
                    <td className="px-6 py-3">
                      {it.city} / {it.district}
                    </td>
                    <td className="px-6 py-3">{it.contractType ?? '—'}</td>
                    <td className="px-6 py-3">
                      {it.estimatedBoxCount ?? 0} thùng/tháng · {it.requestedAreaM2 ?? 0} m2
                    </td>
                    <td className="px-6 py-3">
                      {it.expectedStartDate ?? '—'} → {it.expectedEndDate ?? '—'}
                    </td>
                    <td className="px-6 py-3">{it.status}</td>
                  </tr>
                ))}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-slate-500">
                      Chưa có yêu cầu nào.
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
