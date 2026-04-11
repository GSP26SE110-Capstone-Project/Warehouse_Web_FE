

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

export interface Warehouse {
    warehouseId: string
    warehouseName: string
    address: string
    numberOfPallets: number
    lastUpdated: string
    zones: Zone[]
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
