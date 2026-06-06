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
import { OutboundListPage } from './pages/outbound/OutboundListPage'
import { OutboundCreatePage } from './pages/outbound/OutboundCreatePage'
import { OutboundDetailPage } from './pages/outbound/OutboundDetailPage'
import { Reports } from './pages/admin/Report'
import { AdminSettings } from './pages/admin/Setting'
import { Profile } from './pages/profile/Profile'
import { RequestManagement } from './pages/admin/RequestManagement'
import { ZoneManagement } from './pages/admin/ZoneManagement'
import { RackLayoutManagement } from './pages/admin/RackLayoutManagement'
import { StaffDashboard } from './pages/staff/Dashboard'
import { StaffLayout } from './components/common/layout/StaffLayout'
import { StaffRequestManagement } from './pages/staff/TransportManagement'
import { TenantProductManagement } from './pages/staff/TenantProductManagement'
import { InboundListPage } from './pages/inbound/InboundListPage'
import { InboundCreatePage } from './pages/inbound/InboundCreatePage'
import { InboundDetailPage } from './pages/inbound/InboundDetailPage'
import { BatchManagementPage } from './pages/batch/BatchManagementPage'
import { AiSlotAssistPage } from './pages/ai/AiSlotAssistPage'
import { InventoryListPage } from './pages/inventory/InventoryListPage'
import { TenantContractsPage } from './pages/staff/TenantContractsPage'
import { ContractPaymentReturnPage } from './pages/staff/ContractPaymentReturnPage'
import { ContractPaymentCancelPage } from './pages/staff/ContractPaymentCancelPage'
import { TenantRentalRequestsPage } from './pages/staff/TenantRentalRequestsPage'
import { TenantRecurringRentPage } from './pages/staff/TenantRecurringRentPage'
import { MyDeliveriesPage } from './pages/transporter/MyDeliveriesPage'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { RoleLayout } from './components/common/layout/RoleLayout'
import {
  ADMIN_ROLES,
  getHomePathForRole,
  STAFF_ROLES,
  TRANSPORTER_ROLES,
  useAuth,
} from './auth/AuthContext'

function AdminHomeRedirect() {
  const { user } = useAuth()
  const target = user?.role ? getHomePathForRole(user.role) : '/admin/requests'
  return <Navigate to={target} replace />
}

export const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <NavigationProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Profile — route dùng chung, tránh trùng /profile trong admin vs staff */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleLayout />}>
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminHomeRedirect />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/warehouse" element={<WarehouseManagement />} />
              <Route path="/admin/zones" element={<ZoneManagement />} />
              <Route path="/admin/racks" element={<RackLayoutManagement />} />
              <Route path="/warehouses/:id" element={<WarehouseDetailView />} />
              <Route path="/admin/contract" element={<ContractManagement />} />
              <Route path="/admin/inventory" element={<Inventory />} />
              <Route path="/admin/accounts" element={<AccountManagement />} />
              <Route
                path="/admin/stock-movements"
                element={<Navigate to="/admin/outbound" replace />}
              />
              <Route
                path="/admin/outbound"
                element={<OutboundListPage mode="warehouse" basePath="/admin/outbound" />}
              />
              <Route
                path="/admin/outbound/:outboundRequestId"
                element={<OutboundDetailPage mode="warehouse" basePath="/admin/outbound" />}
              />
              <Route path="/admin/transportation" element={<TransportationManagement />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/requests" element={<RequestManagement />} />
              <Route
                path="/admin/inbound"
                element={<InboundListPage mode="warehouse" basePath="/admin/inbound" />}
              />
              <Route
                path="/admin/inbound/:inboundRequestId"
                element={<InboundDetailPage mode="warehouse" basePath="/admin/inbound" />}
              />
              <Route
                path="/admin/batches"
                element={
                  <BatchManagementPage
                    mode="warehouse"
                    inboundBasePath="/admin/inbound"
                  />
                }
              />
              <Route
                path="/admin/ai-putaway"
                element={<AiSlotAssistPage inboundBasePath="/admin/inbound" />}
              />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={STAFF_ROLES} />}>
            <Route element={<StaffLayout />}>
              <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/contracts" element={<TenantContractsPage />} />
              <Route path="/staff/recurring-rent" element={<TenantRecurringRentPage />} />
              <Route
                path="/staff/contracts/payment/return"
                element={<ContractPaymentReturnPage />}
              />
              <Route
                path="/staff/contracts/payment/cancel"
                element={<ContractPaymentCancelPage />}
              />
              <Route path="/staff/rental-requests" element={<TenantRentalRequestsPage />} />
              <Route element={<ProtectedRoute allowedRoles={['TENANT_ADMIN']} />}>
                <Route path="/staff/accounts" element={<AccountManagement />} />
              </Route>
              <Route path="/staff/requests" element={<StaffRequestManagement />} />
              <Route path="/staff/products" element={<TenantProductManagement />} />
              <Route
                path="/staff/import-export"
                element={<Navigate to="/staff/outbound" replace />}
              />
              <Route
                path="/staff/outbound"
                element={<OutboundListPage mode="tenant" basePath="/staff/outbound" />}
              />
              <Route
                path="/staff/outbound/new"
                element={<OutboundCreatePage basePath="/staff/outbound" />}
              />
              <Route
                path="/staff/outbound/:outboundRequestId"
                element={<OutboundDetailPage mode="tenant" basePath="/staff/outbound" />}
              />
              <Route
                path="/staff/outbound-ops"
                element={<OutboundListPage mode="warehouse" basePath="/staff/outbound-ops" />}
              />
              <Route
                path="/staff/outbound-ops/:outboundRequestId"
                element={
                  <OutboundDetailPage mode="warehouse" basePath="/staff/outbound-ops" />
                }
              />
              <Route
                path="/staff/inbound"
                element={<InboundListPage mode="tenant" basePath="/staff/inbound" />}
              />
              <Route element={<ProtectedRoute allowedRoles={['TENANT_ADMIN']} />}>
                <Route
                  path="/staff/inbound/new"
                  element={<InboundCreatePage basePath="/staff/inbound" />}
                />
              </Route>
              <Route
                path="/staff/inbound/:inboundRequestId"
                element={<InboundDetailPage mode="tenant" basePath="/staff/inbound" />}
              />
              <Route element={<ProtectedRoute allowedRoles={['TENANT_ADMIN']} />}>
                <Route
                  path="/staff/batches"
                  element={
                    <BatchManagementPage
                      mode="tenant"
                      inboundBasePath="/staff/inbound"
                    />
                  }
                />
              </Route>
              <Route
                path="/staff/inbound-ops"
                element={<InboundListPage mode="warehouse" basePath="/staff/inbound-ops" />}
              />
              <Route
                path="/staff/inbound-ops/:inboundRequestId"
                element={<InboundDetailPage mode="warehouse" basePath="/staff/inbound-ops" />}
              />
              <Route
                path="/staff/ai-putaway"
                element={<AiSlotAssistPage inboundBasePath="/staff/inbound-ops" />}
              />
              <Route path="/staff/inventory" element={<InventoryListPage scope="tenant" />} />
              <Route
                path="/staff/inventory-ops"
                element={<InventoryListPage scope="warehouse" />}
              />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={TRANSPORTER_ROLES} />}>
            <Route element={<StaffLayout />}>
              <Route
                path="/staff"
                element={<Navigate to="/staff/my-deliveries" replace />}
              />
              <Route path="/staff/my-deliveries" element={<MyDeliveriesPage />} />
              <Route
                path="/staff/my-deliveries/outbound/:outboundRequestId"
                element={
                  <OutboundDetailPage
                    mode="transporter"
                    basePath="/staff/my-deliveries"
                  />
                }
              />
              <Route
                path="/staff/my-deliveries/:inboundRequestId"
                element={
                  <InboundDetailPage
                    mode="transporter"
                    basePath="/staff/my-deliveries"
                  />
                }
              />
            </Route>
          </Route>
        </Routes>
      </NavigationProvider>
    </BrowserRouter>
  )
}
