import React, { useState, useEffect } from 'react'
import type { RentalRequest } from '../../../types/Contract'
import { accountApi } from '../../../service/accountApi'
import { warehouseApi } from '../../../service/warehouseApi'
import { rentalRequestApi } from '../../../service/rentalRequestApi'

type Props = {
  data: RentalRequest
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

interface TenantData {
  companyName: string;
  taxCode?: string;
  contactPhone?: string;
  address?: string;
  contactEmail?: string;
}

interface WarehouseData {
  warehouseName: string;
  warehouseCode: string;
  address?: string;
}

export const RequestDetailModal: React.FC<Props> = ({
  data,
  onClose,
  onApprove,
  onReject
}) => {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(false);
  const [warehouse, setWarehouse] = useState<WarehouseData | null>(null);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch tenant details
  useEffect(() => {
    const fetchTenant = async () => {
      if (!data.tenantId) return;
      try {
        setLoadingTenant(true);
        const res = await accountApi.getTenant(data.tenantId);
        setTenant(res.data);
      } catch (error) {
        console.error("Không thể lấy thông tin tenant:", error);
      } finally {
        setLoadingTenant(false);
      }
    };
    fetchTenant();
  }, [data.tenantId]);

  // Fetch warehouse details
  useEffect(() => {
    const fetchWarehouse = async () => {
      if (!data.warehouseId) return;
      try {
        setLoadingWarehouse(true);
        const res = await warehouseApi.getById(data.warehouseId);
        setWarehouse(res.data);
      } catch (error) {
        console.error("Không thể lấy thông tin warehouse:", error);
      } finally {
        setLoadingWarehouse(false);
      }
    };
    fetchWarehouse();
  }, [data.warehouseId]);

  const handleApproveAction = async () => {
    try {
      setSubmitting(true);
      const response = await rentalRequestApi.approveApi(data.requestId);
      if (response.status === 200 || response.status === 201) {
        onApprove(data.requestId);
        onClose();
      }
    } catch (error: any) {
      console.error("Lỗi duyệt yêu cầu:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi duyệt");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectAction = async () => {
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      setSubmitting(true);
      const response = await rentalRequestApi.rejectApi(data.requestId, rejectReason);
      if (response.status === 200 || response.status === 201) {
        onReject(data.requestId);
        onClose();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi từ chối");
    } finally {
      setSubmitting(false);
    }
  };

  const statusMap: Record<string, { label: string; class: string }> = {
    PENDING: { label: 'Chờ duyệt', class: 'text-yellow-400 bg-yellow-400/10 ring-yellow-400/20' },
    APPROVED: { label: 'Đã duyệt', class: 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20' },
    REJECTED: { label: 'Từ chối', class: 'text-red-400 bg-red-400/10 ring-red-400/20' }
  };

  const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block';
  const inputStyle = 'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">assignment</span>
              Chi tiết yêu cầu thuê
            </h2>
            <p className="text-sm text-slate-500">
              Ngày tạo: <span className="font-mono text-xs text-slate-400">{new Date(data.createdAt).toLocaleDateString('vi-VN')}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-white/10">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tenant Info */}
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-orange-400 uppercase">Thông tin chủ thuê</h3>
            {loadingTenant ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-white/5 rounded w-full"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>Tên công ty</label>
                    <div className={inputStyle}>{tenant?.companyName || 'N/A'}</div>
                  </div>
                  <div>
                    <label className={labelStyle}>Mã số thuế</label>
                    <div className={inputStyle}>{tenant?.taxCode || '---'}</div>
                  </div>
                  <div>
                    <label className={labelStyle}>Số điện thoại</label>
                    <div className={inputStyle}>{tenant?.contactPhone || 'N/A'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <label className={labelStyle}>Địa chỉ trụ sở</label>
                  <div className={inputStyle}>{tenant?.address || 'N/A'}</div>
                </div>
              </>
            )}
          </div>

          {/* Request Info */}
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase">Thông tin yêu cầu</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelStyle}>Mã kho</label>
                <div className={inputStyle}>{warehouse?.warehouseCode || 'N/A'}</div>
              </div>
              <div>
                <label className={labelStyle}>Tên kho</label>
                <div className={inputStyle}>{warehouse?.warehouseName || 'N/A'}</div>
              </div>
              <div>
                <label className={labelStyle}>Địa chỉ kho</label>
                <div className={inputStyle}>{warehouse?.address || 'N/A'}</div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className={labelStyle}>Thời hạn</label>
                <div className={inputStyle}>{data.durationDays} ngày</div>
              </div>
              <div className="col-span-3">
                <label className={labelStyle}>Ghi chú</label>
                <div className={inputStyle}>{data.notes || 'Không có ghi chú'}</div>
              </div>
              <div>
                <label className={labelStyle}>Trạng thái</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${statusMap[data.status]?.class}`}>
                  {statusMap[data.status]?.label}
                </span>
              </div>
              {/* {data.status === 'PENDING' && !isRejecting && (
                <>
                  <button onClick={() => setIsRejecting(true)} className="...">Từ chối</button>
                  <button
                    onClick={() => onShowContract(data.status)} // Click Duyệt sẽ mở Modal Hợp đồng
                    className="btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-black flex items-center gap-2"
                  >
                    Tiếp tục duyệt & Tạo hợp đồng
                  </button>
                </>
              )} */}
            </div>
          </div>

          {/* Reject Input Area */}
          {isRejecting && (
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
              <label className="text-[11px] font-bold uppercase text-red-400 mb-2 block">Lý do từ chối *</label>
              <textarea
                autoFocus
                className="w-full bg-[#1a2333] border border-red-500/30 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 min-h-[100px]"
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setIsRejecting(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Hủy</button>
                <button
                  onClick={handleRejectAction}
                  disabled={submitting}
                  className="px-4 py-1.5 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600 disabled:opacity-50"
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-white/[0.02]">
          <span className="text-xs text-slate-500">NEXSPACE</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Đóng</button>
            {data.status === 'PENDING' && !isRejecting && (
              <>
                <button
                  onClick={() => setIsRejecting(true)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600"
                >
                  Từ chối
                </button>
                <button
                  onClick={handleApproveAction}
                  disabled={submitting}
                  className="btn-glow bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-black flex items-center gap-2"
                >
                  <span className={`material-symbols-outlined text-[18px] ${submitting ? 'animate-spin' : ''}`}>
                    {submitting ? 'sync' : 'check'}
                  </span>
                  {submitting ? 'Đang duyệt...' : 'Duyệt yêu cầu'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};