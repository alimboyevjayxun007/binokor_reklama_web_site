import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import clayColor from "data-url:../assets/tex/clay_color.webp";
import clayNormal from "data-url:../assets/tex/clay_normal.webp";
import aeratedColor from "data-url:../assets/tex/aerated_color.webp";
import aeratedNormal from "data-url:../assets/tex/aerated_normal.webp";
import weaveColor from "data-url:../assets/tex/weave_color.webp";
import weaveNormal from "data-url:../assets/tex/weave_normal.webp";
import bagLabel from "data-url:../assets/tex/bag_label.webp";
import rustColor from "data-url:../assets/tex/rust_color.webp";
import rustRM from "data-url:../assets/tex/rust_rm.webp";
import rustNormal from "data-url:../assets/tex/rust_normal.webp";
import tileMarble from "data-url:../assets/tex/tile_marble.webp";
import tileStone from "data-url:../assets/tex/tile_stone.webp";
import tileTravertine from "data-url:../assets/tex/tile_travertine.webp";
import woodAtlas from "data-url:../assets/tex/wood_atlas.webp";
import woodNormal from "data-url:../assets/tex/wood_normal.webp";
import woodEnd from "data-url:../assets/tex/wood_end.webp";
import kraft from "data-url:../assets/tex/kraft.webp";
import studioHdr from "data-url:../assets/tex/studio.hdr";
import warehouseHdr from "data-url:../assets/tex/warehouse.hdr";

/* ------------------------------------------------------------ textures */

const loader = new THREE.TextureLoader();
const texCache = new Map<string, { t: THREE.Texture; loaded: boolean; views: THREE.Texture[] }>();

function entry(url: string, srgb: boolean) {
  const key = url.slice(0, 64) + url.length + srgb;
  let e = texCache.get(key);
  if (!e) {
    const rec = { t: null as unknown as THREE.Texture, loaded: false, views: [] as THREE.Texture[] };
    rec.t = loader.load(url, () => {
      rec.loaded = true;
      // clones share the image; flag them for upload once it exists
      rec.views.forEach((v) => (v.needsUpdate = true));
    });
    rec.t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    rec.t.wrapS = rec.t.wrapT = THREE.RepeatWrapping;
    rec.t.anisotropy = 8;
    texCache.set(key, rec);
    e = rec;
  }
  return e;
}

function tex(url: string, srgb = true) {
  return entry(url, srgb).t;
}

/** A texture sharing the same image but with its own repeat/offset. */
function view(url: string, srgb: boolean, repeat: [number, number], offset: [number, number] = [0, 0]) {
  const e = entry(url, srgb);
  const t = e.t.clone();
  t.repeat.set(...repeat);
  t.offset.set(...offset);
  if (e.loaded) t.needsUpdate = true;
  else e.views.push(t);
  return t;
}

/* --------------------------------------------------------- environment */

const envCache: Record<string, Promise<THREE.DataTexture> | undefined> = {};
const envReady: Record<string, THREE.DataTexture | undefined> = {};

export function loadEnv(which: "studio" | "warehouse") {
  if (!envCache[which]) {
    envCache[which] = new HDRLoader().loadAsync(which === "studio" ? studioHdr : warehouseHdr).then((t) => {
      t.mapping = THREE.EquirectangularReflectionMapping;
      envReady[which] = t;
      return t;
    });
  }
  return envCache[which]!;
}
export const getEnv = (which: "studio" | "warehouse") => envReady[which];

/* ------------------------------------------------------- lazy singletons */

function once<T>(make: () => T) {
  let v: T | undefined;
  return () => (v ??= make());
}

/* ---------------------------------------------------------- geometries */

export const geo = {
  brick: once(() => new RoundedBoxGeometry(0.5, 0.13, 0.24, 2, 0.012)),
  aerated: once(() => new RoundedBoxGeometry(0.6, 0.4, 0.6, 2, 0.01)),
  aeratedBlock: once(() => new RoundedBoxGeometry(1.2, 0.4, 0.6, 2, 0.012)),
  tile: once(() => new RoundedBoxGeometry(1.2, 0.022, 1.2, 2, 0.006)),
  plank: once(() => new RoundedBoxGeometry(2.2, 0.1, 0.28, 2, 0.01)),
  batten: once(() => new RoundedBoxGeometry(0.06, 0.04, 1.05, 2, 0.008)),
  palletBoard: once(() => new RoundedBoxGeometry(1.12, 0.035, 0.14, 2, 0.006)),
  palletStringer: once(() => new RoundedBoxGeometry(0.1, 0.035, 1.12, 2, 0.006)),
  palletBlock: once(() => new RoundedBoxGeometry(0.12, 0.1, 0.12, 2, 0.008)),
  chunk: once(() => new THREE.DodecahedronGeometry(0.05, 0)),
};

/* ----------------------------------------------------------- materials */

const BRICK_TINTS = ["#ffffff", "#f3dccf", "#ffe9dc", "#e6c2b0"];

export const mat = {
  clay: once(() =>
    BRICK_TINTS.map(
      (tint, i) =>
        new THREE.MeshStandardMaterial({
          color: tint,
          map: view(clayColor, true, [0.55, 0.3], [i * 0.23, i * 0.31]),
          normalMap: view(clayNormal, false, [0.55, 0.3], [i * 0.23, i * 0.31]),
          normalScale: new THREE.Vector2(0.9, 0.9),
          roughness: 0.92,
        })
    )
  ),
  aerated: once(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#D4D4CF",
        map: view(aeratedColor, true, [0.7, 0.5]),
        normalMap: view(aeratedNormal, false, [0.7, 0.5]),
        normalScale: new THREE.Vector2(1.2, 1.2),
        roughness: 0.96,
      })
  ),
  cementPowder: once(() => new THREE.MeshStandardMaterial({ color: "#8E8F8C", roughness: 1 })),
  weave: once(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#E2DED4",
        map: view(weaveColor, true, [3, 2]),
        normalMap: view(weaveNormal, false, [3, 2]),
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.62,
      })
  ),
  bagLabel: once(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex(bagLabel, true),
        normalMap: view(weaveNormal, false, [2, 1.25]),
        normalScale: new THREE.Vector2(0.6, 0.6),
        roughness: 0.58,
      })
  ),
  rebar: once(
    () =>
      new THREE.MeshStandardMaterial({
        map: view(rustColor, true, [1, 7]),
        roughnessMap: view(rustRM, false, [1, 7]),
        metalnessMap: view(rustRM, false, [1, 7]),
        normalMap: view(rustNormal, false, [1, 7]),
        metalness: 1,
        roughness: 1,
      })
  ),
  rebarRib: once(
    () =>
      new THREE.MeshStandardMaterial({
        map: view(rustColor, true, [24, 1]),
        roughnessMap: view(rustRM, false, [24, 1]),
        metalnessMap: view(rustRM, false, [24, 1]),
        metalness: 1,
        roughness: 1,
      })
  ),
  tieWire: once(() => new THREE.MeshStandardMaterial({ color: "#2B2D31", metalness: 0.8, roughness: 0.45 })),
  tileFaces: once(() =>
    [tileMarble, tileStone, tileTravertine].map(
      (u, i) =>
        new THREE.MeshPhysicalMaterial({
          map: tex(u, true),
          roughness: [0.08, 0.42, 0.3][i],
          clearcoat: [0.8, 0, 0.3][i],
          clearcoatRoughness: 0.06,
        })
    )
  ),
  tileBody: once(() => new THREE.MeshStandardMaterial({ color: "#E4DDD0", roughness: 0.85 })),
  wood: once(() =>
    [0, 1, 2, 3].map(
      (i) =>
        new THREE.MeshStandardMaterial({
          map: view(woodAtlas, true, [1, 0.25], [0, 0.75 - i * 0.25]),
          normalMap: view(woodNormal, false, [1, 0.25], [0, 0.75 - i * 0.25]),
          normalScale: new THREE.Vector2(0.6, 0.6),
          roughness: 0.78,
        })
    )
  ),
  woodPallet: once(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d8c3a4",
        map: view(woodAtlas, true, [0.5, 0.25], [0.2, 0.5]),
        normalMap: view(woodNormal, false, [0.5, 0.25], [0.2, 0.5]),
        roughness: 0.85,
      })
  ),
  woodEnd: once(() => new THREE.MeshStandardMaterial({ map: tex(woodEnd, true), roughness: 0.9 })),
  kraft: once(() => new THREE.MeshStandardMaterial({ map: tex(kraft, true), roughness: 0.92 })),
  strap: once(() => new THREE.MeshPhysicalMaterial({ color: "#1C2C5A", roughness: 0.35, clearcoat: 0.6 })),
  pvc: once(() => {
    const m = (color: string) =>
      new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.35, clearcoatRoughness: 0.2 });
    return { white: m("#EEF0F2"), grey: m("#8D9197"), orange: m("#D9642E"), inner: new THREE.MeshStandardMaterial({ color: "#3A3C40", roughness: 0.7, side: THREE.BackSide }) };
  }),
  bucket: once(() => new THREE.MeshPhysicalMaterial({ color: "#F1F1EE", roughness: 0.38, clearcoat: 0.25, clearcoatRoughness: 0.3, side: THREE.DoubleSide })),
  handleMetal: once(() => new THREE.MeshStandardMaterial({ color: "#B9BEC6", metalness: 1, roughness: 0.28 })),
  roof: once(() =>
    ["#45484E", "#1F4A3A", "#5E2129", "#1E4D8F"].map(
      (c) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.15, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.25 })
    )
  ),
  roofBack: once(() => new THREE.MeshStandardMaterial({ color: "#B7BBC1", metalness: 0.6, roughness: 0.4, side: THREE.BackSide })),
  logo: once(() => new THREE.MeshPhysicalMaterial({ color: "#2F5FFF", metalness: 0.75, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 })),
};

/** Liquid paint: glossy, slightly translucent coat */
const paintCache = new Map<string, THREE.MeshPhysicalMaterial>();
export function paintMat(color: string) {
  let m = paintCache.get(color);
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 });
    paintCache.set(color, m);
  }
  return m;
}
