import React, { useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarNav } from '../SidebarNav';
import { AdminHeader } from '../header/AdminHeader';
import { ScrollToTopButton } from '../ScrollToTopButton';
import { useAuth } from '../../../auth/AuthContext'

export const AdminLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const mainRef = useRef<HTMLElement>(null);
    const { user } = useAuth(); // Lấy user hiện tại để check role

    // Khai báo logic nhận diện theme đồng bộ với hệ thống
    const isDarkMode = user?.role === 'SYSTEM_ADMIN';

    const handleToggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className={`flex w-full h-screen overflow-hidden transition-colors duration-300 ${
            isDarkMode ? 'bg-[#0b101a]' : 'bg-slate-50'
        }`}>
            {/* Sidebar (bên trong component này đã tự xử lý màu theo role) */}
            <SidebarNav collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col transition-all duration-300 relative">
                
                {/* Top Header - Chuyển inline-style sang class động của Tailwind */}
                <div className={`fixed top-0 right-0 left-0 z-20 overflow-visible transition-all duration-300 ${
                    sidebarCollapsed ? 'pl-20' : 'pl-64'
                }`}>
                    <AdminHeader />
                </div>
                
                {/* Main Content */}
                <main 
                    ref={mainRef} 
                    className={`flex-1 mt-16 overflow-auto transition-colors duration-300 ${
                        isDarkMode ? 'bg-[#0b101a]' : 'bg-slate-50'
                    }`}
                >
                    <Outlet />
                </main>
                
                {/* Nút cuộn lên đầu trang thay đổi màu nền theo theme */}
                <ScrollToTopButton 
                    scrollTargetRef={mainRef} 
                    className={`transition-colors duration-300 ${
                        isDarkMode 
                            ? 'bg-[#0b101a]/95 text-white border border-white/5' 
                            : 'bg-white/95 text-slate-700 shadow-md border border-slate-200 hover:bg-slate-50'
                    }`} 
                />
            </div>
        </div>
    );
};