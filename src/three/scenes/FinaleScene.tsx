import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Glow, Shadowed, ShadowCatcher, Studio } from "./Studio";
import { LogoMark } from "../models/Extras";
import { CATALOG } from "../catalog";
import { Amount, clamp, easeInOut, lerp, store } from "../store";

const GROUND = -1.2;

/** The Binokor mark with every material set out around it on the floor, like a finished showroom. */
export default function FinaleScene() {
  const logo = useRef<THREE.Group>(null);
  const items = useRef<(THREE.Group | null)[]>([]);
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const still = useMemo<Amount[]>(() => CATALOG.map(() => ({ current: 0 })), []);
  const s = useRef({ f: 0 });
  const { size } = useThree();

  const spots = useMemo(
    () =>
      CATALOG.map((_, i) => {
        const a = -Math.PI * 0.82 + (i / (CATALOG.length - 1)) * Math.PI * 1.64;
        return { x: Math.sin(a) * 4.1, z: -Math.cos(a) * 2.2 + 0.3, r: -a * 0.6 };
      }),
    []
  );

  useFrame((st, delta) => {
    s.current.f = lerp(s.current.f, store.finale, 1 - Math.exp(-delta * 4));
    const f = s.current.f;
    const t = st.clock.elapsedTime;
    const narrow = size.width / size.height < 1;
    if (logo.current) {
      logo.current.rotation.y = Math.sin(t * 0.4) * 0.25 + store.pointer.x * 0.25;
      logo.current.position.y = GROUND + 1.15 + Math.sin(t * 0.8) * 0.04;
      logo.current.scale.setScalar(lerp(0.7, 1.05, easeInOut(clamp(f * 1.4))));
    }
    items.current.forEach((g, i) => {
      if (!g) return;
      const k = easeInOut(clamp(f * 1.6 - i * 0.07));
      const sp = spots[i];
      const sc = CATALOG[i].heroScale * 0.72;
      g.position.set(sp.x * (narrow ? 0.62 : 1), GROUND + 0.62 * sc - (1 - k) * 0.4, sp.z - (1 - k) * 1.2);
      g.rotation.set(0, sp.r, 0);
      g.scale.setScalar(Math.max(0.001, sc * k));
    });
    if (cam.current) {
      cam.current.position.set(store.pointer.x * 0.3, 2.6, narrow ? 13 : 10.5);
      cam.current.lookAt(0, -0.2, 0);
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={32} position={[0, 2.6, 10.5]} />
      <Studio shadowSize={6} keyPosition={[4, 9, 6]} />
      <Glow position={[0, 0.5, -10]} size={[34, 22]} opacity={0.5} />
      <ShadowCatcher y={GROUND} size={30} opacity={0.4} />
      <Shadowed>
        <group ref={logo}>
          <LogoMark />
        </group>
        {CATALOG.map((m, i) => (
          <group key={m.id} ref={(el) => (items.current[i] = el)}>
            <m.Model amount={still[i]} />
          </group>
        ))}
      </Shadowed>
    </>
  );
}
