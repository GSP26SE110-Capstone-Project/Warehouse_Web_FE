

export interface InventoryItem {
    sku: string
    name: string
    category: string
    warehouse: string
    location: string
    importDate: string // YYYY-MM-DD
    stock: number
    total: number
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

import type { WarehouseStatus } from '../api/types'

export interface WarehouseWhAdmin {
    userId: string
    fullName: string
    email: string
    phone?: string | null
}

export interface Warehouse {
    warehouseId: string
    warehouseCode?: string
    warehouseName: string
    address: string
    city?: string
    district?: string
    totalAreaM2?: number | null
    usableAreaM2?: number | null
    status?: WarehouseStatus
    lastUpdated: string
    whAdmin?: WarehouseWhAdmin | null
    zones: Zone[]
}

export interface Transportation {
    id: string
    orderId: string
    customer: string
    destination: string
    carrier: string
    status: 'In Transit' | 'Delivered' | 'Delayed' | 'Pending'
    statusClassName: string
    lastUpdate: string
    eta: string
    striped?: boolean
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


export const warehouses: Warehouse[] = [
    {
        warehouseId: 'W-1001',
        warehouseName: 'Kho A',
        address: 'TP.HCM',
        usableAreaM2: 25,
        lastUpdated: '10m ago',
        zones: [
            {
                zoneId: 'A-4',
                zoneName: 'Zone A-4',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 1,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-8',
                zoneName: 'Zone A-8',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-5',
                zoneName: 'Zone A-5',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-010',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                    {
                        rackId: 'A-011',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                ],
            },
        ],

    },
    {
        warehouseId: 'W-1003',
        warehouseName: 'Kho A',
        address: 'TP.HCM',
        usableAreaM2: 25,
        lastUpdated: '10m ago',
        zones: [
            {
                zoneId: 'A-4',
                zoneName: 'Zone A-4',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 1,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-8',
                zoneName: 'Zone A-8',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-5',
                zoneName: 'Zone A-5',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-010',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                    {
                        rackId: 'A-011',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                ],
            },
        ],

    },
    {
        warehouseId: 'W-1004',
        warehouseName: 'Kho A',
        address: 'TP.HCM',
        usableAreaM2: 25,
        lastUpdated: '10m ago',
        zones: [
            {
                zoneId: 'A-4',
                zoneName: 'Zone A-4',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 1,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-8',
                zoneName: 'Zone A-8',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-5',
                zoneName: 'Zone A-5',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-010',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                    {
                        rackId: 'A-011',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                ],
            },
        ],

    },
    {
        warehouseId: 'W-1051',
        warehouseName: 'Kho A',
        address: 'TP.HCM',
        usableAreaM2: 25,
        lastUpdated: '10m ago',
        zones: [
            {
                zoneId: 'A-4',
                zoneName: 'Zone A-4',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 1,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-8',
                zoneName: 'Zone A-8',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-5',
                zoneName: 'Zone A-5',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-010',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                    {
                        rackId: 'A-011',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                ],
            },
        ],

    },
    {
        warehouseId: 'W-1006',
        warehouseName: 'Kho A',
        address: 'TP.HCM',
        usableAreaM2: 25,
        lastUpdated: '10m ago',
        zones: [
            {
                zoneId: 'A-4',
                zoneName: 'Zone A-4',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 1,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-8',
                zoneName: 'Zone A-8',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-5',
                zoneName: 'Zone A-5',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-010',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                    {
                        rackId: 'A-011',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                ],
            },
        ],

    },
    {
        warehouseId: 'W-1007',
        warehouseName: 'Kho A',
        address: 'TP.HCM',
        usableAreaM2: 25,
        lastUpdated: '10m ago',
        zones: [
            {
                zoneId: 'A-4',
                zoneName: 'Zone A-4',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 1,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-8',
                zoneName: 'Zone A-8',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-5',
                zoneName: 'Zone A-5',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-010',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                    {
                        rackId: 'A-011',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                ],
            },
        ],

    },
    {
        warehouseId: 'W-1008',
        warehouseName: 'Kho A',
        address: 'TP.HCM',
        usableAreaM2: 25,
        lastUpdated: '10m ago',
        zones: [
            {
                zoneId: 'A-4',
                zoneName: 'Zone A-4',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 1,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-8',
                zoneName: 'Zone A-8',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-5',
                zoneName: 'Zone A-5',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-010',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                    {
                        rackId: 'A-011',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                ],
            },
        ],

    },
    {
        warehouseId: 'W-1009',
        warehouseName: 'Kho A',
        address: 'TP.HCM',
        usableAreaM2: 25,
        lastUpdated: '10m ago',
        zones: [
            {
                zoneId: 'A-4',
                zoneName: 'Zone A-4',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 1,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-8',
                zoneName: 'Zone A-8',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-01',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                    {
                        rackId: 'A-02',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },
                        ],
                    },
                ],
            },
            {
                zoneId: 'A-5',
                zoneName: 'Zone A-5',
                subZone: 'Cold Storage',
                rows: 1,
                cols: 4,
                racks: [
                    {
                        rackId: 'A-010',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                    {
                        rackId: 'A-011',
                        row: 0,
                        col: 0,
                        shelves: 3,
                        status: 'healthy',
                        occupancyPercentage: 80,
                        capacity: 'Heavy',
                        topBarColor: 'green',
                        items: [
                            {
                                sku: 'SP1',
                                name: 'Hàng A',
                                category: 'Food',
                                warehouse: 'In Stock',
                                location: 'A-4 > A-01',
                                importDate: '2024-06-01',
                                stock: 50,
                                total: 100
                            },

                        ],
                    },
                ],
            },
        ],

    },
    {
        warehouseId: 'W-1002',
        warehouseName: 'Kho B',
        address: 'TP.HCM',
        usableAreaM2: 0,
        lastUpdated: '30m ago',
        zones: [],
    },
]