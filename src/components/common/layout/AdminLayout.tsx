import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarNav } from '../SidebarNav';
import { AdminHeader } from '../header/AdminHeader';

export const AdminLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
                <main className="flex-1 mt-16 overflow-auto bg-black-500">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};