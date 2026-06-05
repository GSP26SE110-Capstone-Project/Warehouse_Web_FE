import React, { useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StaffSidebarNav } from '../StaffSidebarNav';
import { StaffHeader } from '../header/StaffHeader';
import { ScrollToTopButton } from '../ScrollToTopButton';

export const StaffLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const mainRef = useRef<HTMLElement>(null);

    const handleToggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        // Đổi bg-[#0b101a] (tối) sang bg-slate-100 (sáng, sạch sẽ)
        <div className="flex bg-slate-100 w-full h-screen overflow-hidden text-slate-900">
            {/* Sidebar (Sẽ tự động ăn theo props hoặc config Light Mode bên trong component đó) */}
            <StaffSidebarNav collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />

            {/* Main Content Area — Đã dọn dẹp chuỗi class bị lỗi cú pháp */}
            <div className="flex-1 flex flex-col transition-all duration-300">
                {/* Top Header */}
                <div 
                    className="fixed top-0 right-0 left-0 z-20 overflow-visible transition-all duration-300" 
                    style={{
                        marginLeft: sidebarCollapsed ? '4rem' : '16rem'
                    }}
                >
                    <StaffHeader />
                </div>
                
                {/* Main Content — Đổi bg-black-500 sang màu xám nền rất nhẹ bg-slate-50/50 để làm nổi bật các thẻ panel màu trắng */}
                <main ref={mainRef} className="flex-1 mt-[69px] overflow-auto bg-slate-50/50">
                    <div className="p-8">
                        <Outlet />
                    </div>
                </main>

                {/* Scroll To Top Button — Chuyển từ nền tối mờ sang nền trắng muốt trong suốt, viền mảnh đổ bóng mềm */}
                <ScrollToTopButton 
                    scrollTargetRef={mainRef} 
                    className="bg-white/95 text-slate-600 border border-slate-200 shadow-md hover:bg-slate-50 hover:text-slate-900" 
                />
            </div>
        </div>
    );
};