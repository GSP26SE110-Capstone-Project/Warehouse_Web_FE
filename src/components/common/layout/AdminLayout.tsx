import React, { useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarNav } from '../SidebarNav';
import { AdminHeader } from '../header/AdminHeader';
import { ScrollToTopButton } from '../ScrollToTopButton';
import { APP_MAIN_SCROLL } from '../../../styles/scrollClasses';

export const AdminLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const mainRef = useRef<HTMLElement>(null);

    const handleToggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="flex bg-[#0b101a] w-full h-screen overflow-hidden">
            {/* Sidebar */}
            <SidebarNav collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col transition-all duration-300 
                }`}>
                {/* Top Header */}
                <div className="fixed top-0 right-0 left-0 z-20 overflow-visible" style={{
                    marginLeft: sidebarCollapsed ? '4rem' : '16rem'
                }}>
                    <AdminHeader />
                </div>
                {/* Main Content */}
                <main ref={mainRef} className={`flex-1 mt-16 bg-black-500 ${APP_MAIN_SCROLL}`}>
                    <Outlet />
                </main>
                <ScrollToTopButton scrollTargetRef={mainRef} className="bg-[#0b101a]/95" />
            </div>
        </div>
    );
};