export type status = "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "CANCELLED";
export type contractType = 'SHARED_STORAGE' | 'RESERVED_STORAGE' | 'DEDICATED_ZONE' | 'DEDICATED_WAREHOUSE';
export type pricingModel = 'USAGE_BASED' | 'FIXED' | 'HYBRID';
export type billingCycle = "DAILY" | "MONTHLY" | "QUARTERLY";

export interface ContractRequest {
  tenantId: string;
  warehouseId: string;
  rentalRequestId: string;
  contractCode: string;
  contractName: string;
  contractType: contractType;
  pricingModel: pricingModel;
  billingCycle: billingCycle;
  allowDynamicRelocation: boolean;
  autoRenew: boolean;
  startDate: string;
  endDate: string;
  minimumBillingDays: number;
  minimumReservedCapacity: number;
  estimatedTotalAmount: number;
  status: status;
  tenantSignature: string;
  warehouseSignature: string;
  createdBy: string;
  approvedBy: string
}

export interface ContractResponse {
  contractId: string;
  tenantId: string;
  warehouseId: string;
  rentalRequestId: string;
  contractCode: string;
  contractName: string;
  contractType: contractType;
  pricingModel: pricingModel;
  billingCycle: billingCycle;
  allowDynamicRelocation: boolean;
  autoRenew: boolean;
  startDate: string;
  endDate: string;
  minimumBillingDays: number;
  minimumReservedCapacity: number;
  estimatedTotalAmount: number;
  status: status;
  tenantSignature: string;
  warehouseSignature: string;
  createdBy: string;
  approvedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllContractsResponse {
  success: boolean;
  message: string;
  data: ContractResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
