import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '../../components/common/header/PublicHeader';

export const AboutUs: React.FC = () => {
  const coreValues = [
    { title: 'Tối Ưu Không Gian', desc: 'Mô phỏng chính xác vị trí dầm dập và cột kệ sắt tiêu chuẩn, quản lý khép kín diện tích sàn m² hữu ích.', icon: 'space_dashboard', color: 'border-cyan-200 bg-cyan-50 text-cyan-600' },
    { title: 'Minh Bạch Phẳng', desc: 'Thiết kế lưới ô chứa bóc tách rõ ràng từ trước. Loại bỏ trạng thái ẩn thông tin gây ức chế khi vận hành.', icon: 'visibility', color: 'border-orange-200 bg-orange-50 text-orange-600' },
    { title: 'Kết Cấu Bền Vững', desc: 'Cơ sở dữ liệu lưu trữ tính toán chịu tải hoàn hảo cho mô hình đa tầng chồng chất (Heavy Duty Mezzanine).', icon: 'all_inclusive', color: 'border-indigo-200 bg-indigo-50 text-indigo-600' }
  ];

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9] text-slate-700 flex flex-col font-sans">
       <PublicHeader mode="aboutus" showBackButton title="Hồ Sơ Năng Lực" />

      {/* THÂN TRANG TRẮNG SÁNG SẠCH SẼ */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 space-y-12">
        
        {/* KHỐI GIỚI THIỆU SỨ MỆNH */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-500 to-blue-600"></div>
          <span className="text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest">Triết lý thiết kế hệ thống</span>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1 mb-4">Giải Phóng Giới Hạn Không Gian Quản Trị Kho</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Lấy cảm hứng từ các kho lưu trữ logistics công nghiệp hiện đại châu Âu — nơi hệ kết cấu thép sáng bóng, ánh sáng giếng trời tự nhiên đan xen tạo cảm giác gọn gàng sạch sẽ, chúng tôi đã tạo dựng nên phần mềm điều phối kho hàng này.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Chúng tôi kiên quyết bài trừ những giao diện quản lý dạng bảng tính Excel chồng chéo, rối rắm và ẩn giấu thông tin. Với mô hình phẳng hóa phân lớp, tất cả vị trí lưu trữ từ Zone tới từng dầm đỡ của Rack đều hiển thị trực diện giúp thao tác xuất nhập kho diễn ra với độ trễ bằng không.
          </p>
        </section>

        {/* KHỐI CÁC GIÁ TRỊ CỐT LÕI */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="text-xs text-orange-600 font-mono font-bold uppercase tracking-widest">Tiêu Chí Cam Kết</span>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1">Nền Tảng Kỹ Thuật Đạt Chuẩn Vật Lý</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {coreValues.map((value, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className={`w-10 h-10 flex items-center justify-center border rounded-xl mb-4 ${value.color}`}>
                    <span className="material-symbols-outlined text-lg">{value.icon}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{value.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* KHỐI THÔNG SỐ ĐỘI NGŨ / LIÊN HỆ BẢN SÁNG */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          
          {/* Năng lực kỹ thuật */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-cyan-600 font-mono uppercase tracking-wider mb-4">// Công nghệ tích hợp cốt lõi</h3>
            <ul className="space-y-3 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span> Khởi tạo trên nền React 18 & TypeScript vững vàng
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span> Tối ưu hóa CSS bằng Tailwind Utility (Gọn nhẹ, tải nhanh)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span> Thiết lập lưới ô phẳng chống chồng đè giao diện
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span> Đảm bảo luồng tải API đồng loạt cho toàn bộ hệ thống kệ
              </li>
            </ul>
          </div>

          {/* Kêu gọi hành động */}
          <div className="bg-gradient-to-br from-slate-100 to-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-orange-600 font-bold uppercase tracking-wider">Hợp tác số hóa kho bãi</span>
              <h3 className="text-md font-bold text-slate-900 uppercase mt-1 mb-2">Bắt đầu quy hoạch ngay hôm nay?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Đội ngũ kỹ sư kết cấu luôn sẵn sàng hỗ trợ doanh nghiệp chuyển dịch mô hình sơ đồ giấy sang tọa độ số phẳng thông minh để tối ưu chi phí vận hành.
              </p>
            </div>
            <Link 
              to="/admin/warehouse" 
              className="mt-6 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-black rounded-xl hover:opacity-95 shadow-md transition-all uppercase tracking-wide w-full sm:w-auto"
            >
              Cấu hình kho của bạn
            </Link>
          </div>

        </section>

      </main>

      {/* FOOTER ĐỒNG BỘ */}
      <footer className="w-full border-t border-slate-200 bg-white p-6 text-center text-xs text-slate-400 font-mono">
        &copy; {new Date().getFullYear()} WMS Clean-Warehouse System. Toàn bộ quyền được bảo hộ.
      </footer>
    </div>
  );
};