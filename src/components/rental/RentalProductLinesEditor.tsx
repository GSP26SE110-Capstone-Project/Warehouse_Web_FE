import { useMemo } from 'react'
import type { ApiProductKindTreeNode, ApiSizeFactor } from '../../api/productCatalog'
import { DarkDropdownSelect, type DarkDropdownOptionGroup } from '../ui/DarkDropdownSelect'
import {
  computeProductLinesSummary,
  type BoxType,
  type ProductLinesSummary,
} from '../../utils/volumeUnits'

export type RentalProductLineDraft = {
  id: string
  productKind: string
  size: string
  quantity: string
}

export function createEmptyProductLine(defaultSize = 'M'): RentalProductLineDraft {
  return {
    id: crypto.randomUUID(),
    productKind: '',
    size: defaultSize,
    quantity: '',
  }
}

type Theme = 'staff' | 'guest'

const TEXT_INPUT_CLASS =
  'block w-full rounded-lg border border-white/10 bg-[#0f1728]/95 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/45 focus:outline-none focus:ring-1 focus:ring-cyan-500/20'

const GUEST_TEXT_INPUT_CLASS =
  'block w-full rounded-lg border border-[#3a5455] bg-[#0b1617]/95 px-3 py-2.5 text-sm text-white placeholder:text-[#6b8586] focus:border-[#06edf9]/45 focus:outline-none focus:ring-1 focus:ring-[#06edf9]/20'

function themeClasses(theme: Theme) {
  if (theme === 'guest') {
    return {
      card: 'border-[#3a5455]/60 bg-[#0b1617]/40',
      header: 'text-[#9bb9bb] border-[#3a5455]/40',
      label: 'text-sm font-medium text-gray-200',
      hint: 'text-xs text-[#9bb9bb]',
      summaryBorder: 'border-[#06edf9]/35 bg-[#06edf9]/10 ring-[#06edf9]/20',
      summaryAccent: 'text-[#06edf9]',
      input: GUEST_TEXT_INPUT_CLASS,
      rowIndex: 'text-[#6b8586]',
    }
  }
  return {
    card: 'border-white/10 bg-[#0c1220]/80',
    header: 'text-slate-500 border-white/10',
    label: 'text-sm font-semibold text-slate-200',
    hint: 'text-xs text-slate-500',
    summaryBorder: 'border-cyan-500/25 bg-cyan-500/5 ring-cyan-500/15',
    summaryAccent: 'text-cyan-300',
    input: TEXT_INPUT_CLASS,
    rowIndex: 'text-slate-600',
  }
}

export function RentalProductLinesEditor({
  lines,
  onChange,
  catalogTree,
  sizeFactors,
  theme = 'staff',
  quantityLabel = 'Số lượng (cái/tháng)',
  quantityHint = 'Ước tính số cái lưu kho trung bình mỗi tháng — không nhân với số tháng thuê.',
  maxBoxType,
  boxAllocationHint,
  hideBoxAllocation = false,
}: {
  lines: RentalProductLineDraft[]
  onChange: (lines: RentalProductLineDraft[]) => void
  catalogTree: ApiProductKindTreeNode[]
  sizeFactors: ApiSizeFactor[]
  theme?: Theme
  quantityLabel?: string
  quantityHint?: string
  /** Giới hạn loại thùng gợi ý (vd. Premium → LARGE, Private → EXTRA). */
  maxBoxType?: BoxType | null
  boxAllocationHint?: string | null
  /** Ẩn phân bổ thùng ở đây — hiển thị gần chọn loại khu (dedicated zone). */
  hideBoxAllocation?: boolean
}) {
  const t = themeClasses(theme)

  const productKindGroups = useMemo<DarkDropdownOptionGroup[]>(
    () =>
      catalogTree.map((group) => ({
        label: group.displayNameVi,
        options: (group.productKinds ?? []).map((kind) => ({
          value: kind.productKind,
          label: kind.displayName,
          hint: `${Number(kind.baseVolumeUnitsPerPiece)} U`,
        })),
      })),
    [catalogTree]
  )

  const catalogByKind = useMemo(() => {
    const map = new Map<string, (typeof catalogTree)[0]['productKinds'][0]>()
    for (const group of catalogTree) {
      for (const kind of group.productKinds ?? []) {
        map.set(kind.productKind, kind)
      }
    }
    return map
  }, [catalogTree])

  const sizeOptionGroups = useMemo<DarkDropdownOptionGroup[]>(
    () =>
      sizeFactors.map((row) => ({
        label: `${Number(row.factor)} U`,
        options: (row.sizes ?? []).map((size) => ({
          value: size,
          label: size,
          hint: `${Number(row.factor)} U`,
        })),
      })),
    [sizeFactors]
  )

  const defaultSize = sizeFactors[0]?.sizes?.[0] ?? 'M'

  const readyDrafts = useMemo(
    () =>
      lines
        .filter((line) => line.productKind && line.quantity)
        .map((line) => ({
          productKind: line.productKind,
          size: line.size,
          quantity: Number(line.quantity),
        })),
    [lines]
  )

  const summary: ProductLinesSummary | null = useMemo(
    () => computeProductLinesSummary(readyDrafts, catalogByKind, sizeFactors, maxBoxType),
    [readyDrafts, catalogByKind, sizeFactors, maxBoxType]
  )

  const updateLine = (id: string, patch: Partial<RentalProductLineDraft>) => {
    onChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }

  const addLine = () => {
    onChange([...lines, createEmptyProductLine(defaultSize)])
  }

  const removeLine = (id: string) => {
    if (lines.length <= 1) {
      onChange([createEmptyProductLine(defaultSize)])
      return
    }
    onChange(lines.filter((line) => line.id !== id))
  }

  return (
    <div className="space-y-4 overflow-visible">
      <div>
        <p className={t.label}>Hàng hóa theo loại + size</p>
        <p className={`mt-1 ${t.hint}`}>
          Chọn loại hàng và size — hệ thống tính volume units (U) và gợi ý phân bổ thùng theo
          quy mô <span className="font-medium text-white/90">mỗi tháng</span>.
        </p>
      </div>

      <div className={`overflow-visible rounded-xl border ${t.card}`}>
        <div
          className={`hidden md:grid md:grid-cols-[minmax(0,2fr)_88px_minmax(0,1fr)_auto] md:gap-3 border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wide ${t.header}`}
        >
          <span>Loại hàng</span>
          <span>Size</span>
          <span title={quantityHint}>{quantityLabel}</span>
          <span className="w-10 text-center" aria-hidden>
            ·
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {lines.map((line, index) => {
            const kindMeta = line.productKind ? catalogByKind.get(line.productKind) : null
            const showSize = kindMeta?.hasSize !== false

            return (
              <div
                key={line.id}
                className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[minmax(0,2fr)_88px_minmax(0,1fr)_auto] md:items-center md:gap-3"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 md:hidden">
                    <span className={`text-[11px] font-semibold uppercase ${t.rowIndex}`}>
                      Dòng {index + 1}
                    </span>
                  </div>
                  <p className={`md:hidden text-[11px] font-medium uppercase tracking-wide ${t.hint}`}>
                    Loại hàng
                  </p>
                  <DarkDropdownSelect
                    id={`product-kind-${line.id}`}
                    value={line.productKind}
                    onChange={(productKind) => updateLine(line.id, { productKind })}
                    groups={productKindGroups}
                    placeholder="Chọn loại hàng…"
                    theme={theme}
                  />
                </div>

                <div className="space-y-1.5">
                  <p className={`md:hidden text-[11px] font-medium uppercase tracking-wide ${t.hint}`}>
                    Size
                  </p>
                  <DarkDropdownSelect
                    id={`size-${line.id}`}
                    value={showSize ? line.size : ''}
                    onChange={(size) => updateLine(line.id, { size })}
                    groups={showSize ? sizeOptionGroups : undefined}
                    options={showSize ? undefined : [{ value: '', label: 'One-size' }]}
                    placeholder="Chọn size…"
                    disabled={!showSize}
                    theme={theme}
                  />
                </div>

                <div className="space-y-1.5">
                  <p className={`md:hidden text-[11px] font-medium uppercase tracking-wide ${t.hint}`}>
                    {quantityLabel}
                  </p>
                  <input
                    type="number"
                    min={1}
                    className={t.input}
                    placeholder="VD: 200/tháng"
                    aria-label={`${quantityLabel} dòng ${index + 1}`}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.id, { quantity: e.target.value })}
                  />
                </div>

                <div className="flex justify-end md:justify-center">
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                    title="Xóa dòng"
                    aria-label={`Xóa dòng ${index + 1}`}
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={addLine}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition-colors ${t.summaryBorder} ${t.summaryAccent} hover:bg-white/[0.03]`}
      >
        <span className="material-symbols-outlined text-base">add</span>
        Thêm dòng hàng
      </button>

      {summary && summary.totalCommittedVolumeUnits > 0 && (
        <div className={`rounded-xl border p-4 ring-1 ${t.summaryBorder}`}>
          <p className={`text-sm font-semibold ${t.summaryAccent} flex items-center gap-1.5`}>
            <span className="material-symbols-outlined text-base">calculate</span>
            Tổng cam kết (ước tính / tháng)
          </p>
          <div className="custom-scrollbar mt-3 -mx-1 overflow-x-auto px-1 pb-1">
            <table className="w-full table-fixed text-left text-xs">
              <colgroup>
                <col className="w-[36%]" />
                <col className="w-[16%]" />
                <col className="w-[24%]" />
                <col className="w-[24%]" />
              </colgroup>
              <thead className="text-slate-500">
                <tr className="border-b border-white/5">
                  <th className="pb-2 pr-2 font-medium">Loại · Size</th>
                  <th className="pb-2 pr-2 font-medium text-right">SL/tháng</th>
                  <th className="pb-2 pr-2 font-medium text-right">U/cái</th>
                  <th className="pb-2 font-medium text-right">U dòng/tháng</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {summary.lines.map((line) => (
                  <tr key={`${line.productKind}-${line.size}-${line.quantity}`} className="border-b border-white/5 last:border-0">
                    <td className="max-w-0 truncate py-2 pr-2" title={`${line.displayName}${line.size ? ` · ${line.size}` : ''}`}>
                      <span className="text-white">{line.displayName}</span>
                      {line.size ? <span className="text-slate-500"> · {line.size}</span> : null}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">{line.quantity.toLocaleString('vi-VN')}</td>
                    <td className="py-2 pr-2 text-right tabular-nums text-slate-400">
                      {line.finalVolumeUnitsPerPiece}
                    </td>
                    <td className="py-2 text-right tabular-nums font-medium text-white">
                      {line.lineVolumeUnits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 border-t border-white/5 pt-3 text-sm text-white">
            Tổng{' '}
            <strong className={t.summaryAccent}>
              {summary.totalCommittedVolumeUnits.toLocaleString('vi-VN')} U/tháng
            </strong>
          </p>

          {!hideBoxAllocation && (
            <div className="mt-3 space-y-1">
              {boxAllocationHint && (
                <p className="text-[11px] text-slate-500">{boxAllocationHint}</p>
              )}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Phân bổ thùng
                </span>
                <span className={`text-sm tabular-nums ${t.summaryAccent}`}>
                  {summary.boxAllocation.length > 0
                    ? summary.boxAllocation
                        .map(
                          (row) =>
                            `${row.count.toLocaleString('vi-VN')} thùng ${row.boxType.toLowerCase()}`
                        )
                        .join(' + ')
                    : '—'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function buildProductLinesPayload(lines: RentalProductLineDraft[]) {
  return lines
    .filter((line) => line.productKind && Number(line.quantity) > 0)
    .map((line) => ({
      productKind: line.productKind,
      size: line.size || undefined,
      quantity: Number(line.quantity),
    }))
}
