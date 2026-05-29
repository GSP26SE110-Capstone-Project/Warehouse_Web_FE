import type { UserRole } from '../api/types'

export interface Account {
  id: string
  name: string
  email: string
  role: string
  apiRole?: UserRole
  roleClassName: string
  status: 'Active' | 'Inactive' | 'Suspended'
  statusClassName: string
  lastLogin: string
  createdAt: string
  striped?: boolean
}