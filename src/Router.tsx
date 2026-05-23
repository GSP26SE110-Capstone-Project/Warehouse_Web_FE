import React from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Login } from './pages/auth/Login'
import { Dashboard } from './pages/admin/Dashboard'
import { Inventory } from './pages/admin/Inventory'
import { AdminLayout } from './components/common/layout/AdminLayout'
import { WarehouseManagement } from './pages/admin/Warehouse'
import { ContractManagement } from './pages/admin/Contract'
import { WarehouseDetailView } from './pages/admin/WarehouseDetail'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { NavigationProvider } from './utils/NavigationProvider'
import { AccountManagement } from './pages/admin/ManageAccount'
import { TransportationManagement } from './pages/admin/ManageTransportation'
import { StockMovementManagement } from './pages/admin/StockMovement'
import { Reports } from './pages/admin/Report'
import { AdminSettings } from './pages/admin/Setting'
import { Profile } from './pages/profile/Profile'
import { RequestManagement } from './pages/admin/RequestManagement'
import { StaffDashboard } from './pages/staff/Dashboard'
import { StaffLayout } from './components/common/layout/StaffLayout'
import { StaffRequestManagement } from './pages/staff/TransportManagement'
import { ImportExportManagement } from './pages/staff/ImportExportManagement'
import { ReportManagement } from './pages/staff/ReportManagement'
import { InventoryManagement } from './pages/staff/InventoryManagement'
import { AuthorizationRoute } from './components/AuthorizationRoute'
import { TenantCompany } from './pages/admin/TenantCompany'
import { HomePage } from './pages/public/Homepage'
import { AboutUs } from './pages/public/AboutUs'

export const Router: React.FC = () => {
    return (
        <BrowserRouter>
            <NavigationProvider>
                <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/forgot-password' element={<ForgotPassword />} />
                    <Route path='/reset-password' element={<ResetPassword />} />
                    <Route path="/profile/:id?" element={<Profile />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/about-us" element={<AboutUs />} />

                    {/* Admin Routes with Layout */}
                    <Route path='/admin' element={
                        <AuthorizationRoute requiredRoles={['SYSTEM_ADMIN']} requireAuth={true} redirectTo='/login'>
                            <AdminLayout />
                        </AuthorizationRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path='/admin/dashboard' element={<Dashboard />} />
                        <Route path='/admin/warehouse' element={<WarehouseManagement />} />
                        <Route path="/admin/warehouses/:id" element={<WarehouseDetailView />} />
                        <Route path='/admin/contract' element={<ContractManagement />} />
                        <Route path='/admin/inventory' element={<Inventory />} />
                        <Route path='/admin/accounts' element={<AccountManagement />} />
                        <Route path='/admin/stock-movements' element={<StockMovementManagement />} />
                        <Route path='/admin/transportation' element={<TransportationManagement />} />
                        <Route path='/admin/reports' element={<Reports />} />
                        <Route path='/admin/settings' element={<AdminSettings />} />
                        <Route path='/admin/requests' element={<RequestManagement />} />
                        <Route path='/admin/tenants' element={<TenantCompany />} />
                    </Route>

                    {/* Staff Routes with Layout */}
                    <Route path='/staff' element={
                        <AuthorizationRoute requiredRoles={['WH_STAFF']} requireAuth={true} redirectTo='/login'>
                            <StaffLayout />
                        </AuthorizationRoute>
                    }>
                        <Route index element={<StaffDashboard />} />
                        <Route path='/staff/dashboard' element={<StaffDashboard />} />
                        <Route path='/staff/requests' element={<StaffRequestManagement />} />
                        <Route path='/staff/import-export' element={<ImportExportManagement />} />
                        <Route path='/staff/reports' element={<ReportManagement />} />
                        <Route path='/staff/inventory' element={<InventoryManagement />} />
                    </Route>


                </Routes>
            </NavigationProvider>
        </BrowserRouter>
    )
}