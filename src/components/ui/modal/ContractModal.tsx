import { useState, useEffect } from 'react'
import type { ContractRequest, RentalRequest } from '../../../types/Contract'
import { warehouseApi } from '../../../service/warehouseApi'
import { contractApi } from '../../../service/contractApi' // Giả sử bạn đã định nghĩa service này

type Mode = 'create' | 'edit' | 'view'

type Props = {
    mode: Mode
    data: RentalRequest // Nhận dữ liệu từ RequestDetailModal
    onClose: () => void
    onSubmit?: (requestId: string) => void
}

interface Rack {
    rackId: string;
    rackCode: string;
    zoneCode: string;
    capacity?: number;
    status: string;
}

export const ContractModal: React.FC<Props> = ({
    mode,
    data,
    onClose,
    onSubmit
}) => {
    const isView = mode === 'view'
    const [loading, setLoading] = useState(false)
    const [availableRacks, setAvailableRacks] = useState<Rack[]>([])
    const [selectedRackIds, setSelectedRackIds] = useState<string[]>([])
    
    // Form state theo schema API bạn cung cấp
    const [form, setForm] = useState({
        requestId: data.requestId,
        totalRentalFee: 0,
        approvedBy: "USR0001", // Nên lấy từ context User đăng nhập
        status: "DRAFT"
    })

    // 1. Fetch danh sách Rack trống của Warehouse tương ứng
    useEffect(() => {
        const fetchRacks = async () => {
            if (!data.warehouseId) return;
            try {
                setLoading(true);
                // Giả sử API trả về các rack có trạng thái trống (Available)
                const res = await warehouseApi.getById(data.warehouseId); 
                // Flat data từ Zones -> Racks nếu API trả về cấu trúc phân cấp
                const allRacks: Rack[] = [];
                res.data.zones?.forEach((z: any) => {
                    z.racks?.forEach((r: any) => {
                        if (r.status === '' || !r.isOccupied) {
                            allRacks.push({ ...r, zoneCode: z.zoneCode });
                        }
                    });
                });
                setAvailableRacks(allRacks);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách Rack:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRacks();
    }, [data.warehouseId]);

    // 2. Logic chọn/bỏ chọn Rack
    const toggleRack = (rackId: string) => {
        if (isView) return;
        setSelectedRackIds(prev => 
            prev.includes(rackId) 
                ? prev.filter(id => id !== rackId) 
                : [...prev, rackId]
        );
    };

    // 3. Submit tạo hợp đồng & duyệt yêu cầu
    const handleSubmit = async () => {
        if (selectedRackIds.length === 0) {
            alert("Vui lòng chọn ít nhất một vị trí Rack trống!");
            return;
        }
        if (form.totalRentalFee <= 0) {
            alert("Vui lòng nhập tổng chi phí thuê!");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                selectedRackIds: selectedRackIds
            };

            // Gọi API tạo hợp đồng (Backend sẽ tự chuyển trạng thái RentalRequest sang APPROVED)
            const response = await contractApi.create(payload);
            
            if (response.status === 200 || response.status === 201) {
                alert("Đã duyệt yêu cầu và khởi tạo hợp đồng thành công!");
                onSubmit?.(data.requestId);
                onClose();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || "Lỗi khi tạo hợp đồng");
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block';
    const inputStyle = 'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition-all';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0b101a]/95 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative z-10 w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0b101a] shadow-2xl flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.01]">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-cyan-400">gavel</span>
                            Cấu hình hợp đồng & Duyệt yêu cầu
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Yêu cầu: <span className="text-cyan-400 font-mono">{data.requestId}</span> • 
                            Khách hàng: <span className="text-slate-200">{data.contactName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="grid grid-cols-12 gap-8">
                        
                        {/* Cột trái: Chọn Rack */}
                        <div className="col-span-7 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-widest">Sơ đồ Rack trống</h3>
                                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded">
                                    Kho: {data.warehouseId}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {availableRacks.length > 0 ? availableRacks.map(rack => (
                                    <div 
                                        key={rack.rackId}
                                        onClick={() => toggleRack(rack.rackId)}
                                        className={`relative p-3 rounded-xl border transition-all cursor-pointer group ${
                                            selectedRackIds.includes(rack.rackId)
                                                ? 'border-cyan-400 bg-cyan-400/10 ring-1 ring-cyan-400/50'
                                                : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                                        }`}
                                    >
                                        <div className="text-[10px] text-slate-500 font-bold mb-1">ZONE {rack.zoneCode}</div>
                                        <div className="text-sm font-bold text-white">{rack.rackCode}</div>
                                        <div className="text-[9px] text-slate-400 mt-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px]">weight</span>
                                            {rack.capacity || 500}kg
                                        </div>
                                        
                                        {selectedRackIds.includes(rack.rackId) && (
                                            <div className="absolute -top-2 -right-2 bg-cyan-400 text-black rounded-full size-5 flex items-center justify-center shadow-lg">
                                                <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="col-span-4 py-20 text-center border border-dashed border-white/10 rounded-2xl">
                                        <span className="material-symbols-outlined text-slate-600 text-4xl mb-2">inventory_2</span>
                                        <p className="text-slate-500 text-sm italic">Không tìm thấy vị trí Rack trống nào!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cột phải: Thông tin tài chính */}
                        <div className="col-span-5 space-y-6">
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6">
                                <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">Thông tin thuê</h3>
                                
                                <div>
                                    <label className={labelStyle}>Thời hạn thuê (Ngày)</label>
                                    <input disabled className={`${inputStyle} opacity-50`} value={data.durationDays} />
                                </div>

                                <div>
                                    <label className={labelStyle}>Tổng chi phí thuê (VNĐ)</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            className={`${inputStyle} text-xl font-bold text-cyan-400 pr-12`}
                                            value={form.totalRentalFee}
                                            onChange={e => setForm({...form, totalRentalFee: +e.target.value})}
                                            placeholder="Nhập số tiền..."
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">VNĐ</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 italic">* Đây là tổng số tiền khách hàng phải trả cho toàn bộ thời gian thuê.</p>
                                </div>

                                <div className="p-4 rounded-xl bg-cyan-400/5 border border-cyan-400/10">
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-slate-400">Số lượng Rack đã chọn:</span>
                                        <span className="text-cyan-400 font-bold">{selectedRackIds.length} vị trí</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Đơn giá trung bình:</span>
                                        <span className="text-white">
                                            {selectedRackIds.length > 0 
                                                ? (form.totalRentalFee / selectedRackIds.length).toLocaleString() 
                                                : 0} VNĐ/Rack
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500">
                        <span className="material-symbols-outlined text-sm">shield_person</span>
                        <span className="text-[10px] uppercase font-bold tracking-tighter">Hợp đồng được duyệt bởi: Admin ({form.approvedBy})</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Hủy bỏ</button>
                        <button
                            disabled={loading || selectedRackIds.length === 0}
                            onClick={handleSubmit}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 px-10 py-2.5 rounded-xl text-sm font-extrabold text-black hover:opacity-90 disabled:opacity-30 disabled:grayscale transition-all shadow-[0_0_30px_rgba(6,182,212,0.2)] flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[20px]">verified</span>
                                    Xác nhận & Ký hợp đồng
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}