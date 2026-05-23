import { api } from "../utils/Axios";
import type { RentalRequestResponse } from "../types/Contract";

export const rentalRequestApi = {
    getAll: (size: number = 100, page: number = 0) => {
        return api.get<RentalRequestResponse>(`/rental-requests`);
    },
    approveApi: (requestId: string) => {        
        return api.post(`/rental-requests/${requestId}/approve`);
    },
    rejectApi: (requestId: string, rejectedReason: string) => {
        return api.post(`/rental-requests/${requestId}/reject`, { rejectedReason });
    }
};