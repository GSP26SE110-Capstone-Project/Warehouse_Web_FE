import { api } from "../utils/Axios";
import type { GetAllRentalRequestsResponse, RentalRequestRequest, RentalRequestResponse } from "../types/RentalRequest";
import type { ApiResponse } from "../types/ApiResponse";

export const rentalRequestApi = {
    getAll: () => {
        return api.get<GetAllRentalRequestsResponse>(`/rental-requests`);
    },
    approveApi: (requestId: string, reviewedBy: string) => {
        return api.patch<ApiResponse<RentalRequestResponse>>(`/rental-requests/${requestId}`, {
            status: 'APPROVED',
            reviewedBy,
            reviewedAt: new Date().toISOString()
        });
    },
   rejectApi: (requestId: string, rejectedReason: string, reviewedBy: string) => {
        return api.patch<ApiResponse<RentalRequestResponse>>(`/rental-requests/${requestId}`, {
            status: 'REJECTED',
            rejectionReason: rejectedReason,
            reviewedBy,
            reviewedAt: new Date().toISOString()
        });
    },
    getRentalRequestsByWarehouse: (warehouseId: string) => {
        return api.get<GetAllRentalRequestsResponse>(`/rental-requests?warehouseId=${warehouseId}`);
    },
    create: (data: RentalRequestRequest) => {
        return api.post<ApiResponse<RentalRequestResponse>>(`/rental-requests`, data);
    }
};