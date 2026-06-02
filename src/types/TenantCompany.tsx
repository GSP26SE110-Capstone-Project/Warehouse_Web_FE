export type TenantStatus = 'ACTIVE' | 'SUSPENDED' ;

export interface TenantCompanyResponse {
  tenantId: string;
  companyName: string;
  companyCode: string;
  taxCode: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllTenantsResponse {
  success: boolean;
  message: string;
  data: TenantCompanyResponse[];
}

export interface TenantRequest {
  companyName: string;
  companyCode?: string;
  taxCode: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status?: TenantStatus;
}