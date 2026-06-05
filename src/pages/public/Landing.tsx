import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { RentalRequestForm } from '../../components/public/RentalRequestForm'
import { RentalRequestLookup } from '../../components/public/RentalRequestLookup'
import { ScrollToTopButton } from '../../components/common/ScrollToTopButton'
import { WarehouseStructureExplorer } from '../../components/public/WarehouseStructureExplorer'
import {
  formatVnd,
  HANDLING_FEES,
  SURCHARGES,
  WAREHOUSE_PRICING,
  ZONE_PRICING,
  type PricingTier,
} from '../../data/pricing'

const HERO_BG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAXarldI6DEHoSyQKxf1Ij69kQAgFbbWOCmHHQXVURcOZC0E6a1dH6LEAyfUU_oE9ExY25IE5kjckyS_qB7w--6UAG7g3dUQqV0gb1mW1sT2HqUNdDtiNFeXbe4NVBgRxHURhim9jCe7WybzvyVwHF-E6tAOpEgfWGFtE5k5hoEHHfHpfW8pHvHQU1gJX3WzbgK3uatQp5u4GQKaAq0LnqXAyCntFjWf63OpUayjGo48M9ntC8x9RLq1Hoze4o28I_jQRyG1r9Ljck'

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

function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <div
      className={`bg-white rounded-xl p-5 flex flex-col gap-3 transition-all duration-300 border border-slate-200/80 hover:border-cyan-500/50 hover:shadow-md ${
        tier.highlight ? 'border-cyan-500 ring-1 ring-cyan-500/20 shadow-sm' : ''
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          tier.highlight ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-100 text-slate-500'
        }`}
      >
        <span className="material-symbols-outlined">{tier.icon}</span>
      </div>
      <h3 className="text-lg font-bold text-slate-800">{tier.label}</h3>
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="text-2xl font-bold text-cyan-600">{formatVnd(tier.price)}</span>
        <span className="text-sm text-slate-500">/ {tier.unit}</span>
      </div>
      {tier.description && (
        <p className="text-sm text-slate-600 leading-relaxed mt-auto">{tier.description}</p>
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
      <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0 border border-cyan-100">
        <span className="material-symbols-outlined text-cyan-600 text-2xl">{icon}</span>
      </div>
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{title}</h2>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">{subtitle}</p>
      </div>
    </div>
  )
}

export const Landing: React.FC = () => {
  const [lookupCode, setLookupCode] = useState('')
  const [lookupEmail, setLookupEmail] = useState('')
  const [autoLookup, setAutoLookup] = useState(false)
  const handleSubmitted = (requestCode: string, contactEmail: string) => {
    setLookupCode(requestCode)
    setLookupEmail(contactEmail)
    setAutoLookup(true)
    window.requestAnimationFrame(() => {
      document.getElementById('lookup')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  useEffect(() => {
    // Nếu dự án có dùng global class đổi màu scrollbar, chuyển nó thành dạng light
    document.documentElement.classList.add('light-scrollbar-root')
    return () => {
      document.documentElement.classList.remove('light-scrollbar-root')
    }
  }, [])

  return (
    <div
      className="font-['Inter',sans-serif] relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-700"
    >
      {/* Background Decorator */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img className="w-full h-full object-cover opacity-[0.04] blur-sm scale-105" src={HERO_BG} alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/20 via-slate-50/50 to-slate-50" />
      </div>

      <header className="relative z-20 sticky top-0 border-b border-slate-200/80 backdrop-blur-md bg-white/80 shadow-sm shadow-slate-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <img src={logo} alt="NEXSPACE" className="h-9 w-9" />
            <span className="text-xl font-black tracking-tight text-slate-900">NEXSPACE</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#explore" className="hover:text-cyan-600 transition-colors no-underline">
              Cấu trúc kho
            </a>
            <a href="#warehouse" className="hover:text-cyan-600 transition-colors no-underline">
              Kho
            </a>
            <a href="#zone" className="hover:text-cyan-600 transition-colors no-underline">
              Zone
            </a>
            <a href="#request" className="hover:text-cyan-600 transition-colors no-underline">
              Gửi yêu cầu
            </a>
            <a href="#lookup" className="hover:text-cyan-600 transition-colors no-underline">
              Tra cứu
            </a>
          </nav>
          <Link
            to="/login"
            className="rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-5 text-sm no-underline shrink-0 shadow-sm shadow-cyan-600/10 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
          <p className="text-sm font-bold tracking-widest uppercase text-cyan-600 mb-4">
            Next-Gen Warehouse
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            Giải pháp lưu trữ linh hoạt theo từng cấp độ
          </h1>
          <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Từ lưu hàng linh hoạt (kho xếp kệ giúp bạn) đến thuê khu riêng hoặc nguyên kho — bảng giá minh bạch,
            hóa đơn theo <strong className="text-slate-800 font-semibold">tháng hoặc năm</strong>.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#request"
              className="rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 px-8 text-base no-underline inline-flex items-center gap-2 shadow-md shadow-cyan-600/10 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">send</span>
              Gửi yêu cầu thuê
            </a>
            <a
              href="#warehouse"
              className="rounded-lg font-bold py-3.5 px-8 text-base border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors no-underline inline-flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-xl text-slate-500">payments</span>
              Xem bảng giá
            </a>
            <Link
              to="/login"
              className="rounded-lg font-bold py-3.5 px-8 text-base border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors no-underline shadow-sm"
            >
              Truy cập hệ thống
            </Link>
          </div>
        </section>

        {/* Warehouse structure component wrapper */}
        <section id="explore" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 scroll-mt-24">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-1 shadow-sm">
            <WarehouseStructureExplorer />
          </div>
        </section>

        {/* Request & Lookup Form Section */}
        <section id="request" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 scroll-mt-24">
          <div className="text-center mb-8">
            <p className="text-sm font-bold tracking-widest uppercase text-cyan-600 mb-2">
              Bắt đầu thuê kho
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Gửi yêu cầu & tra cứu</h2>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto text-sm sm:text-base">
              Gửi yêu cầu thuê kho không cần đăng nhập. Sau khi gửi, dùng mã RR-… và email liên hệ để tra cứu
              trạng thái bất cứ lúc nào — trước khi System Admin cấp tài khoản.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <RentalRequestForm onSubmitted={handleSubmitted} />
            </div>
            <div id="lookup" className="scroll-mt-24 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <RentalRequestLookup
                initialCode={lookupCode}
                initialEmail={lookupEmail}
                autoLookup={autoLookup}
              />
            </div>
          </div>
        </section>

        {/* Pricing Lists */}
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
                <PricingCard key={tier.label} tier={tier} />
              ))}
            </div>
          </div>
        </section>

        {/* Fees Tables */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-600">local_shipping</span>
                Phí xử lý (Handling Fee)
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Phí lưu trữ và phí xử lý được tính riêng, phản ánh vận hành thực tế của kho.
              </p>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {HANDLING_FEES.map((row) => (
                    <tr key={row.operation}>
                      <td className="py-3 text-slate-600 font-medium">{row.operation}</td>
                      <td className="py-3 text-right text-slate-900 font-bold">{row.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-600">trending_up</span>
                Phụ phí & Surcharge
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Áp dụng khi SKU fast-moving hoặc zone premium có yêu cầu đặc biệt.
              </p>
              <ul className="divide-y divide-slate-100">
                {SURCHARGES.map((item) => (
                  <li
                    key={item.name}
                    className="flex flex-col sm:flex-row sm:justify-between gap-1 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="text-slate-800 font-bold">{item.name}</span>
                    <span className="text-sm text-slate-500">{item.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Billing Models Block */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 mt-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-600">info</span>
              Mô hình billing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mt-4">
              {BILLING_MODELS.map((model) => (
                <div key={model.name} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-cyan-700 font-bold mb-1.5">{model.name}</p>
                  <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">{model.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Block */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 text-center">
          <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-14 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-cyan-400 to-blue-500" />
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
              Sẵn sàng quản lý kho thông minh?
            </h2>
            <p className="text-slate-500 mb-8 max-w-lg mx-auto text-sm sm:text-base">
              Đăng nhập để tạo yêu cầu thuê, quản lý hợp đồng và theo dõi billing theo thời gian thực.
            </p>
            <Link
              to="/login"
              className="rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 px-10 text-base no-underline inline-flex items-center gap-2 shadow-md shadow-cyan-600/10 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">login</span>
              Đăng nhập ngay
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} NEXSPACE — Next-Gen Warehouse Management</p>
      </footer>

      <ScrollToTopButton />
    </div>
  )
}