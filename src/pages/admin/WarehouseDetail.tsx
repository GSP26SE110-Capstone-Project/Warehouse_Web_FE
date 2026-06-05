import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import type { Warehouse as WarehouseType, Zone } from '../../types/Warehouse'
import { warehouses } from '../../types/Warehouse'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import * as warehousesApi from '../../api/warehouses'
import { warehouseToRow } from '../../mappers'

export const WarehouseDetailView: React.FC = () => {
    const { id } = useParams()
    const location = useLocation()


    const [warehouse, setWarehouse] = useState<WarehouseType | null>(
        location.state || null
    )

    const [zone, setZone] = useState<Zone | null>(null)

    const [selectedRackId, setSelectedRackId] = useState<string | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const [zoom, setZoom] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [start, setStart] = useState({ x: 0, y: 0 })

    useEffect(() => {
        if (!id) return
        if (warehouse) return

        let cancelled = false
        ;(async () => {
            try {
                const apiWh = await warehousesApi.getWarehouse(id)
                if (!cancelled) {
                    const row = warehouseToRow(apiWh)
                    const mockZones = warehouses.find((w) => w.warehouseId === id)?.zones ?? warehouses[0]?.zones ?? []
                    setWarehouse({ ...row, zones: mockZones })
                }
            } catch {
                const found = warehouses.find((w) => w.warehouseId === id)
                if (!cancelled && found) setWarehouse(found)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [id, warehouse])

    // load zone
    useEffect(() => {
        if (warehouse?.zones?.length) {
            setZone(warehouse.zones[0])
        }
    }, [warehouse])

    const selectedRack = zone?.racks.find(r => r.rackId === selectedRackId)

    const handleRackClick = (rackId: string) => {
        setSelectedRackId(rackId)
        setIsSidebarOpen(true)
    }

    const handleZoom = (delta: number) => {
        setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2))
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        setPosition({
            x: e.clientX - start.x,
            y: e.clientY - start.y,
        })
    }

    const handleMouseUp = () => setIsDragging(false)
const isLoading = !warehouse || !zone
    if (!warehouse || !zone) {
        return <>
            <LoadingOverlay show={isLoading} text="LOADING WAREHOUSE..." />

            <div className="flex h-screen w-full overflow-hidden bg-[#0b101a] text-white">
                {/* toàn bộ layout cũ giữ nguyên */}
            </div>
        </>
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#0b101a] text-white">

            {/* MAIN */}
            <main className={`relative flex flex-col ${isSidebarOpen ? 'mr-[420px]' : 'w-full'}`}>

                {/* HEADER */}
                <div className="absolute top-4 left-6 z-20">
                    <h1 className="text-xl font-bold">
                        {warehouse.warehouseName} ({warehouse.warehouseId})
                    </h1>
                    <p className="text-sm text-gray-400">{warehouse.address}</p>
                </div>

                {/* MAP */}
                <div
                    className={`flex-1 flex items-center justify-center overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={(e) => handleZoom(e.deltaY > 0 ? -0.1 : 0.1)}
                >
                    <div
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        }}
                    >
                        {/* GRID */}
                        <div className="flex flex-col gap-8 p-20">
                            {warehouse.zones.map((zone, zoneIndex) => {
                                const rackMap = new Map(
                                    zone.racks.map(r => [`${r.row}-${r.col}`, r])
                                )

                                return (
                                    <div key={zone.zoneId} className="flex items-start gap-6">

                                        {/* LABEL ZONE */}
                                        <div className="w-10 flex justify-center pt-2">
                                            <span className="text-xl font-bold text-cyan-400">
                                                {String.fromCharCode(65 + zoneIndex)}
                                            </span>
                                        </div>

                                        {/* GRID */}
                                        <div
                                            className="grid gap-3"
                                            style={{
                                                gridTemplateColumns: `repeat(${zone.cols}, 90px)`,
                                            }}
                                        >
                                            {Array.from({ length: zone.rows * zone.cols }).map((_, index) => {
                                                const r = Math.floor(index / zone.cols)
                                                const c = index % zone.cols
                                                const rack = rackMap.get(`${r}-${c}`)

                                                return (
                                                    <div
                                                        key={index}
                                                        className="border border-white/10 rounded-md flex items-center justify-center"
                                                    >
                                                        {rack ? (
                                                            <div
                                                                onClick={() => handleRackClick(rack.rackId)}
                                                                className={`w-full h-full p-1.5 rounded border flex flex-col justify-between cursor-pointer
                      ${selectedRackId === rack.rackId
                                                                        ? 'border-cyan-400 scale-105'
                                                                        : 'border-[#3a5555]'
                                                                    }
                    `}
                                                            >
                                                                {/* ID */}
                                                                <span className="text-[9px] text-center text-slate-300">
                                                                    {rack.rackId}
                                                                </span>

                                                                {/* SHELVES */}
                                                                <div className="flex-1 flex flex-col-reverse gap-[2px] py-1">
                                                                    {Array.from({ length: rack.shelves }).map((_, i) => {
                                                                        const hasItem = rack.items.length > i

                                                                        return (
                                                                            <div
                                                                                key={i}
                                                                                className={`h-5 flex items-center justify-center text-[8px] font-bold rounded
                              ${hasItem
                                                                                        ? 'bg-emerald-400 text-black'
                                                                                        : 'bg-gray-600/40 text-gray-500'
                                                                                    }
                            `}
                                                                            >
                                                                                {i + 1}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-white/10 text-xs">+</span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="absolute bottom-30 right-6 flex flex-col gap-2">
                    <button onClick={() => handleZoom(0.2)} className="size-10 bg-black/60 rounded">+</button>
                    <button onClick={() => handleZoom(-0.2)} className="size-10 bg-black/60 rounded">-</button>
                    <button onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }) }} className="size-10 bg-black/60 rounded">⦿</button>
                </div>
            </main>

            {/* SIDEBAR */}
            <aside className={`mt-20 fixed right-0 top-0 w-[420px] h-full bg-[#0b101a] border-l border-white/10 transition-transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedRack && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold">{selectedRack.rackId}</h2>
                                <p className="text-sm text-gray-400">{selectedRack.shelves} Levels</p>
                            </div>

                            <button onClick={() => setIsSidebarOpen(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="mt-4 space-y-2">
                            {selectedRack.items.length > 0 ? (
                                selectedRack.items.map(item => (
                                    <div key={`${item.sku}-${item.location}`} className="p-2 bg-white/5 rounded">
                                        {item.name} (x{item.stock})
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">Empty</p>
                            )}
                        </div>
                    </div>
                )}
            </aside>
        </div>
    )
}