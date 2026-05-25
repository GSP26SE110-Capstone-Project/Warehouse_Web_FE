import type { ApiResponse } from "../types/ApiResponse";
import type { GetAllOutboundRequestsResponse, OutboundRequestRequest, OutboundRequestResponse } from "../types/Outbound";
import { api } from "../utils/Axios";

export const outboundApi = {
    create: (data: OutboundRequestRequest) => {
        return api.post<ApiResponse<OutboundRequestResponse>>("/outbound-requests", data);
    },
    update: (outboundRequestId: string, data: OutboundRequestRequest) => {
        return api.patch<ApiResponse<OutboundRequestResponse>>(`/outbound-requests/${outboundRequestId}`, data);
    },
    delete: (outboundRequestId: string) => {
        return api.delete(`/outbound-requests/${outboundRequestId}`);
    },
    getAllOutboundRequestsByWarehouse: (warehouseId: string) => {
        return api.get<GetAllOutboundRequestsResponse>(`/outbound-requests?warehouseId=${warehouseId}`);
    }
}