import { useEffect, useState } from 'react'
import { AlertModal } from './AlertModal'
import type { ApiZone } from '../../../api/zones'
import * as warehousesApi from '../../../api/warehouses'
import type { ApiWarehouseZonePlanning } from '../../../api/warehouses'
import { ZONE_STATUS_OPTIONS, ZONE_TYPE_OPTIONS } from '../../../data/zoneTypes'
import {
  REFERENCE_ZONE_AREA_M2,
  computeZoneStorageCapacity,
  formatZoneCapacitySummary,
} from '../../../utils/warehouseCapacity'

type Mode = 'create' | 'edit' | 'view'

export type ZoneWarehouseOption = {
  warehouseId: string
  label: string
}

export type ZoneFormPayload = {
  warehouseId?: string
  zoneCode: string
  zoneName: string
  zoneType: string
  areaM2: number | null
  isDedicated: boolean
  status: string
}

type Props = {
  mode: Mode
  data?: ApiZone
  /** Kho mặc định khi mở modal */
  warehouseId: string
  warehouseLabel: string
  warehouses?: ZoneWarehouseOption[]
  /** System Admin có thể đổi kho khi tạo zone */
  allowWarehousePick?: boolean
  zonePlanning?: ApiWarehouseZonePlanning | null
  /** Diện tích zone đang sửa (trừ khỏi used khi edit) */
  editingZoneAreaM2?: number
  onClose: () => void
  onSubmit?: (data: ZoneFormPayload) => void | Promise<void>
}

function fmtM2(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(n)
}

const emptyForm: ZoneFormPayload = {
  zoneCode: '',
  zoneName: '',
  zoneType: 'SHARED',
  areaM2: null,
  isDedicated: false,
  status: 'ACTIVE',
}

// Cập nhật class label và input sang Light Mode (Nền sáng, viền slate rõ nét)
const labelStyle =
  'text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block'
const inputStyle =
  'w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-500'

function toForm(data?: ApiZone): ZoneFormPayload {
  if (!data) return { ...emptyForm }
  return {
    zoneCode: data.zoneCode,
    zoneName: data.zoneName ?? '',
    zoneType: data.zoneType ?? 'SHARED',
    areaM2: data.areaM2 ?? null,
    isDedicated: Boolean(data.isDedicated),
    status: data.status ?? 'ACTIVE',
  }
}

export function ZoneModal({
  mode,
  data,
  warehouseId: initialWarehouseId,
  warehouseLabel,
  warehouses = [],
  allowWarehousePick = false,
  zonePlanning = null,
  editingZoneAreaM2 = 0,
  onClose,
  onSubmit,
}: Props) {
  const isView = mode === 'view'
  const canPickWarehouse = allowWarehousePick && mode === 'create' && warehouses.length > 0

  const [selectedWarehouseId, setSelectedWarehouseId] = useState(
    data?.warehouseId ?? initialWarehouseId
  )
  const [form, setForm] = useState(() => toForm(data))
  const [areaInput, setAreaInput] = useState(
    data?.areaM2 != null ? String(data.areaM2) : ''
  )
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localPlanning, setLocalPlanning] = useState<ApiWarehouseZonePlanning | null>(
    zonePlanning ?? null
  )
  const [planningLoading, setPlanningLoading] = useState(false)

  const planning = localPlanning ?? zonePlanning

  const displayWarehouseLabel =
    warehouses.find((w) => w.warehouseId === selectedWarehouseId)?.label ??
    (data?.warehouseId && selectedWarehouseId === data.warehouseId ? warehouseLabel : null) ??
    warehouseLabel

  useEffect(() => {
    setForm(toForm(data))
    setAreaInput(data?.areaM2 != null ? String(data.areaM2) : '')
    setSelectedWarehouseId(data?.warehouseId ?? initialWarehouseId)
  }, [data, initialWarehouseId])

  useEffect(() => {
    if (mode !== 'create' || !selectedWarehouseId) {
      setLocalPlanning(null)
      return
    }
    let cancelled = false
    setPlanningLoading(true)
    warehousesApi
      .getWarehouseZonePlanning(selectedWarehouseId)
      .then((p) => {
        if (!cancelled) setLocalPlanning(p)
      })
      .catch(() => {
        if (!cancelled) setLocalPlanning(null)
      })
      .finally(() => {
        if (!cancelled) setPlanningLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [mode, selectedWarehouseId])

  const zonesToAdd =
    planning?.missingZoneCount != null && planning.missingZoneCount > 0
      ? planning.missingZoneCount
      : planning?.suggestedMinZoneCount != null && (planning.zoneCount ?? 0) === 0
        ? planning.suggestedMinZoneCount
        : null

  const applySuggestedArea = () => {
    const a =
      planning?.suggestedAreaPerZoneForEvenSplit ??
      planning?.suggestedReferenceZoneAreaM2 ??
      REFERENCE_ZONE_AREA_M2
    setAreaInput(String(a))
  }

  const handleSubmit = async () => {
    setError('')
    if (!selectedWarehouseId) {
      setError('Chọn kho cho zone')
      return
    }
    if (mode === 'create' && !form.zoneCode.trim()) {
      setError('Mã zone là bắt buộc')
      return
    }
    const area = areaInput.trim() ? Number(areaInput) : null
    if (areaInput.trim() && (!Number.isFinite(area) || area! < 0)) {
      setError('Diện tích không hợp lệ')
      return
    }
    if (planning?.usableAreaM2 != null && area != null && area > 0) {
      const usedOthers = planning.usedZoneAreaM2 - (editingZoneAreaM2 ?? 0)
      const nextTotal = usedOthers + area
      if (nextTotal > planning.usableAreaM2) {
        setError(
          `Diện tích zone (${fmtM2(area)} m²) vượt phần còn lại (${fmtM2(planning.usableAreaM2 - usedOthers)} m²)`
        )
        return
      }
    }
    setSubmitting(true)
    try {
      await onSubmit?.({
        ...form,
        warehouseId: selectedWarehouseId,
        zoneCode: form.zoneCode.trim(),
        zoneName: form.zoneName.trim(),
        areaM2: area,
        isDedicated:
          form.zoneType === 'PRIVATE'
            ? true
            : form.zoneType === 'SHARED'
              ? false
              : form.isDedicated,
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop mờ tối vừa phải cho Light Mode */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Thân Modal màu trắng, viền xám mỏng nhẹ */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <span className="material-symbols-outlined text-cyan-600">grid_view</span>
            {mode === 'create' ? 'Tạo zone' : mode === 'edit' ? 'Sửa zone' : 'Chi tiết zone'}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-2 hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        {/* Nội dung Form cuộn */}
        <div className="space-y-4 overflow-y-auto p-6 text-slate-700">
          <div>
            <label className={labelStyle} htmlFor="zone-warehouse">
              Kho (warehouse)
            </label>
            {canPickWarehouse ? (
              <select
                id="zone-warehouse"
                className={inputStyle}
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
              >
                <option value="">— Chọn kho —</option>
                {warehouses.map((w) => (
                  <option key={w.warehouseId} value={w.warehouseId}>
                    {w.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="zone-warehouse"
                className={inputStyle}
                disabled
                value={displayWarehouseLabel || '—'}
              />
            )}

          </div>

          {/* Banner Thông tin Diện tích kho & Gợi ý */}
          {mode === 'create' && (
            <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">
                Diện tích kho &amp; gợi ý zone
              </p>
              {planningLoading ? (
                <p className="mt-2 text-sm text-slate-500">Đang tải thông tin kho...</p>
              ) : planning ? (
                <>
                  <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                    <p className="text-slate-700">
                      <span className="text-slate-500">Sử dụng:</span>{' '}
                      <strong className="text-slate-900">{fmtM2(planning.usableAreaM2)} m²</strong>
                    </p>
                    <p className="text-slate-700">
                      <span className="text-slate-500">Tổng:</span>{' '}
                      <span className="text-slate-900 font-medium">{fmtM2(planning.totalAreaM2)} m²</span>
                    </p>
                    <p className="text-slate-700">
                      <span className="text-slate-500">Zone hiện có:</span>{' '}
                      <strong className="text-slate-900">{planning.zoneCount}</strong>
                    </p>
                    <p className="text-slate-700">
                      <span className="text-slate-500">Đã phân bổ:</span>{' '}
                      <span className="text-slate-900 font-medium">{fmtM2(planning.usedZoneAreaM2)} m²</span>
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    Còn có thể chia:{' '}
                    <strong className="text-cyan-700">
                      {fmtM2(planning.remainingZoneAreaM2)} m²
                    </strong>
                  </p>
                  
                  {/* Alert Box chứa gợi ý số zone */}
                  {planning.usableAreaM2 != null && planning.usableAreaM2 > 0 ? (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-sm font-medium text-amber-900">
                        {zonesToAdd != null && zonesToAdd > 0 ? (
                          <>
                            Gợi ý cần thêm{' '}
                            <span className="text-lg font-bold text-amber-600">
                              ~{zonesToAdd} zone
                            </span>
                          </>
                        ) : (
                          <>
                            Đã đủ ~{planning.suggestedMinZoneCount} zone tối thiểu (mỗi zone ≈{' '}
                            {planning.suggestedReferenceZoneAreaM2} m²)
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Tính theo diện tích sử dụng {fmtM2(planning.usableAreaM2)} m² ÷{' '}
                        {planning.suggestedReferenceZoneAreaM2} m²/zone
                        {planning.zoneCount > 0 && (
                          <> · hiện có {planning.zoneCount} zone</>
                        )}
                      </p>
                      {zonesToAdd != null && zonesToAdd > 0 && (
                        <button
                          type="button"
                          onClick={applySuggestedArea}
                          className="mt-2 text-xs font-semibold text-cyan-600 hover:text-cyan-800 hover:underline transition-colors"
                        >
                          Điền diện tích gợi ý:{' '}
                          {fmtM2(
                            planning.suggestedAreaPerZoneForEvenSplit ??
                              planning.suggestedReferenceZoneAreaM2
                          )}{' '}
                          m²/zone
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-amber-700 font-medium">
                      Kho chưa khai báo diện tích sử dụng (usableAreaM2). Cập nhật tại Quản lý
                      kho để có gợi ý số zone.
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  Không tải được thông tin diện tích kho.
                </p>
              )}
            </div>
          )}

          <div>
            <label className={labelStyle} htmlFor="zone-code">
              Mã zone
            </label>
            <input
              id="zone-code"
              disabled={mode !== 'create'}
              className={inputStyle}
              value={form.zoneCode}
              placeholder="Z-A01"
              onChange={(e) => setForm({ ...form, zoneCode: e.target.value })}
            />
          </div>
          <div>
            <label className={labelStyle} htmlFor="zone-name">
              Tên zone
            </label>
            <input
              id="zone-name"
              disabled={isView}
              className={inputStyle}
              value={form.zoneName}
              onChange={(e) => setForm({ ...form, zoneName: e.target.value })}
            />
          </div>
          <div>
            <label className={labelStyle} htmlFor="zone-type">
              Loại zone
            </label>
            <select
              id="zone-type"
              disabled={isView}
              className={inputStyle}
              value={form.zoneType}
              onChange={(e) => {
                const zoneType = e.target.value
                setForm({
                  ...form,
                  zoneType,
                  isDedicated:
                    zoneType === 'PRIVATE'
                      ? true
                      : zoneType === 'SHARED'
                        ? false
                        : form.isDedicated,
                })
              }}
            >
              {ZONE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelStyle} htmlFor="zone-area">
              Diện tích (m²)
            </label>
            <input
              id="zone-area"
              type="number"
              min={0}
              step="0.01"
              disabled={isView}
              className={inputStyle}
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
            />
            {areaInput.trim() && Number(areaInput) > 0 && (
              <p className="mt-2 text-[11px] leading-relaxed text-cyan-700 font-medium">
                ≈ {formatZoneCapacitySummary(computeZoneStorageCapacity(Number(areaInput)), form.zoneType)}
              </p>
            )}
          </div>
          {form.zoneType !== 'PRIVATE' && form.zoneType !== 'SHARED' && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 select-none">
              <input
                type="checkbox"
                disabled={isView}
                checked={form.isDedicated}
                onChange={(e) => setForm({ ...form, isDedicated: e.target.checked })}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 h-4 w-4"
              />
              Zone riêng (dedicated)
            </label>
          )}
          <div>
            <label className={labelStyle} htmlFor="zone-status">
              Trạng thái
            </label>
            <select
              id="zone-status"
              disabled={isView}
              className={inputStyle}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {ZONE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer chứa nút bấm */}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50">
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            Đóng
          </button>
          {!isView && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo zone' : 'Cập nhật'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <AlertModal
          type="error"
          title={mode === 'create' ? 'Không thể tạo zone' : 'Không thể lưu zone'}
          message={error}
          onClose={() => setError('')}
        />
      )}
    </div>
  )
}