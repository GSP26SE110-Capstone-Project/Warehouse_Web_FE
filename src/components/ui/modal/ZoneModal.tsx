import { useEffect, useState } from 'react'
import { AlertModal } from './AlertModal'
import { CodeInputWithGenerate } from '../CodeInputWithGenerate'
import { generateZoneCode } from '../../../utils/codeGenerators'
import type { ApiZone } from '../../../api/zones'
import * as warehousesApi from '../../../api/warehouses'
import type { ApiWarehouseZonePlanning } from '../../../api/warehouses'
import { ZONE_STATUS_OPTIONS, ZONE_TYPE_OPTIONS, normalizeZoneType } from '../../../data/zoneTypes'
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
  warehouseId: string
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
  existingZoneCodes?: string[]
  onClose: () => void
  onSubmit?: (data: ZoneFormPayload) => void | Promise<void>
}

function fmtM2(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(n)
}

const emptyForm: ZoneFormPayload = {
  warehouseId: '',
  zoneCode: '',
  zoneName: '',
  zoneType: 'SHARED',
  areaM2: null,
  isDedicated: false,
  status: 'ACTIVE',
}

const labelStyle =
  'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
const inputStyle =
  'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400'

function toForm(data?: ApiZone, fallbackWarehouseId = ''): ZoneFormPayload {
  if (!data) return { ...emptyForm, warehouseId: fallbackWarehouseId }
  return {
    warehouseId: data.warehouseId ?? fallbackWarehouseId,
    zoneCode: data.zoneCode,
    zoneName: data.zoneName ?? '',
    zoneType: normalizeZoneType(data.zoneType),
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
  existingZoneCodes = [],
  onClose,
  onSubmit,
}: Props) {
  const isView = mode === 'view'
  const canPickWarehouse = allowWarehousePick && mode === 'create' && warehouses.length > 0

  const [selectedWarehouseId, setSelectedWarehouseId] = useState(
    data?.warehouseId ?? initialWarehouseId
  )
  const [form, setForm] = useState(() => toForm(data, initialWarehouseId))
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
    setForm(toForm(data, initialWarehouseId))
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
    if (!form.zoneName.trim()) {
      setError('Tên zone là bắt buộc')
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
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="material-symbols-outlined text-cyan-400">grid_view</span>
            {mode === 'create' ? 'Tạo zone' : mode === 'edit' ? 'Sửa zone' : 'Chi tiết zone'}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-2 hover:bg-white/10">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="dark-scrollbar space-y-4 overflow-y-auto p-6 pr-5 [scrollbar-gutter:stable]">
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
            <p className="mt-1 text-[10px] text-slate-500">
              Zone thuộc một kho — dùng khi cấp chỗ và onboarding tenant.
            </p>
          </div>

          {mode === 'create' && (
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400/90">
                Diện tích kho &amp; gợi ý zone
              </p>
              {planningLoading ? (
                <p className="mt-2 text-sm text-slate-400">Đang tải thông tin kho...</p>
              ) : planning ? (
                <>
                  <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                    <p className="text-slate-300">
                      <span className="text-slate-500">Sử dụng:</span>{' '}
                      <strong className="text-white">{fmtM2(planning.usableAreaM2)} m²</strong>
                    </p>
                    <p className="text-slate-300">
                      <span className="text-slate-500">Tổng:</span>{' '}
                      {fmtM2(planning.totalAreaM2)} m²
                    </p>
                    <p className="text-slate-300">
                      <span className="text-slate-500">Zone hiện có:</span>{' '}
                      <strong>{planning.zoneCount}</strong>
                    </p>
                    <p className="text-slate-300">
                      <span className="text-slate-500">Đã phân bổ:</span>{' '}
                      {fmtM2(planning.usedZoneAreaM2)} m²
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    Còn có thể chia:{' '}
                    <strong className="text-cyan-300">
                      {fmtM2(planning.remainingZoneAreaM2)} m²
                    </strong>
                  </p>
                  {planning.usableAreaM2 != null && planning.usableAreaM2 > 0 ? (
                    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                      <p className="text-sm font-medium text-amber-100">
                        {zonesToAdd != null && zonesToAdd > 0 ? (
                          <>
                            Gợi ý cần thêm{' '}
                            <span className="text-lg font-bold text-amber-300">
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
                      <p className="mt-1 text-xs text-amber-200/70">
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
                          className="mt-2 text-xs font-medium text-cyan-300 hover:underline"
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
                    <p className="mt-2 text-xs text-amber-300/90">
                      Kho chưa khai báo diện tích sử dụng (usableAreaM2). Cập nhật tại Quản lý
                      kho để có gợi ý số zone.
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Không tải được thông tin diện tích kho.
                </p>
              )}
            </div>
          )}

          <div>
            <label className={labelStyle} htmlFor="zone-code">
              Mã zone
            </label>
            <CodeInputWithGenerate
              id="zone-code"
              readOnly={mode !== 'create'}
              disabled={mode !== 'create'}
              inputClassName={inputStyle}
              value={form.zoneCode}
              placeholder="Z-A01"
              generateTitle="Sinh mã zone tiếp theo trong kho"
              onChange={(zoneCode) => setForm({ ...form, zoneCode })}
              onGenerate={() => generateZoneCode(existingZoneCodes)}
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
              <p className="mt-2 text-[11px] leading-relaxed text-cyan-200/80">
                ≈ {formatZoneCapacitySummary(computeZoneStorageCapacity(Number(areaInput)), form.zoneType)}
              </p>
            )}
          </div>
          {form.zoneType !== 'PRIVATE' && form.zoneType !== 'SHARED' && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                disabled={isView}
                checked={form.isDedicated}
                onChange={(e) => setForm({ ...form, isDedicated: e.target.checked })}
                className="rounded border-white/20"
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

        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">
            Đóng
          </button>
          {!isView && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
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
