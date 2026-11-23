import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mat } from "../materials";
import { Amount, clamp, easeInOut } from "../store";

const RO = 0.14;
const RI = 0.124;

/* printed marking line that runs along real PVC pipes */
const printCache = new Map<string, THREE.Texture>();
function printTexture(text: string, ink: string) {
  const hit = printCache.get(text + ink);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 1024;
  const x = c.getContext("2d")!;
  x.clearRect(0, 0, 64, 1024);
  x.save();
  x.translate(40, 1024);
  x.rotate(-Math.PI / 2);
  x.fillStyle = ink;
  x.font = "700 22px Arial, Helvetica, sans-serif";
  for (let i = 0; i < 3; i++) x.fillText(text, 20 + i * 340, 0);
  x.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  printCache.set(text + ink, t);
  return t;
}

function Pipe({ length, material, print, ink }: { length: number; material: THREE.Material; print: string; ink: string }) {
  const { outer, inner, ring, decal } = useMemo(() => {
    const outer = new THREE.CylinderGeometry(RO, RO, length, 40, 1, true);
    const inner = new THREE.CylinderGeometry(RI, RI, length, 40, 1, true);
    const ring = new THREE.RingGeometry(RI, RO, 40);
    // a narrow strip of the outer surface for the printed marking
    const decal = new THREE.CylinderGeometry(RO + 0.0015, RO + 0.0015, length * 0.96, 8, 1, true, -0.18, 0.36);
    return { outer, inner, ring, decal };
  }, [length]);
  const decalMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: printTexture(print, ink), transparent: true, roughness: 0.4, depthWrite: false }),
    [print, ink]
  );
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh geometry={outer} material={material} />
      <mesh geometry={inner} material={mat.pvc().inner} />
      <mesh geometry={decal} material={decalMat} />
      <mesh geometry={ring} material={material} position={[0, length / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={ring} material={material} position={[0, -length / 2, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

const PRINT: Record<string, [string, string]> = {
  orange: ["PVC 110×3,2  SN4  KANALIZATSIYA", "#3A2416"],
  grey: ["PVC 110×2,7  SN2  ICHKI", "#1E2228"],
  white: ["PPR 110  PN20  ICHIMLIK SUVI", "#2A5DB0"],
};

const FLOOR = -0.62;
const L = 3.6; // stands for a 6 m pipe
const CUT = L / 3; // the 2 m piece

/** "6 m" → "2 m sotildi + 4 m qoldi" once the cut is made at progress p. */
export function pipeCut(p: number) {
  return p > 0.42;
}

/**
 * A 6 m pipe on trestles in front of a stack of stock pipes. A circular saw
 * comes down at the 2 m mark, cuts, and the sold piece is slid away; the
 * 4 m remainder stays in stock.
 */
export default function Pipes({ amount }: { amount: Amount }) {
  const short = useRef<THREE.Group>(null);
  const long = useRef<THREE.Group>(null);
  const saw = useRef<THREE.Group>(null);
  const blade = useRef<THREE.Mesh>(null);
  const pvc = mat.pvc();
  const steel = mat.handleMetal();
  const wood = mat.woodPallet();

  const bladeGeo = useMemo(() => {
    // toothed disc
    const shape = new THREE.Shape();
    const teeth = 36;
    for (let i = 0; i <= teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const r = i % 2 ? 0.3 : 0.33;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.04, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: false });
    g.center();
    return g;
  }, []);

  useFrame((st) => {
    const p = amount.current;
    const down = easeInOut(clamp((p - 0.08) / 0.3)); // saw lowers through the pipe
    const up = easeInOut(clamp((p - 0.42) / 0.15)); // and lifts away
    const slide = easeInOut(clamp((p - 0.5) / 0.4)); // sold piece moves out
    if (saw.current) {
      saw.current.position.y = FLOOR + 0.95 - down * 0.62 + up * 0.62;
      saw.current.visible = p > 0.02 && up < 0.999;
    }
    if (blade.current) blade.current.rotation.z = -st.clock.elapsedTime * 14 * (down > 0 && up < 1 ? 1 : 0);
    if (short.current) {
      short.current.position.set(-L / 2 + CUT / 2 - slide * 0.55, 0, slide * 1.05);
      short.current.rotation.y = slide * 0.35;
    }
    if (long.current) long.current.position.x = L / 2 - (L - CUT) / 2 + slide * 0.12;
  });

  const pipeY = FLOOR + 0.2 + 0.14;
  const stack = [
    { x: 0, y: 0, kind: "grey" },
    { x: 0.29, y: 0, kind: "white" },
    { x: -0.29, y: 0, kind: "white" },
    { x: 0.145, y: 0.25, kind: "orange" },
    { x: -0.145, y: 0.25, kind: "grey" },
  ] as const;

  return (
    <group>
      {/* stock pipes behind */}
      <group position={[0.2, FLOOR + 0.14, -0.9]}>
        {stack.map((s, i) => {
          const [print, ink] = PRINT[s.kind];
          return (
            <group key={i} position={[0, s.y, s.x]} rotation={[0, Math.PI / 2, 0]}>
              <Pipe length={L} material={pvc[s.kind]} print={print} ink={ink} />
            </group>
          );
        })}
      </group>
      {/* trestles */}
      {[-1.25, 0.2, 1.4].map((x) => (
        <mesh key={x} material={wood} position={[x, FLOOR + 0.1, 0]}>
          <boxGeometry args={[0.14, 0.2, 0.5]} />
        </mesh>
      ))}
      {/* the pipe being cut: 2 m piece + 4 m remainder */}
      <group position={[0, pipeY, 0]}>
        <group ref={short}>
          <group rotation={[0, Math.PI / 2, 0]}>
            <Pipe length={CUT - 0.01} material={pvc.orange} print={PRINT.orange[0]} ink={PRINT.orange[1]} />
          </group>
        </group>
        <group ref={long}>
          <group rotation={[0, Math.PI / 2, 0]}>
            <Pipe length={L - CUT - 0.01} material={pvc.orange} print={PRINT.orange[0]} ink={PRINT.orange[1]} />
          </group>
        </group>
      </group>
      {/* circular saw */}
      <group ref={saw} position={[-L / 2 + CUT, FLOOR + 0.95, 0]} visible={false}>
        <mesh ref={blade} geometry={bladeGeo} material={steel} rotation={[0, Math.PI / 2, 0]} />
        <mesh position={[0, 0.14, 0.0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.06, 0.28, 0.42]} />
          <meshPhysicalMaterial color="#D9642E" roughness={0.4} clearcoat={0.4} />
        </mesh>
      </group>
    </group>
  );
}
