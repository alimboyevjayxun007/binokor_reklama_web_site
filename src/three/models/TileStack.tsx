import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { geo, mat } from "../materials";
import { Amount, clamp, easeInOut, easeOut } from "../store";
import { Outline, arc } from "./helpers";

const S = 1.2; // 600 mm tile
const T = 0.022;
const FLOOR = -0.62;
const JOINT = 0.012;

/** Tiles laid out of the box at progress p (0..4, one box = 4 tiles = 1.44 m²). */
export function tilesLaid(p: number) {
  return Math.floor(clamp((p - 0.08) / 0.8) * 4 + 0.0001);
}

/** A box of four 60×60 porcelain tiles; they are laid one by one into a 1.44 m² square. */
export default function TileStack({ amount }: { amount: Amount }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const frame = useRef<THREE.LineSegments>(null);
  const face = mat.tileFaces()[0];
  const body = mat.tileBody();
  const kraft = mat.kraft();
  const tileMats = useMemo(() => [body, body, face, body, body, body], [face, body]);

  const BOX_X = -1.45;
  const SQ_X = 0.85;
  const slots = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => ({
        from: new THREE.Vector3(BOX_X, FLOOR + 0.035 + (3 - i) * (T + 0.004) + T / 2, 0),
        to: new THREE.Vector3(SQ_X + (i % 2 ? 0.5 : -0.5) * (S + JOINT), FLOOR + T / 2 + 0.001, (i < 2 ? -0.5 : 0.5) * (S + JOINT)),
      })),
    []
  );

  useFrame(() => {
    const p = amount.current;
    const placing = clamp((p - 0.08) / 0.8) * 4;
    slots.forEach((s, i) => {
      const m = refs.current[i];
      if (!m) return;
      const t = easeInOut(clamp(placing - i));
      arc(m.position, s.from, s.to, t, 0.7);
      // tilt up while carried, flat when set down
      m.rotation.set(Math.sin(Math.PI * t) * 0.35, 0, 0);
    });
    if (frame.current) {
      const f = easeOut(clamp(p / 0.1));
      (frame.current.material as THREE.LineBasicMaterial).opacity = f * 0.9;
      frame.current.visible = f > 0.01;
    }
  });

  const BW = S + 0.06;
  return (
    <group>
      {/* open cardboard box */}
      <group position={[BOX_X, FLOOR, 0]}>
        <mesh material={kraft} position={[0, 0.012, 0]}>
          <boxGeometry args={[BW, 0.024, BW]} />
        </mesh>
        {[
          [0, BW / 2, 0],
          [0, -BW / 2, 0],
          [BW / 2, 0, Math.PI / 2],
          [-BW / 2, 0, Math.PI / 2],
        ].map(([x, z, r], i) => (
          <mesh key={i} material={kraft} position={[x, 0.07, z]} rotation={[0, r, 0]}>
            <boxGeometry args={[BW, 0.12, 0.012]} />
          </mesh>
        ))}
      </group>
      {slots.map((s, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={geo.tile()} material={tileMats} position={s.from} />
      ))}
      <group position={[SQ_X, FLOOR + 0.002, 0]}>
        <Outline ref={frame} size={[2 * S + JOINT + 0.04, 0.03, 2 * S + JOINT + 0.04]} />
      </group>
    </group>
  );
}
