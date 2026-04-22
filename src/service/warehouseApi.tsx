import { api } from "../utils/Axios";
import type {WarehouseRequest, BranchRequest, ZoneRequest, RackRequest, LevelRequest} from '../types/Warehouse';

export const warehouseApi = {
    getAll: () => {
        return api.get('/warehouses');
    },
    delete: (id: string) => {
        return api.delete(`/warehouses/${id}`);
    },
    getById: (id: string) => {
        return api.get(`/warehouses/${id}`);
    },
    getZonesByWarehouseId: (id: string) => {
        return api.get(`/warehouses/${id}/zones`);
    },
    getRacksByZone: (id: string) => {
        return api.get(`/zones/${id}/racks`);
    },
    getLevelsByRack: (id: string) => {
        return api.get(`/racks/${id}/levels`);
    },
    createWarehouse: (data: WarehouseRequest) => {
        return api.post('/warehouses', data);
    },
    createBranch: (data: BranchRequest) => {
        return api.post('/branches', data);
    },
    getAllBranches: () => {
        return api.get('/branches');
    },
    createZone: (data: ZoneRequest) => {
        return api.post('/zones', data);
    },
    createRack: (data: RackRequest) => {
        return api.post('/racks', data);
    },
    createLevel: (data: LevelRequest) => {
        return api.post('/levels', data);
    },
    updateWarehouse: (id: string, data: WarehouseRequest) => {
        return api.patch(`/warehouses/${id}`, data);
    },
    updateZone: (id: string, data: ZoneRequest) => {
        return api.patch(`/zones/${id}`, data);
    },
    updateRack: (id: string, data: RackRequest) => {
        return api.patch(`/racks/${id}`, data);
    },
    updateLevel: (id: string, data: LevelRequest) => {
        return api.patch(`/levels/${id}`, data);
    },
    getHierarchy: () => {
        return api.get(`/branches/hierarchy`);
    },
    deleteBranch: (id: string) => {
        return api.delete(`/branches/${id}`);
    },
    deleteZone: (id: string) => {
        return api.delete(`/zones/${id}`);
    },
    deleteRack: (id: string) => {
        return api.delete(`/racks/${id}`);
    },
    deleteLevel: (id: string) => {
        return api.delete(`/levels/${id}`);
    }


};
