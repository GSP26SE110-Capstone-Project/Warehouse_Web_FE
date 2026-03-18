import { useState } from 'react'

// --- Types ---
interface InventoryItem {
    id: string
    skuCode: string
    name: string
    quantity: number
    totalCapacity: number
    category: string
    status: 'In Stock' | 'Low Stock' | 'Critical' | 'Expiring'
    statusColor: 'emerald' | 'orange' | 'red' | 'yellow'
    imageUrl: string
    expiresIn?: string
}

interface Rack {
    rackId: string
    row: number
    col: number
    shelves: number
    status: 'healthy' | 'warning' | 'maintenance'
    occupancyPercentage: number
    capacity: string
    items: InventoryItem[]
    topBarColor: 'green' | 'orange' | 'gray'
}

interface Zone {
    zoneId: string
    zoneName: string
    subZone: string
    rows: number
    cols: number
    racks: Rack[]
}

// --- Sample Data ---
const mockZoneData: Zone = {
    zoneId: 'A-4',
    zoneName: 'Zone A-4',
    subZone: 'Cold Storage',
    rows: 3,
    cols: 4,
    racks: [
        {
            rackId: 'A-01',
            row: 0,
            col: 0,
            shelves: 3,
            status: 'healthy',
            occupancyPercentage: 80,
            capacity: 'Heavy',
            topBarColor: 'green',
            items: [
                { id: '1', skuCode: 'Q-P X7', name: 'Quantum Unit X7', quantity: 50, totalCapacity: 100, category: 'Electronics', status: 'In Stock', statusColor: 'emerald', imageUrl: '' },
                { id: '2', skuCode: 'CC-B', name: 'Cryo-Type B', quantity: 12, totalCapacity: 100, category: 'Coolant', status: 'Expiring', statusColor: 'orange', imageUrl: '', expiresIn: '12h' }
            ],
        },
        {
            rackId: 'A-02',
            row: 0,
            col: 1,
            shelves: 3,
            status: 'warning',
            occupancyPercentage: 40,
            capacity: 'Medium',
            topBarColor: 'orange',
            items: [],
        },
        {
            rackId: 'B-01',
            row: 1,
            col: 0,
            shelves: 3,
            status: 'healthy',
            occupancyPercentage: 20,
            capacity: 'Heavy',
            topBarColor: 'green',
            items: [
                { id: '3', skuCode: 'FOOD-1', name: 'Food Pack', quantity: 10, totalCapacity: 50, category: 'Food', status: 'Low Stock', statusColor: 'orange', imageUrl: '' }
            ],
        },
    ],
}

export const WarehouseDetailView: React.FC = () => {
    const [zone] = useState<Zone>(mockZoneData)
    const [selectedRackId, setSelectedRackId] = useState<string | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [start, setStart] = useState({ x: 0, y: 0 })

    const selectedRack = zone.racks.find(r => r.rackId === selectedRackId)

    // --- Handlers ---
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

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#0b101a] text-white">

            {/* MAIN */}
            <main className={`relative flex flex-col ${isSidebarOpen ? 'mr-[420px]' : 'w-full'}`}>

                {/* MAP */}
                <div
                    className={`flex-1 flex items-center justify-center overflow-hidden ${
                        isDragging ? 'cursor-grabbing' : 'cursor-grab'
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
                        <div
                            className="grid gap-6 p-20"
                            style={{
                                gridTemplateColumns: `repeat(${zone.cols}, 120px)`,
                                gridTemplateRows: `repeat(${zone.rows}, 160px)`,
                            }}
                        >
                            {Array.from({ length: zone.rows * zone.cols }).map((_, index) => {
                                const r = Math.floor(index / zone.cols)
                                const c = index % zone.cols
                                const rack = zone.racks.find(rk => rk.row === r && rk.col === c)

                                return (
                                    <div key={index} className="border border-white/5 rounded-lg flex items-center justify-center">
                                        {rack ? (
                                            <div
                                                onClick={() => handleRackClick(rack.rackId)}
                                                className={`group w-full h-full p-2 rounded border-2 flex flex-col justify-between cursor-pointer
                                                    ${selectedRackId === rack.rackId ? 'border-cyan-400 scale-105' : 'border-[#3a5555]'}
                                                `}
                                            >
                                                {/* Top bar */}
                                                <div className={`h-1 w-full ${rack.topBarColor === 'green' ? 'bg-emerald-500' : 'bg-orange-500'}`} />

                                                <span className="text-[10px]">{rack.rackId}</span>

                                                {/* 🔥 SHELVES BOX */}
                                                <div className="flex-1 flex flex-col-reverse gap-1 py-1">
                                                    {Array.from({ length: rack.shelves }).map((_, i) => {
                                                        const hasItem = rack.items.length > i

                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`flex items-center justify-center text-[9px] font-bold rounded border h-8 transition-all
                                                                    ${
                                                                        hasItem
                                                                            ? 'bg-emerald-400/90 text-black border-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.7)]'
                                                                            : 'bg-gray-700/40 text-gray-400 border-white/10'
                                                                    }
                                                                `}
                                                            >
                                                                L{i + 1}
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                {/* Progress */}
                                                <div className="w-full h-1 bg-black/40 rounded">
                                                    <div
                                                        className="h-full bg-cyan-400"
                                                        style={{ width: `${rack.occupancyPercentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-white/10">+</span>
                                        )}
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

            {/* HEADER + NÚT CLOSE */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold">{selectedRack.rackId}</h2>
                    <p className="text-sm text-gray-400">{selectedRack.shelves} Levels</p>
                </div>

                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="size-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-gray-400">close</span>
                </button>
            </div>

            {/* CONTENT */}
            <div className="mt-4 space-y-2">
                {selectedRack.items.length > 0 ? (
                    selectedRack.items.map(item => (
                        <div key={item.id} className="p-2 bg-white/5 rounded">
                            {item.name} (x{item.quantity})
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