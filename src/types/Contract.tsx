import type { tenant } from "./Account";

export interface Contract {
  id: string
  customerName: string
  customerEmail: string
  warehouse: string
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING'
  price: number
  createdAt: string
}

export interface ContractDetails {
  contractId: string;
  requestId: string;
  tenantId: string;
  approvedBy: string;
  contractCode: string;
  startDate: string;
  endDate: string;
  billingCycle: "MONTH";
  rentalDurationDays: 300;
  totalRentalFee: "0.00";
  contractFileUrl: null;
  sentAt: null;
  tenantSignedAt: null;
  signedBy: null;
  signatureMethod: null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractResponse {
  contracts: ContractDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}

export interface ContractRequest {
  requestId: RentalRequest['requestId'],
  contractCode: string,
  startDate: string,
  endDate: string,
  billingCycle: "MONTH",
  rentalDurationDays: number,
  totalRentalFee: number,
  tenantId: "TEN0001",
  approvedBy: string,
  status: "DRAFT"

}

export interface Request {
  id: string
  customer: string
  customerEmail: string
  warehouse: string
  type: 'rent' | 'lease'
  startDate: string
  endDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface RentalRequest {
  requestId: string,
  customerType: 'individual' | 'company',
  tenantId: string,
  warehouseId: string,
  rentalType:'RACK' | 'LEVEL',
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
  requestedStartDate: string,
  rentalTermUnit: 'DAY' | 'MONTH' | 'YEAR',
  rentalTermValue: number,
  durationDays: number,
  goodsType: string,
  goodsDescription: string,
  goodsQuantity: string,
  goodsWeightKg: string,
  notes: string,
  approvedBy: string | null,
  rejectedReason: string | null,
  createdAt: string,
  updatedAt: string,
}

export interface RentalRequestResponse {
  requests: RentalRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}