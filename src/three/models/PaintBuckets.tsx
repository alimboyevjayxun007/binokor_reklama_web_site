import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mat, paintMat } from "../materials";
import { Amount, clamp, easeInOut, seeded } from "../store";

/* ---------- shared geometry ---------- */
let G: {
  body: THREE.LatheGeometry;
  lid: THREE.LatheGeometry;
  sleeve: THREE.CylinderGeometry;
  handle: THREE.TubeGeometry;
  grip: THREE.CylinderGeometry;
  surface: THREE.CircleGeometry;
  drop: THREE.SphereGeometry;
} | null = null;

function geometry() {
  if (G) return G;
  // outer wall profile of a 10 L moulded pail (radius, height)
  const body = [
    [0, -0.31], [0.355, -0.31], [0.365, -0.3], [0.37, -0.26], [0.378, -0.24], [0.372, -0.22],
    [0.39, 0.12], [0.398, 0.14], [0.392, 0.16], [0.405, 0.24], [0.414, 0.26], [0.408, 0.28],
    [0.418, 0.3], [0.43, 0.31], [0.43, 0.322], [0.395, 0.322], [0.39, 0.29], [0.35, -0.28], [0, -0.28],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const lid = [
    [0, 0.0], [0.38, 0.0], [0.4, 0.012], [0.44, 0.012], [0.445, -0.03], [0.452, -0.035], [0.452, 0.02],
    [0.43, 0.045], [0.33, 0.05], [0.3, 0.07], [0, 0.07],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const arc = new THREE.EllipseCurve(0, 0, 0.44, 0.48, 0, Math.PI, false, 0);
  const pts = arc.getPoints(48).map((p) => new THREE.Vector3(p.x, p.y, 0));
  G = {
    body: new THREE.LatheGeometry(body, 64),
    lid: new THREE.LatheGeometry(lid, 64),
    sleeve: new THREE.CylinderGeometry(0.396, 0.383, 0.33, 64, 1, true),
    handle: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.008, 8, false),
    grip: new THREE.CylinderGeometry(0.026, 0.026, 0.22, 16),
    surface: new THREE.CircleGeometry(0.39, 48),
    drop: new THREE.SphereGeometry(1, 20, 16),
  };
  return G;
}

/* ---------- printed label wrapped around the pail ---------- */
const labelCache = new Map<string, THREE.Texture>();
function labelTexture(color: string, name: string) {
  const key = color + name;
  const hit = labelCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 340;
  const x = c.getContext("2d")!;
  x.fillStyle = "#F7F7F5";
  x.fillRect(0, 0, 1024, 340);
  const draw = (ox: number) => {
    // colour wave
    const g = x.createLinearGradient(ox, 0, ox + 512, 340);
    g.addColorStop(0, color);
    g.addColorStop(1, shade(color, -0.25));
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(ox, 340);
    x.lineTo(ox, 200);
    x.bezierCurveTo(ox + 140, 140, ox + 300, 260, ox + 512, 170);
    x.lineTo(ox + 512, 340);
    x.fill();
    x.fillStyle = "#121A33";
    x.font = "900 66px Arial, Helvetica, sans-serif";
    x.fillText("AKRIL", ox + 40, 92);
    x.font = "700 30px Arial, Helvetica, sans-serif";
    x.fillText("Ichki va tashqi ishlar uchun", ox + 42, 138);
    x.fillStyle = "#ffffff";
    x.font = "800 40px Arial, Helvetica, sans-serif";
    x.fillText(name, ox + 42, 300);
    x.font = "900 54px Arial, Helvetica, sans-serif";
    x.textAlign = "right";
    x.fillText("10 L", ox + 480, 304);
    x.textAlign = "left";
  };
  draw(0);
  draw(512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  labelCache.set(key, t);
  return t;
}
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 + k))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

type BucketProps = { color: string; name: string; amount: Amount; delay?: number; splash?: boolean };

export function Bucket({ color, name, amount, delay = 0, splash = false }: BucketProps) {
  const g = geometry();
  const lid = useRef<THREE.Group>(null);
  const handle = useRef<THREE.Group>(null);
  const drops = useRef<(THREE.Mesh | null)[]>([]);
  const labelMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ map: labelTexture(color, name), roughness: 0.3, clearcoat: 0.4 }),
    [color, name]
  );
  const paint = paintMat(color);
  const plastic = mat.bucket();

  const dropData = useMemo(() => {
    const rnd = seeded(color.length * 17 + name.length);
    return Array.from({ length: 22 }).map(() => ({
      v: new THREE.Vector3((rnd() - 0.5) * 1.3, 0.9 + rnd() * 1.3, (rnd() - 0.2) * 1.0),
      size: 0.018 + rnd() * 0.035,
    }));
  }, [color, name]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const raw = Math.max(0, (amount.current - delay) / (1 - delay));
    const e = easeInOut(Math.min(1, raw));
    // lid is prised up and set back against the pail, like opening it to show the colour
    if (lid.current) {
      lid.current.position.set(0, 0.322 + Math.sin(Math.PI * Math.min(1, e * 1.4)) * 0.18 + e * 0.05, -e * 0.47);
      lid.current.rotation.set(-e * 1.35, 0, 0);
    }
    if (handle.current) handle.current.rotation.x = -0.25 + e * 1.3;
    void splash;
    void dropData;
    void tmp;
    drops.current.forEach((d) => d && (d.visible = false));
  });

  return (
    <group>
      <mesh geometry={g.body} material={plastic} />
      <mesh geometry={g.sleeve} material={labelMat} position={[0, -0.04, 0]} />
      <mesh geometry={g.surface} material={paint} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.27, 0]} />
      <group ref={lid} position={[0, 0.322, 0]}>
        <mesh geometry={g.lid} material={plastic} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.072, 0]} material={paint}>
          <circleGeometry args={[0.16, 40]} />
        </mesh>
      </group>
      <group ref={handle} position={[0, 0.2, 0]} rotation={[-0.25, 0, 0]}>
        <mesh geometry={g.handle} material={mat.handleMetal()} />
        <mesh geometry={g.grip} material={plastic} position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} />
      </group>
      {splash &&
        dropData.map((_, i) => (
          <mesh key={i} ref={(el) => (drops.current[i] = el)} geometry={g.drop} material={paint} visible={false} />
        ))}
    </group>
  );
}

export const PAINTS = [
  { color: "#F2B33D", name: "Qum sariq" },
  { color: "#2F5FFF", name: "Ko'k" },
  { color: "#B8433A", name: "G'isht qizil" },
];

/** Colours opened at progress p. */
export function paintsOpened(p: number) {
  return Math.floor(clamp((p - 0.15) / 0.75) * PAINTS.length + 0.0001);
}

/** Three 10 L pails move into a row and are opened one after another to show the colour. */
export default function PaintBuckets({ amount }: { amount: Amount }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const local = useMemo(() => PAINTS.map(() => ({ current: 0 })), []);
  const START = [
    [0.05, 0, 0.38, 0],
    [-0.82, -0.07, -0.32, 0.5],
    [0.86, -0.1, -0.4, -0.6],
  ];
  useFrame(() => {
    const p = amount.current;
    const line = easeInOut(clamp(p / 0.15));
    const opening = clamp((p - 0.15) / 0.75) * PAINTS.length;
    groups.current.forEach((g, i) => {
      if (!g) return;
      const [sx, sy, sz, sr] = START[i];
      const rx = (i - 1) * 1.05;
      g.position.set(sx + (rx - sx) * line, sy + (0 - sy) * line, sz + (0 - sz) * line);
      g.rotation.y = sr * (1 - line);
      g.scale.setScalar(1 - (i ? 0.22 : 0) * (1 - line));
      local[i].current = clamp(opening - i);
    });
  });
  return (
    <group position={[0, -0.3, 0]}>
      {PAINTS.map((c, i) => (
        <group key={c.color} ref={(el) => (groups.current[i] = el)}>
          <Bucket color={c.color} name={c.name} amount={local[i]} />
        </group>
      ))}
    </group>
  );
}
