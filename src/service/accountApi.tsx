import { api } from "../utils/Axios";
import type { AccountResponse, AccountRequest } from "../types/Account";

export const accountApi = {
    getById: (userId: string) => {
        return api.get<AccountResponse>(`/users/${userId}`);
    },
    getAll: () => {
        return api.get<AccountResponse[]>("/users");
    },
    create: (data: AccountRequest) => {
        return api.post<AccountResponse>("/users", data);
    },
    update: (userId: string, data: AccountRequest) => {
        return api.patch<AccountResponse>(`/users/${userId}`, data);
    },
    delete: (userId: string) => {
        return api.delete(`/users/${userId}`);
    },
    getTenant: (tenantId: string) => {
        return api.get(`/tenants/${tenantId}`);
    }
   
};