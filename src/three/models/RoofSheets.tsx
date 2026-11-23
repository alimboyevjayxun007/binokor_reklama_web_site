import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mat } from "../materials";
import { Amount, clamp, easeInOut, easeOut } from "../store";
import { DimLine, arc } from "./helpers";

const W = 2.3; // 1.15 m across the ribs
const LEN = 4.0; // 2 m long
const FLOOR = -0.62;

/** Measured width/length (m) of the sheet at progress p. */
export function sheetMeasure(p: number) {
  const w = 1.15 * easeInOut(clamp((p - 0.45) / 0.22));
  const l = 2 * easeInOut(clamp((p - 0.62) / 0.25));
  return { w, l, area: w * l };
}

/** Trapezoidal profile of a C-20 profiled sheet. */
function profile(x: number) {
  const P = 0.23;
  const t = (((x % P) + P) % P) / P;
  const h = 0.05;
  if (t < 0.38) return 0;
  if (t < 0.5) return ((t - 0.38) / 0.12) * h;
  if (t < 0.88) return h;
  return (1 - (t - 0.88) / 0.12) * h;
}

let shared: THREE.BufferGeometry | null = null;
function sheetGeometry() {
  if (shared) return shared;
  const g = new THREE.PlaneGeometry(W, LEN, 460, 1);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, profile(p.getX(i) + W / 2));
  g.computeVertexNormals();
  g.rotateX(-Math.PI / 2);
  shared = g;
  return g;
}

/**
 * A stack of profiled roofing sheets in four colours. The top sheet is lifted
 * off and laid down, then measured: 1.15 m × 2 m = 2.3 m².
 */
export default function RoofSheets({ amount }: { amount: Amount }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const dimW = useRef<THREE.Group>(null);
  const dimL = useRef<THREE.Group>(null);
  const g = sheetGeometry();
  const colors = mat.roof();
  const back = mat.roofBack();
  const STACK_X = -1.3;
  const LAY_X = 1.35;
  const from = useMemo(() => new THREE.Vector3(STACK_X, FLOOR + 0.06 + 3 * 0.055, 0), []);
  const to = useMemo(() => new THREE.Vector3(LAY_X, FLOOR + 0.006, 0), []);

  useFrame(() => {
    const p = amount.current;
    const move = easeInOut(clamp((p - 0.05) / 0.35));
    colors.forEach((_, i) => {
      const m = refs.current[i];
      if (!m) return;
      if (i === 3) {
        arc(m.position, from, to, move, 0.9);
        m.rotation.set(0, 0, Math.sin(Math.PI * move) * -0.25);
      } else {
        m.position.set(STACK_X, FLOOR + 0.06 + i * 0.055, 0);
      }
    });
    const { w, l } = sheetMeasure(p);
    if (dimW.current) {
      dimW.current.scale.x = Math.max(0.001, w / 1.15) * W;
      dimW.current.traverse((o) => {
        const mm = (o as THREE.LineSegments).material as THREE.LineBasicMaterial | undefined;
        if (mm) mm.opacity = easeOut(clamp((p - 0.45) / 0.08));
      });
    }
    if (dimL.current) {
      dimL.current.scale.x = Math.max(0.001, l / 2) * LEN;
      dimL.current.traverse((o) => {
        const mm = (o as THREE.LineSegments).material as THREE.LineBasicMaterial | undefined;
        if (mm) mm.opacity = easeOut(clamp((p - 0.62) / 0.08));
      });
    }
  });

  return (
    <group>
      {/* timber bearers under the stack */}
      {[-1.4, 0, 1.4].map((z) => (
        <mesh key={z} material={mat.woodPallet()} position={[STACK_X, FLOOR + 0.03, z]}>
          <boxGeometry args={[W + 0.1, 0.06, 0.12]} />
        </mesh>
      ))}
      {colors.map((m, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          <mesh geometry={g} material={m} />
          <mesh geometry={g} material={back} position={[0, -0.002, 0]} />
        </group>
      ))}
      <group position={[LAY_X - W / 2, FLOOR + 0.02, LEN / 2 + 0.2]}>
        <DimLine ref={dimW} />
      </group>
      <group position={[LAY_X + W / 2 + 0.2, FLOOR + 0.02, LEN / 2]} rotation={[0, Math.PI / 2, 0]}>
        <DimLine ref={dimL} />
      </group>
    </group>
  );
}
