import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mat } from "../materials";
import { Amount, clamp, easeInOut } from "../store";

const LENGTH = 2.8;
const R = 0.05;
const FLOOR = -0.62;

/** Measured length (m) and weight (kg) of one Ø12 bar at progress p. */
export function rebarMeasure(p: number) {
  const t = easeInOut(clamp((p - 0.5) / 0.42));
  const m = 11.7 * t;
  return { m, kg: m * 0.888 };
}

class Helix extends THREE.Curve<THREE.Vector3> {
  constructor(private turns: number, private radius: number, private length: number, private phase = 0) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2 * this.turns + this.phase;
    return target.set(Math.cos(a) * this.radius, (t - 0.5) * this.length, Math.sin(a) * this.radius);
  }
}

let shared: { rod: THREE.BufferGeometry; ribA: THREE.BufferGeometry; ribB: THREE.BufferGeometry; seam: THREE.BufferGeometry } | null = null;
function geometries() {
  if (!shared) {
    shared = {
      rod: new THREE.CylinderGeometry(R, R, LENGTH, 16),
      ribA: new THREE.TubeGeometry(new Helix(26, R, LENGTH, 0), 420, 0.009, 5, false),
      ribB: new THREE.TubeGeometry(new Helix(26, R, LENGTH, Math.PI), 420, 0.009, 5, false),
      seam: new THREE.BoxGeometry(0.016, LENGTH, 0.016),
    };
  }
  return shared;
}

let tapeTex: THREE.CanvasTexture | null = null;
function tapeTexture() {
  if (tapeTex) return tapeTex;
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 64;
  const x = c.getContext("2d")!;
  x.fillStyle = "#F4C430";
  x.fillRect(0, 0, 2048, 64);
  x.fillStyle = "#1A1A1A";
  for (let i = 0; i <= 117; i++) {
    const px = (i / 117) * 2048;
    const major = i % 10 === 0;
    x.fillRect(px, 0, major ? 3 : 1.5, major ? 36 : i % 5 === 0 ? 24 : 14);
    if (major && i > 0) {
      x.font = "700 20px Arial, sans-serif";
      x.fillText(`${i / 10} m`, px + 4, 58);
    }
  }
  tapeTex = new THREE.CanvasTexture(c);
  tapeTex.colorSpace = THREE.SRGBColorSpace;
  tapeTex.anisotropy = 8;
  return tapeTex;
}

/**
 * A tied bundle of ribbed rebar. On progress the wire ties come off, the bars
 * roll apart on the floor and a tape measure runs along the front bar.
 */
export default function RebarBundle({ amount }: { amount: Amount }) {
  const rods = useRef<(THREE.Group | null)[]>([]);
  const ties = useRef<(THREE.Mesh | null)[]>([]);
  const tape = useRef<THREE.Mesh>(null);
  const tapeCase = useRef<THREE.Group>(null);
  const gm = geometries();
  const steel = mat.rebar();
  const rib = mat.rebarRib();
  const tapeMat = useMemo(() => {
    const t = tapeTexture().clone();
    t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0.2 });
  }, []);

  // hexagonal bundle cross-section (y, z) → flat row on the floor
  const layout = useMemo(() => {
    const pts: [number, number][] = [[0, 0]];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      pts.push([Math.cos(a) * R * 2.2, Math.sin(a) * R * 2.2]);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      pts.push([Math.cos(a) * R * 4.3, Math.sin(a) * R * 4.3]);
    }
    const bundleY = FLOOR + R * 4.4 + 0.012;
    // keep each bar's left/right order so none cross while rolling apart
    const order = pts.map((_, i) => i).sort((a, b) => pts[a][1] - pts[b][1] || pts[a][0] - pts[b][0]);
    return pts.map(([y, z], i) => {
      const rank = order.indexOf(i);
      return {
        start: new THREE.Vector3(0, bundleY + y, z),
        end: new THREE.Vector3(0, FLOOR + R + 0.01, (rank - 5.5) * 0.17),
        i,
      };
    });
  }, []);

  useFrame(() => {
    const p = amount.current;
    const untie = easeInOut(clamp(p / 0.12));
    ties.current.forEach((t) => {
      if (!t) return;
      const s = Math.max(0.001, 1 - untie);
      t.scale.setScalar(s);
      t.visible = s > 0.01;
    });
    const spread = easeInOut(clamp((p - 0.08) / 0.4));
    layout.forEach((l, i) => {
      const g = rods.current[i];
      if (!g) return;
      g.position.lerpVectors(l.start, l.end, spread);
      // bars roll along the floor: rotation follows the distance travelled
      g.rotation.x = ((l.end.z - l.start.z) * spread) / R;
    });
    const t = easeInOut(clamp((p - 0.5) / 0.42));
    if (tape.current) {
      tape.current.visible = t > 0.005;
      tape.current.scale.x = Math.max(0.001, t);
      tape.current.position.x = -LENGTH / 2 + (LENGTH * t) / 2;
      (tape.current.material as THREE.MeshStandardMaterial).map!.repeat.x = Math.max(0.001, t);
    }
    if (tapeCase.current) {
      const show = clamp((p - 0.42) / 0.1);
      tapeCase.current.scale.setScalar(Math.max(0.001, show));
    }
  });

  const frontZ = 1.08;

  return (
    <group>
      {layout.map((l, i) => (
        <group key={i} ref={(el) => (rods.current[i] = el)} position={l.start}>
          <group rotation={[0, 0, Math.PI / 2]}>
            <group rotation={[0, i * 0.7, 0]}>
              <mesh geometry={gm.rod} material={steel} />
              <mesh geometry={gm.ribA} material={rib} />
              <mesh geometry={gm.ribB} material={rib} />
              <mesh geometry={gm.seam} material={rib} position={[R, 0, 0]} />
              <mesh geometry={gm.seam} material={rib} position={[-R, 0, 0]} />
            </group>
          </group>
        </group>
      ))}
      {[-0.9, 0, 0.9].map((x, i) => (
        <mesh key={x} ref={(el) => (ties.current[i] = el)} position={[x, FLOOR + R * 4.4 + 0.012, 0]} rotation={[0, Math.PI / 2, 0]} material={mat.tieWire()}>
          <torusGeometry args={[R * 5.4, 0.009, 6, 36]} />
        </mesh>
      ))}
      {/* tape measure */}
      <mesh ref={tape} position={[0, FLOOR + 0.004, frontZ]} rotation={[-Math.PI / 2, 0, 0]} material={tapeMat} visible={false}>
        <planeGeometry args={[LENGTH, 0.09]} />
      </mesh>
      <group ref={tapeCase} position={[-LENGTH / 2 - 0.12, FLOOR + 0.09, frontZ]}>
        <mesh>
          <boxGeometry args={[0.22, 0.18, 0.12]} />
          <meshPhysicalMaterial color="#F4C430" roughness={0.35} clearcoat={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.061]}>
          <circleGeometry args={[0.06, 24]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
