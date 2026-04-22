
export type Role = 'admin' | 'warehouse_staff' | 'tenant_admin';
export type Status = 'active' | 'inactive' | 'suspended';

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AccountResponse {
  userId: string,
  tenantId: string,
  branchId: string,
  username: string,
  email: string,
  passwordHash: string,
  fullName: string,
  phone: string,
  role: Role,
  status: Status,
  isActive: boolean,
  createdAt: string,
  updatedAt: string
}

export interface TenantResponse {
  tenantId: string,
  companyName: string,
  taxCode: string,
  contactEmail: string,
  contactPhone: string,
  address: string,
  isActive: boolean,
  createdAt: string,
  updatedAt: string
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

export interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}

export interface UserResponse {
  userId: string,
  username: string,
  email: string,
  fullName: string,
  phone: string,
  role: Role,
  status: Status,
  isActive: boolean,
  createdAt: string,
  updatedAt: string
}


// export interface ResetPasswordRequest {
//   token: string;
//   newPassword: string;
// }

// export interface ForgotPasswordRequest {
//   email: string;
// }

// export interface Profile {
//   id: string;
//   email: string;
//   userName: string;
//   fullName: string;
//   phoneNumber: string;
//   photoURL: string;
//   gender: string;

// };

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
  tenantId: string,
  branchId: string,
  username: string,
  email: string,
  passwordHash: string,
  fullName: string,
  phone: string,
  role: Role,
  status: Status,
  isActive: boolean,
  createdAt: string,
  updatedAt: string
}

export interface tenant {
  tenantId: string,
  companyName: string,
  taxCode: string,
  contactEmail: string,
  contactPhone: string,
  address: string,
  isActive: boolean,
  createdAt: string,
  updatedAt: string
}