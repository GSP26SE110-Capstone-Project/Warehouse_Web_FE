
export type WarehouseStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'CLOSED';
export type Status = 'ACTIVE' | 'BLOCKED';
export type ZoneType = 'SHARED' | 'FAST_MOVING' | 'BULK' | 'PREMIUM' | 'QC' | 'RETURN';
export type RackType = 'STANDARD' | 'HIGH_CAPACITY';
export type BinStatus = 'EMPTY' | 'PARTIAL' |'FULL'| 'RESERVED' | 'BLOCKED';
export type ReservationType = 'SHARED' | 'RESERVED' | 'DEDICATED';
export type BoxType = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA';

export interface WarehouseRequest {
    warehouseCode: string,
    warehouseName: string,
    address: string,
    totalAreaM2: number,
    usableAreaM2: number,
    status: WarehouseStatus
}
export interface WarehouseResponse {
    warehouseId: string,
    warehouseCode: string,
    warehouseName: string,
    address: string,
    totalAreaM2: number,
    usableAreaM2: number,
    status: WarehouseStatus
    createdAt: string,
    updatedAt: string
}

export interface GetAllWarehousesResponse {
    success: boolean;
    message: string;
    data: WarehouseResponse[];
}

export interface ZoneResponse {
    zoneId: string,
    warehouseId: string,
    zoneCode: string,
    zoneName: string,
    zoneType: ZoneType,
    areaM2: number,
    isDedicated: boolean,
    status: Status,
    createdAt: string,
    updatedAt: string
}

export interface ZoneRequest {
    warehouseId: string,
    zoneCode: string,
    zoneName: string,
    zoneType: ZoneType,
    areaM2: number,
    isDedicated: boolean,
    status: Status,
}

export interface RackResponse {
    rackId: string,
    zoneId: string,
    rackCode: string,
    rackType: RackType,
    maxLevels: number,
    status: Status,
    createdAt: string,
    updatedAt: string
}

export interface RackRequest {
    zoneId: string,
    rackCode: string,
    rackType: RackType,
    maxLevels: number,
    status: Status,
}

export interface LevelResponse {
    rackLevelId: string,
    rackId: string,
    levelCode: string,
    levelNumber: number,
    maxBins: number,
    maxWeightKg: number,
    heightCm: number,
    levelPriority: number,
    createdAt: string,
    updatedAt: string
} 

export interface LevelRequest {
    rackId: string,
    levelCode: string,
    levelNumber: number,
    maxBins: number,
    maxWeightKg: number,
    heightCm: number,
    levelPriority: number,
}

export interface BinResponse {
    binId: string,
    rackLevelId: string,
    binCode: string,
    supportedBoxType: BoxType,
    maxLpnCount: number,
    currentLpnCount: number,
    maxVolumeUnits: number,
    usedVolumeUnits: number,
    maxOwnerCount: number,
    reservationType: ReservationType,
    status: BinStatus,
    createdAt: string,
    updatedAt: string
}

export interface BinRequest {
    rackLevelId: string,
    binCode: string,
    supportedBoxType: BoxType,
    maxLpnCount: number,
    maxVolumeUnits: number,
    maxOwnerCount: number,
    reservationType: ReservationType,
    status: BinStatus,
}