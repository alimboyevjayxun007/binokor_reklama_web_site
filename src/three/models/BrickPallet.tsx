import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { geo, mat } from "../materials";
import { Amount, clamp, easeInOut, seeded } from "../store";
import { arc } from "./helpers";

const BL = 0.5; // 250 mm brick (1 unit = 0.5 m)
const BH = 0.13; // 65 mm
const BD = 0.24; // 120 mm
const GAP = 0.006;
const LAYERS = 6;
export const BRICKS_SOLD = 16; // bricks carried out in the demo

/** Bricks taken out of the pallet one by one; how many were sold is BRICKS_SOLD × progress. */
export function bricksSold(p: number) {
  return Math.round(clamp((p - 0.12) / 0.78) * BRICKS_SOLD);
}

/**
 * A strapped pallet of clay bricks. As `amount` grows the straps are cut and
 * the top bricks are carried, one at a time, to a counted row on the floor.
 */
export default function BrickPallet({ amount }: { amount: Amount }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const straps = useRef<(THREE.Mesh | null)[]>([]);
  const pallet = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const bricks = useMemo(() => {
    const rnd = seeded(42);
    const out: { pos: THREE.Vector3; rotY: number; m: number }[] = [];
    for (let y = 0; y < LAYERS; y++) {
      const along = y % 2 === 0;
      for (let a = 0; a < 2; a++) {
        for (let b = 0; b < 4; b++) {
          const long = (a - 0.5) * (BL + GAP);
          const short = (b - 1.5) * (BD + GAP);
          out.push({
            pos: new THREE.Vector3(along ? long : short, 0.17 + BH / 2 + y * (BH + GAP), along ? short : long),
            rotY: along ? 0 : Math.PI / 2,
            m: Math.floor(rnd() * 4),
          });
        }
      }
    }
    // top bricks leave first
    const order = out.map((_, i) => i).sort((i, j) => out[j].pos.y - out[i].pos.y || i - j);
    const dest = new Map<number, THREE.Vector3>();
    order.slice(0, BRICKS_SOLD).forEach((idx, k) => {
      const col = k % 4;
      const row = Math.floor(k / 4);
      dest.set(idx, new THREE.Vector3(1.05 + col * 0.56, BH / 2 - 0.033, -0.5 + row * 0.33));
    });
    return { list: out, order, dest };
  }, []);

  const clay = mat.clay();
  const wood = mat.woodPallet();

  useFrame(() => {
    const p = amount.current;
    const cut = easeInOut(clamp(p / 0.12));
    straps.current.forEach((s) => {
      if (!s) return;
      s.scale.set(1, Math.max(0.001, 1 - cut), 1);
      s.visible = cut < 0.99;
    });
    if (pallet.current) pallet.current.position.x = -0.55 * easeInOut(clamp(p / 0.15));

    const moving = clamp((p - 0.12) / 0.78) * BRICKS_SOLD; // 0..16, fractional
    bricks.order.forEach((idx, k) => {
      const m = refs.current[idx];
      if (!m) return;
      const b = bricks.list[idx];
      const d = bricks.dest.get(idx);
      const t = d ? easeInOut(clamp(moving - k)) : 0;
      if (!d || t <= 0) {
        m.position.copy(b.pos);
        m.rotation.set(0, b.rotY, 0);
        return;
      }
      // destination is in model space; the pallet group slides left, so compensate
      const from = tmp.copy(b.pos);
      const target = d.clone().setX(d.x + 0.55 * easeInOut(clamp(p / 0.15)));
      arc(m.position, from, target, t, 0.55);
      m.rotation.set(0, b.rotY * (1 - t), 0);
    });
  });

  const stackH = LAYERS * (BH + GAP);

  return (
    <group position={[-0.35, -0.59, 0]}>
      <group ref={pallet}>
        {[-0.48, -0.24, 0, 0.24, 0.48].map((z) => (
          <mesh key={`t${z}`} geometry={geo.palletBoard()} material={wood} position={[0, 0.1525, z]} />
        ))}
        {[-0.5, 0, 0.5].map((x) => (
          <mesh key={`s${x}`} geometry={geo.palletStringer()} material={wood} position={[x, 0.1175, 0]} />
        ))}
        {[-0.5, 0, 0.5].map((x) =>
          [-0.5, 0, 0.5].map((z) => <mesh key={`b${x}${z}`} geometry={geo.palletBlock()} material={wood} position={[x, 0.05, z]} />)
        )}
        {[-0.5, 0, 0.5].map((z) => (
          <mesh key={`u${z}`} geometry={geo.palletBoard()} material={wood} position={[0, -0.0175, z]} scale={[1, 1, 0.8]} />
        ))}
        {bricks.list.map((b, i) => (
          <mesh
            key={i}
            ref={(el) => (refs.current[i] = el)}
            geometry={geo.brick()}
            material={clay[b.m]}
            position={b.pos}
            rotation={[0, b.rotY, 0]}
          />
        ))}
        {[-0.28, 0.28].map((x, i) => (
          <mesh key={x} ref={(el) => (straps.current[i] = el)} position={[x, 0.17 + stackH / 2, 0]} material={mat.strap()}>
            <boxGeometry args={[0.035, stackH + 0.012, 1.0 + 0.012]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
