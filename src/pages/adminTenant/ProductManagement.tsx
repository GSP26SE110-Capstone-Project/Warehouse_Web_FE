import { useState } from 'react'

import { Sku } from './Sku'
import { Collections } from './Collections'


type Tab = 'sku' | 'seasons & categories' | 'collections'

export const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState<Tab>('sku')

  return (
    <div className="flex max-w-screen overflow-hidden bg-slate-50 text-slate-800">
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center">

        <div className="absolute inset-0 bg-slate-50 backdrop-blur-sm" />

        <div className="relative z-10 p-6">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-8 mt-5 ">

            {/* TABS */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('sku')}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${activeTab === 'sku'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                SKU
              </button>


              <button
                onClick={() => setActiveTab('collections')}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${activeTab === 'collections'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                Bộ sưu tập
              </button>
            </div>

            {/* CONTENT */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {activeTab === 'sku' && (
                <Sku />
              )}

              {activeTab === 'collections' && (
                <Collections />
              )}


            </section>
          </div>
        </div>
      </main>
    </div>
  )
}