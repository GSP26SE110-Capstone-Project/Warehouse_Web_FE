import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Login } from './pages/auth/Login'
import { Dashboard } from './pages/admin/Dashboard'
import { Inventory } from './pages/admin/Inventory'
import { AdminLayout } from './components/common/layout/AdminLayout'

export const Router: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/login' element={<Login />} />
                {/* <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/inventory" element={<Inventory />} /> */}
                {/* Admin Routes with Layout */}
                <Route element={<AdminLayout />}>
                    <Route path='/admin' element={<Dashboard />} />
                    <Route path='/admin/dashboard' element={<Dashboard />} />
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