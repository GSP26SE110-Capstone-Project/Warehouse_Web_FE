import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Login } from './pages/auth/Login'
import { Dashboard } from './pages/admin/Dashboard'
import { Inventory } from './pages/admin/Inventory'
import { AdminLayout } from './components/common/layout/AdminLayout'
import { Warehouse } from './pages/admin/Warehouse'
import { Contract } from './pages/admin/Contract'
import { WarehouseDetailView } from './pages/admin/WarehouseDetail'

export const Router: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Login />} />
                {/* <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/inventory" element={<Inventory />} /> */}
                {/* Admin Routes with Layout */}
                <Route element={<AdminLayout />}>
                    <Route path='/admin' element={<Dashboard />} />
                    <Route path='/admin/dashboard' element={<Dashboard />} />
                    <Route path='/admin/warehouse' element={<Warehouse />} />
                    <Route path='/admin/warehouse/detail' element={<WarehouseDetailView />} />
                    <Route path='/admin/contract' element={<Contract />} />
                    <Route path='/admin/inventory' element={<Inventory />} />
                </Route>

                {/* <Route path='/admin' element={
                    <AuthorizationRoute requireAuth={true} requiredRoles={['ADMIN']}>
                        <AdminLayout />
                    </AuthorizationRoute>
                }>

                    <Route index element={<Dashboard />} />
                    <Route path='dashboard' element={<Dashboard />} />
                    <Route path='posts' element={<PostManager />} />
                    <Route path='animals' element={<AnimalManager />} />
                    <Route path='accounts' element={<AccountManager />} />
                    <Route path='orders' element={<AdminOrders />} />
                    <Route path='profile' element={<AdminProfile />} />
                    <Route path='settings' element={<AdminSetting />} />
                </Route> */}

                {/* Admin Routes */}
                {/* <Route path='/admin' element={
                            <AuthorizationRoute requireAuth={true} requiredRoles={['ADMIN']}>
                                <AdminLayout />
                            </AuthorizationRoute>
                        }>

                            <Route index element={<Dashboard />} />
                            <Route path='dashboard' element={<Dashboard />} />
                            <Route path='posts' element={<PostManager />} />
                            <Route path='animals' element={<AnimalManager />} />
                            <Route path='accounts' element={<AccountManager />} />
                            <Route path='orders' element={<AdminOrders />} />
                            <Route path='profile' element={<AdminProfile />} />
                            <Route path='settings' element={<AdminSetting />} />
                        </Route> */}
            </Routes>
        </BrowserRouter>
    )
}