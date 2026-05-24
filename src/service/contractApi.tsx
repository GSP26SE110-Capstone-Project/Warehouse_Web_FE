import { api } from "../utils/Axios";
import type { ContractRequest, ContractResponse, GetAllContractsResponse } from "../types/Contract";
import type { ApiResponse } from "../types/ApiResponse";

export const contractApi = {
    getAllContractsByWarehouse: (warehouseId: string) => {
        return api.get<GetAllContractsResponse>(`/contracts?warehouseId=${warehouseId}`);
    },
    create: (data: ContractRequest) => {
        return api.post<ApiResponse<ContractResponse>>("/contracts", data);
    },
    update: (contractId: string, data: ContractRequest) => {
        return api.patch<ApiResponse<ContractResponse>>(`/contracts/${contractId}`, data);
    },
    delete: (contractId: string) => {
        return api.delete(`/contracts/${contractId}`);
    }
}