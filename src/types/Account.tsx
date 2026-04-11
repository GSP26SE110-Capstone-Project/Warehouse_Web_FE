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