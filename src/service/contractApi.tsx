import { api } from "../utils/Axios";
import type { ContractResponse } from "../types/Contract";

export const contractApi = {
    getAll: async (size: number = 100, page: number = 0) => {
        return api.get<ContractResponse>(`/contracts`);
    },
    create: async (payload: {
    requestId: string;
    totalRentalFee: number;
    selectedRackIds: string[];
    approvedBy: string;
    status: string;
  }) => {
    return await api.post(`/contracts`, payload);
  },
}