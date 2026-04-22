import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { AccountResponse, Role } from "../types/Account";

// Hook để lấy thông tin user (bạn có thể thay đổi logic này)
interface AuthorizedUser {
  userId: string;
  email: string;
  role: Role;
  isAuthenticated: boolean;
}

export const useAuth = (): AuthorizedUser | null => {
  // Ví dụ: lấy từ localStorage hoặc context
  const userDataString = localStorage.getItem('user');
  
  if (!userDataString) return null;
  
  try {
    const userData: AccountResponse = JSON.parse(userDataString);
    const role = userData.role as Role;
    
    return {
      userId: (userData as any).uuid || (userData as any).userUuid || (userData as any).id || (userData as any).user_id || '',
      email: userData.email || '',
      role: role || 'tenant_admin', 
      isAuthenticated: true
    };
  } catch (error) {
    return null;
  }
};

export const useData = (): { userId: string; email: string; fullName: string; phone: string } | null => {
  // Ví dụ: lấy từ localStorage hoặc context
  const userDataString = localStorage.getItem('user');
  
  if (!userDataString) return null;
  
  try {
    const userData: AccountResponse = JSON.parse(userDataString);
    
    return {
      userId: (userData as any).uuid || (userData as any).userUuid || (userData as any).id || (userData as any).user_id || '',
      email: userData.email || '',
      fullName: userData.fullName || '',
      phone: userData.phone || '',
    };
  } catch (error) {
    return null;
  }
};

// Props cho AuthorizationRoute
interface AuthorizationRouteProps {
  children: React.ReactNode;
  requiredRoles?: (Role)[];
  requireAuth?: boolean;
  redirectTo?: string;
}

// Component Authorization
export const AuthorizationRoute: React.FC<AuthorizationRouteProps> = ({
  children,
  requiredRoles = [],
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const user: AuthorizedUser | null = useAuth();
  const location = useLocation();

  // Nếu yêu cầu đăng nhập nhưng user chưa đăng nhập
  if (requireAuth && !user?.isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Nếu có yêu cầu role cụ thể
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

// Higher Order Component để wrap component cần authorization
export const withAuthorization = (
  WrappedComponent: React.ComponentType<any>,
  requiredRoles?: (Role)[],
  requireAuth: boolean = true
) => {
  return (props: any) => (
    <AuthorizationRoute requiredRoles={requiredRoles} requireAuth={requireAuth}>
      <WrappedComponent {...props} />
    </AuthorizationRoute>
  );
};