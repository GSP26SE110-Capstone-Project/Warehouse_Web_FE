import { apiRequest, apiPaginated, buildQuery } from './client'
import type { ApiContractInvoice } from './types'
import type { PayOSPaymentLinkResult } from './contracts'

export type AppendixStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'REJECTED'
  | 'PENDING_APPROVAL'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'TERMINATED'
  | 'CANCELLED'
  | 'DRAFT'

export type StorageLevel =
  | 'WAREHOUSE'
  | 'ZONE'
  | 'RACK'
  | 'RACK_LEVEL'
  | 'BIN'

export interface ApiContractAppendix {
  appendixId: string
  contractId: string
  appendixCode: string
  appendixNumber: number
  title?: string | null
  status: AppendixStatus
  effectiveDate: string
  endDate: string
  estimatedDeltaAmount?: number | string | null
  maxStorageLevel?: StorageLevel | null
  requestedBy?: string | null
  requestedStorageLevel?: StorageLevel | null
  rejectionReason?: string | null
  reviewNote?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  tenantSignature?: string | null
  warehouseSignature?: string | null
  createdBy?: string | null
  approvedBy?: string | null
  terminatedAt?: string | null
  terminationReason?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AppendixCeiling {
  contractId: string
  ceilingLevel: StorageLevel
}

export interface AppendixPaymentPreview {
  appendixId: string
  monthlyRate: number
  billableMonths: number
  initialInvoiceAmount: number
  effectiveDate: string
  endDate: string
}

export interface AppendixItemCreate {
  itemType: 'STORAGE' | 'INBOUND' | 'OUTBOUND' | 'HANDLING' | 'REPACKING' | 'SLA'
  storageLevel?: StorageLevel
  billingUnit: string
  quantity?: number
  reservedQuantity?: number
  boxType?: string
  unitPrice?: number
}

export interface AppendixReservationCreate {
  reservationType: string
  storageLevel: StorageLevel
  warehouseId: string
  zoneId?: string
  rackId?: string
  rackLevelId?: string
  binId?: string
  reservedCapacity?: number
  startDate?: string
  endDate?: string
}

export interface SubmitAppendixRequestBody {
  title?: string
  effectiveDate: string
  endDate: string
  requestedStorageLevel?: StorageLevel
  items?: AppendixItemCreate[]
  reservations?: AppendixReservationCreate[]
}

export interface ApproveAppendixBody {
  estimatedDeltaAmount: number
  warehouseSignature?: string
  reviewNote?: string
  items?: AppendixItemCreate[]
  reservations?: AppendixReservationCreate[]
}

export interface RejectAppendixBody {
  rejectionReason: string
  reviewNote?: string
}

export interface SignAppendixBody {
  tenantSignature: string
}

export interface TerminateAppendixBody {
  reason?: string
}

export function getAppendixCeiling(contractId: string) {
  return apiRequest<AppendixCeiling>(`/contracts/${contractId}/appendices/ceiling`)
}

export function listContractAppendices(
  contractId: string,
  params?: { status?: string; page?: number; limit?: number }
) {
  return apiPaginated<ApiContractAppendix>(
    `/contracts/${contractId}/appendices${buildQuery(params ?? {})}`
  )
}

export function getContractAppendix(contractId: string, appendixId: string) {
  return apiRequest<ApiContractAppendix>(
    `/contracts/${contractId}/appendices/${appendixId}`
  )
}

export function submitAppendixRequest(contractId: string, body: SubmitAppendixRequestBody) {
  return apiRequest<ApiContractAppendix>(`/contracts/${contractId}/appendices`, {
    method: 'POST',
    body,
  })
}

export function signContractAppendix(
  contractId: string,
  appendixId: string,
  body: SignAppendixBody
) {
  return apiRequest<ApiContractAppendix>(
    `/contracts/${contractId}/appendices/${appendixId}`,
    { method: 'PATCH', body }
  )
}

export function markAppendixUnderReview(contractId: string, appendixId: string) {
  return apiRequest<ApiContractAppendix>(
    `/contracts/${contractId}/appendices/${appendixId}/under-review`,
    { method: 'POST' }
  )
}

export function approveContractAppendix(
  contractId: string,
  appendixId: string,
  body: ApproveAppendixBody
) {
  return apiRequest<ApiContractAppendix>(
    `/contracts/${contractId}/appendices/${appendixId}/approve`,
    { method: 'POST', body }
  )
}

export function rejectContractAppendix(
  contractId: string,
  appendixId: string,
  body: RejectAppendixBody
) {
  return apiRequest<ApiContractAppendix>(
    `/contracts/${contractId}/appendices/${appendixId}/reject`,
    { method: 'POST', body }
  )
}

export function terminateContractAppendix(
  contractId: string,
  appendixId: string,
  body?: TerminateAppendixBody
) {
  return apiRequest<ApiContractAppendix>(
    `/contracts/${contractId}/appendices/${appendixId}/terminate`,
    { method: 'POST', body: body ?? {} }
  )
}

export function deleteContractAppendix(contractId: string, appendixId: string) {
  return apiRequest<ApiContractAppendix>(
    `/contracts/${contractId}/appendices/${appendixId}`,
    { method: 'DELETE' }
  )
}

export function previewAppendixPayment(contractId: string, appendixId: string) {
  return apiRequest<AppendixPaymentPreview>(
    `/contracts/${contractId}/appendices/${appendixId}/payment-preview`
  )
}

export function listAppendixInvoices(contractId: string, appendixId: string) {
  return apiRequest<ApiContractInvoice[]>(
    `/contracts/${contractId}/appendices/${appendixId}/invoices`
  )
}

export function createAppendixInvoicePayOSLink(
  contractId: string,
  appendixId: string,
  invoiceId: string,
  body?: { returnUrl?: string; cancelUrl?: string }
) {
  return apiRequest<PayOSPaymentLinkResult>(
    `/contracts/${contractId}/appendices/${appendixId}/invoices/${invoiceId}/payos/create-link`,
    { method: 'POST', body: body ?? {} }
  )
}

export function markAppendixInvoicePaid(
  contractId: string,
  appendixId: string,
  invoiceId: string
) {
  return apiRequest<{ invoice: ApiContractInvoice; appendix: ApiContractAppendix }>(
    `/contracts/${contractId}/appendices/${appendixId}/invoices/${invoiceId}/mark-paid`,
    { method: 'POST' }
  )
}
