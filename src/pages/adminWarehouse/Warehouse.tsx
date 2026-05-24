import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { warehouseApi } from '../../service/warehouseApi'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import type {
  WarehouseResponse, ZoneResponse, ZoneRequest, ZoneType,
  RackResponse, RackRequest, RackType,
  LevelResponse, LevelRequest,
  BinResponse, BinRequest, BinStatus, BoxType, ReservationType
} from '../../types/Warehouse'

type CrudTarget = 'ZONE' | 'RACK' | 'LEVEL' | 'BIN'
type CrudMode = 'CREATE' | 'EDIT' | null

export const Warehouse: React.FC = () => {
  // Lấy id từ URL dành cho đối tượng SYSTEM_ADMIN
  const { id: urlId } = useParams<{ id: string }>()
  
  // Xác định chính xác warehouseId dựa trên phân quyền người dùng
  const [targetWarehouseId, setTargetWarehouseId] = useState<string | null>(null)
  const [isWhAdmin, setIsWhAdmin] = useState<boolean>(false)

  const [loading, setLoading] = useState<boolean>(false)
  const [warehouse, setWarehouse] = useState<WarehouseResponse | null>(null)

  // Lưu trữ danh sách các thực thể phẳng theo phân cấp
  const [zones, setZones] = useState<ZoneResponse[]>([])
  const [racks, setRacks] = useState<RackResponse[]>([])
  const [levels, setLevels] = useState<LevelResponse[]>([])
  const [bins, setBins] = useState<BinResponse[]>([])

  // Tiêu điểm điều hướng sơ đồ
  const [selectedZone, setSelectedZone] = useState<ZoneResponse | null>(null)
  const [selectedRack, setSelectedRack] = useState<RackResponse | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<LevelResponse | null>(null)

  const [zoom, setZoom] = useState<number>(1)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)

  // Trạng thái Quản lý CRUD Động
  const [crudState, setCrudState] = useState<{
    target: CrudTarget;
    mode: CrudMode;
    parentId?: string;
    data?: any
  }>({ target: 'ZONE', mode: null })

  // ================= FORM FIELDS STATE ĐỒNG BỘ TYPES TỰ ĐỘNG =================
  const [zoneForm, setZoneForm] = useState<Partial<ZoneRequest>>({ zoneCode: '', zoneName: '', zoneType: 'SHARED', areaM2: 0, isDedicated: false, status: 'ACTIVE' })
  const [rackForm, setRackForm] = useState<Partial<RackRequest>>({ rackCode: '', rackType: 'STANDARD', maxLevels: 1, status: 'ACTIVE' })
  const [levelForm, setLevelForm] = useState<Partial<LevelRequest>>({ levelCode: '', levelNumber: 1, maxBins: 10, maxWeightKg: 1000, heightCm: 200, levelPriority: 1 })
  const [binForm, setBinForm] = useState<Partial<BinRequest>>({ binCode: '', supportedBoxType: 'MEDIUM', maxLpnCount: 5, maxVolumeUnits: 100, maxOwnerCount: 1, reservationType: 'SHARED', status: 'EMPTY' })

  const [alert, setAlert] = useState<{ open: boolean; type: 'success' | 'confirm'; message: string; onConfirm?: () => void }>({
    open: false, type: 'success', message: ''
  })

  // ================= HOOK 0. KIỂM TRA PHÂN QUYỀN & LẤY WAREHOUSE ID AN TOÀN =================
  useEffect(() => {
    const userString = localStorage.getItem('user')
    if (userString) {
      try {
        const user = JSON.parse(userString)
        
        // Nếu là WH_ADMIN -> Ép buộc hệ thống sử dụng warehouseId thuộc về chính tài khoản đó
        if (user.role === 'WH_ADMIN') {
          setIsWhAdmin(true)
          setTargetWarehouseId(user.warehouseId || null)
        } else {
          // Ngược lại nếu là SYSTEM_ADMIN hoặc quyền khác -> Lấy ID từ URL thông thường
          setIsWhAdmin(false)
          setTargetWarehouseId(urlId || null)
        }
      } catch (e) {
        console.error('Lỗi phân tích dữ liệu user từ localStorage:', e)
        setTargetWarehouseId(urlId || null)
      }
    } else {
      setTargetWarehouseId(urlId || null)
    }
  }, [urlId])

  // ================= SIDE-EFFECTS NẠP DỮ LIỆU CHỦ ĐỘNG =================

  // 1. Lấy thông tin kho và danh sách Zone ban đầu
  useEffect(() => {
    const initPage = async () => {
      if (!targetWarehouseId) return
      setLoading(true)
      try {
        const whRes = await warehouseApi.getById(targetWarehouseId)
        setWarehouse(whRes.data.data)

        const zoneRes = await warehouseApi.getZones(targetWarehouseId)
        setZones(zoneRes.data.data || [])
      } catch (err) {
        console.error('Lỗi khởi tạo dữ liệu kho:', err)
      } finally {
        setLoading(false)
      }
    }
    initPage()
  }, [targetWarehouseId])

  // 2. Tự động tải tất cả các Racks của TẤT CẢ các Zone cùng một lúc
  useEffect(() => {
    const fetchAllRacks = async () => {
      if (zones.length === 0) return
      try {
        const rackPromises = zones.map(zone => warehouseApi.getRacks(zone.zoneId))
        const responses = await Promise.all(rackPromises)
        const combinedRacks = responses.flatMap(res => res.data.data || [])
        setRacks(combinedRacks)
      } catch (err) {
        console.error('Lỗi khi tải toàn bộ danh sách dãy kệ hàng:', err)
      }
    }
    fetchAllRacks()
  }, [zones])

  // 3. Tự động tải Levels khi chọn hoặc đổi Rack ở thanh Sidebar chi tiết
  useEffect(() => {
    const fetchLevels = async () => {
      if (!selectedRack) { setLevels([]); return }
      try {
        const res = await warehouseApi.getLevels(selectedRack.rackId)
        setLevels(res.data.data || [])
        setSelectedLevel(null)
        setBins([])
      } catch (err) { console.error(err) }
    }
    fetchLevels()
  }, [selectedRack])

  // 4. Tự động tải Bins khi chọn hoặc đổi Tầng (Level) ở thanh Sidebar chi tiết
  useEffect(() => {
    const fetchBins = async () => {
      if (!selectedLevel) { setBins([]); return }
      try {
        const res = await warehouseApi.getBins(selectedLevel.rackLevelId)
        setBins(res.data.data || [])
      } catch (err) { console.error(err) }
    }
    fetchBins()
  }, [selectedLevel])

  // ================= ĐIỀU KHIỂN ĐÓNG/MỞ FORM CRUD ĐỘNG =================
  const openCrudForm = (target: CrudTarget, mode: CrudMode, parentId?: string, currentData?: any) => {
    setCrudState({ target, mode, parentId, data: currentData })
    setSidebarOpen(true)

    if (mode === 'EDIT' && currentData) {
      if (target === 'ZONE') setZoneForm(currentData)
      if (target === 'RACK') setRackForm(currentData)
      if (target === 'LEVEL') setLevelForm(currentData)
      if (target === 'BIN') setBinForm(currentData)
    } else {
      if (target === 'ZONE') setZoneForm({ zoneCode: '', zoneName: '', zoneType: 'SHARED', areaM2: 0, isDedicated: false, status: 'ACTIVE' })
      if (target === 'RACK') setRackForm({ rackCode: '', rackType: 'STANDARD', maxLevels: 1, status: 'ACTIVE' })
      if (target === 'LEVEL') setLevelForm({ levelCode: '', levelNumber: (levels.length + 1), maxBins: 10, maxWeightKg: 1000, heightCm: 200, levelPriority: 1 })
      if (target === 'BIN') setBinForm({ binCode: '', supportedBoxType: 'MEDIUM', maxLpnCount: 5, maxVolumeUnits: 100, maxOwnerCount: 1, reservationType: 'SHARED', status: 'EMPTY' })
    }
  }

  // ================= XỬ LÝ SUBMIT BIỂU MẪU LÊN API =================
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetWarehouseId) return
    setLoading(true)
    try {
      if (crudState.target === 'ZONE') {
        if (crudState.mode === 'CREATE') await warehouseApi.createZone({ ...zoneForm, warehouseId: targetWarehouseId } as ZoneRequest)
        else await warehouseApi.updateZone(crudState.data.zoneId, zoneForm as ZoneRequest)
        const res = await warehouseApi.getZones(targetWarehouseId)
        setZones(res.data.data || [])
      }
      else if (crudState.target === 'RACK') {
        if (crudState.mode === 'CREATE') await warehouseApi.createRack({ ...rackForm, zoneId: crudState.parentId } as RackRequest)
        else await warehouseApi.updateRack(crudState.data.rackId, rackForm as RackRequest)

        const res = await warehouseApi.getZones(targetWarehouseId)
        setZones(res.data.data || [])
      }
      else if (crudState.target === 'LEVEL') {
        if (crudState.mode === 'CREATE') await warehouseApi.createLevel({ ...levelForm, rackId: crudState.parentId } as LevelRequest)
        else await warehouseApi.updateLevel(crudState.data.rackLevelId, levelForm as LevelRequest)
        const res = await warehouseApi.getLevels(selectedRack!.rackId)
        setLevels(res.data.data || [])
      }
      else if (crudState.target === 'BIN') {
        if (crudState.mode === 'CREATE') await warehouseApi.createBin({ ...binForm, rackLevelId: crudState.parentId } as BinRequest)
        else await warehouseApi.updateBin(crudState.data.binId, binForm as BinRequest)
        const res = await warehouseApi.getBins(selectedLevel!.rackLevelId)
        setBins(res.data.data || [])
      }

      setAlert({ open: true, type: 'success', message: `Đã đồng bộ dữ liệu cấu trúc ${crudState.target} thành công!` })
      setCrudState({ target: 'ZONE', mode: null })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ================= XỬ LÝ XÓA NÚT THẮT PHÂN CẤP (DELETE) =================
  const handleDeleteNode = (target: CrudTarget, targetId: string) => {
    setAlert({
      open: true,
      type: 'confirm',
      message: `Bạn chắc chắn muốn xóa phân cấp này? Mọi dữ liệu con phụ thuộc trực tiếp vào ${target} này sẽ bị gỡ bỏ khỏi hệ thống.`,
      onConfirm: async () => {
        setLoading(true)
        try {
          if (target === 'ZONE') {
            await warehouseApi.deleteZone(targetId)
            setZones(prev => prev.filter(z => z.zoneId !== targetId))
            if (selectedZone?.zoneId === targetId) setSelectedZone(null)
          } else if (target === 'RACK') {
            await warehouseApi.deleteRack(targetId)
            setRacks(prev => prev.filter(r => r.rackId !== targetId))
            if (selectedRack?.rackId === targetId) setSelectedRack(null)
          } else if (target === 'LEVEL') {
            await warehouseApi.deleteLevel(targetId)
            setLevels(prev => prev.filter(l => l.rackLevelId !== targetId))
            if (selectedLevel?.rackLevelId === targetId) setSelectedLevel(null)
          } else if (target === 'BIN') {
            await warehouseApi.deleteBin(targetId)
            setBins(prev => prev.filter(b => b.binId !== targetId))
          }
          setAlert({ open: true, type: 'success', message: `Xóa phần tử cấu trúc thành công!` })
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
    })
  }

  if (!warehouse && loading) return <div className="flex h-screen items-center justify-center bg-white text-cyan-600 font-mono">ĐANG PHÂN TÍCH HỆ THỐNG KHO...</div>
  if (!warehouse) return <div className="flex h-screen items-center justify-center bg-white text-slate-500">Không tìm thấy mã cấu hình kho hàng được yêu cầu hoặc bạn không có quyền truy cập.</div>

  return (
    <div className="flex w-full overflow-hidden bg-white text-slate-500 flex-col">

      {/* ================= HEADER PHÍA TRÊN CỐ ĐỊNH ================= */}
      <header className="w-full border-b border-cyan-500/5 bg-white p-5 backdrop-blur-md shadow-2xl z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Thông tin kho bên trái */}
          <div>
            {!isWhAdmin && (
              <Link to="/admin/warehouse" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 mb-1">
                <span className="material-symbols-outlined text-xs">arrow_back</span> Quản lý kho tổng
              </Link>
            )}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{warehouse.warehouseName}</h1>
              <span className="text-xs px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 font-mono rounded-md">{warehouse.warehouseCode}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">🗺️ {warehouse.address}</p>
          </div>

          {/* Chỉ số diện tích và Nút tạo Zone */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-[11px] font-mono text-slate-500 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              Diện tích khả dụng: <span className="text-white font-bold">{warehouse.usableAreaM2}</span> / {warehouse.totalAreaM2} m²
            </div>
            <button
              onClick={() => openCrudForm('ZONE', 'CREATE', warehouse.warehouseId)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold rounded-xl hover:bg-cyan-500 hover:text-black transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-xs">add_box</span> Cấu hình Khu (Zone) mới
            </button>
          </div>

        </div>
      </header>

      {/* ================= KHU VỰC THÂN TRANG CHỨA MAP & SIDEBAR ================= */}
      <div className="flex flex-1 overflow-hidden relative w-full">

        <main className={`relative flex flex-1 flex-col h-full transition-all duration-300 ${sidebarOpen ? 'mr-[450px]' : 'w-full'}`}>

          <div className="absolute bottom-10 left-6 z-10 flex items-center gap-1 bg-cyan-500/10 p-1.5 rounded-xl border border-cyan-500/20 backdrop-blur shadow-xl">
            <button onClick={() => setZoom(prev => Math.min(prev + 0.15, 2))} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-sm font-black hover:bg-slate-700">+</button>
            <button onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.5))} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-sm font-black hover:bg-slate-700">-</button>
            <button onClick={() => setZoom(1)} className="px-3 h-8 text-xs font-bold bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-black transition-colors">100%</button>
          </div>

          <div className="h-[620px] overflow-auto bg-white p-8 flex items-start justify-center">
            {zones.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
                <span className="material-symbols-outlined text-4xl mb-3 opacity-50">layers</span>
                <p className="text-center">Không có khu vực (Zone) nào</p>
                <p className="text-xs text-slate-500 mt-1">Hãy tạo khu vực mới để bắt đầu</p>
              </div>
            ) : (
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }} className="transition-transform duration-150 ease-out flex flex-col gap-10 w-full max-w-3xl mt-4">
                {zones.map((zone) => (
                  <div
                    key={zone.zoneId}
                    className={`group/zone relative border-2 border-dashed p-8 pt-12 rounded-3xl transition-all ${selectedZone?.zoneId === zone.zoneId ? 'border-cyan-400 bg-cyan-500/[0.02]' : 'border-cyan-500 bg-cyan-500/[0.01]'
                      }`}
                  >
                    <div className="absolute -top-4 left-6 flex items-center gap-1 bg-cyan-100 p-1 rounded-full border border-white/10 shadow-xl">
                      <span
                        onClick={() => setSelectedZone(zone)}
                        className="bg-cyan-500 text-black px-4 py-1 rounded-full text-xs font-black tracking-widest cursor-pointer hover:bg-cyan-400"
                      >
                        ZONE: {zone.zoneCode} ({zone.zoneType})
                      </span>
                      <button onClick={() => openCrudForm('RACK', 'CREATE', zone.zoneId)} className="p-1 text-emerald-400 hover:bg-white/5 rounded-full" title="Thêm Kệ"><span className="material-symbols-outlined text-sm">add_circle</span></button>
                      <button onClick={() => openCrudForm('ZONE', 'EDIT', warehouse.warehouseId, zone)} className="p-1 text-slate-400 hover:bg-white/5 rounded-full" title="Sửa Zone"><span className="material-symbols-outlined text-sm">edit</span></button>
                      <button onClick={() => handleDeleteNode('ZONE', zone.zoneId)} className="p-1 text-red-400 hover:bg-white/5 rounded-full opacity-0 group-hover/zone:opacity-100 transition-opacity" title="Xóa Zone"><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                      {racks
                        .filter((rack) => rack.zoneId === zone.zoneId)
                        .map((rack) => (
                          <div
                            key={rack.rackId}
                            onClick={() => {
                              setSelectedZone(zone)
                              setSelectedRack(rack)
                              setCrudState({ target: 'RACK', mode: null })
                              setSidebarOpen(true)
                            }}
                            className={`group/rack relative bg-[#131b29] border rounded-xl p-4 cursor-pointer shadow-lg transition-all hover:scale-[1.05] ${selectedRack?.rackId === rack.rackId ? 'border-orange-400 ring-2 ring-orange-500/10' : 'border-white/5'
                              }`}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteNode('RACK', rack.rackId) }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/rack:opacity-100 transition-opacity text-xs font-bold shadow-md z-10"
                            >
                              ×
                            </button>

                            <div className="text-[11px] text-cyan-400 font-mono font-black text-center mb-1">{rack.rackCode}</div>
                            <div className="text-[9px] text-slate-500 text-center mb-2 uppercase font-medium">{rack.rackType}</div>

                            <div className="text-[10px] bg-slate-800 text-slate-300 py-1 rounded text-center font-bold">
                              {rack.maxLevels} TẦNG LƯU TRỮ
                            </div>
                          </div>
                        ))}

                      {racks.filter((rack) => rack.zoneId === zone.zoneId).length === 0 && (
                        <div className="col-span-full text-left text-xs text-slate-500 italic py-2">Khu vực này chưa cấu hình dãy kệ nào.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ================= SIDEBAR QUẢN LÝ CRUD & PHÂN CẤP TRỰC QUAN ================= */}
        <aside className={`fixed right-0 top-0 h-full w-[450px] bg-white border-l border-white/10 p-6 shadow-2xl transition-transform duration-300 flex flex-col justify-between z-20 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>

          {crudState.mode ? (
            <div className="flex-1 flex flex-col h-full mt-6">
              <div className="flex items-center justify-between border-b border-cyan-500 pb-3">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">
                  {crudState.mode === 'CREATE' ? 'Khởi tạo mới' : 'Cập nhật cấu hình'} {crudState.target}
                </h3>
                <button onClick={() => setCrudState({ target: 'ZONE', mode: null })} className="text-slate-500 hover:text-cyan-400 text-xs">Quay lại</button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 mt-4 flex-1 overflow-y-auto pr-1">
                {crudState.target === 'ZONE' && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Mã khu vực (Zone Code)*</label>
                      <input type="text" required value={zoneForm.zoneCode} onChange={(e) => setZoneForm({ ...zoneForm, zoneCode: e.target.value })} className="w-full px-4 py-2 bg-[#161f30] border border-cyan-500 rounded-xl text-sm focus:outline-none focus:border-cyan-400 text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Tên mô tả phân khu</label>
                      <input type="text" required value={zoneForm.zoneName} onChange={(e) => setZoneForm({ ...zoneForm, zoneName: e.target.value })} className="w-full px-4 py-2 bg-[#161f30] border border-cyan-500 rounded-xl text-sm focus:outline-none focus:border-cyan-400 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Loại Zone (Zone Type)</label>
                        <select value={zoneForm.zoneType} onChange={(e) => setZoneForm({ ...zoneForm, zoneType: e.target.value as ZoneType })} className="w-full px-3 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-cyan-400 text-white">
                          <option value="SHARED">SHARED</option>
                          <option value="FAST_MOVING">FAST_MOVING</option>
                          <option value="BULK">BULK</option>
                          <option value="PREMIUM">PREMIUM</option>
                          <option value="QC">QC</option>
                          <option value="RETURN">RETURN</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Diện tích m²</label>
                        <input type="number" value={zoneForm.areaM2} onChange={(e) => setZoneForm({ ...zoneForm, areaM2: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-cyan-400 text-white" />
                      </div>
                    </div>
                  </>
                )}

                {crudState.target === 'RACK' && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Mã kệ (Rack Code)*</label>
                      <input type="text" required value={rackForm.rackCode} onChange={(e) => setRackForm({ ...rackForm, rackCode: e.target.value })} className="w-full px-4 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-cyan-400 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Loại kết cấu Rack</label>
                        <select value={rackForm.rackType} onChange={(e) => setRackForm({ ...rackForm, rackType: e.target.value as RackType })} className="w-full px-3 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none text-white">
                          <option value="STANDARD">STANDARD</option>
                          <option value="HIGH_CAPACITY">HIGH_CAPACITY</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Số tầng tối đa (Max Level)</label>
                        <input type="number" value={rackForm.maxLevels} onChange={(e) => setRackForm({ ...rackForm, maxLevels: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none text-white" />
                      </div>
                    </div>
                  </>
                )}

                {crudState.target === 'LEVEL' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Mã tầng (Level Code)*</label>
                        <input type="text" required value={levelForm.levelCode} onChange={(e) => setLevelForm({ ...levelForm, levelCode: e.target.value })} className="w-full px-4 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none text-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Tầng số (Level Number)</label>
                        <input type="number" value={levelForm.levelNumber} onChange={(e) => setLevelForm({ ...levelForm, levelNumber: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Số Bins tối đa</label>
                        <input type="number" value={levelForm.maxBins} onChange={(e) => setLevelForm({ ...levelForm, maxBins: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#161f30] border border-white/10 rounded-xl text-xs focus:outline-none text-white" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Tải trọng (kg)</label>
                        <input type="number" value={levelForm.maxWeightKg} onChange={(e) => setLevelForm({ ...levelForm, maxWeightKg: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#161f30] border border-white/10 rounded-xl text-xs focus:outline-none text-white" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Chiều cao (cm)</label>
                        <input type="number" value={levelForm.heightCm} onChange={(e) => setLevelForm({ ...levelForm, heightCm: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#161f30] border border-white/10 rounded-xl text-xs focus:outline-none text-white" />
                      </div>
                    </div>
                  </>
                )}

                {crudState.target === 'BIN' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Mã vị trí ô (Bin Code)*</label>
                        <input type="text" required value={binForm.binCode} onChange={(e) => setBinForm({ ...binForm, binCode: e.target.value })} className="w-full px-4 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none text-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Loại thùng hỗ trợ</label>
                        <select value={binForm.supportedBoxType} onChange={(e) => setBinForm({ ...binForm, supportedBoxType: e.target.value as BoxType })} className="w-full px-3 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none text-white">
                          <option value="SMALL">SMALL</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="LARGE">LARGE</option>
                          <option value="EXTRA">EXTRA</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Cơ chế đặt chỗ</label>
                        <select value={binForm.reservationType} onChange={(e) => setBinForm({ ...binForm, reservationType: e.target.value as ReservationType })} className="w-full px-3 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none text-white">
                          <option value="SHARED">SHARED</option>
                          <option value="RESERVED">RESERVED</option>
                          <option value="DEDICATED">DEDICATED</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Trạng thái chứa</label>
                        <select value={binForm.status} onChange={(e) => setBinForm({ ...binForm, status: e.target.value as BinStatus })} className="w-full px-3 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none text-white">
                          <option value="EMPTY">EMPTY</option>
                          <option value="PARTIAL">PARTIAL</option>
                          <option value="FULL">FULL</option>
                          <option value="RESERVED">RESERVED</option>
                          <option value="BLOCKED">BLOCKED</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Số LPN tối đa</label>
                        <input type="number" value={binForm.maxLpnCount} onChange={(e) => setBinForm({ ...binForm, maxLpnCount: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none text-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Thể tích chứa tối đa</label>
                        <input type="number" value={binForm.maxVolumeUnits} onChange={(e) => setBinForm({ ...binForm, maxVolumeUnits: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#161f30] border border-white/10 rounded-xl text-sm focus:outline-none text-white" />
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 flex gap-2">
                  <button type="button" onClick={() => setCrudState({ target: 'ZONE', mode: null })} className="flex-1 py-2 bg-slate-800 text-medium text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">Hủy</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-medium font-black rounded-xl hover:opacity-95 shadow-lg shadow-cyan-500/10">Lưu dữ liệu</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full mt-6 overflow-hidden">
              {selectedRack ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">

                  <div className="flex justify-between items-start border-b border-white/5 pb-3">
                    <div>
                      <span className="text-orange-400 text-[9px] font-mono font-bold block uppercase tracking-wider">Thông số chi tiết Rack</span>
                      <h2 className="text-lg font-black text-cyan-400 flex items-center gap-2 uppercase">
                        {selectedRack.rackCode}
                        <button onClick={() => openCrudForm('RACK', 'EDIT', undefined, selectedRack)} className="text-slate-400 hover:text-cyan-400"><span className="material-symbols-outlined text-xs">edit</span></button>
                      </h2>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="space-y-2 my-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Danh sách các tầng khả dụng</h3>
                      <button onClick={() => openCrudForm('LEVEL', 'CREATE', selectedRack.rackId)} className="text-orange-400 hover:text-orange-300 text-xs font-bold flex items-center">+ Thêm tầng mới</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                      {levels.sort((a, b) => a.levelNumber - b.levelNumber).map((lvl) => (
                        <div
                          key={lvl.rackLevelId}
                          onClick={() => setSelectedLevel(lvl)}
                          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg cursor-pointer border transition-all flex items-center gap-2 shrink-0 ${selectedLevel?.rackLevelId === lvl.rackLevelId ? 'bg-orange-500 text-black border-orange-500' : 'bg-[#161f30] border-white/5 text-white'
                            }`}
                        >
                          {lvl.levelCode} [T{lvl.levelNumber}]
                          <span onClick={(e) => { e.stopPropagation(); handleDeleteNode('LEVEL', lvl.rackLevelId) }} className="hover:text-red-700 font-normal text-[11px]">✕</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 bg-white rounded-xl border border-cyan-500 p-4 flex flex-col overflow-hidden">
                    {selectedLevel ? (
                      <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 uppercase">Vị trí ô chứa (Bins) - {selectedLevel.levelCode}</h4>
                            <span className="text-[10px] text-slate-600 font-mono block">Chịu tải tối đa: {selectedLevel.maxWeightKg}kg | Cao: {selectedLevel.heightCm}cm</span>
                          </div>
                          <button onClick={() => openCrudForm('BIN', 'CREATE', selectedLevel.rackLevelId)} className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-black hover:bg-cyan-500 hover:text-black transition-all">+ Ô (Bin)</button>
                        </div>

                        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2.5 pr-1 content-start">
                          {bins.map((bin) => (
                            <div key={bin.binId} className="group/bin relative bg-[#182235] border border-white/5 p-3 rounded-lg hover:border-cyan-500/30 transition-colors">
                              <div className="absolute top-1 right-1 flex items-center opacity-0 group-hover/bin:opacity-100 transition-opacity">
                                <button onClick={() => openCrudForm('BIN', 'EDIT', selectedLevel.rackLevelId, bin)} className="text-slate-400 hover:text-white p-0.5"><span className="material-symbols-outlined text-xs">edit</span></button>
                                <button onClick={() => handleDeleteNode('BIN', bin.binId)} className="text-red-400 hover:text-red-300 p-0.5"><span className="material-symbols-outlined text-xs">delete</span></button>
                              </div>
                              <span className="text-xs font-mono font-black text-white block tracking-wide">{bin.binCode}</span>
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded uppercase font-bold">{bin.supportedBoxType}</span>
                                <span className={`text-[9px] px-1.5 rounded font-black ${bin.status === 'EMPTY' ? 'bg-emerald-500/10 text-emerald-400' :
                                    bin.status === 'FULL' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                                  }`}>{bin.status}</span>
                              </div>
                            </div>
                          ))}
                          {bins.length === 0 && (
                            <p className="col-span-full text-center text-xs text-slate-500 italic py-8">Tầng này hiện tại chưa phân rã hoặc chưa có vị trí chứa (Bins) nào.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs italic text-center p-4">Vui lòng chọn hoặc thêm mới một Tầng (Level) ở trên để truy xuất sơ đồ lưới ô chứa hàng (Bins).</div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic text-center">Hãy nhấp vào một dãy kệ (Rack) trên bản đồ để mở trung tâm quản lý thiết lập phân cấp chuyên sâu.</div>
              )}
            </div>
          )}
        </aside>

      </div>

      {alert.open && (
        <AlertModal
          title="Thông báo hệ thống"
          message={alert.message}
          type={alert.type}
          onConfirm={alert.onConfirm}
          onClose={() => setAlert({ ...alert, open: false })}
        />
      )}
    </div>
  )
}