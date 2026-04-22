import { api } from "../utils/Axios";
import type { RentalRequestResponse } from "../types/Contract";

export const rentalRequestApi = {
    getAll: (size: number = 100, page: number = 0) => {
        return api.get<RentalRequestResponse>(`/rental-requests`);
    },
    approveApi: (id: string) => {
        return api.post(`/rental-requests/${id}/approve`);
    },
    rejectApi: (id: string, rejectedReason: string) => {
        return api.post(`/rental-requests/${id}/reject`, { rejectedReason });
    }
};