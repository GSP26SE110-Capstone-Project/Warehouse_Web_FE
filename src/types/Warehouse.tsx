

export interface InventoryItem {
    sku: string
    name: string
    category: string
    warehouse: string
    location: string
    importDate: string // YYYY-MM-DD
    stock: number
    total: number
    customer?: string
}

export interface Rack {
    rackId: string
    row: number
    col: number
    shelves: number
    status: 'healthy' | 'warning' | 'maintenance'
    occupancyPercentage: number
    capacity: string
    items: InventoryItem[]
    topBarColor: 'green' | 'orange' | 'gray'
}

export interface Zone {
    zoneId: string
    zoneName: string
    subZone: string
    rows: number
    cols: number
    racks: Rack[]
}

// export interface Warehouse {
//     warehouseId: string;
//     warehouseName: string;
//     address: string;
//     zones: Zone[];
// }

export interface Warehouse {
    warehouseId: string;
    branchId: string;
    managerId: string;
    warehouseCode: string;
    warehouseName: string;
    warehouseType: string;
    warehouseSize: string,
    address: string,
    city: string,
    district: string,
    operatingHours: string,
    length: string,
    width: string,
    height: string,
    totalArea: string,
    usableArea: null,
    isActive: true,
    createdAt: string,
    updatedAt: string
}

export interface WarehouseResponse {
    data: Warehouse[]
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface WarehouseRequest {
    branchId: string,
    managerId: string,
    warehouseCode: string,
    warehouseName: string,
    warehouseType: string,
    warehouseSize: string,
    address: string,
    city: string,
    district: string,
    operatingHours: string,
    length: number,
    width: number,
    height: number,
    temperatureMin: number,
    temperatureMax: number
}

export interface StockMovement {
    id: string
    sku: string
    productName: string
    warehouse: string
    type: 'Import' | 'Export'
    quantity: number
    status: 'Completed' | 'Pending' | 'Cancelled'
    statusClassName: string
    date: string
    striped?: boolean
}

export interface BranchRequest {
    managerId: string;
    branchCode: string;
    branchName: string;
    address: string;
    city: string;
}

export interface ZoneRequest {
    warehouseId: string,
    zoneCode: string,
    zoneName: string,
    zoneType: string,
    length: number,
    width: number
}

export interface RackRequest {
    zoneId: string,
    rackCode: string,
    rackSizeType: string,
    length: number,
    width: number,
    height: number,
    maxWeightCapacity: number
}

export interface LevelRequest {
    rackId: string,
    levelNumber: number,
    heightClearance: number,
    maxWeight: number
}