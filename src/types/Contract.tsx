

export interface Contract {
  contractId: string
  id: string
  customerName: string
  warehouse: string
  warehouseId: string
  tenantId: string
  contractType?: string
  pricingModel?: string
  billingCycle?: string | null
  rentalRequestId?: string | null
  startDate: string
  endDate: string
  status: 'Active' | 'Expired' | 'Pending'
  apiStatus?: string
  statusClassName: string
  price: number
  createdAt: string
}