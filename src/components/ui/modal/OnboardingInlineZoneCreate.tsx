import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../../api/client'
import type { ApiZone } from '../../../api/zones'
import * as zonesApi from '../../../api/zones'
import type { ApiWarehouseZonePlanning } from '../../../api/warehouses'
import { ZONE_TYPE_OPTIONS } from '../../../data/zoneTypes'
import { allowedZoneTypesForContract } from '../../../utils/onboardingStorage'
import {
  computeZoneStorageCapacity,
  formatZoneCapacitySummary,
} from '../../../utils/warehouseCapacity'

const labelStyle =
  'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'
const inputStyle =
  'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400'

function fmtM2(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(n)
}

function zoneTypeOptionsForContract(
  contractType: string,
  requiresPremiumStorage?: boolean
) {
  const allowed = allowedZoneTypesForContract(contractType)
  if (allowed) {
    return ZONE_TYPE_OPTIONS.filter((o) => allowed.includes(o.value))
  }
  if (requiresPremiumStorage) {
    return ZONE_TYPE_OPTIONS.filter((o) => o.value === 'PREMIUM')
  }
  return ZONE_TYPE_OPTIONS.filter((o) => o.value !== 'PRIVATE')
}

function defaultZoneType(
  contractType: string,
  requiresPremiumStorage?: boolean,
  suggestedZoneType?: string | null
): string {
  const options = zoneTypeOptionsForContract(
    contractType,
    requiresPremiumStorage
  )
  if (contractType === 'DEDICATED_ZONE') {
    const suggested = String(suggestedZoneType ?? '')
      .trim()
      .toUpperCase()
    if (suggested === 'PREMIUM' && options.some((o) => o.value === 'PREMIUM')) {
      return 'PREMIUM'
    }
    return 'PRIVATE'
  }
  if (contractType === 'SHARED_STORAGE') return 'SHARED'
  if (requiresPremiumStorage) return 'PREMIUM'
  return options[0]?.value ?? 'SHARED'
}

function defaultAreaM2(
  tenantRequiredAreaM2: number | null,
  planning: ApiWarehouseZonePlanning | null
): string {
  if (tenantRequiredAreaM2 != null && tenantRequiredAreaM2 > 0) {
    return String(Math.round(tenantRequiredAreaM2))
  }
  const suggested =
    planning?.suggestedAreaPerZoneForEvenSplit ??
    planning?.suggestedReferenceZoneAreaM2
  return suggested != null && suggested > 0 ? String(Math.round(suggested)) : ''
}

type Props = {
  warehouseId: string
  warehouseName: string
  contractType: string
  requiresPremiumStorage?: boolean
  suggestedZoneType?: string | null
  tenantRequiredAreaM2: number | null
  warehousePlanning: ApiWarehouseZonePlanning | null
  initialExpanded?: boolean
  onCreated: (zone: ApiZone) => void | Promise<void>
}

export function OnboardingInlineZoneCreate({
  warehouseId,
  warehouseName,
  contractType,
  requiresPremiumStorage,
  suggestedZoneType,
  tenantRequiredAreaM2,
  warehousePlanning,
  initialExpanded = false,
  onCreated,
}: Props) {
  const [expanded, setExpanded] = useState(initialExpanded)
  const [zoneCode, setZoneCode] = useState('')
  const [zoneName, setZoneName] = useState('')
  const [zoneType, setZoneType] = useState(() =>
    defaultZoneType(contractType, requiresPremiumStorage, suggestedZoneType)
  )
  const [areaInput, setAreaInput] = useState(() =>
    defaultAreaM2(tenantRequiredAreaM2, warehousePlanning)
  )
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const zoneTypeOptions = useMemo(
    () =>
      zoneTypeOptionsForContract(contractType, requiresPremiumStorage),
    [contractType, requiresPremiumStorage]
  )

  useEffect(() => {
    setZoneType(defaultZoneType(contractType, requiresPremiumStorage, suggestedZoneType))
  }, [contractType, requiresPremiumStorage, suggestedZoneType])

  useEffect(() => {
    if (initialExpanded) setExpanded(true)
  }, [initialExpanded])

  useEffect(() => {
    if (!expanded) return
    setAreaInput((prev) => {
      if (prev.trim()) return prev
      return defaultAreaM2(tenantRequiredAreaM2, warehousePlanning)
    })
  }, [expanded, tenantRequiredAreaM2, warehousePlanning])

  const areaNum = areaInput.trim() ? Number(areaInput) : null
  const remaining = warehousePlanning?.remainingZoneAreaM2 ?? null
  const exceedsRemaining =
    remaining != null && areaNum != null && areaNum > 0 && areaNum > remaining + 0.001

  const handleSubmit = async () => {
    setError('')
    if (!zoneCode.trim()) {
      setError('Nhập mã zone')
      return
    }
    if (!Number.isFinite(areaNum) || areaNum! <= 0) {
      setError('Diện tích zone phải > 0')
      return
    }
    if (exceedsRemaining) {
      setError(
        `Diện tích vượt phần còn lại của kho (${fmtM2(remaining)} m²)`
      )
      return
    }

    setSubmitting(true)
    try {
      const created = await zonesApi.createZone({
        warehouseId,
        zoneCode: zoneCode.trim(),
        zoneName: zoneName.trim() || undefined,
        zoneType,
        areaM2: areaNum!,
        isDedicated: zoneType === 'PRIVATE',
        status: 'ACTIVE',
      })
      await onCreated(created)
      setZoneCode('')
      setZoneName('')
      setAreaInput(defaultAreaM2(tenantRequiredAreaM2, warehousePlanning))
      setExpanded(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Tạo zone thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <span className="material-symbols-outlined text-base text-cyan-400">add_box</span>
          Chưa có zone phù hợp? Tạo zone mới
        </span>
        <span className="material-symbols-outlined text-slate-500">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-white/10 px-4 py-4">
          <p className="text-xs text-slate-400">
            Tạo zone trực tiếp trong kho <strong className="text-slate-200">{warehouseName}</strong>.
            Zone mới sẽ được chọn tự động sau khi tạo.
          </p>

          {warehousePlanning && (
            <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-100/90">
              Còn có thể chia:{' '}
              <strong className="text-cyan-200">{fmtM2(warehousePlanning.remainingZoneAreaM2)} m²</strong>
              {warehousePlanning.suggestedReferenceZoneAreaM2 != null && (
                <>
                  {' '}
                  · gợi ý ~{Math.round(warehousePlanning.suggestedReferenceZoneAreaM2)} m²/zone
                </>
              )}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelStyle} htmlFor="onboarding-zone-code">
                Mã zone
              </label>
              <input
                id="onboarding-zone-code"
                className={inputStyle}
                value={zoneCode}
                onChange={(e) => setZoneCode(e.target.value)}
                placeholder="Z-NEW01"
              />
            </div>
            <div>
              <label className={labelStyle} htmlFor="onboarding-zone-name">
                Tên zone
              </label>
              <input
                id="onboarding-zone-name"
                className={inputStyle}
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="Khu mới cho tenant"
              />
            </div>
            <div>
              <label className={labelStyle} htmlFor="onboarding-zone-type">
                Loại zone
              </label>
              <select
                id="onboarding-zone-type"
                className={inputStyle}
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value)}
              >
                {zoneTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelStyle} htmlFor="onboarding-zone-area">
                Diện tích (m²)
              </label>
              <input
                id="onboarding-zone-area"
                type="number"
                min={1}
                step={1}
                className={inputStyle}
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                placeholder="200"
              />
            </div>
          </div>

          {areaNum != null && areaNum > 0 && (
            <p className="text-[11px] leading-relaxed text-cyan-200/80">
              ≈ {formatZoneCapacitySummary(computeZoneStorageCapacity(areaNum), zoneType)}
            </p>
          )}

          {exceedsRemaining && (
            <p className="text-xs text-amber-300">
              Diện tích vượt phần còn lại — giảm m² hoặc cập nhật diện tích kho.
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={submitting || exceedsRemaining}
            onClick={() => void handleSubmit()}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Đang tạo zone…' : 'Tạo zone & chọn'}
          </button>
        </div>
      )}
    </div>
  )
}
