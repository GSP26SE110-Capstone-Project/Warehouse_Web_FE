export interface ImportExportRequest {
    id: string;
    customer: string;
    warehouse: string;
    description: string;
    weight: number;
    origin: string;
    destination: string;
    type: 'IMPORT' | 'EXPORT';
    status: 'WAITING' | 'APPROVED' | 'CANCELED';
    createdAt: string;
    scheduledTime: string;
    hasTransport?: boolean
}

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
