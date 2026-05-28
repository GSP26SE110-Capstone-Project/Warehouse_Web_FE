export type RentalRequestStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
export type ContractType = 'SHARED_STORAGE' | 'RESERVED_STORAGE' | 'DEDICATED_ZONE' | 'DEDICATED_WAREHOUSE';
export type PricingModel = 'USAGE_BASED' | 'FIXED' | 'HYBRID';


export interface RentalRequestRequest {
  tenantId: string,
  city: string,
  district: string,
  requestCode: string,
  contractType: ContractType,
  pricingModel: PricingModel,
  billingCycle: string,
  estimatedSkuCount: number,
  estimatedBoxCount: number,
  estimatedVolume: number,
  requestedAreaM2: number,
  averageStorageDays: number,
  estimatedInboundPerWeek: number,
  estimatedOutboundPerWeek: number,
  requiresFastPicking: boolean,
  requiresPremiumStorage: boolean,
  notes: string,
  suggestedZoneType: string,
  suggestedRackType: string,
  expectedStartDate: string,
  expectedEndDate: string,
  status: RentalRequestStatus,
  createdBy: string
}

export interface RentalRequestResponse {
  rentalRequestId: string,
  requestCode: string,
  tenantId: string,
  city: string,
  district: string,
  warehouseId: string,
  contractType: ContractType,
  pricingModel: PricingModel,
  billingCycle: string,
  estimatedSkuCount: number,
  estimatedBoxCount: number,
  estimatedVolume: number,
  requestedAreaM2: number,
  averageStorageDays: number,
  estimatedInboundPerWeek: number,
  estimatedOutboundPerWeek: number,
  requiresFastPicking: boolean,
  requiresPremiumStorage: boolean,
  notes: string,
  suggestedZoneType: string,
  suggestedRackType: string,
  expectedStartDate: string,
  expectedEndDate: string,
  status: RentalRequestStatus,
  reviewedBy: string,
  reviewedAt: string,
  rejectionReason: string,
  reviewNote: string,
  createdBy: string,
  createdAt: string,
  updatedAt: string
}

export interface GetAllRentalRequestsResponse {
  success: boolean;
  message: string;
  data: RentalRequestResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
