import { apiRequest, apiPaginated, buildQuery } from './client'

export interface ApiTenant {
  tenantId: string
  companyName: string
  companyCode?: string | null
  taxCode?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  address?: string | null
  status: 'ACTIVE' | 'SUSPENDED'
  /** Guest onboarding — hồ sơ công ty đã tồn tại theo email */
  reusedExistingProfile?: boolean
}

export function listTenants(params?: { page?: number; limit?: number }) {
  return apiPaginated<ApiTenant>(`/tenants${buildQuery(params ?? {})}`)
}

export function getTenant(tenantId: string) {
  return apiRequest<ApiTenant>(`/tenants/${tenantId}`)
}

export function createTenant(body: {
  companyName: string
  companyCode?: string
  taxCode?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
}) {
  return apiRequest<ApiTenant>('/tenants', { method: 'POST', body, auth: false })
}
