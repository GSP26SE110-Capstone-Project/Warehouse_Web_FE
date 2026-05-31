import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Edges, Grid, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import type { WarehouseLayerId } from './types'

const BUILDING = { w: 20, d: 14, h: 5.5 }
const CYAN = '#06edf9'

const ZONES = [
  { id: 'A', x: -4.75, z: -3.5, w: 9, d: 6.2, color: '#06edf9' },
  { id: 'B', x: 4.75, z: -3.5, w: 9, d: 6.2, color: '#fbbf24' },
  { id: 'C', x: -4.75, z: 3.5, w: 9, d: 6.2, color: '#a78bfa' },
  { id: 'D', x: 4.75, z: 3.5, w: 9, d: 6.2, color: '#34d399' },
] as const

const FOCUS_ZONE = ZONES[0]
const RACK_SPOTS: [number, number, number][] = [
  [-6.8, 0, -5.2],
  [-4.75, 0, -3.5],
  [-2.7, 0, -1.8],
]

const CAMERA_PRESETS: Record<
  WarehouseLayerId,
  { position: THREE.Vector3; target: THREE.Vector3 }
> = {
  warehouse: {
    position: new THREE.Vector3(22, 16, 22),
    target: new THREE.Vector3(0, 2, 0),
  },
  zone: {
    position: new THREE.Vector3(16, 12, 16),
    target: new THREE.Vector3(0, 0.5, 0),
  },
  rack: {
    position: new THREE.Vector3(10, 7.5, 10),
    target: new THREE.Vector3(FOCUS_ZONE.x, 1.5, FOCUS_ZONE.z),
  },
  bin: {
    position: new THREE.Vector3(6, 4.5, 6),
    target: new THREE.Vector3(-4.75, 1.2, -3.5),
  },
}

function SceneNavigation({ layer }: { layer: WarehouseLayerId }) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const desiredPos = useRef(new THREE.Vector3())
  const desiredTarget = useRef(new THREE.Vector3())
  const transitioning = useRef(true)
  const preset = useMemo(() => CAMERA_PRESETS[layer], [layer])

  useEffect(() => {
    transitioning.current = true
    desiredPos.current.copy(preset.position)
    desiredTarget.current.copy(preset.target)
  }, [preset])

  useFrame((_, delta) => {
    if (!transitioning.current) return

    const t = 1 - Math.exp(-4 * delta)
    camera.position.lerp(desiredPos.current, t)
    const controls = controlsRef.current
    if (controls) {
      controls.target.lerp(desiredTarget.current, t)
      controls.update()
    } else {
      camera.lookAt(desiredTarget.current)
    }

    if (
      camera.position.distanceTo(desiredPos.current) < 0.08 &&
      (controls?.target.distanceTo(desiredTarget.current) ?? 0) < 0.08
    ) {
      transitioning.current = false
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={5}
      maxDistance={38}
      minPolarAngle={0.35}
      maxPolarAngle={Math.PI / 2.05}
      onStart={() => {
        transitioning.current = false
      }}
    />
  )
}

function WarehouseShell({ layer }: { layer: WarehouseLayerId }) {
  const highlight = layer === 'warehouse'
  const { w, d, h } = BUILDING

  return (
    <mesh position={[0, h / 2, 0]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color="#0a1819"
        transparent
        opacity={highlight ? 0.32 : 0.12}
        emissive={highlight ? CYAN : '#000000'}
        emissiveIntensity={highlight ? 0.35 : 0}
        metalness={0.2}
        roughness={0.85}
      />
      <Edges color={highlight ? CYAN : '#3a5455'} threshold={15} />
    </mesh>
  )
}

function ZoneTiles({ layer }: { layer: WarehouseLayerId }) {
  const zoneHighlight = layer === 'zone'

  return (
    <group>
      {ZONES.map((zone) => {
        const focusZone = layer === 'rack' || layer === 'bin'
        const isFocus = zone.id === FOCUS_ZONE.id
        const dimOthers = focusZone && !isFocus

        return (
          <mesh key={zone.id} position={[zone.x, 0.06, zone.z]} receiveShadow>
            <boxGeometry args={[zone.w, 0.12, zone.d]} />
            <meshStandardMaterial
              color={zone.color}
              transparent
              opacity={dimOthers ? 0.08 : zoneHighlight ? 0.55 : 0.22}
              emissive={zone.color}
              emissiveIntensity={zoneHighlight ? 0.45 : dimOthers ? 0.02 : 0.12}
              metalness={0.1}
              roughness={0.75}
            />
            {(zoneHighlight || (focusZone && isFocus)) && (
              <Edges color={zone.color} threshold={12} />
            )}
          </mesh>
        )
      })}
    </group>
  )
}

function RackUnit({
  position,
  highlight,
  showBins,
}: {
  position: [number, number, number]
  highlight: boolean
  showBins: boolean
}) {
  const rackW = 2.2
  const rackD = 1
  const rackH = 3.2
  const levels = 3

  const posts: [number, number, number][] = [
    [-rackW / 2, rackH / 2, rackD / 2],
    [rackW / 2, rackH / 2, rackD / 2],
    [-rackW / 2, rackH / 2, -rackD / 2],
    [rackW / 2, rackH / 2, -rackD / 2],
  ]

  return (
    <group position={position}>
      {posts.map((pos, i) => (
        <mesh key={`post-${i}`} position={pos} castShadow>
          <boxGeometry args={[0.08, rackH, 0.08]} />
          <meshStandardMaterial color="#526769" metalness={0.3} roughness={0.7} />
        </mesh>
      ))}

      {Array.from({ length: levels }).map((_, level) => (
        <mesh key={`shelf-${level}`} position={[0, 0.45 + level * 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[rackW, 0.07, rackD]} />
          <meshStandardMaterial
            color={highlight ? CYAN : '#3a5455'}
            emissive={highlight ? CYAN : '#000000'}
            emissiveIntensity={highlight ? 0.35 : 0}
            metalness={0.25}
            roughness={0.8}
          />
        </mesh>
      ))}

      {showBins &&
        Array.from({ length: levels }).flatMap((_, level) =>
          Array.from({ length: 4 }).map((__, col) => (
            <mesh
              key={`bin-${level}-${col}`}
              position={[-0.75 + col * 0.5, 0.62 + level * 1.05, 0]}
              castShadow
            >
              <boxGeometry args={[0.34, 0.26, 0.52]} />
              <meshStandardMaterial
                color={CYAN}
                emissive={CYAN}
                emissiveIntensity={0.55}
                metalness={0.15}
                roughness={0.55}
              />
            </mesh>
          ))
        )}
    </group>
  )
}

function Racks({ layer }: { layer: WarehouseLayerId }) {
  if (layer !== 'rack' && layer !== 'bin') return null

  return (
    <group>
      {RACK_SPOTS.map((pos, i) => (
        <RackUnit
          key={i}
          position={pos}
          highlight={layer === 'rack' || layer === 'bin'}
          showBins={layer === 'bin'}
        />
      ))}
    </group>
  )
}

function SceneContent({ layer }: { layer: WarehouseLayerId }) {
  return (
    <>
      <color attach="background" args={['#050b0b']} />
      <fog attach="fog" args={['#050b0b', 28, 55]} />

      <ambientLight intensity={0.45} />
      <directionalLight position={[12, 18, 8]} intensity={1.35} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-8, 6, -6]} intensity={0.35} color={CYAN} />
      <pointLight position={[8, 4, 8]} intensity={0.2} color="#a78bfa" />

      <SceneNavigation layer={layer} />

      <Grid
        args={[BUILDING.w, BUILDING.d]}
        cellSize={1}
        cellThickness={0.5}
        sectionSize={5}
        sectionThickness={1}
        fadeDistance={28}
        fadeStrength={1.2}
        position={[0, 0.01, 0]}
        cellColor="#1a3334"
        sectionColor="#06edf944"
      />

      <WarehouseShell layer={layer} />
      <ZoneTiles layer={layer} />
      <Racks layer={layer} />

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.45}
        scale={24}
        blur={2.5}
        far={12}
        color="#000000"
      />
    </>
  )
}

type Props = {
  layer: WarehouseLayerId
  className?: string
}

export default function WarehouseScene3D({ layer, className = '' }: Props) {
  return (
    <div className={`h-full w-full min-h-[280px] sm:min-h-[360px] ${className}`}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ fov: 42, near: 0.1, far: 80, position: [22, 16, 22] }}
      >
        <SceneContent layer={layer} />
      </Canvas>
    </div>
  )
}
