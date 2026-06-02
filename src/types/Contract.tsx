export type status = "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "CANCELLED";
export type contractType = 'SHARED_STORAGE' | 'RESERVED_STORAGE' | 'DEDICATED_ZONE' | 'DEDICATED_WAREHOUSE';
export type pricingModel = 'USAGE_BASED' | 'FIXED' | 'HYBRID';
export type billingCycle = "DAILY" | "MONTHLY" | "QUARTERLY";
export type storageLevel = 'WAREHOUSE' | 'ZONE' | 'RACK' | 'RACK_LEVEL' | 'BIN';
export type boxType = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA';
import type { BoxType, ReservationType } from './Warehouse';
export type StorageLevel = 'WAREHOUSE' | 'ZONE' | 'RACK' | 'LEVEL' | 'BIN';
export type ReservationStatus = 'PENDING' | 'ACTIVE' | 'RELEASED' | 'CANCELLED';

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

export interface ContractItemRequest {
  contractId: string;
  itemType: "STORAGE" | "HANDLING" | "OTHER";
  storageLevel: storageLevel;
  billingUnit: "BOX_DAY";
  quantity: number;
  reservedQuantity: number;
  boxType: boxType;
  unitPrice: number;
}

export interface ContractItemResponse {
  contractItemId: string;
  contractId: string;
  itemType: "STORAGE" | "HANDLING" | "OTHER";
  storageLevel: storageLevel;
  billingUnit: "BOX_DAY";
  quantity: number;
  reservedQuantity: number;
  boxType: boxType;
  unitPrice: number;
  createdAt: string;
}

export interface StorageReservationRequest {
  contractId: string;
  reservationType: ReservationType;
  storageLevel: StorageLevel;
  warehouseId: string;
  zoneId?: string | null;
  rackId?: string | null;
  rackLevelId?: string | null;
  binId?: string | null;
  reservedCapacity: number;
  boxType: BoxType;
  startDate: string;
  endDate: string;
  status: ReservationStatus;
}

export interface StorageReservationResponse {
  reservationId: string;
  contractId: string;
  reservationType: ReservationType;
  storageLevel: StorageLevel;
  warehouseId: string;
  zoneId?: string | null;
  rackId?: string | null;
  rackLevelId?: string | null;
  binId?: string | null;
  reservedCapacity: number;
  boxType: BoxType;
  startDate: string;
  endDate: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}