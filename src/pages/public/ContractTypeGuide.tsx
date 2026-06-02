import type { ContractType } from '../../types/RentalRequest'

interface ContractTypeOption {
  value: ContractType
  icon: string
  title: string
  tagline: string
  description: string
}

const GUEST_CONTRACT_TYPE_OPTIONS: ContractTypeOption[] = [
  {
    value: 'SHARED_STORAGE',
    icon: 'workspaces',
    title: 'Kho Chung (Shared Storage)',
    tagline: 'Chia sẻ không gian với các khách hàng khác',
    description:
      'Thuê một phần diện tích kho chung. Phù hợp với doanh nghiệp nhỏ vừa, chi phí thấp nhất. Bạn chia sẻ zone lưu trữ và dịch vụ với các khách hàng khác.',
  },
  {
    value: 'RESERVED_STORAGE',
    icon: 'lock_clock',
    title: 'Kho Dự Trữ (Reserved Storage)',
    tagline: 'Không gian riêng, dùng theo nhu cầu',
    description:
      'Thuê một khu vực riêng biệt được bảo lưu cho công ty bạn. Bạn có toàn quyền sử dụng không gian này, chỉ trả phí theo lượng hàng lưu trữ thực tế.',
  },
  {
    value: 'DEDICATED_ZONE',
    icon: 'rectangle_select_large',
    title: 'Khu Vực Riêng (Dedicated Zone)',
    tagline: 'Khu vực độc lập, quyền sử dụng toàn bộ',
    description:
      'Thuê một khu vực lưu trữ hoàn toàn riêng biệt với hệ thống rack, kệ riêng. Kiểm soát đầy đủ về quy trình, thời gian hoạt động. Giá cố định hoặc theo nhu cầu.',
  },
  {
    value: 'DEDICATED_WAREHOUSE',
    icon: 'domain',
    title: 'Kho Riêng (Dedicated Warehouse)',
    tagline: 'Toàn bộ kho chỉ phục vụ doanh nghiệp bạn',
    description:
      'Thuê toàn bộ một kho lưu trữ với mọi trang thiết bị, hệ thống quản lý riêng. Phù hợp với doanh nghiệp lớn có nhu cầu cao, yêu cầu đặc biệt về logistics.',
  },
]

export function ContractTypeGuide({
  selected,
  onSelect,
}: {
  selected: ContractType
  onSelect: (value: ContractType) => void
}) {
  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border-[#06edf9]/15 mb-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#06edf9]">help</span>
          Chọn loại hình thuê phù hợp
        </h3>
        <p className="text-sm text-[#9bb9bb] mt-1 max-w-3xl">
          Chọn hình thức gần với nhu cầu của bạn. Không chắc? Chọn{' '}
          <strong className="text-[#06edf9]">Chưa rõ / để kho tư vấn</strong> — đội ngũ kho sẽ đề xuất
          khi duyệt yêu cầu.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GUEST_CONTRACT_TYPE_OPTIONS.map((item) => {
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