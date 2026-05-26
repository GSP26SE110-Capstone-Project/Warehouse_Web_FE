
export type SkuStatus = 'ACTIVE' | 'INACTIVE';
export type movementCategory= 'FAST' | 'NORMAL' | 'SLOW';

export interface CategoryRequest {
    categoryName: string
}
export interface CategoryResponse {
    categoryId: string
    categoryName: string
}

export interface GetallCategoryResponse {
    success: boolean;
    message: string;
    data: CategoryResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface SeasonRequest {
    seasonName: string
}

export interface SeasonResponse {
    seasonId: string
    seasonName: string
}

export interface GetAllSeasonResponse {
    success: boolean;
    message: string;
    data: SeasonResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CollectionRequest {
    tenantId: string
    collectionName: string
}

export interface CollectionResponse {
    collectionId: string
    tenantId: string
    collectionName: string
}

export interface GetAllCollectionResponse {
    success: boolean;
    message: string;
    data: CollectionResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface SkuRequest {
    tenantId: string
    skuCode: string
    productName: string
    categoryId: string
    collectionId: string
    seasonId: string
    color: string
    size: string
    material: string
    movementCategory: movementCategory
    status: SkuStatus
}

export interface SkuResponse {
    skuId: string
    tenantId: string
    skuCode: string
    productName: string
    categoryId: string
    collectionId: string
    seasonId: string
    color: string
    size: string
    material: string
    movementCategory: movementCategory
    status: SkuStatus
    createdAt: string
    updatedAt: string
}

export interface GetAllSkuResponse {
    success: boolean;
    message: string;
    data: SkuResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}