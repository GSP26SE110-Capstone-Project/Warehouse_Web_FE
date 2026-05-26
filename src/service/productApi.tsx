import type { ApiResponse } from "../types/ApiResponse";
import type { CategoryRequest, CategoryResponse, CollectionRequest, CollectionResponse, GetallCategoryResponse, GetAllCollectionResponse, GetAllSeasonResponse, GetAllSkuResponse, SeasonRequest, SeasonResponse, SkuRequest, SkuResponse } from "../types/Product";
import { api } from "../utils/Axios";


export const productApi = {
    getAllCategories: () => {
        return api.get<ApiResponse<GetallCategoryResponse>>('/categories');
    },
    createCategory: (data: CategoryRequest) => {
        return api.post<ApiResponse<CategoryResponse>>('/categories', data);
    },
    updateCategory: (id: string, data: CategoryRequest) => {
        return api.patch<ApiResponse<CategoryResponse>>(`/categories/${id}`, data);
    },
    deleteCategory: (id: string) => {
        return api.delete(`/categories/${id}`);
    },
    getAllSeasons: () => {
        return api.get<ApiResponse<GetAllSeasonResponse>>('/seasons');
    },
    createSeason: (data: SeasonRequest) => {
        return api.post<ApiResponse<SeasonResponse>>('/seasons', data);
    },
    updateSeason: (id: string, data: SeasonRequest) => {
        return api.patch<ApiResponse<SeasonResponse>>(`/seasons/${id}`, data);
    },
    deleteSeason: (id: string) => {
        return api.delete(`/seasons/${id}`);
    },
    getAllCollections: (tenantId: string) => {
        return api.get<ApiResponse<GetAllCollectionResponse>>(`/collections?tenantId=${tenantId}`);
    },
    createCollection: (data: CollectionRequest) => {
        return api.post<ApiResponse<CollectionResponse>>('/collections', data);
    },
    updateCollection: (id: string, data: CollectionRequest) => {
        return api.patch<ApiResponse<CollectionResponse>>(`/collections/${id}`, data);
    },
    deleteCollection: (id: string) => {
        return api.delete(`/collections/${id}`);
    },
    getAllSkus: (tenantId: string) => {
        return api.get<ApiResponse<GetAllSkuResponse>>(`/skus?tenantId=${tenantId}`);
    },
    createSku: (data: SkuRequest) => {
        return api.post<ApiResponse<SkuResponse>>('/skus', data);
    },
    updateSku: (id: string, data: SkuRequest) => {
        return api.patch<ApiResponse<SkuResponse>>(`/skus/${id}`, data);
    },
    deleteSku: (id: string) => {
        return api.delete(`/skus/${id}`);
    },
}