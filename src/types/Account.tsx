export interface Account {
   id: string
  name: string
  email: string
  role: 'Admin' | 'Manager' | 'Staff'
  roleClassName: string
  status: 'Active' | 'Inactive' | 'Suspended'
  statusClassName: string
  lastLogin: string
  createdAt: string
  striped?: boolean
}