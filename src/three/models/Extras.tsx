import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mat } from "../materials";

const FONT = "Arial, Helvetica, sans-serif";

function canvasTexture(w: number, h: number, draw: (x: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

let screenTex: THREE.Texture | null = null;
export function screenTexture() {
  return (screenTex ??= canvasTexture(512, 320, (x) => {
    x.fillStyle = "#0B1430";
    x.fillRect(0, 0, 512, 320);
    x.fillStyle = "#2F5FFF";
    x.fillRect(0, 0, 512, 46);
    x.fillStyle = "#fff";
    x.font = `800 24px ${FONT}`;
    x.fillText("BINOKOR  KASSA", 18, 31);
    const rows = [["G'isht M-100", "340"], ["Sement M400", "12"], ["Armatura 12", "8"], ["Kafel 60×60", "24 m²"]];
    x.font = `600 20px ${FONT}`;
    rows.forEach(([a, b], i) => {
      x.fillStyle = i % 2 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.09)";
      x.fillRect(14, 60 + i * 44, 484, 38);
      x.fillStyle = "#DCE4FF";
      x.fillText(a, 26, 86 + i * 44);
      x.textAlign = "right";
      x.fillText(b, 486, 86 + i * 44);
      x.textAlign = "left";
    });
    x.fillStyle = "#FFB547";
    x.fillRect(14, 246, 484, 58);
    x.fillStyle = "#0B1430";
    x.font = `800 26px ${FONT}`;
    x.fillText("JAMI  4 280 000", 30, 284);
  }));
}

let receiptTex: THREE.Texture | null = null;
export function receiptTexture() {
  return (receiptTex ??= canvasTexture(256, 512, (x) => {
    x.fillStyle = "#FBFBF8";
    x.fillRect(0, 0, 256, 512);
    x.fillStyle = "#222";
    x.font = `800 28px ${FONT}`;
    x.textAlign = "center";
    x.fillText("BINOKOR", 128, 48);
    x.font = `500 15px ${FONT}`;
    x.fillText("Qurilish mollari do'koni", 128, 72);
    x.textAlign = "left";
    const rows = [["G'isht M-100", "340"], ["Sement M400", "12"], ["Armatura 12", "8"], ["Kafel 60x60", "24"], ["Bo'yoq 10 L", "3"]];
    rows.forEach(([a, b], i) => {
      x.fillText(a, 20, 116 + i * 38);
      x.textAlign = "right";
      x.fillText(b, 236, 116 + i * 38);
      x.textAlign = "left";
    });
    x.setLineDash([5, 5]);
    x.strokeStyle = "#333";
    x.beginPath();
    x.moveTo(16, 316);
    x.lineTo(240, 316);
    x.stroke();
    x.setLineDash([]);
    x.font = `800 21px ${FONT}`;
    x.fillText("JAMI", 20, 356);
    x.textAlign = "right";
    x.fillText("4 280 000", 236, 356);
    x.textAlign = "left";
    for (let i = 0; i < 38; i++) x.fillRect(26 + i * 5.3, 400, i % 3 === 0 ? 3 : 1.4, 56);
  }));
}

/** Binokor house mark, extruded in polished blue metal. */
export function LogoMark({ color }: { color?: string }) {
  const geo = useMemo(() => {
    const pts: [number, number][] = [
      [3, 21], [3, 9], [12, 3], [21, 9], [21, 21], [14, 21], [14, 14], [10, 14], [10, 21], [3, 21],
    ];
    const shape = new THREE.Shape();
    pts.forEach(([x, y], i) => {
      const px = (x - 12) / 9;
      const py = (12 - y) / 9;
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    });
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.055, bevelSegments: 6 });
    g.center();
    return g;
  }, []);
  const material = useMemo(() => {
    if (!color) return mat.logo();
    const m = mat.logo().clone();
    m.color.set(color);
    return m;
  }, [color]);
  return <mesh geometry={geo} material={material} />;
}

/** Countertop POS terminal with a lit touch screen. */
export function Terminal() {
  const { body, screen, plastic, glass } = useMemo(
    () => ({
      body: new RoundedBoxGeometry(0.9, 0.2, 0.62, 3, 0.05),
      screen: new RoundedBoxGeometry(0.86, 0.56, 0.045, 3, 0.02),
      plastic: new THREE.MeshPhysicalMaterial({ color: "#1E222A", roughness: 0.42, clearcoat: 0.3 }),
      glass: new THREE.MeshPhysicalMaterial({
        map: screenTexture(),
        emissive: "#ffffff",
        emissiveMap: screenTexture(),
        emissiveIntensity: 0.9,
        roughness: 0.05,
        clearcoat: 1,
      }),
    }),
    []
  );
  return (
    <group>
      <mesh geometry={body} material={plastic} position={[0, -0.1, 0]} />
      <mesh material={plastic} position={[0, 0.05, -0.16]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.12, 0.3, 0.06]} />
      </mesh>
      <group position={[0, 0.25, -0.12]} rotation={[-0.32, 0, 0]}>
        <mesh geometry={screen} material={plastic} />
        <mesh position={[0, 0, 0.024]} material={glass}>
          <planeGeometry args={[0.78, 0.49]} />
        </mesh>
      </group>
    </group>
  );
}

let tagTex: THREE.Texture | null = null;
/** Kraft-paper price tag on a string. */
export function PriceTag() {
  const { geo, face } = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.55, -0.3);
    s.lineTo(0.3, -0.3);
    s.lineTo(0.6, 0);
    s.lineTo(0.3, 0.3);
    s.lineTo(-0.55, 0.3);
    s.lineTo(-0.55, -0.3);
    const hole = new THREE.Path();
    hole.absarc(0.38, 0, 0.055, 0, Math.PI * 2, true);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false });
    g.center();
    // planar UVs over the tag face
    const p = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 0.575) / 1.15, (p.getY(i) + 0.3) / 0.6);
    tagTex ??= canvasTexture(512, 268, (x) => {
      x.fillStyle = "#C9A274";
      x.fillRect(0, 0, 512, 268);
      x.fillStyle = "#1B1B1B";
      x.font = `800 30px ${FONT}`;
      x.fillText("CHEGIRMA", 40, 70);
      x.font = `900 92px ${FONT}`;
      x.fillStyle = "#B8392B";
      x.fillText("-7%", 36, 180);
      x.fillStyle = "#1B1B1B";
      x.font = `600 24px ${FONT}`;
      x.fillText("Profnastil, yashil", 40, 230);
    });
    const face = new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.9 });
    return { geo: g, face };
  }, []);
  return (
    <group>
      <mesh geometry={geo} material={face} />
      <mesh position={[0.62, 0.08, 0]} rotation={[0, 0, 0.6]}>
        <torusGeometry args={[0.16, 0.006, 6, 32]} />
        <meshStandardMaterial color="#E8E2D2" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Folded sheet of paper as a "message sent" symbol. */
export function PaperPlane() {
  const geo = useMemo(() => {
    const v = new Float32Array([
      0, 0, 0.9, -0.55, 0.05, -0.5, 0, 0.0, -0.3,
      0, 0, 0.9, 0, 0.0, -0.3, 0.55, 0.05, -0.5,
      0, 0, 0.9, 0, -0.22, -0.4, 0, 0.0, -0.3,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial color="#F6F6F2" roughness={0.75} sheen={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}
