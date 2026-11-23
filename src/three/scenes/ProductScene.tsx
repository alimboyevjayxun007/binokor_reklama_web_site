import { useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { MaterialEntry } from "../catalog";
import { Shadowed, ShadowCatcher, SoftShadow, Studio } from "./Studio";
import { Amount, clamp, lerp, store } from "../store";

/**
 * One material in the horizontal catalog. The demo progress follows the
 * panel's position on screen: it starts as the panel slides in and completes
 * when the panel reaches the centre. Its counter is written straight into the DOM.
 */
export default function ProductScene({
  entry,
  track,
  bigRef,
  smallRef,
}: {
  entry: MaterialEntry;
  track: RefObject<HTMLElement | null>;
  bigRef: RefObject<HTMLElement | null>;
  smallRef: RefObject<HTMLElement | null>;
}) {
  const group = useRef<THREE.Group>(null);
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const amount = useMemo<Amount>(() => ({ current: 0 }), []);
  const state = useRef({ p: 0, d: 1, big: "", small: "" });
  const { size } = useThree();

  useFrame((_, delta) => {
    const el = track.current;
    if (!el || !group.current) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const d = (r.left + r.width / 2 - vw / 2) / vw; // 0 when centred, + to the right
    // 0 when the panel enters from the right, 1 at the centre, stays done as it leaves
    const target = clamp((0.62 - d) / 0.58);
    const k = 1 - Math.exp(-delta * 5);
    state.current.p = lerp(state.current.p, target, k);
    state.current.d = lerp(state.current.d, d, k);
    amount.current = state.current.p;

    const { big, small } = entry.counter(state.current.p);
    if (big !== state.current.big && bigRef.current) {
      bigRef.current.textContent = big;
      state.current.big = big;
    }
    if (small !== state.current.small && smallRef.current) {
      smallRef.current.textContent = small;
      state.current.small = small;
    }

    // a slow, small turn as the panel travels: no spinning
    const g = group.current;
    g.rotation.y = 0.32 - clamp(state.current.d, -1, 1) * 0.3 + store.pointer.x * 0.06;

    if (cam.current) {
      const narrow = size.width / size.height < 1;
      const phone = window.innerWidth < 768;
      cam.current.position.set(0, narrow ? 3.4 : 3.1, phone ? 7.4 : narrow ? 9.4 : 8.4);
      cam.current.lookAt(0, -0.35, 0);
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={30} position={[0, 3.1, 8.4]} />
      <Studio shadowSize={4} keyPosition={[3, 8, 5]} />
      <group ref={group} scale={entry.scale}>
        <Shadowed>
          <entry.Model amount={amount} />
        </Shadowed>
        <ShadowCatcher y={-0.625} opacity={0.42} size={16} />
        <SoftShadow size={5} opacity={0.35} position={[0, -0.62, 0]} />
      </group>
    </>
  );
}
