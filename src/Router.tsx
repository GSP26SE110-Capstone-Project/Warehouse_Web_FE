import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Login } from './pages/auth/Login'
import { Landing } from './pages/public/Landing'
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
import { ZoneManagement } from './pages/admin/ZoneManagement'
import { RackLayoutManagement } from './pages/admin/RackLayoutManagement'
import { StaffDashboard } from './pages/staff/Dashboard'
import { StaffLayout } from './components/common/layout/StaffLayout'
import { StaffRequestManagement } from './pages/staff/TransportManagement'
import { ImportExportManagement } from './pages/staff/ImportExportManagement'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { ADMIN_ROLES, STAFF_ROLES } from './auth/AuthContext'

export const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <NavigationProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/warehouse" element={<WarehouseManagement />} />
              <Route path="/admin/zones" element={<ZoneManagement />} />
              <Route path="/admin/racks" element={<RackLayoutManagement />} />
              <Route path="/warehouses/:id" element={<WarehouseDetailView />} />
              <Route path="/admin/contract" element={<ContractManagement />} />
              <Route path="/admin/inventory" element={<Inventory />} />
              <Route path="/admin/accounts" element={<AccountManagement />} />
              <Route path="/admin/stock-movements" element={<StockMovementManagement />} />
              <Route path="/admin/transportation" element={<TransportationManagement />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/requests" element={<RequestManagement />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={STAFF_ROLES} />}>
            <Route element={<StaffLayout />}>
              <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/requests" element={<StaffRequestManagement />} />
              <Route path="/staff/import-export" element={<ImportExportManagement />} />
            </Route>
          </Route>
        </Routes>
      </NavigationProvider>
    </BrowserRouter>
  )
}
