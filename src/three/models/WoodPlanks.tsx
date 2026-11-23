import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { geo, mat } from "../materials";
import { Amount, clamp, easeInOut, easeOut } from "../store";
import { Outline, arc } from "./helpers";

const TH = 0.1;
const WD = 0.28;
const STICK = 0.045;
const FLOOR = -0.62;
const TOTAL = 22; // 50×150×6000 board = 0.045 m³ → 22 ≈ 1 m³
const START = 6;

/** Boards stacked at progress p. */
export function boardsStacked(p: number) {
  return START + Math.floor(clamp((p - 0.1) / 0.82) * (TOTAL - START) + 0.0001);
}

/** Sawn boards are stacked, with stickers between layers, into a one-cubic-metre pack. */
export default function WoodPlanks({ amount }: { amount: Amount }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const battens = useRef<(THREE.Mesh | null)[]>([]);
  const frame = useRef<THREE.LineSegments>(null);
  const woods = mat.wood();
  const end = mat.woodEnd();
  const mats = useMemo(() => woods.map((w) => [end, end, w, w, w, w]), [woods, end]);

  const slots = useMemo(
    () =>
      Array.from({ length: TOTAL }).map((_, k) => {
        const layer = Math.floor(k / 6);
        const i = k % 6;
        const target = new THREE.Vector3(((k * 7) % 5) * 0.02 - 0.04, FLOOR + TH / 2 + layer * (TH + STICK), (i - 2.5) * (WD + 0.02));
        return { target, from: target.clone().add(new THREE.Vector3(3.2, 0.25, 0)), layer };
      }),
    []
  );

  useFrame(() => {
    const p = amount.current;
    const placing = START + clamp((p - 0.1) / 0.82) * (TOTAL - START);
    slots.forEach((s, k) => {
      const m = refs.current[k];
      if (!m) return;
      const t = k < START ? 1 : easeInOut(clamp(placing - k));
      m.visible = t > 0.001;
      arc(m.position, k < START ? s.target : s.from, s.target, k < START ? 1 : t, 0.3);
    });
    battens.current.forEach((b, i) => {
      if (!b) return;
      const layerAbove = Math.floor(i / 2) + 1;
      const t = easeOut(clamp(placing - layerAbove * 6 + 0.6));
      b.visible = t > 0.01;
      b.scale.set(1, 1, Math.max(0.001, t));
    });
    if (frame.current) {
      const f = easeOut(clamp(p / 0.12));
      (frame.current.material as THREE.LineBasicMaterial).opacity = f * 0.9;
      frame.current.visible = f > 0.01;
    }
  });

  const h = 4 * TH + 3 * STICK;
  return (
    <group rotation={[0, 0.35, 0]}>
      {slots.map((s, k) => (
        <mesh key={k} ref={(el) => (refs.current[k] = el)} geometry={geo.plank()} material={mats[k % 4]} position={s.target} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={`b${i}`}
          ref={(el) => (battens.current[i] = el)}
          geometry={geo.batten()}
          material={woods[3]}
          position={[i % 2 ? 0.8 : -0.8, FLOOR + TH + STICK / 2 + Math.floor(i / 2) * (TH + STICK), 0]}
          scale={[1, 1, 1.75]}
          visible={false}
        />
      ))}
      <group position={[0, FLOOR, 0]}>
        <Outline ref={frame} size={[2.3, h + 0.02, 6 * (WD + 0.02) + 0.04]} />
      </group>
    </group>
  );
}
