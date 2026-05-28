import React from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Login } from './pages/auth/Login'
import { Dashboard } from './pages/admin/Dashboard'
import { Inventory } from './pages/adminWarehouse/Inventory'
import { AdminLayout } from './components/common/layout/AdminLayout'
import { WarehouseManagement } from './pages/admin/Warehouse'
import { ManageContracts } from './pages/adminWarehouse/Contract'
import { WarehouseDetailView } from './pages/admin/WarehouseDetail'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { NavigationProvider } from './utils/NavigationProvider'
import { AccountManagement } from './pages/admin/ManageAccount'
import { TransportationManagement } from './pages/admin/ManageTransportation'
import { StockMovementManagement } from './pages/admin/StockMovement'
import { Reports } from './pages/adminTenant/Report'
import { AdminSettings } from './pages/admin/Setting'
import { Profile } from './pages/profile/Profile'
import { RequestManagement } from './pages/admin/RequestManagement'
import { StaffDashboard } from './pages/staff/Dashboard'
import { StaffRequestManagement } from './pages/staff/TransportManagement'
import { ImportExportManagement } from './pages/staff/ImportExportManagement'
import { ReportManagement } from './pages/staff/ReportManagement'
import { InventoryManagement } from './pages/staff/InventoryManagement'
import { AuthorizationRoute } from './components/AuthorizationRoute'
import { TenantCompany } from './pages/admin/TenantCompany'
import { HomePage } from './pages/public/Homepage'
import { AboutUs } from './pages/public/AboutUs'
import { AdminWarehouseLayout } from './components/common/layout/AdminWarehouseLayout'
import { AdminWarehouseDashboard } from './pages/adminWarehouse/Dashboard'
import { Warehouse } from './pages/adminWarehouse/Warehouse'
import { ManageRequestRental } from './pages/adminWarehouse/ManageRequestRental'
import { ManageInbound } from './pages/adminWarehouse/ManageInbound'
import { ManageOutbound } from './pages/adminWarehouse/ManageOutBound'
import { ManageWarehouseStaff } from './pages/adminWarehouse/ManageWarehouseStaff'
import { AdminTenantLayout } from './components/common/layout/AdminTenantLayout'
import { ProductManagement } from './pages/adminTenant/ProductManagement'
import { ManageStaffTenant } from './pages/adminTenant/ManageStaffTenant'
import { TenantManageInbound } from './pages/adminTenant/ManageInbound'
import { TenantManageOutbound } from './pages/adminTenant/ManageOutbound'
import { ManageContract } from './pages/adminTenant/ManageContract'
import { Rental } from './pages/public/Rental'

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
                    <Route path="/warehouses" element={<Rental />} />



                    {/* ==================Admin System Routes with Layout=============== */}
                    <Route path='/admin-system' element={
                        <AuthorizationRoute requiredRoles={['SYSTEM_ADMIN']} requireAuth={true} redirectTo='/login'>
                            <AdminLayout />
                        </AuthorizationRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path='/admin-system/dashboard' element={<Dashboard />} />
                        <Route path='/admin-system/warehouse' element={<WarehouseManagement />} />
                        <Route path="/admin-system/warehouses/:id" element={<WarehouseDetailView />} />
                        <Route path='/admin-system/inventory' element={<Inventory />} />
                        <Route path='/admin-system/accounts' element={<AccountManagement />} />
                        <Route path='/admin-system/stock-movements' element={<StockMovementManagement />} />
                        <Route path='/admin-system/transportation' element={<TransportationManagement />} />
                        <Route path='/admin-system/reports' element={<Reports />} />
                        <Route path='/admin-system/settings' element={<AdminSettings />} />
                        <Route path='/admin-system/requests' element={<RequestManagement />} />
                        <Route path='/admin-system/tenants' element={<TenantCompany />} />
                    </Route>

                    {/* ==================Admin Warehouse Routes with Layout=============== */}
                    <Route path='/admin-warehouse' element={
                        <AuthorizationRoute requiredRoles={['WH_ADMIN']} requireAuth={true} redirectTo='/login'>
                            <AdminWarehouseLayout />
                        </AuthorizationRoute>
                    }>
                        <Route index element={<AdminWarehouseDashboard />} />
                        <Route path='/admin-warehouse/dashboard' element={<AdminWarehouseDashboard />} />
                        <Route path='/admin-warehouse/requests' element={<ManageRequestRental />} />
                        <Route path='/admin-warehouse/contracts' element={<ManageContracts />} />
                        <Route path='/admin-warehouse/import-export' element={<ImportExportManagement />} />
                        <Route path='/admin-warehouse/inbound' element={<ManageInbound />} />
                        <Route path='/admin-warehouse/outbound' element={<ManageOutbound />} />
                        <Route path='/admin-warehouse/warehouse-staff' element={<ManageWarehouseStaff />} />
                        <Route path='/admin-warehouse/inventory' element={<InventoryManagement />} />
                        <Route path='/admin-warehouse/warehouses' element={<Warehouse />} />
                    </Route>

                    {/* ==================Admin Tenant Routes with Layout=============== */}
                    <Route path='/admin-tenant' element={
                        <AuthorizationRoute requiredRoles={['TENANT_ADMIN']} requireAuth={true} redirectTo='/login'>
                            <AdminTenantLayout />
                        </AuthorizationRoute>
                    }>
                        <Route index element={<StaffDashboard />} />
                        <Route path='/admin-tenant/dashboard' element={<StaffDashboard />} />
                        <Route path='/admin-tenant/products' element={<ProductManagement />} />
                        <Route path='/admin-tenant/inbound' element={<TenantManageInbound />} />
                        <Route path='/admin-tenant/outbound' element={<TenantManageOutbound />} />
                        <Route path='/admin-tenant/import-export' element={<ImportExportManagement />} />
                        <Route path='/admin-tenant/reports' element={<ReportManagement />} />
                        <Route path='/admin-tenant/tenant-staff' element={<ManageStaffTenant />} />
                        <Route path='/admin-tenant/contracts' element={<ManageContract />} />
                    </Route>


                </Routes>
            </NavigationProvider>
        </BrowserRouter>
    )
}