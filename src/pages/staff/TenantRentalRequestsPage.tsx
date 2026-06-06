import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/client'
import { listRentalRequests } from '../../api/rentalRequests'
import type { ApiRentalRequest, RentalRequestStatus } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { CONTRACT_TYPE_LABELS } from '../../data/contractTypes'
import {
  RENTAL_REQUEST_STATUS_CLASS,
  RENTAL_REQUEST_STATUS_LABEL,
} from '../../data/rentalRequestStatus'
import { RentalRequestForm } from '../../components/public/RentalRequestForm'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import {
  estimateMonthCount,
  estimateRentalDays,
} from '../../utils/rentalPeriod'
import { formatDisplayDate, rentalRequestDateOnly } from '../../utils/datePicker'
import { formatRentalCapacitySummary } from '../../utils/rentalCapacitySummary'

function RentalStatusBadge({ status }: { status: RentalRequestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
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

function formatCapacitySummary(item: ApiRentalRequest): string {
  return formatRentalCapacitySummary(item)
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

export function TenantRentalRequestsPage() {
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState<ApiRentalRequest[]>([])

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
      const requests = await listRentalRequests({ tenantId, limit: 100 })
      setItems(requests.items)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách yêu cầu thuê.')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmitted = () => {
    void load()
  }

  return (
    <div className="overflow-y-auto overflow-x-hidden bg-[#0b101a] p-6 text-slate-100 md:p-8">
      <LoadingOverlay show={loading} text="Đang tải..." />

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-500/80">Tenant</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Yêu cầu thuê kho</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Khai báo quy mô hàng hóa, chọn loại hình thuê và khu vực — warehouse admin sẽ xem xét và liên hệ.
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

        {tenantId ? (
          <RentalRequestForm tenantId={tenantId} onSubmitted={handleSubmitted} />
        ) : (
          <InlineAlert
            variant="warning"
            title="Chưa liên kết tenant"
            message="Tài khoản chưa được gán tenant. Vui lòng liên hệ quản trị viên."
          />
        )}

        <section
          id="tenant-rental-list"
          className="glass-panel relative z-0 scroll-mt-24 overflow-hidden rounded-xl border border-white/5"
        >
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
                {items.map((it) => {
                  const period = formatRentalPeriod(it.expectedStartDate, it.expectedEndDate)
                  return (
                    <tr key={it.rentalRequestId} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-6 py-3.5 font-mono text-sm text-cyan-300">{it.requestCode}</td>
                      <td className="px-6 py-3.5">
                        <span className="text-white">{it.city}</span>
                        <span className="text-slate-600"> · </span>
                        <span className="text-slate-400">{it.district}</span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-300">{contractTypeLabel(it.contractType)}</td>
                      <td className="px-6 py-3.5 text-slate-400">{formatCapacitySummary(it)}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <p className="text-slate-300">{period.label}</p>
                        {period.months > 0 && (
                          <p className="mt-0.5 text-xs text-slate-500">
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
