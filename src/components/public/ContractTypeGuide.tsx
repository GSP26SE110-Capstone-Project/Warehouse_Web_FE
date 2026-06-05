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
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border-[#06edf9]/15">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#06edf9]">recommend</span>
          Loại hình thuê phù hợp
        </h3>
        <p className="text-sm text-[#9bb9bb] mt-1">
          Gợi ý theo quy mô hàng hóa — chọn lại nếu cần.
        </p>
      </div>

      {recommendation && (
        <div
          className={`mb-4 rounded-lg border px-3 py-2.5 text-sm leading-snug ${
            recommendation.confidence === 'high'
              ? 'border-[#06edf9]/35 bg-[#06edf9]/10'
              : recommendation.confidence === 'medium'
                ? 'border-amber-400/30 bg-amber-400/10 text-amber-100'
                : 'border-white/10 bg-white/[0.03] text-[#9bb9bb]'
          }`}
        >
          <p className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-base text-[#06edf9] shrink-0">
              {recommendation.confidence === 'low' ? 'info' : 'auto_awesome'}
            </span>
            <span className="truncate text-white/95">
              {recommendation.contractType !== 'NEEDS_CONSULTATION' ? (
                <>
                  <strong className="text-[#06edf9] font-semibold">
                    {CONTRACT_TYPE_LABELS[recommendation.contractType]}
                  </strong>
                  <span className="text-[#9bb9bb]"> — </span>
                  <span className="text-[#c8f8fc]">{recommendation.reason}</span>
                </>
              ) : (
                recommendation.reason
              )}
            </span>
          </p>
          {recommendation.metrics?.estimatedBoxCount != null && (
            <p className="mt-1 text-xs text-[#9bb9bb] pl-7">
              ~{recommendation.metrics.estimatedBoxCount.toLocaleString('vi-VN')} thùng/tháng
              {recommendation.metrics.totalU != null &&
                ` · ${recommendation.metrics.totalU.toLocaleString('vi-VN')} U/tháng`}
            </p>
          )}
        </div>
      )}

      <div
        className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5"
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
                'group flex w-full items-center gap-3 px-3 py-3 sm:px-4 sm:py-3.5 text-left transition-colors cursor-pointer',
                isActive
                  ? 'bg-[#06edf9]/10'
                  : isRecommended
                    ? 'bg-[#06edf9]/[0.04] hover:bg-[#06edf9]/8'
                    : 'bg-transparent hover:bg-white/[0.03]',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                  isActive
                    ? 'border-[#06edf9]/50 bg-[#06edf9]/15 text-[#06edf9]'
                    : 'border-white/10 bg-white/5 text-[#7a9496] group-hover:text-[#9bb9bb]',
                ].join(' ')}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </span>

              <span className="min-w-0 flex-1 flex items-center gap-2 sm:gap-3">
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-semibold text-white">{item.title}</span>
                  {/* <span className="hidden sm:inline text-[#9bb9bb] font-normal">
                    {' '}
                    · {item.tagline}
                  </span> */}
                </span>

                <span className="flex shrink-0 items-center gap-1.5">
                  {isRecommended && !isActive && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#06edf9]/15 text-[#06edf9] whitespace-nowrap">
                      Đề xuất
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#06edf9]/20 text-[#06edf9] whitespace-nowrap">
                      Đang chọn
                    </span>
                  )}
                  <span
                    className={[
                      'flex h-5 w-5 items-center justify-center rounded-full border transition-all',
                      isActive
                        ? 'border-[#06edf9] bg-[#06edf9] text-[#0f2223]'
                        : 'border-[#3a5455] bg-transparent',
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
