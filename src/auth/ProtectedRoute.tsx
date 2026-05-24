import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingOverlay } from '../components/ui/LoadingOverlay'
import type { ApiUser } from '../api/types'
import { useAuth } from './AuthContext'

type Props = {
  allowedRoles?: ApiUser['role'][]
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingOverlay show text="Đang tải phiên đăng nhập..." />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
