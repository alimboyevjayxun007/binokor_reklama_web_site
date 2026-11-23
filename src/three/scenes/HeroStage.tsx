import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { CATALOG } from "../catalog";
import { Glow, Shadowed, ShadowCatcher, Studio } from "./Studio";
import { Amount, clamp, easeInOut, easeOut, lerp, range, store } from "../store";
import { arc } from "../models/helpers";

const GROUND = -1.6;
/** height of each model's top above its floor (model units, before scale) at progress 0 */
const TOP = [1.02, 1.05, 0.5, 0.42, 0.16, 1.0, 0.68, 0.12, 0.3];

/* the delivered heap: loose, overlapping, turned every which way (relative to heap centre) */
const PILE: { x: number; z: number; r: number; tilt: number }[] = [
  { x: 1.75, z: 0.35, r: -0.35, tilt: 0 }, // g'isht
  { x: -0.25, z: -0.15, r: 0.2, tilt: 0 }, // sement
  { x: 0.25, z: 1.35, r: -0.45, tilt: 0.04 }, // armatura
  { x: 2.45, z: -1.0, r: 0.45, tilt: 0 }, // gazoblok
  { x: -1.85, z: 1.35, r: 0.6, tilt: 0.06 }, // kafel
  { x: 1.15, z: 1.65, r: 0.1, tilt: 0 }, // bo'yoq
  { x: 0.55, z: -1.5, r: 0.25, tilt: 0 }, // quvur
  { x: -1.4, z: 0.55, r: 1.05, tilt: 0.05 }, // yog'och
  { x: -1.55, z: -1.35, r: 0.55, tilt: 0.03 }, // profnastil
];

/* catalogue grid: long goods in the back row, packed goods in front */
const GRID_DESKTOP: { x: number; z: number }[] = [
  { x: -4.1, z: 1.3 }, { x: -2.05, z: 1.3 }, { x: -1.15, z: -1.7 }, { x: 0, z: 1.3 },
  { x: 2.05, z: 1.3 }, { x: 4.1, z: 1.3 }, { x: 1.15, z: -1.7 }, { x: 3.45, z: -1.7 }, { x: -3.45, z: -1.7 },
];
const GRID_PHONE: { x: number; z: number }[] = [
  { x: -1.55, z: 1.5 }, { x: 0, z: 1.5 }, { x: 1.55, z: 0 }, { x: 1.55, z: 1.5 },
  { x: -1.55, z: 0 }, { x: 0, z: 0 }, { x: 0, z: -1.5 }, { x: 1.55, z: -1.5 }, { x: -1.55, z: -1.5 },
];

/**
 * Hero: a delivery dumped in a heap → a scanner beam passes and every item
 * gets its tag → items are carried into a tidy catalogue grid → the grid
 * slides off to the left, into the product track.
 */
export default function HeroStage({ tags }: { tags: MutableRefObject<(HTMLElement | null)[]> }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const beam = useRef<THREE.Group>(null);
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const s = useRef({ stage: 0, intro: 0, px: 0, py: 0, seen: CATALOG.map(() => 0) });
  const { size } = useThree();
  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const tmpB = useMemo(() => new THREE.Vector3(), []);
  const proj = useMemo(() => new THREE.Vector3(), []);
  const still = useMemo<Amount[]>(() => CATALOG.map(() => ({ current: 0 })), []);

  useFrame((state, delta) => {
    const st = s.current;
    st.stage = lerp(st.stage, store.stage, 1 - Math.exp(-delta * 7));
    st.intro = lerp(st.intro, store.intro, 1 - Math.exp(-delta * 6));
    st.px = lerp(st.px, store.pointer.x, 1 - Math.exp(-delta * 3));
    st.py = lerp(st.py, store.pointer.y, 1 - Math.exp(-delta * 3));

    const narrow = size.width / size.height < 1;
    const heapX = narrow ? 0 : 2.5;
    const heapZ = narrow ? 0.6 : 0;
    const heapScale = narrow ? 0.62 : 1;
    const grid = narrow ? GRID_PHONE : GRID_DESKTOP;
    const gridScale = narrow ? 0.8 : 1;

    const scan = range(st.stage, 0.14, 0.46);
    const organize = range(st.stage, 0.5, 0.84);
    const exit = easeInOut(range(st.stage, 0.9, 1));

    // scanner beam sweeps the heap from left to right
    const minX = heapX - 3.0 * heapScale;
    const maxX = heapX + 3.2 * heapScale;
    const beamX = lerp(minX, maxX, easeInOut(scan));
    if (beam.current) {
      beam.current.position.set(beamX, GROUND, heapZ);
      const vis = scan > 0 && scan < 1 ? Math.sin(Math.PI * scan) : 0;
      beam.current.visible = vis > 0.01;
      beam.current.scale.set(1, Math.min(1, vis * 3), heapScale);
    }

    CATALOG.forEach((m, i) => {
      const g = groups.current[i];
      if (!g) return;
      const pile = PILE[i];
      const sc = m.heroScale * heapScale;

      // intro: the heap is set down (items drop in, staggered)
      const intro = easeOut(range(st.intro, i * 0.06, i * 0.06 + 0.5));
      const px = heapX + pile.x * heapScale;
      const pz = heapZ + pile.z * heapScale;
      const floorY = GROUND + 0.62 * sc;

      // the item under the scanner shows its tag; it hops slightly as the beam passes
      const near = scan > 0 && scan < 1 ? clamp(1 - Math.abs(beamX - px) / (1.1 * heapScale)) : 0;
      st.seen[i] = lerp(st.seen[i], near > 0.05 ? 1 : 0, 1 - Math.exp(-delta * 9));
      const hop = Math.sin(Math.PI * clamp((beamX - (px - 0.3)) / 0.9)) * 0.18 * (scan > 0 && scan < 1 ? 1 : 0);

      tmpA.set(px, floorY + (1 - intro) * 3.5 + hop, pz);

      // organise: carried to its slot in the catalogue grid
      const t = easeInOut(clamp(organize * 1.5 - i * 0.055));
      const gs = grid[i];
      const gsc = m.heroScale * gridScale;
      tmpB.set(gs.x * gridScale - exit * 16, GROUND + 0.62 * gsc, gs.z * gridScale);
      arc(g.position, tmpA, tmpB, t, 0.9);
      g.rotation.set(pile.tilt * (1 - t), lerp(pile.r, 0.3, t), pile.tilt * 0.6 * (1 - t));
      g.scale.setScalar(lerp(sc, gsc, t) * (0.6 + 0.4 * intro));

      // tag follows the item, appears once it has been scanned
      const tag = tags.current[i];
      if (tag) {
        proj.set(g.position.x, g.position.y + (TOP[i] - 0.62) * g.scale.x + 0.2, g.position.z);
        proj.project(state.camera);
        const x = (proj.x * 0.5 + 0.5) * size.width;
        const y = (-proj.y * 0.5 + 0.5) * size.height;
        // after the scan, every tag comes back once its item is set down in the grid (desktop only)
        const placed = narrow ? 0 : clamp((t - 0.85) / 0.15);
        const o = Math.max(st.seen[i] * (organize > 0 ? 0 : 1), placed) * (1 - exit);
        tag.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
        tag.style.opacity = o.toFixed(3);
      }
    });

    if (cam.current) {
      cam.current.position.set(st.px * 0.4, 2.9 + st.py * 0.2, narrow ? 16 : 12.5);
      cam.current.lookAt(0, narrow ? 1.1 : -0.55, 0);
    }
    void still;
  });

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={30} position={[0, 2.9, 12.5]} near={0.1} far={80} />
      <Studio shadowSize={8} keyPosition={[6, 10, 7]} />
      <Glow position={[0, 0.5, -14]} size={[46, 30]} opacity={0.6} />
      <ShadowCatcher y={GROUND} size={40} opacity={0.38} />
      <Shadowed>
        {CATALOG.map((m, i) => (
          <group key={m.id} ref={(el) => (groups.current[i] = el)}>
            <m.Model amount={still[i]} />
          </group>
        ))}
      </Shadowed>
      {/* scanner: a thin amber light sheet with a soft halo */}
      <group ref={beam} visible={false}>
        {/* a light curtain: faint sheet, bright edges on the floor and at the top */}
        <mesh position={[0, 1.1, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[5.2, 2.2]} />
          <meshBasicMaterial color="#FFB547" transparent opacity={0.07} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.012, 0]}>
          <boxGeometry args={[0.035, 0.012, 5.2]} />
          <meshBasicMaterial color="#FFB547" toneMapped={false} />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[0.02, 0.02, 5.2]} />
          <meshBasicMaterial color="#FFD38A" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 5.2]} />
          <meshBasicMaterial color="#FFB547" transparent opacity={0.18} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
