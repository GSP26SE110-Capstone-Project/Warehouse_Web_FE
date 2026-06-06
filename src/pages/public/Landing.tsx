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
  BOX_MONTH_PRICING,
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
      className={`glass-panel rounded-xl p-5 flex flex-col gap-3 transition-all duration-300 hover:border-[#06edf9]/30 ${
        tier.highlight ? 'border-[#06edf9]/40 ring-1 ring-[#06edf9]/20' : ''
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          tier.highlight ? 'bg-[#06edf9]/15 text-[#06edf9]' : 'bg-white/5 text-[#9bb9bb]'
        }`}
      >
        <span className="material-symbols-outlined">{tier.icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-white">{tier.label}</h3>
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="text-2xl font-bold text-[#06edf9]">{formatVnd(tier.price)}</span>
        <span className="text-sm text-[#9bb9bb]">/ {tier.unit}</span>
      </div>
      {tier.description && (
        <p className="text-sm text-[#9bb9bb] leading-relaxed mt-auto">{tier.description}</p>
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
      <div className="w-12 h-12 rounded-xl bg-[#06edf9]/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[#06edf9] text-2xl">{icon}</span>
      </div>
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">{title}</h2>
        <p className="text-[#9bb9bb] mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

export const Landing: React.FC = () => {
  const [lookupCode, setLookupCode] = useState('')
  const [lookupEmail, setLookupEmail] = useState('')
  const [autoLookup, setAutoLookup] = useState(false)
  const handleSubmitted = (requestCode: string, contactEmail?: string) => {
    setLookupCode(requestCode)
    setLookupEmail(contactEmail ?? '')
    setAutoLookup(true)
    window.requestAnimationFrame(() => {
      document.getElementById('lookup')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  useEffect(() => {
    document.documentElement.classList.add('dark-scrollbar-root')
    return () => {
      document.documentElement.classList.remove('dark-scrollbar-root')
    }
  }, [])

  return (
    <div
      className="font-['Inter',sans-serif] relative min-h-screen overflow-x-hidden"
      style={{ background: '#050b0b', color: '#fff' }}
    >
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img className="w-full h-full object-cover opacity-20 blur-sm scale-105" src={HERO_BG} alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2223cc] via-[#0f222399] to-[#050b0b]" />
      </div>

      <header className="relative z-20 sticky top-0 border-b border-white/5 backdrop-blur-md bg-[#050b0b]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <img src={logo} alt="NEXSPACE" className="h-9 w-9" />
            <span className="text-xl font-black tracking-tight text-white">NEXSPACE</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[#9bb9bb]">
            <a href="#explore" className="hover:text-[#06edf9] transition-colors no-underline">
              Cấu trúc kho
            </a>
            <a href="#warehouse" className="hover:text-[#06edf9] transition-colors no-underline">
              Kho
            </a>
            <a href="#zone" className="hover:text-[#06edf9] transition-colors no-underline">
              Zone
            </a>
            <a href="#request" className="hover:text-[#06edf9] transition-colors no-underline">
              Gửi yêu cầu
            </a>
            <a href="#lookup" className="hover:text-[#06edf9] transition-colors no-underline">
              Tra cứu
            </a>
          </nav>
          <Link
            to="/login"
            className="auth-btn rounded-lg font-semibold py-2.5 px-5 text-sm no-underline shrink-0"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
          <p className="text-sm font-medium tracking-widest uppercase text-[#06edf9] mb-4">
            Next-Gen Warehouse
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Giải pháp lưu trữ linh hoạt theo từng cấp độ
          </h1>
          <p className="mt-6 text-lg text-[#9bb9bb] max-w-2xl mx-auto leading-relaxed">
            Từ lưu hàng linh hoạt (kho xếp kệ giúp bạn) đến thuê khu riêng hoặc nguyên kho — bảng giá minh bạch,
            hóa đơn theo <strong className="text-white font-medium">tháng hoặc năm</strong>.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#request"
              className="auth-btn rounded-lg font-bold py-3.5 px-8 text-base no-underline inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined">send</span>
              Gửi yêu cầu thuê
            </a>
            <a
              href="#warehouse"
              className="rounded-lg font-semibold py-3.5 px-8 text-base border border-white/10 text-white hover:border-[#06edf9]/40 transition-colors no-underline inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined">payments</span>
              Xem bảng giá
            </a>
            <Link
              to="/login"
              className="rounded-lg font-semibold py-3.5 px-8 text-base border border-white/10 text-white hover:border-[#06edf9]/40 transition-colors no-underline"
            >
              Truy cập hệ thống
            </Link>
          </div>
        </section>

        <section id="explore" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 scroll-mt-24">
          <WarehouseStructureExplorer />
        </section>

        <section id="request" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 scroll-mt-24">
          <div className="text-center mb-8">
            <p className="text-sm font-medium tracking-widest uppercase text-[#06edf9] mb-2">
              Bắt đầu thuê kho
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Gửi yêu cầu & tra cứu</h2>
            <p className="text-[#9bb9bb] mt-3 max-w-2xl mx-auto">
              Gửi yêu cầu thuê kho không cần đăng nhập. Sau khi gửi, dùng mã RR-… và email liên hệ để tra cứu
              trạng thái bất cứ lúc nào — trước khi System Admin cấp tài khoản.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <RentalRequestForm onSubmitted={handleSubmitted} />
            <div id="lookup" className="scroll-mt-24">
              <RentalRequestLookup
                initialCode={lookupCode}
                initialEmail={lookupEmail}
                autoLookup={autoLookup}
              />
            </div>
          </div>
        </section>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
              {ZONE_PRICING.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#06edf9]">local_shipping</span>
                Phí xử lý (Handling Fee)
              </h3>
              <p className="text-sm text-[#9bb9bb] mb-4">
                Phí lưu trữ và phí xử lý được tính riêng, phản ánh vận hành thực tế của kho.
              </p>
              <table className="w-full text-sm">
                <tbody>
                  {HANDLING_FEES.map((row) => (
                    <tr key={row.operation} className="border-t border-white/5">
                      <td className="py-2.5 text-[#9bb9bb]">{row.operation}</td>
                      <td className="py-2.5 text-right text-white font-medium">{row.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="glass-panel rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#06edf9]">package_2</span>
                Giá lưu trữ theo loại thùng
              </h3>
              <p className="text-sm text-[#9bb9bb] mb-4">
                Lưu hàng linh hoạt (SHARED_STORAGE) — đơn giá cố định theo loại LPN/thùng, tính theo tháng
                (30 ngày). Số thùng thực tế × đơn giá/tháng trên hóa đơn.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase text-[#9bb9bb]">
                    <th className="pb-2 font-medium">Loại thùng</th>
                    <th className="pb-2 text-right font-medium">Giá/tháng</th>
                  </tr>
                </thead>
                <tbody>
                  {BOX_MONTH_PRICING.map((row) => (
                    <tr key={row.name} className="border-t border-white/5">
                      <td className="py-2.5">
                        <span className="text-white font-medium">{row.label}</span>
                        {row.description && (
                          <span className="mt-0.5 block text-xs text-[#9bb9bb]">{row.description}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right align-top">
                        <span className="font-semibold text-[#06edf9]">{formatVnd(row.price)}</span>
                        <span className="block text-xs text-[#9bb9bb]">/ {row.unit}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 mt-6 border-[#06edf9]/20">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#06edf9]">info</span>
              Mô hình billing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {BILLING_MODELS.map((model) => (
                <div key={model.name} className="bg-white/3 rounded-lg p-4">
                  <p className="text-[#06edf9] font-semibold mb-1">{model.name}</p>
                  <p className="text-[#9bb9bb]">{model.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 text-center">
          <div className="glass-panel rounded-2xl p-10 sm:p-14 border-[#06edf9]/20">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Sẵn sàng quản lý kho thông minh?
            </h2>
            <p className="text-[#9bb9bb] mb-8 max-w-lg mx-auto">
              Đăng nhập để tạo yêu cầu thuê, quản lý hợp đồng và theo dõi billing theo thời gian thực.
            </p>
            <Link
              to="/login"
              className="auth-btn rounded-lg font-bold py-3.5 px-10 text-base no-underline inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined">login</span>
              Đăng nhập ngay
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-[#9bb9bb]">
        <p>© {new Date().getFullYear()} NEXSPACE — Next-Gen Warehouse Management</p>
      </footer>

      <ScrollToTopButton />
    </div>
  )
}
