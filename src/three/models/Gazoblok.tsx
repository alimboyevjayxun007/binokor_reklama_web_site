import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { geo, mat } from "../materials";
import { Amount, clamp, easeInOut, easeOut } from "../store";
import { Outline, arc } from "./helpers";

const BW = 1.2; // 600 mm
const BH = 0.4; // 200 mm
const BD = 0.6; // 300 mm
const G = 0.01;
const TOTAL = 27; // 600×300×200 → 0.036 m³ each, 27 ≈ 1 m³
const START = 6;
const FLOOR = -0.62;

/** Blocks inside the 1 m³ frame at progress p. */
export function blocksPlaced(p: number) {
  return START + Math.floor(clamp((p - 0.1) / 0.82) * (TOTAL - START) + 0.0001);
}

/**
 * Aerated concrete blocks fill a one-cubic-metre frame, layer by layer,
 * each block slid in from the side the way a mason stacks them.
 */
export default function Gazoblok({ amount }: { amount: Amount }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const frame = useRef<THREE.LineSegments>(null);
  const m = mat.aerated();
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const slots = useMemo(
    () =>
      Array.from({ length: TOTAL }).map((_, k) => {
        const layer = Math.floor(k / 6);
        const i = k % 6;
        const x = (i % 2 ? 0.5 : -0.5) * (BW + G);
        const z = (Math.floor(i / 2) - 1) * (BD + G);
        const target = new THREE.Vector3(x, FLOOR + BH / 2 + layer * (BH + G), z);
        return { target, from: target.clone().add(new THREE.Vector3(3.4, 0.2, 0.6)) };
      }),
    []
  );

  useFrame(() => {
    const p = amount.current;
    const placing = START + clamp((p - 0.1) / 0.82) * (TOTAL - START);
    slots.forEach((s, k) => {
      const mesh = refs.current[k];
      if (!mesh) return;
      const t = k < START ? 1 : easeInOut(clamp(placing - k));
      mesh.visible = t > 0.001;
      arc(mesh.position, k < START ? s.target : s.from, s.target, k < START ? 1 : t, 0.35);
      mesh.rotation.set(0, (1 - t) * 0.25, 0);
    });
    if (frame.current) {
      const f = easeOut(clamp(p / 0.12));
      (frame.current.material as THREE.LineBasicMaterial).opacity = f * 0.95;
      frame.current.visible = f > 0.01;
    }
    void tmp;
  });

  const frameSize: [number, number, number] = [2 * BW + 3 * G, 5 * (BH + G), 3 * BD + 4 * G];

  return (
    <group>
      {slots.map((s, k) => (
        <mesh key={k} ref={(el) => (refs.current[k] = el)} geometry={geo.aeratedBlock()} material={m} position={s.target} />
      ))}
      <group position={[0, FLOOR, 0]}>
        <Outline ref={frame} size={frameSize} />
      </group>
    </group>
  );
}
