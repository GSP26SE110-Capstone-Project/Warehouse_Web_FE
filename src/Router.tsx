import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
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

export const Router: React.FC = () => {
    return (
        <BrowserRouter>
            <NavigationProvider>
                <Routes>
                    <Route path='/' element={<Login />} />
                    <Route path='/forgot-password' element={<ForgotPassword />} />
                    <Route path='/reset-password' element={<ResetPassword />} />
                    {/* Admin Routes with Layout */}
                    <Route element={<AdminLayout />}>
                        <Route path='/admin' element={<Dashboard />} />
                        <Route path='/admin/dashboard' element={<Dashboard />} />
                        <Route path='/admin/warehouse' element={<WarehouseManagement />} />
                        <Route path="/warehouses/:id" element={<WarehouseDetailView />} />
                        <Route path='/admin/contract' element={<ContractManagement />} />
                        <Route path='/admin/inventory' element={<Inventory />} />
                        <Route path='/admin/accounts' element={<AccountManagement />} />
                        <Route path='/admin/stock-movements' element={<StockMovementManagement />} />
                        <Route path='/admin/transportation' element={<TransportationManagement />} />
                        <Route path='/admin/reports' element={<Reports />} />
                        <Route path='/admin/settings' element={<AdminSettings />} />
                        <Route path='/profile' element={<Profile />} />
                    </Route>
                </Routes>
            </NavigationProvider>
        </BrowserRouter>
    )
}