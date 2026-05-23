import type { ApiResponse } from "../types/ApiResponse";
import type { GetAllTenantsResponse, TenantCompanyResponse, TenantRequest } from "../types/TenantCompany";
import { api } from "../utils/Axios";



export const tenantCompanyApi = {
    getAll: () => {
        return api.get<GetAllTenantsResponse>("/tenants");
    },
    create: (data: TenantRequest) => {
        return api.post<ApiResponse<TenantCompanyResponse>>("/tenants", data);
    },
    update: (tenantId: string, data: TenantRequest) => {
        return api.patch<ApiResponse<TenantCompanyResponse>>(`/tenants/${tenantId}`, data);
    },
    delete: (tenantId: string) => {
        return api.delete(`/tenants/${tenantId}`);
    },
    getById: (tenantId: string) => {
        return api.get<ApiResponse<TenantCompanyResponse>>(`/tenants/${tenantId}`);
    }
};