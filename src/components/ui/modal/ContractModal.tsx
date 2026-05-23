import React, { useState, useEffect } from 'react'
import type { RentalRequest } from '../../../types/Contract'
import { warehouseApi } from '../../../service/warehouseApi'
import { contractApi } from '../../../service/contractApi'

type Mode = 'create' | 'edit' | 'view'

type Props = {
    mode: Mode
    data: RentalRequest // Nhận dữ liệu từ RequestDetailModal
    onClose: () => void
    onSubmit?: (contractId: string) => void
}

interface Rack {
    rackId: string;
    rackCode: string;
    zoneCode: string;
    maxWeightCapacity: number;
    isRented: boolean;
}

export const ContractModal: React.FC<Props> = ({ mode, data, onClose, onSubmit }) => {
    const isView = mode === 'view'
    const [loading, setLoading] = useState(false)
    const [availableRacks, setAvailableRacks] = useState<Rack[]>([])
    const [selectedRackIds, setSelectedRackIds] = useState<string[]>([])
    const [warehouseInfo, setWarehouseInfo] = useState({ branchName: '', warehouseName: '' })

    // Form state khởi tạo từ dữ liệu yêu cầu thuê
    const [form, setForm] = useState({
        requestId: data.requestId,
        totalRentalFee: 0,
        approvedBy: (data as any).approvedBy,
        status: "DRAFT"
    })

    useEffect(() => {
        const fetchHierarchyData = async () => {
            if (!data.warehouseId) return;
            try {
                setLoading(true);
                const res = await warehouseApi.getHierarchy();

                // Lấy mảng branches từ API response
                const branches = res.data?.branches || [];
                let targetWarehouse: any = null;
                let targetBranch: any = null;

                // Tìm kho mục tiêu
                for (const b of branches) {
                    const wh = b.warehouses?.find((w: any) => String(w.warehouseId) === String(data.warehouseId));
                    if (wh) {
                        targetBranch = b;
                        targetWarehouse = wh;
                        break;
                    }
                }

                if (targetWarehouse) {
                    setWarehouseInfo({
                        branchName: targetBranch.branchName,
                        warehouseName: targetWarehouse.warehouseName
                    });

                    const emptyRacks: Rack[] = [];
                    // Duyệt qua các zone và rack để tìm rack trống
                    targetWarehouse.zones?.forEach((zone: any) => {
                        // Chỉ lấy rack nếu Zone chưa bị thuê hoàn toàn
                        if (zone.isRented == false) {
                            zone.racks?.forEach((rack: any) => {
                                // Kiểm tra nếu rack có thuộc tính isRented (nếu không mặc định là false)
                                if (rack.isRented == false || rack.isRented == undefined) {
                                    emptyRacks.push({
                                        rackId: rack.rackId,
                                        rackCode: rack.rackCode,
                                        zoneCode: zone.zoneCode,
                                        maxWeightCapacity: parseFloat(rack.maxWeightCapacity || '0'),
                                        isRented: false
                                    });
                                }
                            });
                        }
                    });
                    setAvailableRacks(emptyRacks);
                }
            } catch (error) {
                console.error("Lỗi lấy sơ đồ kho:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHierarchyData();
    }, [data.warehouseId]);

    const toggleRack = (rackId: string) => {
        if (isView) return;
        setSelectedRackIds(prev =>
            prev.includes(rackId) ? prev.filter(id => id !== rackId) : [...prev, rackId]
        );
    };

    const handleSubmit = async () => {
        if (selectedRackIds.length === 0) return alert("Vui lòng chọn ít nhất một Rack!");
        if (form.totalRentalFee <= 0) return alert("Vui lòng nhập chi phí thuê!");

        setLoading(true);
        try {
            const payload = { ...form, selectedRackIds };
            const response = await contractApi.create(payload);
            const newContractId = response.data.contractId;

            if (response.status === 200 || response.status === 201) {

                // 2. Gửi hợp đồng cho User qua email/hệ thống
                if (newContractId) {
                    try {
                        await contractApi.sendContract(newContractId, { contractFileUrl: response.data.contractFileUrl });
                        alert("Khởi tạo và Gửi hợp đồng thành công!");
                    } catch (sendError) {
                        console.error("Hợp đồng đã tạo nhưng lỗi khi gửi:", sendError);
                        alert("Hợp đồng đã được tạo, nhưng không thể gửi thông báo cho khách hàng.");
                    }
                } else {
                    alert("Khởi tạo hợp đồng thành công!");
                }

                onSubmit?.(newContractId);
                onClose();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || "Lỗi hệ thống khi tạo hợp đồng");
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
                        <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                            {warehouseInfo.branchName} / {warehouseInfo.warehouseName}
                        </div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-cyan-400">contract</span>
                            Thiết lập hợp đồng thuê kho
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading && availableRacks.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p>Đang tải dữ liệu vị trí kho...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-12 gap-8">
                            {/* Cột trái: Sơ đồ chọn Rack */}
                            <div className="col-span-7 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-widest">Rack khả dụng</h3>
                                    <span className="text-xs text-slate-500 italic">Chọn các rack để gán vào hợp đồng</span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {availableRacks.length > 0 ? availableRacks.map(rack => (
                                        <div
                                            key={rack.rackId}
                                            onClick={() => toggleRack(rack.rackId)}
                                            className={`relative p-4 rounded-xl border transition-all cursor-pointer ${selectedRackIds.includes(rack.rackId)
                                                    ? 'border-cyan-400 bg-cyan-400/10 ring-1 ring-cyan-400/50'
                                                    : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                                                }`}
                                        >
                                            <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Khu vực: {rack.zoneCode}</div>
                                            <div className="text-base font-bold text-white">Rack {rack.rackCode}</div>
                                            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">weight</span>
                                                Tải trọng: {rack.maxWeightCapacity}kg
                                            </div>

                                            {selectedRackIds.includes(rack.rackId) && (
                                                <div className="absolute -top-2 -right-2 bg-cyan-400 text-black rounded-full size-6 flex items-center justify-center shadow-lg">
                                                    <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="col-span-3 py-20 text-center border border-dashed border-white/10 rounded-2xl">
                                            <p className="text-slate-500 text-sm italic">Không có Rack trống khả dụng.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cột phải: Thông tin thanh toán */}
                            <div className="col-span-5">
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6 sticky top-0">
                                    <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">Chi phí & Cam kết</h3>

                                    <div>
                                        <label className={labelStyle}>Mã yêu cầu</label>
                                        <div className={`${inputStyle} bg-slate-800/50 text-slate-400 font-mono`}>{data.requestId}</div>
                                    </div>

                                    <div>
                                        <label className={labelStyle}>Tổng thời hạn thuê</label>
                                        <div className={`${inputStyle} bg-slate-800/50 text-slate-400`}>{data.durationDays} ngày</div>
                                    </div>

                                    <div>
                                        <label className={labelStyle}>Tổng giá trị hợp đồng (VNĐ)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className={`${inputStyle} text-lg font-bold text-cyan-400 pr-14`}
                                                value={form.totalRentalFee}
                                                onChange={e => setForm({ ...form, totalRentalFee: +e.target.value })}
                                                placeholder="0"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">VNĐ</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Đã chọn:</span>
                                            <span className="text-white font-bold">{selectedRackIds.length} vị trí</span>
                                        </div>
                                        <div className="flex justify-between text-lg border-t border-white/5 pt-3">
                                            <span className="text-slate-400">Thành tiền:</span>
                                            <span className="text-cyan-400 font-black">{(form.totalRentalFee).toLocaleString()} đ</span>
                                        </div>
                                    </div>

                                    <button
                                        disabled={loading || selectedRackIds.length === 0}
                                        onClick={handleSubmit}
                                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 rounded-xl text-sm font-black text-black hover:opacity-90 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined font-bold">verified_user</span>
                                        {loading ? 'ĐANG XỬ LÝ...' : 'PHÊ DUYỆT HỢP ĐỒNG'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}