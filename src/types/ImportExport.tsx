
type recordType = 'IMPORT' | 'EXPORT';
type status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';

export interface ImportExportReport {
    id: string;
    customer: string;
    warehouse: string;
    description: string;
    weight: number;
    origin: string;
    destination: string;
    type: 'IMPORT' | 'EXPORT';
    driver: string;
    createdAt: string;
}

export interface ImportExportRequest {
    contractId: string,
    warehouseId: string,
    scopeType: string,
    zoneId: string,
    recordType: recordType,
    recordCode: string,
    scheduledDatetime: string,
    quantity: number,
    weight: number,
    isFullZone: boolean,
    status: status,
    notes: string
}

export interface ImportExportDetail {
    recordId: string,
    contractId: string,
    warehouseId: string,
    scopeType: string,
    zoneId: string,
    slotId: null,
    recordType: recordType,
    recordCode: string,
    scheduledDatetime: string,
    actualDatetime: string,
    quantity: number,
    weight: number,
    isFullZone: boolean,
    responsibleStaffId: null,
    approvedBy: null,
    approvedAt: null,
    status: status,
    cancelReason?: string,
    notes: string,
    createdAt: string,
    updatedAt: string
}

export interface ImportExportResponse {
    records: ImportExportDetail[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}