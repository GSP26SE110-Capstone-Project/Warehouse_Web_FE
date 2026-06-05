import {
  CONTRACT_TYPE_LABELS,
  GUEST_CONTRACT_TYPE_OPTIONS,
  type ContractTypeValue,
} from '../../data/contractTypes'
import type { ContractTypeRecommendation } from '../../utils/contractTypeRecommendation'

export function ContractTypeGuide({
  selected,
  onSelect,
  recommendation,
}: {
  selected: ContractTypeValue
  onSelect: (value: ContractTypeValue) => void
  recommendation?: ContractTypeRecommendation | null
}) {
  return (
    <div className="rounded-2xl p-5 sm:p-6 border border-slate-200 bg-white shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-600">recommend</span>
          Loại hình thuê phù hợp
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Gợi ý theo quy mô hàng hóa — chọn lại nếu cần.
        </p>
      </div>

      {recommendation && (
        <div
          className={`mb-4 rounded-lg border px-3 py-2.5 text-sm leading-snug ${
            recommendation.confidence === 'high'
              ? 'border-cyan-200 bg-cyan-50 text-cyan-900'
              : recommendation.confidence === 'medium'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        />
      )}

      {recommendation && (
        <div
          className={`mb-4 rounded-lg border px-3 py-2.5 text-sm leading-snug ${
            recommendation.confidence === 'high'
              ? 'border-cyan-200 bg-cyan-50/70'
              : recommendation.confidence === 'medium'
                ? 'border-amber-200 bg-amber-50/70'
                : 'border-slate-200 bg-slate-50'
          }`}
        >
          <p className="flex items-center gap-2 min-w-0">
            <span
              className={`material-symbols-outlined text-base shrink-0 ${
                recommendation.confidence === 'high'
                  ? 'text-cyan-600'
                  : recommendation.confidence === 'medium'
                    ? 'text-amber-600'
                    : 'text-slate-500'
              }`}
            >
              {recommendation.confidence === 'low' ? 'info' : 'auto_awesome'}
            </span>
            <span className="truncate text-slate-700">
              {recommendation.contractType !== 'NEEDS_CONSULTATION' ? (
                <>
                  <strong className="text-cyan-700 font-bold">
                    {CONTRACT_TYPE_LABELS[recommendation.contractType]}
                  </strong>
                  <span className="text-slate-400"> — </span>
                  <span className="text-slate-600 font-medium">{recommendation.reason}</span>
                </>
              ) : (
                <span className="font-medium text-slate-600">{recommendation.reason}</span>
              )}
            </span>
          </p>
          {recommendation.metrics?.estimatedBoxCount != null && (
            <p className="mt-1 text-xs text-slate-500 pl-7 font-medium">
              ~{recommendation.metrics.estimatedBoxCount.toLocaleString('vi-VN')} thùng/tháng
              {recommendation.metrics.totalU != null &&
                ` · ${recommendation.metrics.totalU.toLocaleString('vi-VN')} U/tháng`}
            </p>
          )}
        </div>
      )}

      <div
        className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white"
        role="radiogroup"
        aria-label="Loại hình thuê"
      >
        {GUEST_CONTRACT_TYPE_OPTIONS.map((item) => {
          const isActive = selected === item.value
          const isRecommended =
            recommendation != null &&
            recommendation.contractType === item.value &&
            recommendation.contractType !== 'NEEDS_CONSULTATION'

          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(item.value)}
              className={[
                'group flex w-full items-center gap-3 px-3 py-3 sm:px-4 sm:py-3.5 text-left transition-colors cursor-pointer border-0',
                isActive
                  ? 'bg-cyan-50/60'
                  : isRecommended
                    ? 'bg-slate-50/70 hover:bg-slate-50'
                    : 'bg-transparent hover:bg-slate-50/40',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                  isActive
                    ? 'border-cyan-300 bg-cyan-100 text-cyan-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500 group-hover:text-slate-700',
                ].join(' ')}
              >
                <span className="material-symbols-outlined text-[20px] font-medium">{item.icon}</span>
              </span>

              <span className="min-w-0 flex-1 flex items-center gap-2 sm:gap-3">
                <span className="min-w-0 flex-1 truncate">
                  <span
                    className={[
                      'font-semibold transition-colors',
                      isActive ? 'text-cyan-900' : 'text-slate-700 group-hover:text-slate-900',
                    ].join(' ')}
                  >
                    {item.title}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-1.5">
                  {isRecommended && !isActive && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 whitespace-nowrap">
                      Đề xuất
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cyan-600 text-white whitespace-nowrap">
                      Đang chọn
                    </span>
                  )}
                  <span
                    className={[
                      'flex h-5 w-5 items-center justify-center rounded-full border transition-all',
                      isActive
                        ? 'border-cyan-600 bg-cyan-600 text-white'
                        : 'border-slate-300 bg-white group-hover:border-slate-400',
                    ].join(' ')}
                    aria-hidden
                  >
                    {isActive && (
                      <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                    )}
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}