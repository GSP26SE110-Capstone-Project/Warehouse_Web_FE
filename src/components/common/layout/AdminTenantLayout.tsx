import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminTenantSideNav } from '../AdminTenantSideNav';
import { AdminTenantHeader } from '../header/AdminTenantHeader';

export const AdminTenantLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const handleToggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="flex bg-slate-50 w-full h-screen overflow-hidden text-slate-800">
            {/* Sidebar */}
            <AdminTenantSideNav collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col transition-all duration-300  relative
                }`}>
                {/* Top Header */}
                <div className=" fixed top-0 right-0 left-0 z-20 border-b border-slate-200 bg-white shadow-sm transition-all duration-300" style={{
                    marginLeft: sidebarCollapsed ? '5rem' : '16rem'
                }}>
                    <AdminTenantHeader />
                </div>
                {/* Main Content */}
                <main className="flex-1 mt-16 overflow-auto bg-slate-50 p-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};