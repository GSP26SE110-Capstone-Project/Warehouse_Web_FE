import React, { useState } from 'react'

const STRUCTURE_DATA = [
  {
    id: 'wh',
    title: '1. Cấp độ Warehouse (Kho hàng)',
    desc: 'Toàn bộ diện tích tổ hợp logistics. Phù hợp cho các doanh nghiệp lớn bao trọn gói để làm trung tâm phân phối chính.',
    color: 'border-blue-500 bg-blue-50/30 text-blue-700',
    icon: 'corporate_fare',
  },
  {
    id: 'zone',
    title: '2. Cấp độ Zone (Khu vực độc lập)',
    desc: 'Các phân khu biệt lập trong tổng kho (Ví dụ: Khu mát, khu hàng giá trị cao, khu linh kiện). Tính phí thuê theo m² mặt sàn.',
    color: 'border-cyan-500 bg-cyan-50/30 text-cyan-700',
    icon: 'grid_view',
  },
  {
    id: 'rack',
    title: '3. Cấp độ Rack (Kệ chứa hàng)',
    desc: 'Hệ thống kệ Selective/Drive-in cao tầng tối ưu hóa không gian chiều dọc. Khách hàng có thể thuê trọn một dãy kệ lớn.',
    color: 'border-teal-500 bg-teal-50/30 text-teal-700',
    icon: 'shelves',
  },
  {
    id: 'level',
    title: '4. Cấp độ Rack Level (Tầng kệ)',
    desc: 'Chia nhỏ từ hệ kệ Rack. Nếu lượng hàng vừa phải, bạn chỉ cần thuê theo từng tầng kệ riêng lẻ để tiết kiệm chi phí.',
    color: 'border-emerald-500 bg-emerald-50/30 text-emerald-700',
    icon: 'layers',
  },
  {
    id: 'bin',
    title: '5. Cấp độ Bin / Box (Thùng lưu trữ)',
    desc: 'Đơn vị lưu trữ nhỏ nhất dành cho hàng hóa phân mảnh, linh kiện nhỏ lẻ hoặc hàng thương mại điện tử (E-commerce).',
    color: 'border-indigo-500 bg-indigo-50/30 text-indigo-700',
    icon: 'package_2',
  },
]

export const WarehouseStructureExplorer: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 sm:p-8">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h3 className="text-xl font-bold text-gray-900">Mô hình phân rã không gian lưu trữ Nexspace</h3>
        <p className="text-sm text-gray-500 mt-1">
          Bấm chọn các cấp độ kiến trúc để hiểu rõ cơ chế phân bố và định giá dòng tiền của chúng tôi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        {STRUCTURE_DATA.map((item, index) => {
          const isActive = activeStep === index
          return (
            <button
              key={item.id}
              onClick={() => setActiveStep(index)}
              className={`p-3 rounded-xl border text-center transition-all flex md:flex-col items-center justify-start md:justify-center gap-3 ${
                isActive
                  ? 'border-[#0077b6] bg-cyan-50/30 shadow-sm font-semibold text-[#0077b6]'
                  : 'border-gray-100 bg-gray-50/50 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="material-symbols-outlined text-2xl shrink-0">{item.icon}</span>
              <span className="text-xs tracking-tight">{item.title.split(' ')[2]}</span>
            </button>
          )
        })}
      </div>

      <div className={`border-l-4 rounded-r-xl p-5 transition-all duration-300 ${STRUCTURE_DATA[activeStep].color}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined font-bold">{STRUCTURE_DATA[activeStep].icon}</span>
          <h4 className="font-bold text-gray-900">{STRUCTURE_DATA[activeStep].title}</h4>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {STRUCTURE_DATA[activeStep].desc}
        </p>
      </div>
    </div>
  )
}