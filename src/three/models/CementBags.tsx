import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { geo, mat } from "../materials";
import { Amount, clamp, easeOut, seeded } from "../store";

const W = 1.3; // 650 mm
const H = 0.3; // 150 mm
const D = 0.82; // 410 mm
export const BAGS_TOTAL = 20;
const BAGS_START = 3;

/** Bags on the pallet at progress p (3 → 20; 20 bags × 50 kg = 1 tonna). */
export function bagsOnPallet(p: number) {
  return BAGS_START + Math.floor(clamp((p - 0.08) / 0.84) * (BAGS_TOTAL - BAGS_START) + 0.0001);
}

/** Filled woven-polypropylene bag: a subdivided box squeezed into a pillow, with small wrinkles. */
function pillowGeometry(seed = 1) {
  const g = new THREE.BoxGeometry(W, H, D, 28, 6, 18);
  const p = g.attributes.position as THREE.BufferAttribute;
  const rnd = seeded(seed);
  const ph = [rnd() * 6, rnd() * 6, rnd() * 6];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const u = x / (W / 2);
    const w2 = z / (D / 2);
    const f = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 6)), 0.32) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(w2), 6)), 0.32);
    const thick = 0.18 + 0.82 * f;
    const wrinkle = (Math.sin(u * 9 + ph[0]) * Math.sin(w2 * 7 + ph[1]) + Math.sin(u * 23 + w2 * 5 + ph[2]) * 0.4) * 0.012 * f;
    const pinch = 1 - 0.05 * Math.abs(y / (H / 2)) * (1 - f);
    p.setXYZ(i, x * pinch, y * thick + Math.sign(y) * wrinkle, z * (1 - 0.03 * (1 - f)));
  }
  g.computeVertexNormals();
  return g;
}

let bagGeos: THREE.BufferGeometry[] | null = null;
const getBagGeos = () => (bagGeos ??= [1, 2, 3, 4].map(pillowGeometry));

/**
 * A pallet being loaded with cement bags, layer by layer, until it holds
 * 20 bags — one tonne. Bags are set down from above like a loader would.
 */
export default function CementBags({ amount }: { amount: Amount }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const weave = mat.weave();
  const label = mat.bagLabel();
  const wood = mat.woodPallet();
  // box material order: +x, -x, +y, -y, +z, -z
  const bagMats = useMemo(() => [weave, weave, label, weave, weave, weave], [weave, label]);
  const geos = getBagGeos();

  const slots = useMemo(() => {
    const rnd = seeded(12);
    return Array.from({ length: BAGS_TOTAL }).map((_, k) => {
      const layer = Math.floor(k / 4);
      const i = k % 4;
      return {
        pos: new THREE.Vector3((i % 2 ? 0.67 : -0.67) + (rnd() - 0.5) * 0.04, 0.2 + H * 0.46 + layer * H * 0.93, (i < 2 ? -0.43 : 0.43) + (rnd() - 0.5) * 0.04),
        rotY: (rnd() - 0.5) * 0.07 + (layer % 2 ? Math.PI : 0),
        g: Math.floor(rnd() * 4),
      };
    });
  }, []);

  useFrame(() => {
    const p = amount.current;
    const placing = BAGS_START + clamp((p - 0.08) / 0.84) * (BAGS_TOTAL - BAGS_START);
    slots.forEach((s, k) => {
      const m = refs.current[k];
      if (!m) return;
      const t = k < BAGS_START ? 1 : easeOut(clamp(placing - k));
      m.visible = t > 0.001;
      m.position.set(s.pos.x, s.pos.y + (1 - t) * 1.6, s.pos.z);
      m.rotation.set(0, s.rotY, (1 - t) * 0.05);
    });
  });

  return (
    <group position={[0, -0.62, 0]}>
      {/* pallet 1300 × 850 */}
      {[-0.75, -0.375, 0, 0.375, 0.75].map((z) => (
        <mesh key={`t${z}`} geometry={geo.palletBoard()} material={wood} position={[0, 0.1525, z]} scale={[2.42, 1, 1]} />
      ))}
      {[-1.25, 0, 1.25].map((x) => (
        <mesh key={`s${x}`} geometry={geo.palletStringer()} material={wood} position={[x, 0.1175, 0]} scale={[1, 1, 1.5]} />
      ))}
      {[-1.25, 0, 1.25].map((x) =>
        [-0.75, 0, 0.75].map((z) => <mesh key={`b${x}${z}`} geometry={geo.palletBlock()} material={wood} position={[x, 0.05, z]} />)
      )}
      {slots.map((s, k) => (
        <mesh key={k} ref={(el) => (refs.current[k] = el)} geometry={geos[s.g]} material={bagMats} position={s.pos} rotation={[0, s.rotY, 0]} />
      ))}
    </group>
  );
}
