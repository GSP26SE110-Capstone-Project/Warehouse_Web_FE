import { useState, useEffect } from 'react'
import { warehouseApi } from '../../../service/warehouseApi'
import type { WarehouseRequest } from '../../../types/Warehouse'
import { api } from '../../../utils/Axios';
import { AlertModal } from '../modal/AlertModal'

export interface UserResponse {
    userId: string;
    username: string;
    fullName: string;
    role: string;
}

interface Branch {
    branchId: string
    branchName: string
    isActive: boolean
}

type Mode = 'create' | 'edit' | 'view'
type Props = { mode: Mode; data?: any; onClose: () => void; onSubmit?: (id: string) => void }

export const WarehouseModal: React.FC<Props> = ({ data, mode, onClose, onSubmit }) => {
    const isEdit = mode === 'edit';
    const isView = mode === 'view';

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);
    const [staffList, setStaffList] = useState<UserResponse[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [ids, setIds] = useState({ branchId: '', warehouseId: '' });
    const [isNewBranch, setIsNewBranch] = useState(false);

    // Form states
    const [zones, setZones] = useState<any[]>([]);
    const [branchForm, setBranchForm] = useState({
        managerId: '', branchCode: '', branchName: '', address: '', city: '', isActive: true
    });
    const [warehouseForm, setWarehouseForm] = useState<WarehouseRequest>({
        branchId: '', managerId: '', warehouseCode: '', warehouseName: '',
        warehouseType: 'cold_storage', warehouseSize: 'small', address: '',
        city: '', district: '', operatingHours: '08:00-18:00',
        length: 0, width: 0, height: 0, temperatureMin: 0, temperatureMax: 0
    });

    const [alert, setAlert] = useState<{ open: boolean; message: string; type: 'success' | 'confirm' }>({
        open: false, message: '', type: 'success'
    });



    // 1. Fetch và Lọc Staff chuẩn
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingStaff(true);
            try {
                const [staffRes, branchRes] = await Promise.all([
                    api.get('/users', { params: { role: 'warehouse_staff' } }),
                    warehouseApi.getAllBranches()
                ]);

                const rawStaff = Array.isArray(staffRes.data) ? staffRes.data : (staffRes.data.data || []);
                const filteredStaff = rawStaff.filter((u: any) => u.role?.toLowerCase() === 'warehouse_staff');

                setStaffList(filteredStaff);
                setBranches(branchRes.data.branches || []);

                if (isEdit && data) {
                    setWarehouseForm({ ...data });
                    setIds({ branchId: data.branchId, warehouseId: data.warehouseId });
                    setZones(data.zones || []);
                } else {
                    setZones([{ zoneCode: 'A', length: 10, width: 10, racks: [] }]);
                }
            } catch (e) {
                console.error("Lỗi tải dữ liệu:", e);
            } finally {
                setIsLoadingStaff(false);
            }
        };
        fetchData();
    }, [isEdit, data]);

    // --- Logic Xử lý Step ---
    const handleStep1 = async () => {
        if (isNewBranch) {
            if (!branchForm.managerId || !branchForm.branchCode)
                return setAlert({ open: true, message: "Thiếu thông tin chi nhánh!", type: 'confirm' });
            try {
                setIsSubmitting(true);
                const res = await warehouseApi.createBranch(branchForm);
                setIds(prev => ({ ...prev, branchId: res.data.branchId }));
                setWarehouseForm(prev => ({ ...prev, branchId: res.data.branchId }));
                setStep(2);
            } catch (e) { setAlert({ open: true, message: "Lỗi tạo chi nhánh", type: 'confirm' }); }
            finally { setIsSubmitting(false); }
        } else {
            if (!warehouseForm.branchId) return setAlert({ open: true, message: "Vui lòng chọn chi nhánh!", type: 'confirm' });
            setIds(prev => ({ ...prev, branchId: warehouseForm.branchId }));
            setStep(2);
        }
    };

    const handleStep2 = async () => {
        try {
            setIsSubmitting(true);
            if (isEdit) {
                await warehouseApi.updateWarehouse(ids.warehouseId, warehouseForm);
                setStep(3); // Cho phép qua bước 3 để sửa sơ đồ
            } else {
                const res = await warehouseApi.createWarehouse({ ...warehouseForm, branchId: ids.branchId });
                setIds(prev => ({ ...prev, warehouseId: res.data.warehouseId }));
                setStep(3);
            }
        } catch (e) { setAlert({ open: true, message: "Lỗi lưu thông tin kho", type: 'confirm' }); }
        finally { setIsSubmitting(false); }
    };

    const addNewZone = () => {
        setZones([...zones, { 
            zoneCode: '', 
            zoneName: '', 
            zoneType: 'standard', 
            length: 0, 
            width: 0, 
            racks: [] 
        }]);
    };

    const addNewRack = (zIdx: number) => {
        const n = [...zones];
        n[zIdx].racks.push({ 
            rackCode: '', 
            rackSizeType: 'small',
            length: 0,
            width: 0,
            height: 0,
            maxWeightCapacity: 1000,
            levels: [] 
        });
        setZones(n);
    };

    const addNewLevel = (zIdx: number, rIdx: number) => {
        const n = [...zones];
        const currentLevels = n[zIdx].racks[rIdx].levels || [];
        n[zIdx].racks[rIdx].levels.push({ 
            levelNumber: currentLevels.length + 1, 
            heightClearance: 2, 
            maxWeight: 100 
        });
        setZones(n);
    };

   const handleStep3 = async () => {
        try {
            setIsSubmitting(true);
            for (const zone of zones) {
                let currentZoneId = zone.zoneId;

                // 1. Xử lý Zone
                if (!currentZoneId) {
                    const zoneRes = await warehouseApi.createZone({
                        warehouseId: ids.warehouseId,
                        zoneCode: zone.zoneCode,
                        zoneName: zone.zoneName || `Zone ${zone.zoneCode}`,
                        zoneType: zone.zoneType || 'standard',
                        length: Number(zone.length),
                        width: Number(zone.width)
                    });
                    currentZoneId = zoneRes.data.zoneId;
                }

                // 2. Xử lý Rack
                if (zone.racks?.length > 0) {
                    for (const rack of zone.racks) {
                        let currentRackId = rack.rackId;
                        if (!currentRackId) {
                            const rackRes = await warehouseApi.createRack({
                                zoneId: currentZoneId,
                                rackCode: rack.rackCode,
                                rackSizeType: rack.rackSizeType || 'small',
                                length: Number(rack.length) || 0,
                                width: Number(rack.width) || 0,
                                height: Number(rack.height) || 0,
                                maxWeightCapacity: Number(rack.maxWeightCapacity) || 1000
                            });
                            currentRackId = rackRes.data.rackId;
                        }

                        // 3. Xử lý Level
                        if (rack.levels?.length > 0) {
                            for (const level of rack.levels) {
                                if (!level.levelId) {
                                    await warehouseApi.createLevel({
                                        rackId: currentRackId,
                                        levelNumber: Number(level.levelNumber),
                                        heightClearance: Number(level.heightClearance) || 2,
                                        maxWeight: Number(level.maxWeight) || 100
                                    });
                                }
                            }
                        }
                    }
                }
            }

            setAlert({
                open: true,
                message: isEdit ? "Cập nhật sơ đồ thành công!" : "Khởi tạo sơ đồ thành công!",
                type: 'success'
            });
        } catch (e: any) {
            setAlert({ open: true, message: "Lỗi lưu sơ đồ chi tiết", type: 'confirm' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Logic Xóa ---
    const removeZone = (index: number) => setZones(zones.filter((_, i) => i !== index));
    const removeRack = (zIdx: number, rIdx: number) => {
        const newZones = [...zones];
        newZones[zIdx].racks = newZones[zIdx].racks.filter((_: any, i: number) => i !== rIdx);
        setZones(newZones);
    };
    const removeLevel = (zIdx: number, rIdx: number, lIdx: number) => {
        const newZones = [...zones];
        newZones[zIdx].racks[rIdx].levels = newZones[zIdx].racks[rIdx].levels.filter((_: any, i: number) => i !== lIdx);
        setZones(newZones);
    };

    const inputStyle = 'w-full bg-[#1a2333] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none disabled:opacity-40 disabled:bg-slate-800';
    const labelStyle = 'text-[10px] font-bold text-slate-500 uppercase mb-1 block';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b101a]/90 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl bg-[#0b101a] border border-white/5 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <h2 className="text-white font-bold flex items-center gap-2 text-lg">
                        {step === 1 ? '📍 CHI NHÁNH' : step === 2 ? '🏢 THÔNG TIN KHO' : '🏗️ SƠ ĐỒ CHI TIẾT'}
                    </h2>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className={labelStyle}>Chọn chi nhánh</span>
                                <button onClick={() => setIsNewBranch(!isNewBranch)} className="text-[10px] text-cyan-400 underline uppercase font-bold">
                                    {isNewBranch ? "Quay lại" : "Tạo chi nhánh mới"}
                                </button>
                            </div>
                            {isNewBranch ? (
                                <div className="grid grid-cols-2 gap-4 p-4 border border-cyan-400/20 bg-cyan-400/5 rounded-lg">
                                    <div className="col-span-2">
                                        <label className={labelStyle}>Quản lý chi nhánh (Staff)</label>
                                        <select className={inputStyle} value={branchForm.managerId} onChange={e => setBranchForm({ ...branchForm, managerId: e.target.value })}>
                                            <option value="">-- Chọn Staff --</option>
                                            {staffList.map(s => <option key={s.userId} value={s.userId}>{s.fullName}</option>)}
                                        </select>
                                    </div>
                                    <input placeholder="Mã nhánh" className={inputStyle} onChange={e => setBranchForm({ ...branchForm, branchCode: e.target.value })} />
                                    <input placeholder="Tên nhánh" className={inputStyle} onChange={e => setBranchForm({ ...branchForm, branchName: e.target.value })} />
                                </div>
                            ) : (
                                <select className={inputStyle} value={warehouseForm.branchId} onChange={(e) => setWarehouseForm({ ...warehouseForm, branchId: e.target.value })}>
                                    <option value="">-- Chọn chi nhánh --</option>
                                    {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
                                </select>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-6 gap-4">
                            <div className="col-span-6">
                                <label className={labelStyle}>Quản lý kho</label>
                                <select className={inputStyle} value={warehouseForm.managerId} onChange={e => setWarehouseForm({ ...warehouseForm, managerId: e.target.value })}>
                                    <option value="">-- Chọn nhân viên --</option>
                                    {staffList.map(s => <option key={s.userId} value={s.userId}>{s.fullName}</option>)}
                                </select>
                            </div>
                            <div className="col-span-3">
                                <label className={labelStyle}>Mã kho</label>
                                <input className={inputStyle} value={warehouseForm.warehouseCode} disabled={isEdit} onChange={e => setWarehouseForm({ ...warehouseForm, warehouseCode: e.target.value })} />
                            </div>
                            <div className="col-span-3">
                                <label className={labelStyle}>Tên kho</label>
                                <input className={inputStyle} value={warehouseForm.warehouseName} onChange={e => setWarehouseForm({ ...warehouseForm, warehouseName: e.target.value })} />
                            </div>
                            <div className="col-span-6"><label className={labelStyle}>Địa chỉ</label><input className={inputStyle} value={warehouseForm.address} onChange={e => setWarehouseForm({ ...warehouseForm, address: e.target.value })} /></div>
                            <div className="col-span-2">
                                <label className={labelStyle}>Chiều dài</label>
                                <input type="number" className={inputStyle} value={warehouseForm.length} onChange={e => setWarehouseForm({ ...warehouseForm, length: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelStyle}>Chiều rộng</label>
                                <input type="number" className={inputStyle} value={warehouseForm.width} onChange={e => setWarehouseForm({ ...warehouseForm, width: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelStyle}>Chiều cao</label>
                                <input type="number" className={inputStyle} value={warehouseForm.height} onChange={e => setWarehouseForm({ ...warehouseForm, height: parseFloat(e.target.value) || 0 })} />
                            </div>
                        </div>
                    )}

                   {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">Cấu trúc Zone / Rack / Level</h3>
                                <button 
                                    onClick={addNewZone} 
                                    className="text-[10px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-3 py-1 rounded hover:bg-cyan-400/20 transition-all"
                                >
                                    + THÊM ZONE
                                </button>
                            </div>

                            {zones.map((z, zIdx) => (
                                <div key={zIdx} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl relative mb-4">
                                    <button onClick={() => removeZone(zIdx)} className="absolute top-4 right-4 text-red-500/50 hover:text-red-500 text-[10px]">XÓA ZONE</button>
                                    
                                    <div className="grid grid-cols-12 gap-3 mb-6">
                                        <div className="col-span-2">
                                            <label className={labelStyle}>Mã Zone</label>
                                            <input className={inputStyle} value={z.zoneCode} placeholder="A, B..." onChange={e => { const n = [...zones]; n[zIdx].zoneCode = e.target.value; setZones(n); }} />
                                        </div>
                                        <div className="col-span-4">
                                            <label className={labelStyle}>Tên Zone</label>
                                            <input className={inputStyle} value={z.zoneName} placeholder="Khu vực..." onChange={e => { const n = [...zones]; n[zIdx].zoneName = e.target.value; setZones(n); }} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className={labelStyle}>Dài (m)</label>
                                            <input type="number" className={inputStyle} value={z.length} onChange={e => { const n = [...zones]; n[zIdx].length = +e.target.value; setZones(n); }} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className={labelStyle}>Rộng (m)</label>
                                            <input type="number" className={inputStyle} value={z.width} onChange={e => { const n = [...zones]; n[zIdx].width = +e.target.value; setZones(n); }} />
                                        </div>
                                        <div className="col-span-2 flex items-end">
                                            <button onClick={() => addNewRack(zIdx)} className="w-full h-[38px] text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20">+ RACK</button>
                                        </div>
                                    </div>

                                    {/* Racks Area */}
                                    <div className="ml-4 space-y-4 border-l-2 border-white/5 pl-6">
                                        {z.racks?.map((r: any, rIdx: number) => (
                                            <div key={rIdx} className="p-4 bg-black/40 rounded-lg border border-white/5 relative">
                                                <button onClick={() => removeRack(zIdx, rIdx)} className="absolute top-2 right-2 text-slate-600 hover:text-red-400">✕</button>
                                                
                                                <div className="grid grid-cols-12 gap-3 items-end">
                                                    <div className="col-span-3">
                                                        <label className="text-[9px] text-slate-500 uppercase mb-1 block">Mã Rack</label>
                                                        <input className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white" value={r.rackCode} onChange={e => { const n = [...zones]; n[zIdx].racks[rIdx].rackCode = e.target.value; setZones(n); }} />
                                                    </div>
                                                    <div className="col-span-5">
                                                        <label className="text-[9px] text-slate-500 uppercase mb-1 block">Kích thước (D-R-C m)</label>
                                                        <div className="flex gap-1">
                                                            <input type="number" placeholder="L" className="w-full bg-white/5 border border-white/5 rounded px-1 py-1.5 text-[10px]" value={r.length} onChange={e => { const n = [...zones]; n[zIdx].racks[rIdx].length = +e.target.value; setZones(n); }} />
                                                            <input type="number" placeholder="W" className="w-full bg-white/5 border border-white/5 rounded px-1 py-1.5 text-[10px]" value={r.width} onChange={e => { const n = [...zones]; n[zIdx].racks[rIdx].width = +e.target.value; setZones(n); }} />
                                                            <input type="number" placeholder="H" className="w-full bg-white/5 border border-white/5 rounded px-1 py-1.5 text-[10px]" value={r.height} onChange={e => { const n = [...zones]; n[zIdx].racks[rIdx].height = +e.target.value; setZones(n); }} />
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[9px] text-slate-500 uppercase mb-1 block">Max (kg)</label>
                                                        <input type="number" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs" value={r.maxWeightCapacity} onChange={e => { const n = [...zones]; n[zIdx].racks[rIdx].maxWeightCapacity = +e.target.value; setZones(n); }} />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <button onClick={() => addNewLevel(zIdx, rIdx)} className="w-full py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px]">+ LEVEL</button>
                                                    </div>
                                                </div>

                                                {/* Levels Grid */}
                                                <div className="grid grid-cols-5 gap-2 mt-4">
                                                    {r.levels?.map((l: any, lIdx: number) => (
                                                        <div key={lIdx} className="flex flex-col bg-white/5 p-2 rounded relative group border border-transparent hover:border-cyan-400/30">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[10px] text-cyan-400 font-bold">L{l.levelNumber}</span>
                                                                <button onClick={() => removeLevel(zIdx, rIdx, lIdx)} className="opacity-0 group-hover:opacity-100 text-red-500 text-[8px]">✕</button>
                                                            </div>
                                                            <input 
                                                                type="number" 
                                                                title="Tải trọng tầng (kg)"
                                                                className="bg-transparent text-[9px] border-b border-white/10 focus:outline-none" 
                                                                value={l.maxWeight} 
                                                                onChange={e => { const n = [...zones]; n[zIdx].racks[rIdx].levels[lIdx].maxWeight = +e.target.value; setZones(n); }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-between bg-white/[0.01]">
                    <button onClick={onClose} className="text-sm text-slate-500 hover:text-white">Hủy</button>
                    <div className="flex gap-3">
                        {step > 1 && <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-white border border-white/10 rounded-lg text-sm">Quay lại</button>}
                        <button
                            onClick={step === 1 ? handleStep1 : step === 2 ? handleStep2 : handleStep3}
                            disabled={isSubmitting}
                            className="bg-cyan-400 hover:bg-cyan-300 text-black px-8 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                        >
                            {isSubmitting ? 'Đang lưu...' : step === 3 ? 'Hoàn tất' : 'Tiếp theo'}
                        </button>
                    </div>
                </div>
            </div>

            {alert.open && (
                <AlertModal
                    title="Thông báo"
                    message={alert.message}
                    type={alert.type}
                    onClose={() => {
                        setAlert({ ...alert, open: false });
                        if (alert.type === 'success') onClose();
                    }}
                />
            )}
        </div>
    )
}