import { api } from "../utils/Axios";
import type { GetAllRentalRequestsResponse, RentalRequestResponse } from "../types/RentalRequest";

export const rentalRequestApi = {
    getAll: (size: number = 100, page: number = 0) => {
        return api.get<RentalRequestResponse>(`/rental-requests`);
    },
    approveApi: (requestId: string) => {        
        return api.post(`/rental-requests/${requestId}/approve`);
    },
    rejectApi: (requestId: string, rejectedReason: string) => {
        return api.post(`/rental-requests/${requestId}/reject`, { rejectedReason });
    },
    getRentalRequestsByWarehouse: (warehouseId: string) => {
        return api.get<GetAllRentalRequestsResponse>(`/rental-requests?warehouseId=${warehouseId}`);
    },
};