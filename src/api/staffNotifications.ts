import { apiRequest } from './client'
import type { OutboundStatus } from './outboundRequests'

export interface WhStaffPickAlertRow {
  outboundRequestId: string
  outboundCode: string
  status: OutboundStatus
  requestedShipDate?: string | null
  companyName?: string
  assignedAt?: string | null
}

export interface WhStaffPickAlerts {
  assignedCount: number
  pickingCount: number
  recent: WhStaffPickAlertRow[]
}

export function getWhStaffAssignedPickAlerts() {
  return apiRequest<WhStaffPickAlerts>('/admin/notifications/wh-staff-assigned-picks')
}
