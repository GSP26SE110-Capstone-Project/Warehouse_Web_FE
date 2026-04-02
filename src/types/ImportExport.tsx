export interface ImportExportRequest {
    id: number;
    customer: string;
    warehouse: string;
    description: string;
    weight: number;
    origin: string;
    destination: string;
    type: 'import' | 'export';
    status: 'WAITING' | 'APPROVED' | 'CANCELED';
    createdAt: string;
    scheduledTime: string;
    hasTransport?: boolean
}