import { api } from "../utils/Axios";
import type { ContractItemRequest, ContractItemResponse, ContractRequest, ContractResponse, GetAllContractsResponse, StorageReservationRequest, StorageReservationResponse } from "../types/Contract";
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
    },
    getAllContracts: () => {
        return api.get<GetAllContractsResponse>("/contracts");
    },
    // createContractItem: (contractId: string, itemData: ContractItemRequest) => {
    //     return api.post<ApiResponse<ContractItemResponse>>(`/contracts/${contractId}/items`, itemData);
    // },
    getContractById: (id: string) => {
        return api.get<ApiResponse<ContractResponse>>(`/contracts/${id}`);
    },
    createStorageReservation: (data: StorageReservationRequest) => {
        return api.post<ApiResponse<StorageReservationResponse>>('/storage-reservations', data);
    },
    createContractItem: (data: any) => {
        return api.post('/contract-items', data);
    },
}