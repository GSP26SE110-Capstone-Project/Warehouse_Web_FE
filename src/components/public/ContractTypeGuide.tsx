import {
  CONTRACT_TYPE_OPTIONS,
  type ContractTypeValue,
} from '../../data/contractTypes'

export function ContractTypeGuide({
  selected,
  onSelect,
}: {
  selected: ContractTypeValue
  onSelect: (value: ContractTypeValue) => void
}) {
  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border-[#06edf9]/15 mb-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#06edf9]">help</span>
          Chọn loại hình thuê phù hợp
        </h3>
        <p className="text-sm text-[#9bb9bb] mt-1 max-w-3xl">
          Bốn hình thức dưới đây mô tả mức độ “riêng tư” không gian kho. Chọn một loại rồi điền form bên dưới — bạn
          có thể đổi lại trước khi gửi.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CONTRACT_TYPE_OPTIONS.map((item) => {
          const isActive = selected === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onSelect(item.value)}
              className={`text-left rounded-xl p-4 sm:p-5 transition-all border cursor-pointer ${
                isActive
                  ? 'border-[#06edf9]/60 bg-[#06edf9]/10 ring-1 ring-[#06edf9]/30'
                  : 'border-white/10 bg-white/[0.02] hover:border-[#06edf9]/30 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-[#06edf9]/20 text-[#06edf9]' : 'bg-white/5 text-[#9bb9bb]'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{item.title}</p>
                    {isActive && (
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#06edf9]/20 text-[#06edf9]">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#06edf9]/90 mt-0.5">{item.tagline}</p>
                  <p className="text-sm text-[#9bb9bb] mt-2 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
