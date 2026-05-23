import { api } from "../utils/Axios";
import type { WarehouseRequest, ZoneRequest, RackRequest, LevelRequest, WarehouseResponse, BinRequest } from '../types/Warehouse';
import type { ApiResponse } from "../types/ApiResponse";

export const warehouseApi = {
    getAll: () => {
        return api.get<ApiResponse<WarehouseResponse>>('/warehouses');
    },
    delete: (id: string) => {
        return api.delete(`/warehouses/${id}`);
    },
    getById: (id: string) => {
        return api.get(`/warehouses/${id}`);
    },
    create: (data: WarehouseRequest) => {
        return api.post<ApiResponse<WarehouseResponse>>('/warehouses', data);
    },
    update: (id: string, data: WarehouseRequest) => {
        return api.patch<ApiResponse<WarehouseResponse>>(`/warehouses/${id}`, data);
    },
    getZones: (warehouseId: string) => {
        return api.get(`/zones/?warehouseId=${warehouseId}`);
    },
    createZone: (data: ZoneRequest) => {
        return api.post('/zones', data);
    },
    updateZone: (zoneId: string, data: ZoneRequest) => {
        return api.patch(`/zones/${zoneId}`, data);
    },
    deleteZone: (zoneId: string) => {
        return api.delete(`/zones/${zoneId}`);
    },
    getRacks: (zoneId: string) => {
        return api.get(`/racks/?zoneId=${zoneId}`);
    },
    createRack: (data: RackRequest) => {
        return api.post('/racks', data);
    },
    updateRack: (rackId: string, data: RackRequest) => {
        return api.patch(`/racks/${rackId}`, data);
    },
    deleteRack: (rackId: string) => {
        return api.delete(`/racks/${rackId}`);
    },
    getLevels: (rackId: string) => {
        return api.get(`/rack-levels/?rackId=${rackId}`);
    },
    createLevel: (data: LevelRequest) => {
        return api.post('/rack-levels', data);
    },
    updateLevel: (rackLevelId: string, data: LevelRequest) => {
        return api.patch(`/rack-levels/${rackLevelId}`, data);
    },
    deleteLevel: (rackLevelId: string) => {
        return api.delete(`/rack-levels/${rackLevelId}`);
    },
    createBin: (data: BinRequest) => {
        return api.post('/bins', data);
    },
    updateBin: (binId: string, data: BinRequest) => {
        return api.patch(`/bins/${binId}`, data);
    },
    deleteBin: (binId: string) => {
        return api.delete(`/bins/${binId}`);
    },
    getBins: (rackLevelId: string) => {
        return api.get(`/bins/?rackLevelId=${rackLevelId}`);
    }


};
