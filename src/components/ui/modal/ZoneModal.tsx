import { useEffect, useState } from 'react'
import type { ApiZone } from '../../../api/zones'
import { ZONE_STATUS_OPTIONS, ZONE_TYPE_OPTIONS } from '../../../data/zoneTypes'

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
  onClose: () => void
  onSubmit?: (data: ZoneFormPayload) => void | Promise<void>
}

const emptyForm: ZoneFormPayload = {
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

  const displayWarehouseLabel =
    warehouses.find((w) => w.warehouseId === selectedWarehouseId)?.label ??
    (data?.warehouseId && selectedWarehouseId === data.warehouseId ? warehouseLabel : null) ??
    warehouseLabel

  useEffect(() => {
    setForm(toForm(data))
    setAreaInput(data?.areaM2 != null ? String(data.areaM2) : '')
    setSelectedWarehouseId(data?.warehouseId ?? initialWarehouseId)
  }, [data, initialWarehouseId])

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
    setSubmitting(true)
    try {
      await onSubmit?.({
        ...form,
        warehouseId: selectedWarehouseId,
        zoneCode: form.zoneCode.trim(),
        zoneName: form.zoneName.trim(),
        areaM2: area,
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

        <div className="space-y-4 overflow-y-auto p-6">
          {error && (
            <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

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
              onChange={(e) => setForm({ ...form, zoneType: e.target.value })}
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
          </div>
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
    </div>
  )
}
