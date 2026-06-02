// components/ContractWorkflowModal.tsx
import React, { useState } from 'react';
import { contractApi } from '../../../service/contractApi';
import { warehouseApi } from '../../../service/warehouseApi';
import type { ContractRequest, ContractItemRequest, StorageReservationRequest } from '../../../types/Contract';

type Step = 'CONTRACT' | 'ITEM' | 'RESERVATION' | 'SUCCESS';

interface ContractWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshList?: () => void;
}

export const ContractModal: React.FC<ContractWorkflowModalProps> = ({ isOpen, onClose, onRefreshList }) => {
  const [currentStep, setCurrentStep] = useState<Step>('CONTRACT');
  const [loading, setLoading] = useState<boolean>(false);

  // Lưu trữ IDs sinh ra từ bước trước để truyền sang bước sau
  const [createdContractId, setCreatedContractId] = useState<string>('');
  
  // States lưu data tạm thời của Form các bước (tùy chọn nếu muốn back bước)
  const [contractData, setContractData] = useState<Partial<ContractRequest>>({
    status: 'DRAFT',
    contractType: 'SHARED_STORAGE',
    pricingModel: 'USAGE_BASED',
    billingCycle: 'MONTHLY',
    allowDynamicRelocation: true,
    autoRenew: false,
    minimumBillingDays: 1,
    minimumReservedCapacity: 0,
    estimatedTotalAmount: 0
  });

  const [itemData, setItemData] = useState<Partial<ContractItemRequest>>({
    itemType: 'STORAGE',
    storageLevel: 'WAREHOUSE',
    billingUnit: 'BOX_DAY',
    boxType: 'SMALL'
  });

  const [reservationData, setReservationData] = useState<Partial<StorageReservationRequest>>({
    reservationType: 'SHARED',
    storageLevel: 'WAREHOUSE',
    status: 'ACTIVE',
    boxType: 'SMALL'
  });

  if (!isOpen) return null;

  // --- XỬ LÝ SUBMIT TỪNG BƯỚC ---
  
  // Bước 1: Tạo Hợp đồng
  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Gọi API tạo contract
      const response = await contractApi.create(contractData as ContractRequest);
      if (response.data.success && response.data.data) {
        const newContractId = response.data.data.contractId;
        setCreatedContractId(newContractId);
        
        // Auto-fill contractId vào data của các bước tiếp theo
        setItemData(prev => ({ ...prev, contractId: newContractId }));
        setReservationData(prev => ({ ...prev, contractId: newContractId }));
        
        // Chuyển sang Modal điền Item
        setCurrentStep('ITEM');
      }
    } catch (error) {
      console.error("Lỗi khi tạo hợp đồng:", error);
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Tạo Item thuộc Hợp đồng
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await contractApi.createContractItem(createdContractId, itemData as ContractItemRequest);
      if (response.data.success) {
        // Chuyển sang Modal cấu hình vùng lưu trữ đặt chỗ (Reservation)
        setCurrentStep('RESERVATION');
      }
    } catch (error) {
      console.error("Lỗi khi tạo Contract Item:", error);
    } finally {
      setLoading(false);
    }
  };

  // Bước 3: Tạo Đặt chỗ lưu trữ
  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await contractApi.createStorageReservation(reservationData as StorageReservationRequest);
      if (response.data.success) {
        setCurrentStep('SUCCESS');
        if (onRefreshList) onRefreshList();
      }
    } catch (error) {
      console.error("Lỗi khi tạo Storage Reservation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setCurrentStep('CONTRACT');
    setCreatedContractId('');
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        
        {/* THANH TIẾN TRÌNH (STEPPER) */}
        <div className="stepper-header">
          <span className={currentStep === 'CONTRACT' ? 'active' : ''}>1. Hợp đồng</span>
          <span className={currentStep === 'ITEM' ? 'active' : ''}>2. Điều khoản</span>
          <span className={currentStep === 'RESERVATION' ? 'active' : ''}>3. Cấu hình vị trí</span>
        </div>

        {/* BƯỚC 1: MODAL CONTRACT */}
        {currentStep === 'CONTRACT' && (
          <form onSubmit={handleContractSubmit}>
            <h3>Bước 1: Tạo Thông Tin Hợp Đồng</h3>
            <div>
              <label>Mã Hợp Đồng</label>
              <input 
                type="text" 
                value={contractData.contractCode || ''} 
                onChange={e => setContractData({...contractData, contractCode: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label>Tên Hợp Đồng</label>
              <input 
                type="text" 
                value={contractData.contractName || ''} 
                onChange={e => setContractData({...contractData, contractName: e.target.value})} 
                required 
              />
            </div>
            {/* Các fields khác điền tương tự dựa vào contractData... */}
            
            <div className="modal-actions">
              <button type="button" onClick={handleResetAndClose}>Hủy</button>
              <button type="submit" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Tiếp tục (Tạo Item) →'}
              </button>
            </div>
          </form>
        )}

        {/* BƯỚC 2: MODAL CONTRACT ITEM */}
        {currentStep === 'ITEM' && (
          <form onSubmit={handleItemSubmit}>
            <h3>Bước 2: Thêm Loại Hàng & Đơn Giá (Contract Item)</h3>
            <p className="text-sm text-gray">Mã HD liên kết: {createdContractId}</p>
            
            <div>
              <label>Kích cỡ Box (`BoxType`)</label>
              <select 
                value={itemData.boxType} 
                onChange={e => setItemData({...itemData, boxType: e.target.value as any})}
              >
                <option value="SMALL">SMALL</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LARGE">LARGE</option>
                <option value="EXTRA">EXTRA</option>
              </select>
            </div>
            <div>
              <label>Số lượng</label>
              <input 
                type="number" 
                value={itemData.quantity || 0} 
                onChange={e => setItemData({...itemData, quantity: Number(e.target.value)})} 
              />
            </div>
            {/* Các fields khác... */}

            <div className="modal-actions">
              <button type="button" disabled>Quay lại (Khóa khi HD đã tạo)</button>
              <button type="submit" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Tiếp tục (Cấu hình Vị trí) →'}
              </button>
            </div>
          </form>
        )}

        {/* BƯỚC 3: MODAL STORAGE RESERVATION */}
        {currentStep === 'RESERVATION' && (
          <form onSubmit={handleReservationSubmit}>
            <h3>Bước 3: Đặt Chỗ Kho Bãi (Storage Reservation)</h3>
            
            <div>
              <label>Cấp độ lưu trữ (`StorageLevel`)</label>
              <select 
                value={reservationData.storageLevel} 
                onChange={e => setReservationData({...reservationData, storageLevel: e.target.value as any})}
              >
                <option value="WAREHOUSE">WAREHOUSE</option>
                <option value="ZONE">ZONE</option>
                <option value="RACK">RACK</option>
                <option value="LEVEL">LEVEL</option>
                <option value="BIN">BIN</option>
              </select>
            </div>

            {/* Render động Cascade Selectors dựa vào StorageLevel đã chọn ở trên */}
            {/* Ví dụ: Nếu chọn ZONE, render API select getZones từ warehouseApi */}

            <div className="modal-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Đang lưu vị trí...' : 'Hoàn tất khởi tạo'}
              </button>
            </div>
          </form>
        )}

        {/* HOÀN THÀNH */}
        {currentStep === 'SUCCESS' && (
          <div className="success-step text-center">
            <h3>🎉 Khởi tạo chuỗi hợp đồng thành công!</h3>
            <p>Hợp đồng, hạng mục phụ lục và vị trí lưu trữ đã được cấu hình đồng bộ.</p>
            <button onClick={handleResetAndClose}>Đóng cửa sổ</button>
          </div>
        )}

      </div>
    </div>
  );
};