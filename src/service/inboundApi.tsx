import type { ApiResponse } from "../types/ApiResponse";
import type { InboundRequestResponse, InboundRequestRequest, GetAllInboundRequestsResponse } from "../types/Inbound";
import { api } from "../utils/Axios";

export const inboundApi = {
    create: (data: InboundRequestRequest) => {
        return api.post<ApiResponse<InboundRequestResponse>>("/inbound-requests", data);
    },
    update: (inboundRequestId: string, data: InboundRequestRequest) => {
        return api.patch<ApiResponse<InboundRequestResponse>>(`/inbound-requests/${inboundRequestId}`, data);
    },
    delete: (inboundRequestId: string) => {
        return api.delete(`/inbound-requests/${inboundRequestId}`);
    },
    getAllInboundRequestsByWarehouse: (warehouseId: string) => {
        return api.get<GetAllInboundRequestsResponse>(`/inbound-requests?warehouseId=${warehouseId}`);
    },
    getAllInboundRequestsByTenant: (tenantId: string) => {
        return api.get<GetAllInboundRequestsResponse>(`/inbound-requests?tenantId=${tenantId}`);
    },
    createItem: (itemData: { inboundRequestId: string; skuId: string; expectedQuantity: number }) => {
        return api.post<ApiResponse<any>>("/inbound-request-items", itemData);
    },
    // create: (data: Omit<InboundRequestResponse, 'inboundRequestId' | 'createdAt' | 'updatedAt' | 'skus'>) => {
    //     return api.post<ApiResponse<InboundRequestResponse>>("/inbound-requests", data);
    // },

    // // API 2: Tạo từng dòng hàng hóa dựa vào inboundRequestId vừa lấy được
    // createItem: (itemData: { inboundRequestId: string; skuId: string; expectedQuantity: number }) => {
    //     return api.post<ApiResponse<any>>("/inbound-request-items", itemData);
    // },
}