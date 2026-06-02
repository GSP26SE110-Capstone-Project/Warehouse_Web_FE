export type Status = 'DRAFT' | 'PENDING' | 'APPROVED' | 'ARRIVED' | 'RECEIVED' | 'COMPLETED' | 'CANCELED';

export interface InboundRequestDetailRequest {
    inboundRequestId: string;
    skuId: string;
    expectedQuantity: number;
}

export interface InboundRequestDetailResponse {
    inboundRequestItemId: string,
    inboundRequestId: string,
    skuId: string,
    expectedQuantity: number,
    receivedQuantity: number,
    discrepancyQuantity: number,
    createdAt: string,
    sku: {
        skuId: string,
        skuCode: string,
        productName: string,
        color: string,
        size: string
    }

}

export interface InboundRequestRequest {
    tenantId: string;
    contractId: string;
    warehouseId: string;
    inboundCode: string;
    expectedArrivalDate: string;
    actualArrivalAt: string;
    status: Status;
    createdBy: string;
    approvedBy: string;
    receivedBy: string;
}

export interface InboundRequestResponse {
    inboundRequestId: string;
    tenantId: string;
    contractId: string;
    warehouseId: string;
    inboundCode: string;
    expectedArrivalDate: string;
    actualArrivalAt: string;
    status: Status;
    createdBy: string;
    approvedBy: string;
    receivedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface GetAllInboundRequestsResponse {
    success: boolean;
    message: string;
    data: InboundRequestResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}





