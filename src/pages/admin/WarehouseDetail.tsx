// // import { useState, useEffect } from 'react'
// // import { useParams, useLocation } from 'react-router-dom'
// // import type { Warehouse as WarehouseType, Zone } from '../../types/Warehouse'
// // import { warehouses } from '../../data/initialData'
// // import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
// // import { Link } from 'react-router-dom'

// // export const WarehouseDetailView: React.FC = () => {
// //     const { id } = useParams()
// //     const location = useLocation()


// //     const [warehouse, setWarehouse] = useState<WarehouseType | null>(
// //         location.state || null
// //     )

// //     const [zone, setZone] = useState<Zone | null>(null)

// //     const [selectedRackId, setSelectedRackId] = useState<string | null>(null)
// //     const [isSidebarOpen, setIsSidebarOpen] = useState(false)

// //     const [zoom, setZoom] = useState(1)
// //     const [position, setPosition] = useState({ x: 0, y: 0 })
// //     const [isDragging, setIsDragging] = useState(false)
// //     const [start, setStart] = useState({ x: 0, y: 0 })

// //     // fallback khi reload
// //     useEffect(() => {
// //         if (!warehouse) {
// //             const found = warehouses.find(w => w.warehouseId === id)
// //             if (found) setWarehouse(found)
// //         }
// //     }, [id])

// //     // load zone
// //     useEffect(() => {
// //         if (warehouse?.zones?.length) {
// //             setZone(warehouse.zones[0])
// //         }
// //     }, [warehouse])

// //     const selectedRack = zone?.racks.find(r => r.rackId === selectedRackId)

// //     const handleRackClick = (rackId: string) => {
// //         setSelectedRackId(rackId)
// //         setIsSidebarOpen(true)
// //     }

// //     const handleZoom = (delta: number) => {
// //         setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2))
// //     }

// //     const handleMouseDown = (e: React.MouseEvent) => {
// //         setIsDragging(true)
// //         setStart({
// //             x: e.clientX - position.x,
// //             y: e.clientY - position.y,
// //         })
// //     }

// //     const handleMouseMove = (e: React.MouseEvent) => {
// //         if (!isDragging) return
// //         setPosition({
// //             x: e.clientX - start.x,
// //             y: e.clientY - start.y,
// //         })
// //     }

// //     const handleMouseUp = () => setIsDragging(false)
// //     const isLoading = !warehouse || !zone
// //     if (!warehouse || !zone) {
// //         return <>
// //             <LoadingOverlay show={isLoading} text="LOADING WAREHOUSE..." />

// //             <div className="flex h-screen w-full overflow-hidden bg-[#0b101a] text-white">
// //             </div>
// //         </>
// //     }

// //     return (
// //         <div className="flex h-screen w-full overflow-hidden bg-[#0b101a] text-white">

// //             {/* MAIN */}
// //             <main className={`relative flex flex-col ${isSidebarOpen ? 'mr-[420px]' : 'w-full'}`}>
// //                 <Link
// //                     to="/admin/warehouse"
// //                     className="absolute top-8 left-4 z-20 flex items-center gap-2 px-4 py-1
// //                                 rounded-xl text-sm font-medium
// //                                 bg-gradient-to-r from-cyan-500/20 to-blue-500/20
// //                                 text-cyan-300 border border-cyan-400/20
// //                                 hover:from-cyan-500/30 hover:to-blue-500/30
// //                                 hover:text-white hover:border-cyan-300/40
// //                                 transition-all duration-200 shadow-md"
// //                                             >
// //                     <span className="text-lg">←</span>
// //                     <span>Back</span>
// //                 </Link>

// //                 {/* HEADER */}
// //                 <div className="absolute top-20 left-6 z-10">

// //                     <h1 className="text-xl font-bold">
// //                         {warehouse.warehouseName} ({warehouse.warehouseId})
// //                     </h1>
// //                     <p className="text-sm text-gray-400">{warehouse.address}</p>
// //                 </div>

// //                 {/* MAP */}
// //                 <div
// //                     className={`flex-1 flex items-center justify-center overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
// //                         }`}
// //                     onMouseDown={handleMouseDown}
// //                     onMouseMove={handleMouseMove}
// //                     onMouseUp={handleMouseUp}
// //                     onMouseLeave={handleMouseUp}
// //                     onWheel={(e) => handleZoom(e.deltaY > 0 ? -0.1 : 0.1)}
// //                 >
// //                     <div
// //                         style={{
// //                             transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
// //                         }}
// //                     >
// //                         {/* GRID */}
// //                         <div className="flex flex-col gap-8 p-20">
// //                             {warehouse.zones.map((zone, zoneIndex) => {
// //                                 const rackMap = new Map(
// //                                     zone.racks.map(r => [`${r.row}-${r.col}`, r])
// //                                 )

// //                                 return (
// //                                     <div key={zone.zoneId} className="flex items-start gap-6">

// //                                         {/* LABEL ZONE */}
// //                                         <div className="w-10 flex justify-center pt-2">
// //                                             <span className="text-xl font-bold text-cyan-400">
// //                                                 {String.fromCharCode(65 + zoneIndex)}
// //                                             </span>
// //                                         </div>

// //                                         {/* GRID */}
// //                                         <div
// //                                             className="grid gap-3"
// //                                             style={{
// //                                                 gridTemplateColumns: `repeat(${zone.cols}, 90px)`,
// //                                             }}
// //                                         >
// //                                             {Array.from({ length: zone.rows * zone.cols }).map((_, index) => {
// //                                                 const r = Math.floor(index / zone.cols)
// //                                                 const c = index % zone.cols
// //                                                 const rack = rackMap.get(`${r}-${c}`)

// //                                                 return (
// //                                                     <div
// //                                                         key={index}
// //                                                         className="border border-white/10 rounded-md flex items-center justify-center"
// //                                                     >
// //                                                         {rack ? (
// //                                                             <div
// //                                                                 onClick={() => handleRackClick(rack.rackId)}
// //                                                                 className={`w-full h-full p-1.5 rounded border flex flex-col justify-between cursor-pointer
// //                       ${selectedRackId === rack.rackId
// //                                                                         ? 'border-cyan-400 scale-105'
// //                                                                         : 'border-[#3a5555]'
// //                                                                     }
// //                     `}
// //                                                             >
// //                                                                 {/* ID */}
// //                                                                 <span className="text-[9px] text-center text-slate-300">
// //                                                                     {rack.rackId}
// //                                                                 </span>

// //                                                                 {/* SHELVES */}
// //                                                                 <div className="flex-1 flex flex-col-reverse gap-[2px] py-1">
// //                                                                     {Array.from({ length: rack.shelves }).map((_, i) => {
// //                                                                         const hasItem = rack.items.length > i

// //                                                                         return (
// //                                                                             <div
// //                                                                                 key={i}
// //                                                                                 className={`h-5 flex items-center justify-center text-[8px] font-bold rounded
// //                               ${hasItem
// //                                                                                         ? 'bg-emerald-400 text-black'
// //                                                                                         : 'bg-gray-600/40 text-gray-500'
// //                                                                                     }
// //                             `}
// //                                                                             >
// //                                                                                 {i + 1}
// //                                                                             </div>
// //                                                                         )
// //                                                                     })}
// //                                                                 </div>
// //                                                             </div>
// //                                                         ) : (
// //                                                             <span className="text-white/10 text-xs">+</span>
// //                                                         )}
// //                                                     </div>
// //                                                 )
// //                                             })}
// //                                         </div>
// //                                     </div>
// //                                 )
// //                             })}
// //                         </div>
// //                     </div>
// //                 </div>

// //                 {/* CONTROLS */}
// //                 <div className="absolute bottom-30 right-6 flex flex-col gap-2">
// //                     <button onClick={() => handleZoom(0.2)} className="size-10 bg-black/60 rounded">+</button>
// //                     <button onClick={() => handleZoom(-0.2)} className="size-10 bg-black/60 rounded">-</button>
// //                     <button onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }) }} className="size-10 bg-black/60 rounded">⦿</button>
// //                 </div>
// //             </main>

// //             {/* SIDEBAR */}
// //             <aside className={`mt-20 fixed right-0 top-0 w-[420px] h-full bg-[#0b101a] border-l border-white/10 transition-transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
// //                 {selectedRack && (
// //                     <div className="p-6">
// //                         <div className="flex justify-between items-center mb-4">
// //                             <div>
// //                                 <h2 className="text-xl font-bold">{selectedRack.rackId}</h2>
// //                                 <p className="text-sm text-gray-400">{selectedRack.shelves} Levels</p>
// //                             </div>

// //                             <button onClick={() => setIsSidebarOpen(false)}>
// //                                 ✕
// //                             </button>
// //                         </div>

// //                         <div className="mt-4 space-y-2">
// //                             {selectedRack.items.length > 0 ? (
// //                                 selectedRack.items.map(item => (
// //                                     <div key={item.sku} className="p-2 bg-white/5 rounded">
// //                                         {item.name} (x{item.total})
// //                                     </div>
// //                                 ))
// //                             ) : (
// //                                 <p className="text-gray-500">Empty</p>
// //                             )}
// //                         </div>
// //                     </div>
// //                 )}
// //             </aside>
// //         </div>
// //     )
// // }



// interface Level {
//     levelId: string;
//     levelNumber: number;
//     heightClearance: string;
// }

// interface Rack {
//     rackId: string;
//     rackCode: string;
//     zoneId: string;
//     levels: Level[]; // Chúng ta sẽ map levels vào đây sau khi fetch
// }

// interface Zone {
//     zoneId: string;
//     zoneCode: string;
//     zoneName: string;
//     racks: Rack[]; // Chúng ta sẽ map racks vào đây
// }

// interface Warehouse {
//     warehouseId: string;
//     warehouseName: string;
//     address: string;
//     zones: Zone[];
// }
// import { useState, useEffect } from 'react'
// import { useParams, Link } from 'react-router-dom'
// import { warehouseApi } from '../../service/warehouseApi'
// import { LoadingOverlay } from '../../components/ui/LoadingOverlay'

// export const WarehouseDetailView: React.FC = () => {
//     const { id } = useParams()
//     const [warehouse, setWarehouse] = useState<any>(null)
//     const [loading, setLoading] = useState(true)
    
//     // UI States
//     const [selectedRack, setSelectedRack] = useState<any>(null)
//     const [isSidebarOpen, setIsSidebarOpen] = useState(false)
//     const [zoom, setZoom] = useState(1)
//     const [position, setPosition] = useState({ x: 0, y: 0 })

//     useEffect(() => {
//     const fetchFullData = async () => {
//         if (!id) return;
//         try {
//             setLoading(true);
            
//             // 1. Lấy thông tin Warehouse
//             const whRes = await warehouseApi.getById(id);
//             const whData = whRes.data;

//             // 2. Lấy danh sách Zone (đảm bảo đúng tên hàm getZonesByWarehouseId)
//             const zonesRes = await warehouseApi.getZonesByWarehouseId(id);
//             // Kiểm tra nếu data là object { zones: [] } hoặc mảng []
//             const zonesRaw = Array.isArray(zonesRes.data) ? zonesRes.data : (zonesRes.data.zones || []);

//             // 3. Fetch đệ quy Racks và Levels
//             const fullZones = await Promise.all(zonesRaw.map(async (zone: any) => {
//                 try {
//                     const racksRes = await warehouseApi.getRacksByZone(zone.zoneId);
//                     const racksRaw = Array.isArray(racksRes.data) ? racksRes.data : (racksRes.data.racks || []);

//                     const racksWithLevels = await Promise.all(racksRaw.map(async (rack: any) => {
//                         try {
//                             const levelsRes = await warehouseApi.getLevelsByRack(rack.rackId);
//                             const levelsRaw = Array.isArray(levelsRes.data) ? levelsRes.data : (levelsRes.data.levels || []);
//                             return { ...rack, levels: levelsRaw };
//                         } catch {
//                             return { ...rack, levels: [] };
//                         }
//                     }));
//                     return { ...zone, racks: racksWithLevels };
//                 } catch {
//                     return { ...zone, racks: [] };
//                 }
//             }));

//             setWarehouse({ ...whData, zones: fullZones });
//         } catch (error) {
//             console.error("Lỗi tải sơ đồ kho:", error);
//         } finally {
//             setLoading(false);
//         }
//     };
//     fetchFullData();
// }, [id]);

//     const handleRackClick = (rack: any) => {
//         setSelectedRack(rack)
//         setIsSidebarOpen(true)
//     }

//     if (loading || !warehouse) return <LoadingOverlay show={true} text="ĐANG TẢI SƠ ĐỒ KHO..." />

//     return (
//         <div className="flex h-screen w-full overflow-hidden bg-[#0b101a] text-white">
//             <main className={`relative flex flex-col transition-all duration-300 ${isSidebarOpen ? 'mr-[420px]' : 'w-full'}`}>
//                 {/* Back Button & Header */}
//                 <div className="absolute top-8 left-6 z-10">
//                     <Link to="/admin/warehouse" className="text-cyan-400 hover:underline flex items-center gap-2 mb-4">
//                         ← Quay lại danh sách
//                     </Link>
//                     <h1 className="text-2xl font-bold text-white">{warehouse.warehouseName}</h1>
//                     <p className="text-slate-400 text-sm">{warehouse.address}</p>
//                 </div>

//                 {/* SƠ ĐỒ (MAP) */}
//                 <div 
//                     className="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
//                     onWheel={(e) => setZoom(prev => Math.min(Math.max(prev + (e.deltaY > 0 ? -0.1 : 0.1), 0.5), 2))}
//                 >
//                     <div style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})` }} className="transition-transform duration-75">
//                         <div className="flex flex-col gap-16 p-20">
//                             {warehouse.zones?.map((zone: any) => (
//                                 <div key={zone.zoneId} className="border border-white/5 bg-white/[0.02] p-8 rounded-3xl relative">
//                                     {/* Tên Zone */}
//                                     <div className="absolute -top-4 left-8 bg-cyan-500 text-black px-4 py-1 rounded-full font-bold">
//                                         Zone {zone.zoneCode}
//                                     </div>

//                                     {/* GRID RACKS TRONG ZONE */}
//                                     <div className="grid grid-cols-4 gap-6"> 
//                                         {zone.racks?.map((rack: any) => (
//                                             <div 
//                                                 key={rack.rackId}
//                                                 onClick={() => handleRackClick(rack)}
//                                                 className={`group relative w-32 cursor-pointer transition-all hover:scale-105 ${
//                                                     selectedRack?.rackId === rack.rackId ? 'ring-2 ring-cyan-400' : ''
//                                                 }`}
//                                             >
//                                                 {/* Vẽ Rack với 3 Level */}
//                                                 <div className="bg-[#1a2333] border border-slate-700 rounded-lg p-2 shadow-xl">
//                                                     <div className="text-[10px] text-slate-500 mb-2 text-center font-mono">
//                                                         {rack.rackCode}
//                                                     </div>
                                                    
//                                                     {/* Levels hiển thị từ cao xuống thấp hoặc thấp lên cao */}
//                                                     <div className="flex flex-col-reverse gap-1.5">
//                                                         {rack.levels?.sort((a: any, b: any) => a.levelNumber - b.levelNumber).map((level: any) => (
//                                                             <div 
//                                                                 key={level.levelId}
//                                                                 className="h-8 bg-emerald-500/20 border border-emerald-500/40 rounded flex items-center justify-center text-[10px] text-emerald-300 font-bold group-hover:bg-emerald-500/40"
//                                                             >
//                                                                 Lvl {level.levelNumber}
//                                                             </div>
//                                                         ))}
//                                                         {/* Nếu chưa đủ 3 level thì render ô trống */}
//                                                         {Array.from({ length: Math.max(0, 3 - (rack.levels?.length || 0)) }).map((_, i) => (
//                                                             <div key={i} className="h-8 border border-dashed border-slate-700 rounded opacity-30" />
//                                                         ))}
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//             </main>

//             {/* SIDEBAR CHI TIẾT RACK */}
//             <aside className={`fixed right-0 top-0 w-[420px] h-full bg-[#0d1421] border-l border-white/10 p-6 transition-transform duration-300 z-30 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
//                 {selectedRack && (
//                     <div className="space-y-6 mt-16">
//                         <div className="flex justify-between items-start">
//                             <div>
//                                 <h2 className="text-2xl font-bold text-cyan-400">Rack: {selectedRack.rackCode}</h2>
//                                 <p className="text-slate-400 italic">ID: {selectedRack.rackId}</p>
//                             </div>
//                             <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-full">✕</button>
//                         </div>

//                         <div className="grid grid-cols-2 gap-4">
//                             <div className="bg-white/5 p-3 rounded-lg">
//                                 <p className="text-xs text-slate-500 uppercase">Sức chứa tối đa</p>
//                                 <p className="text-lg font-semibold">{selectedRack.maxWeightCapacity} kg</p>
//                             </div>
//                             <div className="bg-white/5 p-3 rounded-lg">
//                                 <p className="text-xs text-slate-500 uppercase">Kích thước (LxWxH)</p>
//                                 <p className="text-sm font-semibold">{selectedRack.length}x{selectedRack.width}x{selectedRack.height}</p>
//                             </div>
//                         </div>

//                         <div className="space-y-3">
//                             <h3 className="text-sm font-bold text-slate-300 uppercase">Danh sách Levels</h3>
//                             {selectedRack.levels?.map((level: any) => (
//                                 <div key={level.levelId} className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
//                                     <div className="flex items-center gap-3">
//                                         <div className="size-8 bg-emerald-500 text-black rounded-lg flex items-center justify-center font-bold">
//                                             {level.levelNumber}
//                                         </div>
//                                         <div>
//                                             <p className="font-bold">Tầng {level.levelNumber}</p>
//                                             <p className="text-[10px] text-slate-400">Tải trọng tối đa: {level.maxWeight}kg</p>
//                                         </div>
//                                     </div>
//                                     <span className="text-xs text-emerald-400 font-mono">{level.levelId}</span>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}
//             </aside>
//         </div>
//     )
// }

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { warehouseApi } from '../../service/warehouseApi' // Đảm bảo api này có method getHierarchy
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'

export const WarehouseDetailView: React.FC = () => {
    const { id } = useParams()
    const [warehouse, setWarehouse] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    
    // UI States
    const [selectedRack, setSelectedRack] = useState<any>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const fetchAndFilterData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                // 1. Gọi API lấy toàn bộ cấu trúc hierarchy
                const response = await warehouseApi.getHierarchy();
                const branches = response.data.branches || [];

                // 2. Tìm warehouse có ID trùng với params trong tất cả các branches
                let foundWarehouse = null;
                for (const branch of branches) {
                    const wh = branch.warehouses.find((w: any) => w.warehouseId === id);
                    if (wh) {
                        foundWarehouse = wh;
                        break;
                    }
                }

                if (foundWarehouse) {
                    setWarehouse(foundWarehouse);
                } else {
                    console.error("Không tìm thấy kho với ID:", id);
                }
            } catch (error) {
                console.error("Lỗi tải sơ đồ kho:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndFilterData();
    }, [id]);

    const handleRackClick = (rack: any) => {
        setSelectedRack(rack)
        setIsSidebarOpen(true)
    }

    const handleZoom = (delta: number) => {
        setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2))
    }

    if (loading) return <LoadingOverlay show={true} text="ĐANG TẢI SƠ ĐỒ KHO..." />
    if (!warehouse) return <div className="text-white p-10">Không tìm thấy dữ liệu kho.</div>

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#0b101a] text-white">
            <main className={`relative flex flex-col transition-all duration-300 ${isSidebarOpen ? 'mr-[420px]' : 'w-full'}`}>
                
                {/* HEADER & BACK BUTTON */}
                <div className="absolute top-8 left-6 z-10 bg-[#0b101a]/80 p-4 rounded-xl backdrop-blur-md border border-white/5">
                    <Link to="/admin/warehouse" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 mb-2 transition-colors">
                        <span className="text-xl">←</span> Quay lại danh sách
                    </Link>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight">{warehouse.warehouseName}</h1>
                    <div className="flex gap-4 mt-1">
                        <p className="text-slate-400 text-sm">📍 {warehouse.district}</p>
                        <p className="text-slate-400 text-sm">📏 Diện tích: {warehouse.totalArea} m²</p>
                    </div>
                </div>

                {/* CONTROLS (Floating) */}
                <div className="absolute bottom-10 left-6 z-10 flex flex-col gap-2">
                    <button onClick={() => handleZoom(0.2)} className="size-10 bg-slate-800 border border-white/10 rounded-lg hover:bg-slate-700 transition-colors">+</button>
                    <button onClick={() => handleZoom(-0.2)} className="size-10 bg-slate-800 border border-white/10 rounded-lg hover:bg-slate-700 transition-colors">-</button>
                    <button onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }) }} className="size-10 bg-cyan-600 border border-white/10 rounded-lg hover:bg-cyan-500 transition-colors">⦿</button>
                </div>

                {/* MAP AREA */}
                <div 
                    className="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
                    onWheel={(e) => handleZoom(e.deltaY > 0 ? -0.1 : 0.1)}
                >
                    <div 
                        style={{ 
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        }} 
                        className="transition-transform duration-150 ease-out"
                    >
                        <div className="flex flex-col gap-16 p-32">
                            {warehouse.zones?.map((zone: any) => (
                                <div key={zone.zoneId} className="border border-white/10 bg-white/[0.03] p-10 rounded-[2rem] relative min-w-[600px]">
                                    {/* Zone Label */}
                                    <div className="absolute -top-5 left-10 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-1.5 rounded-full font-black shadow-lg shadow-cyan-500/20">
                                        ZONE {zone.zoneCode}
                                    </div>

                                    {/* RACKS GRID */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8"> 
                                        {zone.racks?.length > 0 ? zone.racks.map((rack: any) => (
                                            <div 
                                                key={rack.rackId}
                                                onClick={() => handleRackClick(rack)}
                                                className={`group relative w-36 cursor-pointer transition-all duration-300 hover:scale-110 ${
                                                    selectedRack?.rackId === rack.rackId ? 'ring-2 ring-cyan-400 ring-offset-4 ring-offset-[#0b101a]' : ''
                                                }`}
                                            >
                                                <div className="bg-[#161e2d] border border-slate-700 rounded-xl p-3 shadow-2xl">
                                                    <div className="text-[10px] text-cyan-400/70 mb-2 text-center font-mono font-bold">
                                                        {rack.rackCode}
                                                    </div>
                                                    
                                                    {/* Levels Visualizer */}
                                                    <div className="flex flex-col-reverse gap-1.5">
                                                        {/* Lấy 3 levels cao nhất hoặc hiển thị đủ theo data */}
                                                        {rack.levels?.length > 0 ? (
                                                            rack.levels.sort((a: any, b: any) => a.levelNumber - b.levelNumber).map((level: any) => (
                                                                <div 
                                                                    key={level.levelId}
                                                                    className="h-7 bg-emerald-500/20 border border-emerald-500/40 rounded-md flex items-center justify-center text-[9px] text-emerald-300 font-bold group-hover:bg-emerald-500/40 transition-colors"
                                                                >
                                                                    LVL {level.levelNumber}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="h-20 flex items-center justify-center border border-dashed border-slate-700 rounded-md text-[10px] text-slate-500">
                                                                Trống
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-full py-10 text-center text-slate-600 italic">
                                                Khu vực này chưa bố trí kệ hàng
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* SIDEBAR DETAIL */}
            <aside className={`fixed right-0 top-0 w-[420px] h-full bg-[#0d1421] border-l border-white/10 p-8 transition-transform duration-500 ease-in-out z-30 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedRack && (
                    <div className="space-y-8 mt-12">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-1">Rack Detail</div>
                                <h2 className="text-3xl font-black text-white">{selectedRack.rackCode}</h2>
                                <p className="text-slate-500 font-mono text-sm">{selectedRack.rackId}</p>
                            </div>
                            <button 
                                onClick={() => setIsSidebarOpen(false)} 
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Tải trọng tối đa</p>
                                <p className="text-xl font-semibold text-emerald-400">{selectedRack.maxWeightCapacity} <span className="text-xs text-slate-400">kg</span></p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Kích thước</p>
                                <p className="text-sm font-semibold">{selectedRack.length}m x {selectedRack.width}m</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-tighter">Cấu trúc tầng ({selectedRack.levels?.length || 0})</h3>
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {selectedRack.levels?.sort((a: any, b: any) => b.levelNumber - a.levelNumber).map((level: any) => (
                                    <div key={level.levelId} className="group flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-cyan-500/50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center font-black group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                                                {level.levelNumber}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-200">Tầng {level.levelNumber}</p>
                                                <p className="text-[10px] text-slate-500 uppercase">Sức chứa: {level.maxWeight}kg</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-600 block font-mono">{level.levelId}</span>
                                            <span className="text-[10px] text-emerald-500/70 font-bold">● Khả dụng</span>
                                        </div>
                                    </div>
                                ))}
                                {(!selectedRack.levels || selectedRack.levels.length === 0) && (
                                    <p className="text-slate-500 italic text-sm py-4">Kệ này chưa được chia tầng.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </div>
    )
}