import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { getEnv, loadEnv } from "../materials";

/**
 * Real-world lighting: a photographed studio (or warehouse) HDRI for
 * reflections plus one shadow-casting key light.
 */
export function Studio({
  env = "studio",
  intensity = 0.7,
  shadowSize = 4,
  keyIntensity = 1.8,
  keyPosition = [4, 7, 5] as [number, number, number],
}: {
  env?: "studio" | "warehouse";
  intensity?: number;
  shadowSize?: number;
  keyIntensity?: number;
  keyPosition?: [number, number, number];
}) {
  const [map, setMap] = useState<THREE.DataTexture | undefined>(() => getEnv(env));
  const light = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    if (!map) loadEnv(env).then(setMap);
  }, [env, map]);

  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = c.bottom = -shadowSize;
    c.right = c.top = shadowSize;
    c.near = 0.5;
    c.far = 30;
    c.updateProjectionMatrix();
    l.shadow.mapSize.set(1024, 1024);
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.025;
    l.shadow.radius = 6;
  }, [shadowSize]);

  return (
    <>
      {map && <Environment map={map} environmentIntensity={intensity} />}
      <directionalLight ref={light} position={keyPosition} intensity={keyIntensity} color="#FFF4E6" castShadow />
      <directionalLight position={[-5, 2, -4]} intensity={0.35} color="#9DB6FF" />
    </>
  );
}

/** Invisible floor that only shows the shadows falling on it. */
export function ShadowCatcher({ y = -1, size = 14, opacity = 0.32 }: { y?: number; size?: number; opacity?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <shadowMaterial transparent opacity={opacity} />
    </mesh>
  );
}

/** Turns on shadow casting/receiving for every mesh inside. */
export function Shadowed({ children, receive = true }: { children: ReactNode; receive?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    ref.current?.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = receive;
      }
    });
  });
  return <group ref={ref}>{children}</group>;
}

const glowTex = new Map<string, THREE.Texture>();
/** Soft radial light behind a scene, drawn in WebGL so it never covers the page text. */
export function Glow({
  color = "#2F5FFF",
  size = [40, 26] as [number, number],
  position = [0, 0, -12] as [number, number, number],
  opacity = 0.55,
}: {
  color?: string;
  size?: [number, number];
  position?: [number, number, number];
  opacity?: number;
}) {
  let t = glowTex.get(color);
  if (!t) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, color + "ff");
    g.addColorStop(0.45, color + "55");
    g.addColorStop(1, color + "00");
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    glowTex.set(color, t);
  }
  return (
    <mesh position={position} renderOrder={-10}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={t} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

let shadowTex: THREE.Texture | null = null;
function getShadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, "rgba(0,0,0,0.5)");
  g.addColorStop(0.55, "rgba(0,0,0,0.18)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

/** Soft ambient-occlusion blob under an object (complements the real shadow). */
export function SoftShadow({
  size = 3,
  opacity = 0.6,
  position = [0, -1, 0] as [number, number, number],
}: {
  size?: number;
  opacity?: number;
  position?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={getShadowTexture()} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}
