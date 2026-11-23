import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Glow, Shadowed, ShadowCatcher, Studio } from "./Studio";
import CementBags from "../models/CementBags";
import TileStack from "../models/TileStack";
import { PaperPlane, PriceTag, Terminal } from "../models/Extras";
import { geo, mat } from "../materials";
import { clamp, easeInOut, lerp, store, tri } from "../store";

const STILL = { current: 0 };
const FLOOR = -0.62;
const N = 5;

function MiniChart({ grow }: { grow: { current: number } }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const clay = mat.clay();
  const hot = useMemo(() => {
    const m = clay[1].clone();
    m.emissive = new THREE.Color("#FFB547");
    m.emissiveIntensity = 0.25;
    return m;
  }, [clay]);
  const cols = [3, 6, 4];
  useFrame(() => {
    let n = 0;
    cols.forEach((h) => {
      for (let k = 0; k < h; k++) {
        const m = refs.current[n++];
        if (!m) continue;
        const v = clamp(grow.current * (h + 1) - k);
        m.visible = v > 0.01;
        m.scale.setScalar(Math.max(0.001, easeInOut(v)));
      }
    });
  });
  let idx = 0;
  return (
    <group>
      {cols.map((h, c) =>
        Array.from({ length: h }).map((_, k) => {
          const i = idx++;
          return (
            <mesh
              key={`${c}${k}`}
              ref={(el) => (refs.current[i] = el)}
              geometry={geo.brick()}
              position={[(c - 1) * 0.56, FLOOR + 0.068 + k * 0.136, 0]}
              material={c === 1 ? hot : clay[(c + k) % 4]}
            />
          );
        })
      )}
    </group>
  );
}

let phoneTex: THREE.CanvasTexture | null = null;
function phoneTexture() {
  if (phoneTex) return phoneTex;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const x = c.getContext("2d")!;
  x.fillStyle = "#EEF1F6";
  x.fillRect(0, 0, 256, 512);
  x.fillStyle = "#2F5FFF";
  x.fillRect(0, 0, 256, 64);
  x.fillStyle = "#fff";
  x.font = "700 20px Arial, sans-serif";
  x.fillText("Mijoz", 20, 40);
  const bubble = (y: number, w: number, h: number, right: boolean, text: string[]) => {
    x.fillStyle = right ? "#D7E3FF" : "#FFFFFF";
    const bx = right ? 256 - w - 14 : 14;
    x.beginPath();
    x.roundRect(bx, y, w, h, 14);
    x.fill();
    x.fillStyle = "#1A2340";
    x.font = "500 15px Arial, sans-serif";
    text.forEach((t, i) => x.fillText(t, bx + 12, y + 24 + i * 20));
  };
  bubble(96, 200, 66, false, ["Salom! Ertaga 2 tonna", "sement va 300 g'isht."]);
  bubble(186, 196, 88, true, ["Qabul qilindi. Ikkalasi", "ham omborda bor,", "kassaga kiritildi."]);
  phoneTex = new THREE.CanvasTexture(c);
  phoneTex.colorSpace = THREE.SRGBColorSpace;
  return phoneTex;
}

function Phone() {
  return (
    <group>
      <RoundedBox args={[0.62, 1.2, 0.06]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial color="#1B1F27" roughness={0.3} clearcoat={0.8} />
      </RoundedBox>
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[0.56, 1.12]} />
        <meshStandardMaterial map={phoneTexture()} emissive="#ffffff" emissiveMap={phoneTexture()} emissiveIntensity={0.55} roughness={0.1} />
      </mesh>
    </group>
  );
}

/**
 * The AI agent lives inside the till. The terminal stays in the middle; for
 * each module the thing it is working on is brought to the counter next to it.
 */
export default function AICoreScene() {
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const objs = useRef<(THREE.Group | null)[]>([]);
  const ring = useRef<THREE.Mesh>(null);
  const plane = useRef<THREE.Group>(null);
  const tag = useRef<THREE.Group>(null);
  const grow = useMemo(() => ({ current: 0 }), []);
  const s = useRef({ a: 0 });
  const { size } = useThree();

  useFrame((st, delta) => {
    s.current.a = lerp(s.current.a, store.ai, 1 - Math.exp(-delta * 5));
    const a = s.current.a;
    const t = st.clock.elapsedTime;

    if (cam.current) {
      const narrow = window.innerWidth < 768;
      const ox = narrow ? 0 : -size.width * 0.24;
      const v = cam.current.view;
      if (!v || v.offsetX !== ox || v.fullWidth !== size.width) {
        cam.current.setViewOffset(size.width, size.height, ox, 0, size.width, size.height);
      }
      cam.current.position.set(store.pointer.x * 0.4, 2.4, narrow ? 9.6 : 8.2);
      cam.current.lookAt(0.6, 0.1, 0);
    }

    for (let k = 0; k < N; k++) {
      const g = objs.current[k];
      if (!g) continue;
      const w = easeInOut(tri(a, k));
      g.visible = w > 0.01;
      const side = k > a ? 1 : -1;
      g.position.set(1.9 + (1 - w) * 2.2 * side, 0, (1 - w) * -0.6);
      g.scale.setScalar(Math.max(0.001, 0.4 + 0.6 * w));
    }
    grow.current = clamp(tri(a, 2) * 1.2);

    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.35 + Math.sin(t * 2.4) * 0.15;
      ring.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.03);
    }
    // price tag swings on its string; the reply plane flies from phone to till
    if (tag.current) tag.current.rotation.z = Math.sin(t * 1.6) * 0.12 + 0.2;
    if (plane.current) {
      const f = (t * 0.35) % 1;
      const w = tri(a, 4);
      plane.current.visible = w > 0.3;
      plane.current.position.set(lerp(0.9, -0.4, f), 0.9 + Math.sin(f * Math.PI) * 0.6, lerp(0.2, 0.3, f));
      plane.current.rotation.set(0.2, -Math.PI / 2, Math.sin(f * Math.PI) * 0.3);
      plane.current.scale.setScalar(0.35 * (1 - Math.abs(2 * f - 1) * 0.3));
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={32} position={[0, 2.4, 8.2]} />
      <Studio shadowSize={4} keyPosition={[3, 8, 5]} />
      <Glow position={[0.6, 0.4, -8]} size={[24, 16]} opacity={0.55} />
      <ShadowCatcher y={FLOOR} size={20} opacity={0.4} />

      <Shadowed>
        {/* counter top */}
        <RoundedBox args={[4.4, 0.12, 2.4]} radius={0.03} position={[0.7, FLOOR - 0.06, 0]}>
          <meshPhysicalMaterial map={mat.tileFaces()[1].map} roughness={0.35} clearcoat={0.4} />
        </RoundedBox>
        {/* the till */}
        <group position={[-0.6, FLOOR + 0.31, 0.1]} rotation={[0, 0.45, 0]} scale={1.55}>
          <Terminal />
        </group>

        {/* 0 Ombor */}
        <group ref={(el) => (objs.current[0] = el)}>
          <group scale={0.5} position={[0, FLOOR * 0.5 + 0.0, 0]}>
            <CementBags amount={STILL} />
          </group>
        </group>
        {/* 1 Kassa */}
        <group ref={(el) => (objs.current[1] = el)}>
          <group scale={0.55} position={[0.3, FLOOR * 0.45, 0]}>
            <TileStack amount={STILL} />
          </group>
        </group>
        {/* 2 Hisobot */}
        <group ref={(el) => (objs.current[2] = el)}>
          <group scale={0.8} position={[0, FLOOR * 0.2, 0]}>
            <MiniChart grow={grow} />
          </group>
        </group>
        {/* 3 Narx */}
        <group ref={(el) => (objs.current[3] = el)}>
          <group ref={tag} position={[0, 0.6, 0]}>
            <PriceTag />
          </group>
        </group>
        {/* 4 Mijozlar */}
        <group ref={(el) => (objs.current[4] = el)}>
          <group position={[0.1, 0.05, 0.2]} rotation={[-0.15, -0.35, 0]}>
            <Phone />
          </group>
        </group>
      </Shadowed>

      <group ref={plane}>
        <PaperPlane />
      </group>

      {/* "AI on" ring around the till */}
      <mesh ref={ring} position={[-0.6, FLOOR + 0.005, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.04, 96]} />
        <meshBasicMaterial color="#FFB547" transparent opacity={0.4} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}
