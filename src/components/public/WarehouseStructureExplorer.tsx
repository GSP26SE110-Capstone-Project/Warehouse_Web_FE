import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { DEMO_ZONES, describeZoneLpnCapacity, type DemoZone3D } from './warehouse3d/demoZones'
import WarehouseScene2DFallback from './warehouse3d/WarehouseScene2DFallback'
import { SceneErrorBoundary } from './warehouse3d/SceneErrorBoundary'
import { isWebGLAvailable } from './warehouse3d/webglSupport'

const WarehouseScene3D = lazy(() => import('./warehouse3d/WarehouseScene3D'))

import type { WarehouseLayerId } from './warehouse3d/types'

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
      'Mỗi khu có loại riêng: Chia sẻ, Premium hoặc Khu riêng. Click vào từng khu trên mô hình 3D để xem loại thùng LPN lớn nhất có thể dùng.',
  },
  {
    id: 'rack',
    icon: 'shelves',
    title: 'Rack (Kệ)',
    subtitle: 'Kệ đứng trong từng khu',
    description:
      'Camera zoom vào khu demo — hiển thị khung kệ và các tầng (rack level). Mỗi kệ có nhiều tầng ngang để xếp hàng.',
  },
  {
    id: 'bin',
    icon: 'package_2',
    title: 'Bin (Ngăn / thùng)',
    subtitle: 'Đơn vị nhỏ nhất trên từng tầng kệ',
    description:
      'Zoom sát hơn — các khối cyan là ngăn (bin) trên từng rack level. Mỗi ngăn có thể chứa LPN (mã kiện).',
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

function ZoneInfoPanel({ zone }: { zone: DemoZone3D }) {
  const capacity = describeZoneLpnCapacity(zone.zoneType)

  return (
    <div className="mt-4 rounded-xl border border-[#06edf9]/35 bg-[#06edf9]/10 px-4 py-3 text-sm">
      <p className="font-semibold text-white">
        Khu {zone.id} · {zone.title}
      </p>
      <p className="mt-2 text-[#9bb9bb] leading-relaxed">
        Bin mặc định: <strong className="text-white">{capacity.binVolume} volume</strong>
        {' · '}
        LPN lớn nhất:{' '}
        <strong className="text-[#06edf9]">{capacity.maxBoxTypeLabel}</strong>
      </p>
      <p className="mt-2 text-xs text-[#9bb9bb]/90 leading-relaxed">{capacity.note}</p>
    </div>
  )
}

function ScenePanel({
  layer,
  selectedZoneId,
  onZoneSelect,
}: {
  layer: WarehouseLayerId
  selectedZoneId?: string | null
  onZoneSelect?: (zone: DemoZone3D) => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [renderMode, setRenderMode] = useState<'idle' | 'webgl' | 'fallback'>('idle')
  const [webglRuntimeFailed, setWebglRuntimeFailed] = useState(false)
  const [canvasKey, setCanvasKey] = useState(0)

  const activateScene = () => {
    setRenderMode(isWebGLAvailable() ? 'webgl' : 'fallback')
  }

  const retryWebGL = () => {
    setWebglRuntimeFailed(false)
    setRenderMode('idle')
    setCanvasKey((key) => key + 1)
    window.requestAnimationFrame(() => activateScene())
  }

  useEffect(() => {
    const el = hostRef.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      activateScene()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          activateScene()
          observer.disconnect()
        }
      },
      { rootMargin: '120px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (renderMode !== 'webgl') return

    const onRejection = (event: PromiseRejectionEvent) => {
      const message = String(event.reason?.message ?? event.reason ?? '')
      if (/webgl/i.test(message)) {
        event.preventDefault()
        setWebglRuntimeFailed(true)
      }
    }

    window.addEventListener('unhandledrejection', onRejection)
    return () => window.removeEventListener('unhandledrejection', onRejection)
  }, [renderMode])

  const sceneProps = { layer, selectedZoneId, onZoneSelect }
  const useFallback = renderMode === 'fallback' || webglRuntimeFailed

  return (
    <div
      ref={hostRef}
      className="relative min-h-[280px] sm:min-h-[360px] bg-gradient-to-br from-[#0a1819] to-[#050b0b] overflow-hidden"
    >
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,237,249,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(6,237,249,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {renderMode === 'idle' && <SceneFallback />}

      {useFallback && renderMode !== 'idle' && (
        <WarehouseScene2DFallback
          {...sceneProps}
          reason={webglRuntimeFailed ? 'error' : 'unsupported'}
          onRetry3D={retryWebGL}
        />
      )}

      {renderMode === 'webgl' && !webglRuntimeFailed && (
        <SceneErrorBoundary
          fallback={
            <WarehouseScene2DFallback
              {...sceneProps}
              reason="error"
              onRetry3D={retryWebGL}
            />
          }
          onError={() => setWebglRuntimeFailed(true)}
        >
          <Suspense fallback={<SceneFallback />}>
            <WarehouseScene3D key={canvasKey} {...sceneProps} />
          </Suspense>
        </SceneErrorBoundary>
      )}

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 text-[10px] sm:text-xs text-[#9bb9bb]">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-[#06edf9]">360</span>
          Kéo để xoay · cuộn để zoom
        </span>
        <span className="text-right opacity-80">
          {useFallback && renderMode !== 'idle' ? 'Sơ đồ 2D' : 'Three.js'}
        </span>
      </div>
    </div>
  )
}

/** Minh họa cấu trúc kho — scene Three.js (lazy + chỉ mount khi scroll tới). */
export function WarehouseStructureExplorer() {
  const [active, setActive] = useState<WarehouseLayerId>('warehouse')
  const [selectedZone, setSelectedZone] = useState<DemoZone3D | null>(null)
  const layer = LAYERS.find((l) => l.id === active) ?? LAYERS[0]

  useEffect(() => {
    if (active !== 'warehouse' && active !== 'zone') {
      setSelectedZone(null)
    }
  }, [active])

  const handleLayerChange = (id: WarehouseLayerId) => {
    setActive(id)
    if (id !== 'warehouse' && id !== 'zone') {
      setSelectedZone(null)
    }
  }

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
            NEXSPACE chia không gian theo 4 cấp — từ tòa kho đến từng ngăn trên kệ. Chọn từng lớp
            bên dưới; camera 3D sẽ zoom và highlight rack, rack level và bin tương ứng.
          </p>

          <div className="space-y-2">
            {LAYERS.map((item) => {
              const selected = item.id === active
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLayerChange(item.id)}
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

          {selectedZone && (active === 'zone' || active === 'warehouse') && (
            <ZoneInfoPanel zone={selectedZone} />
          )}

          {(active === 'zone' || active === 'warehouse') && !selectedZone && (
            <p className="mt-4 text-xs text-[#6b8586]">
              💡 Click một khu trên mô hình 3D bên phải để xem giới hạn loại thùng LPN.
            </p>
          )}

          {(active === 'rack' || active === 'bin') && (
            <p className="mt-4 text-xs text-[#6b8586]">
              {active === 'rack'
                ? '💡 Các tầng ngang trên kệ là rack level — chọn Bin để xem ngăn hàng trên từng tầng.'
                : '💡 Các khối cyan là bin — mỗi bin nằm trên một rack level.'}
            </p>
          )}

          {(active === 'zone' || active === 'warehouse') && (
            <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#06edf9]/80">
                Bản đồ khu (demo)
              </p>
              {DEMO_ZONES.map((zone) => {
                const cap = describeZoneLpnCapacity(zone.zoneType)
                const picked = selectedZone?.id === zone.id
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      picked
                        ? 'border-[#06edf9]/40 bg-[#06edf9]/10'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-gray-200">
                        Khu {zone.id} · {zone.title}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium text-[#9bb9bb]">{cap.maxBoxTypeLabel}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <ScenePanel
          layer={active}
          selectedZoneId={selectedZone?.id}
          onZoneSelect={setSelectedZone}
        />
      </div>
    </div>
  )
}
