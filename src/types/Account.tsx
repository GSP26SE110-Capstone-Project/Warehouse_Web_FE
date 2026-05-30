import type { UserRole, UserStatus } from '../api/types'

export interface Account {
  id: string
  name: string
  email: string
  role: string
  apiRole?: UserRole
  apiStatus?: UserStatus
  roleClassName: string
  status: 'Active' | 'Inactive' | 'Suspended'
  statusClassName: string
  lastLogin: string
  createdAt: string
  striped?: boolean
}