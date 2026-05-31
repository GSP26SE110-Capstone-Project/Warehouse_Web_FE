import { AdminLayout } from './AdminLayout'
import { StaffLayout } from './StaffLayout'
import { ADMIN_ROLES, useAuth } from '../../../auth/AuthContext'

/** Chọn layout sidebar/header theo role — dùng cho route dùng chung như /profile */
export function RoleLayout() {
  const { user } = useAuth()
  if (user && ADMIN_ROLES.includes(user.role)) {
    return <AdminLayout />
  }
  return <StaffLayout />
}
