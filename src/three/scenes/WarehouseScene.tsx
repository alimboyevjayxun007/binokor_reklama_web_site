import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Shadowed, ShadowCatcher, Studio } from "./Studio";
import { LogoMark, Terminal, receiptTexture } from "../models/Extras";
import { Bucket } from "../models/PaintBuckets";
import { geo, mat } from "../materials";
import { clamp, easeInOut, easeOut, lerp, range, store, tri } from "../store";

const SHELF_Y = [0.35, 1.25, 2.15];
const RACK_W = 3.4;
const STILL = { current: 0 };

type ItemKind = "brick" | "cement" | "paint" | "tile" | "block";
const KINDS: ItemKind[] = ["brick", "cement", "paint", "tile", "block", "cement", "brick", "paint", "tile", "block", "brick", "cement"];

let G: { bag: THREE.BufferGeometry; box: THREE.BufferGeometry; counter: THREE.BufferGeometry } | null = null;
function geoms() {
  return (G ??= {
    bag: new RoundedBoxGeometry(0.62, 0.2, 0.42, 3, 0.07),
    box: new RoundedBoxGeometry(0.6, 0.3, 0.42, 2, 0.01),
    counter: new RoundedBoxGeometry(1.5, 0.6, 0.8, 3, 0.04),
  });
}

/** Small realistic stock items that sit on the shelves. */
function Item({ kind }: { kind: ItemKind }) {
  const g = geoms();
  switch (kind) {
    case "brick": {
      const clay = mat.clay();
      return (
        <group>
          {[0, 1, 2, 3].map((y) =>
            [-0.125, 0.125].map((z, j) => (
              <mesh
                key={`${y}${z}`}
                geometry={geo.brick()}
                material={clay[(y + j) % 4]}
                position={[0, 0.068 + y * 0.136, z]}
                scale={[1.1, 1, 1]}
              />
            ))
          )}
        </group>
      );
    }
    case "cement": {
      const w = mat.weave();
      const l = mat.bagLabel();
      return <mesh geometry={g.bag} material={[w, w, l, w, w, w]} position={[0, 0.1, 0]} />;
    }
    case "paint":
      return (
        <group>
          {[-0.16, 0.16].map((x, i) => (
            <group key={x} position={[x, 0.155, 0]} scale={0.42}>
              <Bucket color={i ? "#2F5FFF" : "#F2B33D"} name={i ? "Ko'k" : "Qum sariq"} amount={STILL} />
            </group>
          ))}
        </group>
      );
    case "tile": {
      const k = mat.kraft();
      const f = mat.tileFaces()[0];
      return <mesh geometry={g.box} material={[k, k, f, k, k, k]} position={[0, 0.15, 0]} />;
    }
    default:
      return (
        <mesh geometry={geo.aerated()} material={mat.aerated()} position={[0, 0.2, 0]} scale={[1, 1, 0.7]} />
      );
  }
}

function Rack() {
  const { upright, beam, deck } = useMemo(
    () => ({
      upright: new THREE.MeshPhysicalMaterial({ color: "#1F4FD6", roughness: 0.35, metalness: 0.4, clearcoat: 0.5 }),
      beam: new THREE.MeshPhysicalMaterial({ color: "#E8661F", roughness: 0.35, metalness: 0.4, clearcoat: 0.5 }),
      deck: new THREE.MeshStandardMaterial({ color: "#B9C0CC", roughness: 0.45, metalness: 0.8 }),
    }),
    []
  );
  return (
    <group>
      {[-RACK_W / 2, RACK_W / 2].map((x) =>
        [-0.32, 0.32].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.35, z]} material={upright}>
            <boxGeometry args={[0.08, 2.7, 0.08]} />
          </mesh>
        ))
      )}
      {[-RACK_W / 2, RACK_W / 2].map((x) =>
        [0.5, 1.1, 1.7, 2.3].map((y) => (
          <mesh key={`br${x}${y}`} position={[x, y, 0]} rotation={[y % 1.2 ? 0.7 : -0.7, 0, 0]} material={upright}>
            <boxGeometry args={[0.02, 0.02, 0.85]} />
          </mesh>
        ))
      )}
      {SHELF_Y.map((y) => (
        <group key={y} position={[0, y, 0]}>
          <mesh position={[0, -0.03, 0]} material={deck}>
            <boxGeometry args={[RACK_W, 0.03, 0.7]} />
          </mesh>
          {[-0.34, 0.34].map((z) => (
            <mesh key={z} position={[0, -0.08, z]} material={beam}>
              <boxGeometry args={[RACK_W + 0.04, 0.11, 0.05]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default function WarehouseScene() {
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const rack = useRef<THREE.Group>(null);
  const items = useRef<(THREE.Group | null)[]>([]);
  const levels = useRef<(THREE.Mesh | null)[]>([]);
  const sold = useRef<THREE.Group>(null);
  const receipt = useRef<THREE.Mesh>(null);
  const counter = useRef<THREE.Group>(null);
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  const chart = useRef<THREE.Group>(null);
  const branches = useRef<THREE.Group>(null);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  const links = useRef<THREE.Group>(null);
  const dome = useRef<THREE.Mesh>(null);
  const domeRing = useRef<THREE.Mesh>(null);
  const s = useRef({ b: 0 });
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const { size } = useThree();

  const slots = useMemo(
    () =>
      KINDS.map((kind, i) => {
        const shelf = Math.floor(i / 4);
        const col = i % 4;
        return { kind, shelf, x: (col - 1.5) * 0.8, y: SHELF_Y[shelf], base: i % 3 !== 2 };
      }),
    []
  );

  const COLS = [2, 4, 3, 6, 5];
  const clay = mat.clay();
  const hot = useMemo(() => {
    const m = clay[2].clone();
    m.emissive = new THREE.Color("#FFB547");
    m.emissiveIntensity = 0.22;
    return m;
  }, [clay]);
  const counterMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#2A3140", roughness: 0.3, clearcoat: 0.6 }), []);
  const counterTop = useMemo(() => new THREE.MeshPhysicalMaterial({ map: mat.tileFaces()[0].map, roughness: 0.1, clearcoat: 0.8 }), []);

  const CAMS = useMemo(
    () => [
      { p: new THREE.Vector3(4.6, 2.9, 7.8), l: new THREE.Vector3(0.5, 1.0, 0.5) },
      { p: new THREE.Vector3(0.4, 2.4, 9.0), l: new THREE.Vector3(0, 1.2, 0) },
      { p: new THREE.Vector3(-4.2, 2.6, 8.0), l: new THREE.Vector3(-1.0, 1.0, 0.8) },
      { p: new THREE.Vector3(0, 7.6, 10.2), l: new THREE.Vector3(0, 0.4, 0.4) },
      { p: new THREE.Vector3(3.2, 4.2, 10.8), l: new THREE.Vector3(0, 1.2, 0) },
    ],
    []
  );

  useFrame((st, delta) => {
    s.current.b = lerp(s.current.b, store.benefit, 1 - Math.exp(-delta * 5));
    const b = s.current.b;
    const t = st.clock.elapsedTime;
    const w = [0, 1, 2, 3, 4].map((k) => tri(b, k));

    const i0 = Math.floor(clamp(b, 0, 3.999));
    const f = easeInOut(b - i0);
    const A = CAMS[i0];
    const B = CAMS[Math.min(4, i0 + 1)];
    if (cam.current) {
      const narrow = window.innerWidth < 768;
      const ox = narrow ? 0 : size.width * 0.24;
      const oy = 0;
      const v = cam.current.view;
      if (!v || v.offsetX !== ox || v.offsetY !== oy || v.fullWidth !== size.width) {
        cam.current.setViewOffset(size.width, size.height, ox, oy, size.width, size.height);
      }
      cam.current.position.lerpVectors(A.p, B.p, f);
      cam.current.position.x += store.pointer.x * 0.3;
      lookAt.lerpVectors(A.l, B.l, f);
      cam.current.lookAt(lookAt);
    }

    const fill = easeOut(range(b, 0.35, 1.2));
    let dropIdx = 0;
    slots.forEach((sl, i) => {
      const g = items.current[i];
      if (!g) return;
      if (sl.base) {
        g.position.set(sl.x, sl.y, 0);
        g.scale.setScalar(1);
        return;
      }
      const start = dropIdx * 0.18;
      dropIdx++;
      const p = clamp((fill - start) / 0.4);
      const bounce = p < 1 ? Math.sin(p * Math.PI) * 0.12 : 0;
      g.position.set(sl.x, sl.y + (1 - easeOut(p)) * 2.4 + bounce, 0);
      g.scale.setScalar(p > 0 ? 1 : 0.001);
    });
    levels.current.forEach((m, shelf) => {
      if (!m) return;
      const base = shelf === 1 ? 0.5 : 0.75;
      const v = lerp(base, 1, fill);
      m.scale.x = Math.max(0.001, v);
      m.position.x = -RACK_W / 2 + (RACK_W * v) / 2;
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + w[1] * 0.8;
    });

    if (sold.current) {
      const p = easeInOut(w[0]);
      sold.current.position.set(lerp(-1.2, 1.35, p), lerp(SHELF_Y[0], 0.6, p) + Math.sin(p * Math.PI) * 0.6, lerp(0, 1.7, p));
      sold.current.rotation.y = p * 0.6;
      sold.current.scale.setScalar(Math.max(0.001, p));
    }
    if (receipt.current) {
      const p = easeOut(w[0]);
      receipt.current.scale.set(1, Math.max(0.001, p), 1);
      receipt.current.position.y = 0.92 + p * 0.3;
    }
    if (counter.current) {
      counter.current.scale.setScalar(Math.max(0.001, easeOut(clamp(w[0] * 1.6))));
    }

    if (chart.current) chart.current.visible = w[2] > 0.01;
    let n = 0;
    COLS.forEach((h, c) => {
      for (let k = 0; k < h; k++) {
        const m = bars.current[n++];
        if (!m) continue;
        const threshold = (k + c * 0.4) / (h + 2.5);
        const p = easeOut(clamp((w[2] - threshold) * 3));
        m.scale.setScalar(Math.max(0.001, p));
        m.position.y = 0.068 + k * 0.136 + (1 - p) * 0.6;
      }
    });

    if (rack.current) {
      const p = easeInOut(w[3]);
      rack.current.scale.setScalar(lerp(1, 0.62, p));
      rack.current.position.z = lerp(0, -0.6, p);
    }
    if (branches.current && links.current) {
      branches.current.visible = links.current.visible = w[3] > 0.12;
      const sc = Math.max(0.001, easeOut(w[3]));
      branches.current.scale.setScalar(sc);
      links.current.scale.setScalar(sc);
    }
    pulses.current.forEach((m, i) => {
      if (!m) return;
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
      const q = (t * 0.45 + i * 0.33) % 1;
      m.position.set(Math.cos(a) * 2.7 * (1 - q), 0.35, Math.sin(a) * 2.7 * (1 - q));
    });

    if (dome.current && domeRing.current) {
      const p = easeOut(w[4]);
      dome.current.visible = domeRing.current.visible = p > 0.01;
      dome.current.scale.setScalar(Math.max(0.001, p) * 2.8);
      dome.current.rotation.y = t * 0.12;
      domeRing.current.scale.setScalar(Math.max(0.001, p) * (2.8 + Math.sin(t * 2) * 0.05));
    }
  });

  const branchSpots = [0, 1, 2].map((i) => {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    return [Math.cos(a) * 2.7, 0, Math.sin(a) * 2.7] as [number, number, number];
  });

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={34} position={[0, 2, 7]} />
      <Studio env="warehouse" intensity={0.85} shadowSize={6} keyPosition={[5, 9, 6]} keyIntensity={2} />
      <ShadowCatcher y={0} size={24} opacity={0.22} />

      <Shadowed>
        <group ref={rack}>
          <Rack />
          {slots.map((sl, i) => (
            <group key={i} ref={(el) => (items.current[i] = el)} position={[sl.x, sl.y, 0]}>
              <Item kind={sl.kind} />
            </group>
          ))}
          {SHELF_Y.map((y, i) => (
            <mesh key={y} ref={(el) => (levels.current[i] = el)} position={[0, y - 0.08, 0.372]}>
              <boxGeometry args={[RACK_W, 0.03, 0.01]} />
              <meshStandardMaterial color="#FFB547" emissive="#FFB547" emissiveIntensity={0.5} />
            </mesh>
          ))}
        </group>

        <group ref={counter} position={[1.55, 0, 1.75]}>
          <mesh geometry={geoms().counter} material={counterMat} position={[0, 0.3, 0]} />
          <mesh position={[0, 0.602, 0]} rotation={[-Math.PI / 2, 0, 0]} material={counterTop}>
            <planeGeometry args={[1.48, 0.78]} />
          </mesh>
          <group position={[0.25, 0.71, -0.05]} scale={0.6}>
            <Terminal />
          </group>
          <mesh ref={receipt} position={[0.68, 0.92, 0.12]} rotation={[0, -0.5, 0]}>
            <planeGeometry args={[0.3, 0.6]} />
            <meshStandardMaterial map={receiptTexture()} side={THREE.DoubleSide} roughness={0.85} />
          </mesh>
        </group>
        <group ref={sold}>
          <Item kind="brick" />
        </group>

        <group ref={chart} position={[-1.6, 0, 1.6]} rotation={[0, 0.35, 0]}>
          {(() => {
            let n = 0;
            return COLS.map((h, c) =>
              Array.from({ length: h }).map((_, k) => {
                const idx = n++;
                return (
                  <mesh
                    key={`${c}-${k}`}
                    ref={(el) => (bars.current[idx] = el)}
                    geometry={geo.brick()}
                    material={c === 3 ? hot : clay[(k + c) % 4]}
                    position={[(c - 2) * 0.56, 0.068 + k * 0.136, 0]}
                    rotation={[0, k % 2 ? 0.04 : -0.03, 0]}
                  />
                );
              })
            );
          })()}
        </group>

        <group ref={branches} visible={false}>
          {branchSpots.map((p, i) => (
            <group key={i} position={p}>
              <group position={[0, 0.55, 0]} scale={0.6}>
                <LogoMark color={["#2F5FFF", "#E8661F", "#1F6E52"][i]} />
              </group>
            </group>
          ))}
        </group>
      </Shadowed>

      {/* data links to the branches (no shadows) */}
      <group ref={links} visible={false}>
        {branchSpots.map((p, i) => {
          const len = Math.hypot(p[0], p[2]);
          const ang = Math.atan2(p[0], p[2]);
          return (
            <mesh key={`l${i}`} position={[p[0] / 2, 0.35, p[2] / 2]} rotation={[Math.PI / 2, 0, -ang]}>
              <cylinderGeometry args={[0.012, 0.012, len, 6]} />
              <meshStandardMaterial color="#5B8CFF" emissive="#5B8CFF" emissiveIntensity={0.8} />
            </mesh>
          );
        })}
        {[0, 1, 2].map((i) => (
          <mesh key={`p${i}`} ref={(el) => (pulses.current[i] = el)}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#FFB547" emissive="#FFB547" emissiveIntensity={1.5} />
          </mesh>
        ))}
      </group>

      <mesh ref={dome} visible={false}>
        <sphereGeometry args={[1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#2F5FFF" wireframe transparent opacity={0.3} />
      </mesh>
      <mesh ref={domeRing} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} visible={false}>
        <ringGeometry args={[0.97, 1, 96]} />
        <meshBasicMaterial color="#2F5FFF" transparent opacity={0.8} />
      </mesh>
    </>
  );
}
