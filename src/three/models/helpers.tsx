import { forwardRef, useMemo } from "react";
import * as THREE from "three";

export const AMBER = "#FFB547";

const lineMats = new Map<string, THREE.LineBasicMaterial>();
export function lineMat(color = AMBER) {
  let m = lineMats.get(color);
  if (!m) {
    m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1, depthWrite: false });
    lineMats.set(color, m);
  }
  return m;
}

/** Wireframe measuring box (e.g. "1 m³"). Origin at the bottom centre. */
export const Outline = forwardRef<THREE.LineSegments, { size: [number, number, number]; color?: string }>(
  function Outline({ size, color = AMBER }, ref) {
    const geo = useMemo(() => {
      const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(...size));
      g.translate(0, size[1] / 2, 0);
      return g;
    }, [size]);
    const material = useMemo(
      () => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }),
      [color]
    );
    return <lineSegments ref={ref} geometry={geo} material={material} />;
  }
);

/** A dimension line with end ticks along +x, length 1 (scale.x sets the length). */
export const DimLine = forwardRef<THREE.Group, { color?: string }>(function DimLine({ color = AMBER }, ref) {
  const { line, tick } = useMemo(() => {
    const line = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)]);
    const tick = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -0.08, 0), new THREE.Vector3(0, 0.08, 0)]);
    return { line, tick };
  }, []);
  const m = useMemo(() => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }), [color]);
  return (
    <group ref={ref}>
      <lineSegments geometry={line} material={m} />
      <lineSegments geometry={tick} material={m} />
      <lineSegments geometry={tick} material={m} position={[1, 0, 0]} name="end" />
    </group>
  );
});

export function setOpacity(o: THREE.Object3D | null, v: number) {
  if (!o) return;
  o.traverse((c) => {
    const m = (c as THREE.Mesh).material as THREE.Material | undefined;
    if (m && "opacity" in m) {
      (m as THREE.Material).opacity = v;
      c.visible = v > 0.01;
    }
  });
}

/** Moves along a lifted arc from a to b (t 0..1), like being carried by hand. */
export function arc(out: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, t: number, lift = 0.5) {
  out.lerpVectors(a, b, t);
  out.y += Math.sin(Math.PI * t) * lift;
  return out;
}
