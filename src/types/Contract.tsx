

export interface Contract {
  id: string
  customerName: string
  customerEmail: string
  warehouse: string
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING'
  price: number
  createdAt: string
}

export interface Request {
  id: string
  customer: string
  customerEmail: string
  warehouse: string
  type: 'rent' | 'lease'
  startDate: string
  endDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}