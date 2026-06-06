import { apiRequest } from './client'

export type BarcodeEntityType =
  | 'INBOUND_REQUEST'
  | 'OUTBOUND_REQUEST'
  | 'LPN'
  | 'SKU'
  | 'BIN'
  | 'BATCH'

export interface BarcodeScanResult {
  symbology?: string
  value: string
  structuredValue?: string | null
  entityType: BarcodeEntityType
  entityId?: string | null
  displayCode?: string | null
  scanFormat?: 'BUSINESS_CODE' | 'NGW1'
  scannedRaw?: string
  entity?: Record<string, unknown>
}

export function resolveScan(value: string, warehouseId?: string) {
  return apiRequest<BarcodeScanResult>(
    `/scan/resolve${warehouseId ? `?value=${encodeURIComponent(value)}&warehouseId=${encodeURIComponent(warehouseId)}` : `?value=${encodeURIComponent(value)}`}`
  )
}

export function resolveScanPost(body: { value: string; warehouseId?: string }) {
  return apiRequest<BarcodeScanResult>('/scan/resolve', {
    method: 'POST',
    body,
  })
}
