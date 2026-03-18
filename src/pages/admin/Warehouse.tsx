import { useState } from 'react'
import { StatsCard } from '../../components/ui/StatCard'

type Warehouse = {
  warehouseId: string         // mã kho
  warehouseName: string       // tên kho
  address: string                // địa chỉ kho
  numberOfPallets: number            // số lượng pallet 
  lastUpdated: string         // thời gian cập nhật
}

const warehouses: Warehouse[] = [
  {
    warehouseId: 'W-1001',
    warehouseName: 'Kho A',
    address: '123 Đường ABC, Quận XYZ, TP. HCM',
    numberOfPallets: 25,
    lastUpdated: '10m ago',
  },
  {
    warehouseId: 'W-1002',
    warehouseName: 'Kho B',
    address: '456 Đường DEF, Quận UVW, TP. HCM',
    numberOfPallets: 0,
    lastUpdated: '30m ago',
  },
  {
    warehouseId: 'W-1003',
    warehouseName: 'Kho C',
    address: '789 Đường GHI, Quận RST, TP. HCM',
    numberOfPallets: 80,
    lastUpdated: '1h ago',
  },
  {
    warehouseId: 'W-1004',
    warehouseName: 'Kho D',
    address: '101 Đường JKL, Quận MNO, TP. HCM',
    numberOfPallets: 10,
    lastUpdated: '2h ago',
  },
  {
    warehouseId: 'W-1005',
    warehouseName: 'Kho E',
    address: '202 Đường MNO, Quận PQR, TP. HCM',
    numberOfPallets: 0,
    lastUpdated: '3h ago',

  },
]


export const Warehouse: React.FC = () => {
  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100 pb-15">
      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 z-0 bg-[#0b101a]/90 backdrop-blur-sm" />
        <div className="relative z-10 flex-1 p-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            <section className="glass-panel flex flex-col overflow-hidden rounded-xl border border-white/5 mt-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-5">
                <h3 className="text-2xl font-bold tracking-wide text-white">QUẢN LÝ KHO</h3>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a2333] px-4 py-2 text-sm text-slate-300 transition-all hover:border-white/20 hover:text-white">
                    <span className="material-symbols-outlined text-lg">filter_list</span>
                    <span>Lọc</span>
                  </button>
                  <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a2333] px-4 py-2 text-sm text-slate-300 transition-all hover:border-white/20 hover:text-white">
                    <span className="material-symbols-outlined text-lg">download</span>
                    <span>Xuất báo cáo</span>
                  </button>
                  <button className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold tracking-wide text-black shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40">
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span>TẠO KHO</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#131b29] text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4 font-medium">Mã kho</th>
                      <th className="px-6 py-4 font-medium">Tên kho</th>
                      <th className="px-6 py-4 text-center font-medium">Địa chỉ</th>
                      <th className="px-6 py-4 font-medium">Số lượng pallet</th>
                      <th className="px-6 py-4 text-center font-medium">Lần cuối cập nhật</th>
                      <th className="px-6 py-4 text-center font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {warehouses.map((item) => {
                      return (
                        <tr
                          key={item.warehouseId}
                          className="group cursor-pointer transition-colors hover:bg-white/5"
                        >
                          <td className="px-6 py-4 font-mono text-cyan-400">{item.warehouseId}</td>
                          <td className="px-6 py-4 font-medium text-white">{item.warehouseName}</td>
                          <td className="px-6 py-4  text-white">{item.address}</td>
                          <td className="px-6 py-4 text-center  text-white">{item.numberOfPallets}</td>
                          <td className="px-6 py-4 text-center text-white">{item.lastUpdated}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-60 transition-opacity group-hover:opacity-100">
                              <button className="rounded p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              <button className="rounded p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button className="rounded p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 bg-[#131b29] px-6 py-4">
                <p className="font-mono text-xs text-slate-400">
                  Showing <span className="text-white">1-5</span> of <span className="text-white">458</span> items
                </p>
                <div className="flex gap-2">
                  <button className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50">
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
                    1
                  </button>
                  <button className="rounded-md px-3 py-1 text-xs font-medium text-slate-400 hover:bg-white/5">
                    2
                  </button>
                  <button className="rounded-md px-3 py-1 text-xs font-medium text-slate-400 hover:bg-white/5">
                    3
                  </button>
                  <span className="px-2 py-1 text-xs text-slate-600">...</span>
                  <button className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}