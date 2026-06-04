import { apiRequest, apiPaginated, buildQuery } from './client'
import type {
  ApiContract,
  ApiContractInvoice,
  ContractTerminationPreview,
} from './types'

export function getContract(contractId: string) {
  return apiRequest<ApiContract>(`/contracts/${contractId}`)
}

export function listContracts(params?: {
  tenantId?: string
  warehouseId?: string
  rentalRequestId?: string
  status?: string
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiContract>(`/contracts${buildQuery(params ?? {})}`)
}

export function updateContract(
  contractId: string,
  body: {
    status?: string
    contractName?: string
    billingCycle?: string
    estimatedTotalAmount?: number
    tenantSignature?: string
    warehouseSignature?: string
    startDate?: string
    endDate?: string
  }
) {
  return apiRequest<ApiContract>(`/contracts/${contractId}`, { method: 'PATCH', body })
}

export function listContractInvoices(contractId: string) {
  return apiRequest<ApiContractInvoice[]>(`/contracts/${contractId}/invoices`)
}

export interface PayOSPaymentLinkResult {
  orderCode: number
  amount: number
  checkoutUrl: string
  paymentLinkId?: string
  returnUrl: string
  cancelUrl: string
  invoiceId: string
  contractId: string
  /** true khi mở lại link PayOS đã tạo trước đó (không tạo đơn mới) */
  reusedExistingLink?: boolean
  /** Số tiền trên invoice (khi devMode, khác amount gửi PayOS) */
  invoiceAmount?: number
  devMode?: boolean
}

export function createContractInvoicePayOSLink(
  contractId: string,
  invoiceId: string,
  body?: { returnUrl?: string; cancelUrl?: string }
) {
  return apiRequest<PayOSPaymentLinkResult>(
    `/contracts/${contractId}/invoices/${invoiceId}/payos/create-link`,
    { method: 'POST', body: body ?? {} }
  )
}

/** Chỉ dùng khi test / WH xác nhận thủ công — production dùng PayOS webhook. */
export function markContractInvoicePaid(contractId: string, invoiceId: string) {
  return apiRequest<{ invoice: ApiContractInvoice; contract: ApiContract }>(
    `/contracts/${contractId}/invoices/${invoiceId}/mark-paid`,
    { method: 'POST' }
  )
}

export function previewContractTermination(contractId: string) {
  return apiRequest<ContractTerminationPreview>(
    `/contracts/${contractId}/termination/preview`
  )
}

export function requestContractTermination(
  contractId: string,
  body?: { reason?: string }
) {
  return apiRequest<{ request: unknown; settlement: ContractTerminationPreview }>(
    `/contracts/${contractId}/termination/request`,
    { method: 'POST', body: body ?? {} }
  )
}

export function listContractTerminationRequests(
  contractId: string,
  params?: { status?: string }
) {
  const q = params?.status ? `?status=${encodeURIComponent(params.status)}` : ''
  return apiRequest<unknown[]>(`/contracts/${contractId}/termination/requests${q}`)
}

export type ContractTerminationApproveResult = {
  request: unknown
  contract: ApiContract
  inventoryRemainder: {
    totalQuantity: number
    availableQuantity: number
    reservedQuantity: number
    skuCount: number
  }
  nextSteps: { message: string; outboundAllowed: boolean; inboundAllowed: boolean }
}

export function approveContractTermination(
  contractId: string,
  terminationRequestId: string
) {
  return apiRequest<ContractTerminationApproveResult>(
    `/contracts/${contractId}/termination/requests/${terminationRequestId}/approve`,
    { method: 'POST' }
  )
}

export function rejectContractTermination(
  contractId: string,
  terminationRequestId: string
) {
  return apiRequest<{ request: unknown }>(
    `/contracts/${contractId}/termination/requests/${terminationRequestId}/reject`,
    { method: 'POST' }
  )
}

export function createContract(body: {
  tenantId: string
  warehouseId: string
  contractType: string
  pricingModel: string
  startDate: string
  endDate: string
  rentalRequestId?: string
  contractCode?: string
  contractName?: string
  billingCycle?: string
  estimatedTotalAmount?: number
  status?: string
}) {
  return apiRequest<ApiContract>('/contracts', { method: 'POST', body })
}
