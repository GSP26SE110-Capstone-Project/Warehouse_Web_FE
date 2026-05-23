
export type Role = 'SYSTEM_ADMIN' | 'WH_ADMIN' | 'WH_STAFF' | 'TENANT_ADMIN' | 'TENANT_STAFF';
export type Status = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: UserResponse;
  };
}

export interface UserResponse {
  userId: string,
  tenantId?: string,
  warehouseId?: string,
  fullName: string,
  email: string,
  phone?: string,
  role: Role,
  status: Status,
  createdAt: string,
  updatedAt: string
}

export interface GetAllUsersResponse {
  success: boolean;
  message: string;
  data: UserResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetUsersResponse {
  success: boolean;
  message: string;
  data: UserResponse;
}


export interface UserRequest {
  fullName: string
  email?: string
  password?: string
  phone: string
  role?: Role
  status: Status
  tenantId?: string
  warehouseId?: string
}


export interface AccountRequest {
  email: string,
  fullName: string,
  phone: string,
  role: Role,
  status: Status,
  isActive: boolean,
  passwordHash: string
}





export interface Account {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'STAFF'
  roleClassName: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  statusClassName: string
  lastLogin: string
  createdAt: string
  striped?: boolean
}

export interface User {
  userId: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  userId: string,
  tenantId?: string,
  branchId: string,
  username: string,
  email: string,
  passwordHash: string,
  fullName: string,
  phone?: string,
  role: Role,
  status: Status,
  isActive: boolean,
  createdAt: string,
  updatedAt: string
}
