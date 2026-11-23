import type { ComponentType } from "react";
import type { Amount } from "./store";
import BrickPallet, { bricksSold } from "./models/BrickPallet";
import CementBags, { bagsOnPallet } from "./models/CementBags";
import RebarBundle, { rebarMeasure } from "./models/RebarBundle";
import Gazoblok, { blocksPlaced } from "./models/Gazoblok";
import TileStack, { tilesLaid } from "./models/TileStack";
import PaintBuckets, { paintsOpened } from "./models/PaintBuckets";
import Pipes, { pipeCut } from "./models/Pipes";
import WoodPlanks, { boardsStacked } from "./models/WoodPlanks";
import RoofSheets, { sheetMeasure } from "./models/RoofSheets";

/** Uzbek number formatting: 1 000, 2,30 */
export const num = (v: number, digits = 0) =>
  v
    .toFixed(digits)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export type MaterialEntry = {
  id: string;
  name: string;
  /** short label used in the hero tags */
  tag: string;
  accent: string;
  units: string[];
  headline: string;
  body: string;
  /** the real conversion the demo shows */
  formula: string;
  /** live read-out driven by the demo progress */
  counter: (p: number) => { big: string; small: string };
  Model: ComponentType<{ amount: Amount }>;
  /** scale used when the model sits in a product panel */
  scale: number;
  /** scale in the hero still-life (keeps real relative sizes) */
  heroScale: number;
};

export const CATALOG: MaterialEntry[] = [
  {
    id: "gisht",
    name: "G'isht",
    tag: "G'isht M-100 · 400 dona",
    accent: "#B5532F",
    units: ["dona", "paddon"],
    headline: "Paddonda keladi, donalab sotiladi",
    body: "Mijoz 16 dona olsa ham, butun paddon olsa ham, ombordagi qoldiq shu zahoti to'g'ri ayriladi. Paddonni qo'lda sanash shart emas.",
    formula: "1 paddon = 400 dona",
    counter: (p) => {
      const sold = bricksSold(p);
      return { big: `${num(400 - sold)} dona`, small: sold ? `omborda qoldi, ${sold} dona sotildi` : "omborda" };
    },
    Model: BrickPallet,
    scale: 0.66,
    heroScale: 0.5,
  },
  {
    id: "sement",
    name: "Sement",
    tag: "Sement M400 · 50 kg",
    accent: "#A39E93",
    units: ["qop", "tonna"],
    headline: "Qopda ham, tonnada ham bir xil aniq",
    body: "Mijoz «1 tonna» desa, tizim buni 20 qop deb tushunadi. Narx ham, qoldiq ham ikkala o'lchovda bir xil to'g'ri chiqadi.",
    formula: "20 qop × 50 kg = 1 tonna",
    counter: (p) => {
      const n = bagsOnPallet(p);
      return { big: `${n} qop`, small: n === 20 ? "1 000 kg = 1 tonna" : `${num(n * 50)} kg` };
    },
    Model: CementBags,
    scale: 0.62,
    heroScale: 0.5,
  },
  {
    id: "armatura",
    name: "Armatura",
    tag: "Armatura Ø12 · 11,7 m",
    accent: "#8A5A3C",
    units: ["metr", "kg", "tonna"],
    headline: "Metrda, kilogrammda yoki tonnada",
    body: "Bitta Ø12 armatura 11,7 metr va 10,4 kg. Qaysi o'lchovda sotsangiz ham, narx va qoldiq bir zumda qayta hisoblanadi.",
    formula: "Ø12 mm: 1 metr = 0,888 kg",
    counter: (p) => {
      const { m, kg } = rebarMeasure(p);
      return { big: `${num(m, 1)} m`, small: `${num(kg, 1)} kg` };
    },
    Model: RebarBundle,
    scale: 0.85,
    heroScale: 0.5,
  },
  {
    id: "gazoblok",
    name: "Gazoblok",
    tag: "Gazoblok D500 · 600×300×200",
    accent: "#AEB6C2",
    units: ["dona", "m³"],
    headline: "Kub metrni donaga o'zi aylantiradi",
    body: "Mijoz «3 kub» desa, tizim nechta blok kerakligini va narxini darhol hisoblab beradi.",
    formula: "1 m³ ≈ 27 dona",
    counter: (p) => {
      const n = blocksPlaced(p);
      return { big: `${n} dona`, small: `${num(n * 0.036, 2)} m³` };
    },
    Model: Gazoblok,
    scale: 0.6,
    heroScale: 0.42,
  },
  {
    id: "kafel",
    name: "Kafel va plitka",
    tag: "Kafel 60×60 · 1,44 m²",
    accent: "#8E9AB0",
    units: ["m²", "quti", "dona"],
    headline: "Kvadrat metr bo'yicha xatosiz",
    body: "Qancha m² kerakligini ayting: tizim necha quti va necha dona ekanini hisoblaydi. Ortiqcha yoki kam berilgan plitka bo'lmaydi.",
    formula: "1 quti = 4 dona = 1,44 m²",
    counter: (p) => {
      const n = tilesLaid(p);
      return { big: `${num(n * 0.36, 2)} m²`, small: `${n} dona` };
    },
    Model: TileStack,
    scale: 0.66,
    heroScale: 0.42,
  },
  {
    id: "boyoq",
    name: "Bo'yoq",
    tag: "Akril bo'yoq · 10 L",
    accent: "#F2B33D",
    units: ["litr", "chelak", "rang"],
    headline: "Har bir rang va hajm alohida nazoratda",
    body: "Qaysi rang qancha qolganini ko'rib turasiz. Mijoz kerakli rangni topolmay ketib qolmaydi.",
    formula: "Har bir rang alohida tovar",
    counter: (p) => {
      const n = paintsOpened(p);
      return { big: `${n} rang`, small: `${n * 10} litr` };
    },
    Model: PaintBuckets,
    scale: 0.95,
    heroScale: 0.55,
  },
  {
    id: "quvur",
    name: "Quvurlar",
    tag: "PVC quvur 110 · 6 m",
    accent: "#D9642E",
    units: ["metr", "dona"],
    headline: "Kesib sotilgan quvur ham hisobda",
    body: "Mijozga 2 metr kesib berdingiz: qolgan 4 metr ham omborda ko'rinib turadi, yo'qolib ketmaydi.",
    formula: "6 m = 2 m + 4 m",
    counter: (p) =>
      pipeCut(p) ? { big: "2 m sotildi", small: "4 m omborda qoldi" } : { big: "6 m", small: "butun quvur" },
    Model: Pipes,
    scale: 0.78,
    heroScale: 0.5,
  },
  {
    id: "yogoch",
    name: "Yog'och",
    tag: "Taxta 50×150×6000",
    accent: "#B8793F",
    units: ["dona", "m³"],
    headline: "Kub metrda ham, donada ham",
    body: "Taxta va brus o'lchami bo'yicha hisoblanadi: mijoz kub so'rasa ham, dona so'rasa ham narx o'zi chiqadi.",
    formula: "1 m³ ≈ 22 dona",
    counter: (p) => {
      const n = boardsStacked(p);
      return { big: `${n} dona`, small: `${num(n * 0.045, 2)} m³` };
    },
    Model: WoodPlanks,
    scale: 0.8,
    heroScale: 0.5,
  },
  {
    id: "profnastil",
    name: "Profnastil",
    tag: "Profnastil C-20 · 4 rang",
    accent: "#2F5FAF",
    units: ["list", "m²", "rang"],
    headline: "List va kvadrat metrda aniq",
    body: "Har bir rang va o'lcham alohida hisobda. Mijoz m² so'rasa, necha list kerakligini tizim aytadi.",
    formula: "1 list (1,15 × 2 m) = 2,3 m²",
    counter: (p) => {
      const { w, l, area } = sheetMeasure(p);
      return { big: `${num(area, 2)} m²`, small: `${num(w, 2)} × ${num(l, 2)} m` };
    },
    Model: RoofSheets,
    scale: 0.5,
    heroScale: 0.34,
  },
];
