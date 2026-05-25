export type Status = 'DRAFT' | 'PENDING' | 'APPROVED' | 'ARRIVED' | 'RECEIVED' | 'COMPLETED' | 'CANCELED';


export interface OutboundRequestRequest {
    tenantId: string;
    contractId: string;
    warehouseId: string;
    outboundCode: string;
    requestedShipDate: string;
    actualShippedAt: string;
    status: Status;
    createdBy: string;
    approvedBy: string;
}

export interface OutboundRequestResponse {
    outboundRequestId: string;
    tenantId: string;
    contractId: string;
    warehouseId: string;
    outboundCode: string;
    requestedShipDate: string;
    actualShippedAt: string;
    status: Status;
    createdBy: string;
    approvedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface GetAllOutboundRequestsResponse {
    success: boolean;
    message: string;
    data: OutboundRequestResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}