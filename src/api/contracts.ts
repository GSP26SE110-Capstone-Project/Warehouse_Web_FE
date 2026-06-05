import { apiRequest, apiPaginated, buildQuery } from './client'
import type {
  ApiContract,
  ApiContractInvoice,
  ApiContractTerminationRequest,
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

export interface ApiCommitmentWarning {
  code: string
  productKind?: string | null
  size?: string | null
  effectiveCommittedPieces?: number
  usedPieces?: number
  overagePieces?: number
  message: string
}

export interface ApiContractInboundCommitmentLine {
  key: string
  productKind: string | null
  size?: string | null
  sizeGroup?: string | null
  committedPieces: number
  writtenOffPieces?: number
  effectiveCommittedPieces: number
  usedPieces: number
  remainingPieces: number
  overagePieces: number
  isTailRemaining?: boolean
  canCloseLine?: boolean
  tailCloseThreshold?: number
  uncommitted?: boolean
}

export interface ApiContractInboundCommitment {
  applies: boolean
  contractId: string
  rentalRequestId?: string | null
  productLines: ApiContractInboundCommitmentLine[]
  totals: {
    committedPieces: number
    effectiveCommittedPieces?: number
    writtenOffPieces?: number
    usedPieces: number
    remainingPieces: number | null
    overagePieces: number
  }
  warnings?: ApiCommitmentWarning[]
}

export interface CloseCommitmentLineResult {
  contractId: string
  productKind: string
  size?: string | null
  closedPieces: number
  note?: string | null
  line?: ApiContractInboundCommitmentLine
  totals?: ApiContractInboundCommitment['totals']
}

export function getContractInboundCommitment(contractId: string) {
  return apiRequest<ApiContractInboundCommitment>(
    `/contracts/${contractId}/inbound-commitment`
  )
}

export function closeInboundCommitmentLine(
  contractId: string,
  body: { productKind: string; size?: string | null; note?: string }
) {
  return apiRequest<CloseCommitmentLineResult>(
    `/contracts/${contractId}/inbound-commitment/close-line`,
    { method: 'POST', body }
  )
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

/** Sau redirect PayOS — đồng bộ trạng thái nếu webhook chưa tới. */
export function syncContractInvoicePayOSPayment(contractId: string, invoiceId: string) {
  return apiRequest<{
    synced: boolean
    alreadyPaid?: boolean
    payosStatus?: string
    orderCode?: number
    message?: string
    invoice?: ApiContractInvoice
    contract?: ApiContract
  }>(`/contracts/${contractId}/invoices/${invoiceId}/payos/sync`, { method: 'POST' })
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
  return apiRequest<{
    request: ApiContractTerminationRequest
    settlement: ContractTerminationPreview
  }>(`/contracts/${contractId}/termination/request`, { method: 'POST', body: body ?? {} })
}

export function listContractTerminationRequests(
  contractId: string,
  params?: { status?: string }
) {
  return apiRequest<ApiContractTerminationRequest[]>(
    `/contracts/${contractId}/termination/requests${buildQuery(params ?? {})}`
  )
}

export function approveContractTerminationRequest(
  contractId: string,
  terminationRequestId: string
) {
  return apiRequest<{
    request: ApiContractTerminationRequest
    contract: ApiContract
    inventoryRemainder?: { totalQuantity?: number }
    nextSteps?: { message?: string; outboundAllowed?: boolean; inboundAllowed?: boolean }
  }>(
    `/contracts/${contractId}/termination/requests/${terminationRequestId}/approve`,
    { method: 'POST' }
  )
}

export function rejectContractTerminationRequest(
  contractId: string,
  terminationRequestId: string
) {
  return apiRequest<{ request: ApiContractTerminationRequest }>(
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
