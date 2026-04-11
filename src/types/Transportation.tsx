export interface RequestTransportation {
    id: number;
    customer: string;
    warehouse: string;
    description: string;
    weight: number;
    origin: string;
    status: 'WAITING' | 'APPROVED' | 'CANCELED';
    createdAt: string;
    updatedAt: string;
    fromAdress: string;
    toAdress: string;
    scheduledTime: string;
    actyalStartTime: string;
    actualEndTime: string;
}

export interface Transportation {
    id: string
    orderId: string
    customer: string
    destination: string
    carrier: string
    status: 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'PENDING'
    lastUpdate: string
    eta: string
    striped?: boolean
}