import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { ContractTypeGuide } from './ContractTypeGuide'
import { RentalRequestForm } from './RentalRequestForm'
import { RentalRequestLookup } from './RentalRequestLookup'
import { ScrollToTopButton } from './ScrollToTopButton'
import { WarehouseStructureExplorer } from './WarehouseStructureExplorer'
import type { ContractType } from '../../types/RentalRequest'
import type {PricingModel} from '../../types/RentalRequest'
import { PublicHeader } from '../../components/common/header/PublicHeader'

const HERO_BG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXarldI6DEHoSyQKxf1Ij69kQAgFbbWOCmHHQXVURcOZC0E6a1dH6LEAyfUU_oE9ExY25IE5kjckyS_qB7w--6UAG7g3dUQqV0gb1mW1sT2HqUNdDtiNFeXbe4NVBgRxHURhim9jCe7WybzvyVwHF-E6tAOpEgfWGFtE5k5hoEHHfHpfW8pHvHQU1gJX3WzbgK3uatQp5u4GQKaAq0LnqXAyCntFjWf63OpUayjGo48M9ntC8x9RLq1Hoze4o28I_jQRyG1r9Ljck'

const BILLING_MODELS = [
  {
    name: 'Lưu hàng linh hoạt',
    desc: 'Kho xếp hàng lên kệ giúp bạn — trả theo lượng hàng thực tế, hóa đơn theo tháng hoặc năm',
  },
  {
    name: 'Thuê khu riêng trong kho',
    desc: 'Một khu vực tách riêng — phí theo diện tích × đơn giá khu/tháng',
  },
  {
    name: 'Thuê nguyên kho',
    desc: 'Toàn bộ warehouse — phí theo diện tích × 120.000 ₫/m²/tháng',
  },
]



interface PricingTier {
  name: string
  label: string
  price: number
  unit: string
  icon: string
  highlight?: boolean
  description?: string
}

// Utility function to format VND
function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  })
    .format(value)
    .replace(/₫/g, '₫')
}

const WAREHOUSE_PRICING: PricingTier = {
  name: 'warehouse',
  label: 'Thuê nguyên Warehouse',
  price: 120000,
  unit: 'm²/tháng',
  icon: 'warehouse',
  highlight: true,
  description: 'Dedicated warehouse với đầy đủ tiện ích',
}

const ZONE_PRICING: PricingTier[] = [
  {
    name: 'standard_zone',
    label: 'Zone Tiêu Chuẩn',
    price: 50000,
    unit: 'm²/tháng',
    icon: 'grid_view',
    description: 'Khu vực tiêu chuẩn cho lưu hàng',
  },
  {
    name: 'premium_zone',
    label: 'Zone Premium',
    price: 75000,
    unit: 'm²/tháng',
    icon: 'star',
    highlight: true,
    description: 'Khu vực premium với điều kiện tốt hơn',
  },
]

const RACK_PRICING: PricingTier[] = [
  {
    name: 'standard_rack',
    label: 'Rack Tiêu Chuẩn',
    price: 15000,
    unit: 'rack/ngày',
    icon: 'shelves',
    description: 'Rack tiêu chuẩn cho lưu trữ cơ bản',
  },
  {
    name: 'heavy_duty_rack',
    label: 'Rack Chịu Lực Cao',
    price: 25000,
    unit: 'rack/ngày',
    icon: 'shelves',
    highlight: true,
    description: 'Rack chịu lực cao cho hàng nặng',
  },
]

const RACK_LEVEL_PRICING: PricingTier[] = [
  {
    name: 'level_1',
    label: 'Tầng 1 (Mặt đất)',
    price: 5000,
    unit: 'level/ngày',
    icon: 'layers',
    description: 'Tầng mặt đất - dễ tiếp cận',
  },
  {
    name: 'level_2_3',
    label: 'Tầng 2-3 (Giữa)',
    price: 7500,
    unit: 'level/ngày',
    icon: 'layers',
    highlight: true,
    description: 'Tầng giữa - sử dụng phổ biến',
  },
  {
    name: 'level_4_5',
    label: 'Tầng 4-5 (Trên cao)',
    price: 10000,
    unit: 'level/ngày',
    icon: 'layers',
    description: 'Tầng trên cao - tiếp cận khó hơn',
  },
]

const BIN_PRICING: PricingTier[] = [
  {
    name: 'small_bin',
    label: 'Hộp Nhỏ (S)',
    price: 2000,
    unit: 'box/ngày',
    icon: 'package_2',
    description: 'Hộp nhỏ - đến 10kg',
  },
  {
    name: 'medium_bin',
    label: 'Hộp Trung (M)',
    price: 3500,
    unit: 'box/ngày',
    icon: 'package_2',
    highlight: true,
    description: 'Hộp trung - 10-20kg',
  },
  {
    name: 'large_bin',
    label: 'Hộp Lớn (L)',
    price: 5500,
    unit: 'box/ngày',
    icon: 'package_2',
    description: 'Hộp lớn - 20-30kg',
  },
  {
    name: 'xlarge_bin',
    label: 'Hộp Cực Lớn (XL)',
    price: 8000,
    unit: 'box/ngày',
    icon: 'package_2',
    description: 'Hộp cực lớn - trên 30kg',
  },
]

const HANDLING_FEES = [
  { operation: 'Inbound (Nhập kho)', fee: '5.000₫/lần' },
  { operation: 'Outbound (Xuất kho)', fee: '7.500₫/lần' },
  { operation: 'Picking (Lấy hàng)', fee: '2.000₫/SKU' },
  { operation: 'Packing (Đóng gói)', fee: '3.000₫/box' },
  { operation: 'Labeling (Dán nhãn)', fee: '1.000₫/SKU' },
]

const SURCHARGES = [
  { name: 'Fast-Moving SKU', detail: '+20% phí lưu trữ' },
  { name: 'Premium Zone', detail: '+30% phí diện tích' },
  { name: 'Climate Control', detail: '+15.000₫/m²/tháng' },
  { name: 'Security Camera', detail: '+5.000₫/zone/tháng' },
]


function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <div
      className={`bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-md hover:border-[#00b4d8]/50 ${
        tier.highlight ? 'border-[#00b4d8] ring-1 ring-[#00b4d8]/20 bg-cyan-50/20' : ''
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          tier.highlight ? 'bg-[#00b4d8]/10 text-[#0077b6]' : 'bg-gray-100 text-gray-500'
        }`}
      >
        <span className="material-symbols-outlined">{tier.icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{tier.label}</h3>
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="text-2xl font-bold text-[#0077b6]">{formatVnd(tier.price)}</span>
        <span className="text-sm text-gray-500">/ {tier.unit}</span>
      </div>
      {tier.description && (
        <p className="text-sm text-gray-600 leading-relaxed mt-auto">{tier.description}</p>
      )}
    </div>
  )
}

function SectionHeader({
  id,
  icon,
  title,
  subtitle,
}: {
  id: string
  icon: string
  title: string
  subtitle: string
}) {
  return (
    <div id={id} className="flex flex-col sm:flex-row sm:items-end gap-3 mb-8 scroll-mt-24">
      <div className="w-12 h-12 rounded-xl bg-[#00b4d8]/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[#0077b6] text-2xl">{icon}</span>
      </div>
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600 mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

export const Landing: React.FC = () => {
  const [lookupCode, setLookupCode] = useState('')
  const [lookupEmail, setLookupEmail] = useState('')
  const [autoLookup, setAutoLookup] = useState(false)
  const [contractType, setContractType] = useState<ContractType>('DEDICATED_WAREHOUSE')

  const handleSubmitted = (requestCode: string, contactEmail: string) => {
    setLookupCode(requestCode)
    setLookupEmail(contactEmail)
    setAutoLookup(true)
    window.requestAnimationFrame(() => {
      document.getElementById('lookup')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  useEffect(() => {
    // Nếu bạn có class custom cho scrollbar nền sáng, hãy đổi ở đây, ví dụ 'light-scrollbar-root'
    document.documentElement.classList.add('light-scrollbar-root')
    return () => {
      document.documentElement.classList.remove('light-scrollbar-root')
    }
  }, [])

  return (
    <div
      className="font-['Inter',sans-serif] relative min-h-screen overflow-x-hidden"
      style={{ background: '#f8fafc', color: '#1e293b' }}
    >
           <PublicHeader mode="aboutus" showBackButton title="Tham Khảo Giá Thuê" />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#request"
              className="bg-[#0077b6] hover:bg-[#0096c7] text-white rounded-lg font-bold py-3.5 px-8 text-base no-underline inline-flex items-center gap-2 shadow-md transition-colors"
            >
              <span className="material-symbols-outlined">send</span>
              Gửi yêu cầu thuê
            </a>
            <a
              href="#warehouse"
              className="bg-white rounded-lg font-semibold py-3.5 px-8 text-base border border-gray-300 text-gray-700 hover:border-[#00b4d8] hover:text-[#0077b6] transition-colors no-underline inline-flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined">payments</span>
              Xem bảng giá
            </a>
            <Link
              to="/login"
              className="bg-white rounded-lg font-semibold py-3.5 px-8 text-base border border-gray-300 text-gray-700 hover:border-[#00b4d8] hover:text-[#0077b6] transition-colors no-underline shadow-sm"
            >
              Truy cập hệ thống
            </Link>
          </div>

        {/* Explorer Section */}
        {/* <section id="explore" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 scroll-mt-24">
          <WarehouseStructureExplorer />
        </section> */}

        {/* Request & Lookup Section */}
        <section id="request" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 scroll-mt-24">
          <div className="text-center mb-8 mt-10">
            <p className="text-sm font-bold tracking-widest uppercase text-[#0077b6] mb-2">
              Bắt đầu thuê kho
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Gửi yêu cầu & tra cứu</h2>
            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
              Gửi yêu cầu thuê kho không cần đăng nhập. Sau khi gửi, dùng mã RR-… và email liên hệ để tra cứu
              trạng thái bất cứ lúc nào — trước khi System Admin cấp tài khoản.
            </p>
          </div>
          {/* <ContractTypeGuide selected={contractType} onSelect={setContractType} /> */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-8">
            <RentalRequestForm
              contractType={contractType}
              onContractTypeChange={setContractType}
              onSubmitted={handleSubmitted}
            />
            <div id="lookup" className="scroll-mt-24">
              <RentalRequestLookup
                initialCode={lookupCode}
                initialEmail={lookupEmail}
                autoLookup={autoLookup}
              />
            </div>
          </div>
        </section>

        {/* Pricing Sections */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-20">
          <div>
            <SectionHeader
              id="warehouse"
              icon="warehouse"
              title="Thuê nguyên Warehouse"
              subtitle="Dedicated warehouse — tính theo diện tích m²/tháng"
            />
            <div className="max-w-md">
              <PricingCard tier={WAREHOUSE_PRICING} />
            </div>
          </div>

          <div>
            <SectionHeader
              id="zone"
              icon="grid_view"
              title="Thuê khu riêng (Zone)"
              subtitle="Một khu vực tách riêng trong kho — giá theo loại khu và diện tích m²/tháng"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ZONE_PRICING.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
          </div>

          <div>
            <SectionHeader
              id="rack"
              icon="shelves"
              title="Thuê Rack & Rack Level"
              subtitle="Đơn giá theo rack/ngày và level/ngày — tổng phí kỳ = đơn giá × số ngày sử dụng; hóa đơn tổng hợp theo tháng/năm"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {RACK_PRICING.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
            <p className="text-sm text-gray-500 mb-4 uppercase tracking-widest font-bold">
              Giá theo tầng kệ (Rack Level)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {RACK_LEVEL_PRICING.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
          </div>

          <div>
            <SectionHeader
              id="bin"
              icon="package_2"
              title="Thuê Bin (Box)"
              subtitle="Đơn giá theo box/ngày (BOX_DAY) — tổng phí kỳ = đơn giá × số box-day; hóa đơn tổng hợp theo tháng/năm"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BIN_PRICING.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
          </div>
        </section>

        {/* Fees & Billing Models */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0077b6]">local_shipping</span>
                Phí xử lý (Handling Fee)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Phí lưu trữ và phí xử lý được tính riêng, phản ánh vận hành thực tế của kho.
              </p>
              <table className="w-full text-sm">
                <tbody>
                  {HANDLING_FEES.map((row) => (
                    <tr key={row.operation} className="border-t border-gray-100">
                      <td className="py-2.5 text-gray-600">{row.operation}</td>
                      <td className="py-2.5 text-right text-gray-900 font-semibold">{row.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0077b6]">trending_up</span>
                Phụ phí & Surcharge
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Áp dụng khi SKU fast-moving hoặc zone premium có yêu cầu đặc biệt.
              </p>
              <ul className="space-y-3">
                {SURCHARGES.map((item) => (
                  <li
                    key={item.name}
                    className="flex flex-col sm:flex-row sm:justify-between gap-1 border-t border-gray-100 pt-3 first:border-0 first:pt-0"
                  >
                    <span className="text-gray-900 font-semibold">{item.name}</span>
                    <span className="text-sm text-gray-600">{item.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0077b6]">info</span>
              Mô hình billing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {BILLING_MODELS.map((model) => (
                <div key={model.name} className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                  <p className="text-[#0077b6] font-bold mb-1">{model.name}</p>
                  <p className="text-gray-600">{model.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 text-center">
          <div className="bg-white border border-gray-200 shadow-md rounded-2xl p-10 sm:p-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Sẵn sàng quản lý kho thông minh?
            </h2>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto">
              Đăng nhập để tạo yêu cầu thuê, quản lý hợp đồng và theo dõi billing theo thời gian thực.
            </p>
            <Link
              to="/login"
              className="bg-[#0077b6] hover:bg-[#0096c7] text-white rounded-lg font-bold py-3.5 px-10 text-base no-underline inline-flex items-center gap-2 shadow-md transition-colors"
            >
              <span className="material-symbols-outlined">login</span>
              Đăng nhập ngay
            </Link>
          </div>
        </section>
      </main>

      <ScrollToTopButton />
    </div>
  )
}