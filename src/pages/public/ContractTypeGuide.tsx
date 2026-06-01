import React from 'react'
import type { ContractType } from '../../types/RentalRequest'

interface ContractTypeGuideProps {
  selected: ContractType
  onSelect: (value: ContractType) => void
}

export const ContractTypeGuide: React.FC<ContractTypeGuideProps> = ({ selected, onSelect }) => {
  const options: { value: ContractType; label: string; desc: string; icon: string }[] = [
    {
      value: 'DEDICATED_WAREHOUSE',
      label: 'Thuê nguyên kho',
      desc: 'Phù hợp cho doanh nghiệp lớn. Toàn quyền vận hành hoặc sử dụng hệ thống quản lý chuyên biệt của Nexspace.',
      icon: 'all_inclusive',
    },
    {
      value: 'DEDICATED_ZONE',
      label: 'Thuê khu riêng (Zone)',
      desc: 'Phù hợp doanh nghiệp vừa. Có không gian riêng tách biệt, tự quản lý hoặc kho quản lý hộ.',
      icon: 'grid_view',
    },
    {
      value: 'RESERVED_STORAGE',
      label: 'Thuê kho dành riêng',
      desc: 'Phù hợp cho doanh nghiệp lớn. Toàn quyền vận hành hoặc sử dụng hệ thống quản lý chuyên biệt của Nexspace.',
      icon: 'warehouse',
    },
    {
      value: 'SHARED_STORAGE',
      label: 'Thuê kho chung',
      desc: 'Phù hợp cho doanh nghiệp nhỏ hoặc cần lưu trữ tạm thời. Chia sẻ không gian với các doanh nghiệp khác.',
      icon: 'people_alt',
    },
  ]

  return (
    <div className="mb-8">
      <p className="text-sm font-bold text-gray-700 mb-3">Bước 1: Chọn hình thức thuê kho</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {options.map((opt) => {
          const isSelected = selected === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 shadow-sm flex flex-col gap-2 ${
                isSelected
                  ? 'bg-cyan-50/40 border-[#0077b6] ring-2 ring-[#0077b6]/10'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-[#0077b6] text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{opt.icon}</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">{opt.label}</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{opt.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}