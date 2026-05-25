

export interface Contract {
  id: string
  customerName: string
  warehouse: string
  startDate: string
  endDate: string
  status: 'Active' | 'Expired' | 'Pending'
  statusClassName: string
  price: number
  createdAt: string
}