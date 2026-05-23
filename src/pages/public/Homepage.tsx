import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '../../components/common/header/PublicHeader';

export const HomePage: React.FC = () => {
  const systemStats = [
    { label: 'Tổng Diện Tích Quản Lý', value: '150,000 m²', icon: 'layers', color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
    { label: 'Hệ Thống Dãy Kệ (Rack)', value: '2,400+ Units', icon: 'grid_view', color: 'text-orange-600 bg-orange-50 border-orange-100' },
    { label: 'Vị Trí Ô Chứa (Bins)', value: '45,000+ Bins', icon: 'shelves', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { label: 'Hiệu Suất Vận Hành', value: '99.8%', icon: 'bolt', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  ];

  const coreFeatures = [
    {
      code: 'Z-MGMT',
      title: 'Quản Lý Phân Khu (Zone)',
      desc: 'Tối ưu hóa không gian lưu trữ theo đặc tính hàng hóa: Luồng luân chuyển nhanh, hàng cồng kềnh hoặc phân khu kiểm định chất lượng (QC).',
      link: '/admin/warehouse',
      icon: 'bento'
    },
    {
      code: 'R-FLOW',
      title: 'Sơ Đồ Kệ Hàng Trực Quan',
      desc: 'Hiển thị trực tiếp cấu trúc tầng (Level) và ô chứa (Bin) trực diện theo thời gian thực mà không cần thao tác click rườm rà.',
      link: '/admin/warehouse',
      icon: 'view_in_ar'
    },
    {
      code: 'L-TRACK',
      title: 'Điều Phối LPN & Thể Tích',
      desc: 'Kiểm soát chặt chẽ mã pallet (LPN), giới hạn tải trọng kg của dầm kệ chịu lực và sức chứa thể tích hình học thông minh.',
      link: '/admin/warehouse',
      icon: 'analytics'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9] text-slate-700 flex flex-col font-sans">
       <PublicHeader mode="home" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center ">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tight mb-4">
          Hệ Thống Quản Lý Kho Hàng Thông Minh
        </h2>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl">
          Giải pháp tối ưu không gian, minh bạch thông tin và kết cấu bền vững cho các hoạt động logistics hiện đại
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/admin/warehouse"
            className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-lg hover:opacity-95 transition-all uppercase tracking-wide"
          >
            Bắt đầu ngay
          </Link>
          <Link 
            to="/about-us"
            className="px-8 py-3 border-2 border-cyan-600 text-cyan-600 font-bold rounded-lg hover:bg-cyan-50 transition-all uppercase tracking-wide"
          >
            Tìm hiểu thêm
          </Link>
        </div>
      </main>
      {/* HERO SECTION - KIẾN TRÚC SÁNG TRỰC QUAN */}
      <section className="relative w-full border-b border-slate-200 bg-white p-12 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 py-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-600 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span> Kiến trúc vận hành logistics thế hệ mới
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tight leading-tight">
              Hệ Thống Quy Hoạch <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Kho Bãi Trực Quan Flat-UI</span>
            </h1>
            <p className="text-sm text-slate-500 mt-4 leading-relaxed max-w-xl">
              Giải pháp số hóa toàn diện sơ đồ mặt bằng vật lý (WMS). Quản lý minh bạch và đồng bộ chuỗi dữ liệu đa tầng từ Phân khu lớn, Dãy kệ chịu tải, Tầng lưu trữ cho tới chi tiết từng tọa độ ô chứa (Bin).
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link 
                to="/admin/warehouse" 
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-black rounded-xl hover:opacity-95 shadow-md shadow-cyan-600/10 uppercase tracking-wider transition-all"
              >
                <span className="material-symbols-outlined text-sm">dashboard</span> Trung tâm điều phối
              </Link>
              <Link 
                to="/about" 
                className="flex items-center gap-2 px-6 py-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all uppercase tracking-wider"
              >
                Hồ sơ năng lực
              </Link>
            </div>
          </div>

          {/* KHỐI GIẢ LẬP TRẠNG THÁI PANEL (BẢN MÀU SÁNG MÁY CHỦ) */}
          <div className="w-full lg:w-[420px] bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-600 text-sm">terminal</span>
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Hệ thống giám sát</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 font-mono rounded font-bold">READY</span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between">
                <span className="text-slate-400"># ENGINE_STATUS:</span> <span className="text-cyan-600 font-bold">Mượt mà</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between">
                <span className="text-slate-400"># STRUCT_RENDER:</span> <span className="text-orange-600 font-bold">Đã nạp sơ đồ kệ</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between">
                <span className="text-slate-400"># DATA_INTEGRITY:</span> <span className="text-indigo-600 font-bold">100% Khớp vị trí</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION THỐNG KÊ NHANH */}
      <section className="w-full py-10 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {systemStats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{stat.label}</span>
                <span className="text-xl font-black text-slate-900 font-mono tracking-tight">{stat.value}</span>
              </div>
              <span className={`material-symbols-outlined text-2xl p-2 rounded-xl border ${stat.color}`}>{stat.icon}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION TÍNH NĂNG ĐIỀU HÀNH BẢN SÁNG */}
      <section className="w-full py-12 px-6 max-w-7xl mx-auto flex-1">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs text-orange-600 font-mono font-bold uppercase tracking-widest">Mô đun Chức Năng</span>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">Phân Hệ Thiết Lập Kho Vật Lý</h2>
          <p className="text-xs text-slate-500 mt-2">Bố cục hiển thị mở phẳng giúp thủ kho và nhà điều hành nắm bắt ngay năng lực chứa của từng dầm kệ mà không bị che khuất tầm nhìn.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coreFeatures.map((feature, idx) => (
            <div key={idx} className="group relative bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-cyan-500/50 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined text-2xl text-cyan-600 bg-cyan-50 p-3 rounded-xl border border-cyan-100 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                    {feature.icon}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-md">{feature.code}</span>
                </div>
                <h3 className="text-md font-bold text-slate-900 group-hover:text-cyan-600 transition-colors uppercase tracking-tight">{feature.title}</h3>
                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">{feature.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link to={feature.link} className="text-xs text-cyan-600 hover:text-cyan-700 font-bold flex items-center gap-1">
                  Cấu hình kết cấu <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER ĐỒNG BỘ MÀU SÁNG */}
      <footer className="w-full border-t border-slate-200 bg-white p-6 text-center text-xs text-slate-400 font-mono">
        &copy; {new Date().getFullYear()} WMS Clean-Warehouse System. Toàn bộ quyền được bảo hộ.
      </footer>
    </div>
  );
};