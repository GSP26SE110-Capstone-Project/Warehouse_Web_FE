import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { WarehouseLayerId } from './warehouse3d/types'

const WarehouseScene3D = lazy(() => import('./warehouse3d/WarehouseScene3D'))

const LAYERS: {
  id: WarehouseLayerId
  icon: string
  title: string
  subtitle: string
  description: string
}[] = [
  {
    id: 'warehouse',
    icon: 'warehouse',
    title: 'Warehouse',
    subtitle: 'Toàn bộ tòa kho',
    description:
      'Một cơ sở vật lý tại thành phố / quận bạn chọn. Thuê nguyên kho nghĩa là toàn bộ diện tích này dành riêng cho doanh nghiệp bạn.',
  },
  {
    id: 'zone',
    icon: 'grid_view',
    title: 'Zone (Khu)',
    subtitle: 'Chia kho thành các khu chức năng',
    description:
      'Mỗi khu có loại riêng: linh hoạt (SHARED), hàng nhanh (FAST_MOVING), cao cấp (PREMIUM) hoặc riêng tư (PRIVATE). Thuê khu riêng = một zone dành cho bạn.',
  },
  {
    id: 'rack',
    icon: 'shelves',
    title: 'Rack (Kệ)',
    subtitle: 'Kệ đứng trong từng khu',
    description:
      'Kho bố trí kệ theo quy hoạch zone. Lưu hàng linh hoạt: kho chọn kệ/ngăn phù hợp — bạn trả theo lượng hàng thực tế, không cần giữ kệ cố định.',
  },
  {
    id: 'bin',
    icon: 'package_2',
    title: 'Bin (Ngăn / thùng)',
    subtitle: 'Đơn vị nhỏ nhất để đặt hàng',
    description:
      'Mỗi ngăn chứa LPN (mã kiện). Hệ thống theo dõi tồn theo bin — minh họa quy mô thực tế khi bạn gửi loại hàng + size trên form.',
  },
]

function SceneFallback() {
  return (
    <div className="flex h-full min-h-[280px] sm:min-h-[360px] flex-col items-center justify-center gap-3 text-[#9bb9bb]">
      <span className="material-symbols-outlined animate-pulse text-3xl text-[#06edf9]">view_in_ar</span>
      <p className="text-sm">Đang tải mô hình 3D…</p>
    </div>
  )
}

function ScenePanel({ layer }: { layer: WarehouseLayerId }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [shouldMount, setShouldMount] = useState(false)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setShouldMount(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldMount(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={hostRef}
      className="relative min-h-[280px] sm:min-h-[360px] bg-gradient-to-br from-[#0a1819] to-[#050b0b] overflow-hidden"
    >
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,237,249,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(6,237,249,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {shouldMount ? (
        <Suspense fallback={<SceneFallback />}>
          <WarehouseScene3D layer={layer} />
        </Suspense>
      ) : (
        <SceneFallback />
      )}

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 text-[10px] sm:text-xs text-[#9bb9bb]">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-[#06edf9]">360</span>
          Kéo để xoay · cuộn để zoom
        </span>
        <span className="text-right opacity-80">Three.js</span>
      </div>
    </div>
  )
}

/** Minh họa cấu trúc kho — scene Three.js (lazy + chỉ mount khi scroll tới). */
export function WarehouseStructureExplorer() {
  const [active, setActive] = useState<WarehouseLayerId>('warehouse')
  const layer = LAYERS.find((l) => l.id === active) ?? LAYERS[0]

  return (
    <div className="glass-panel rounded-2xl border-[#06edf9]/15 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/5">
          <p className="text-xs font-medium tracking-widest uppercase text-[#06edf9] mb-3">
            Khám phá cấu trúc
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Một kho trông như thế nào?
          </h3>
          <p className="text-sm text-[#9bb9bb] mb-6 leading-relaxed">
            NEXSPACE chia không gian theo 4 cấp — từ tòa kho đến từng ngăn hàng. Chọn từng lớp bên
            dưới; camera 3D sẽ zoom và highlight phần tương ứng.
          </p>

          <div className="space-y-2">
            {LAYERS.map((item) => {
              const selected = item.id === active
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  className={`w-full text-left rounded-xl px-4 py-3 border transition-all ${
                    selected
                      ? 'border-[#06edf9]/50 bg-[#06edf9]/10'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`material-symbols-outlined text-xl mt-0.5 ${
                        selected ? 'text-[#06edf9]' : 'text-[#9bb9bb]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <p className={`font-semibold ${selected ? 'text-white' : 'text-gray-200'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-[#9bb9bb] mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <p className="mt-5 text-sm text-[#9bb9bb] leading-relaxed border-t border-white/5 pt-4">
            {layer.description}
          </p>
        </div>

        <ScenePanel layer={active} />
      </div>
    </div>
  )
}
