/**
 * Mutable scroll / pointer state shared between the DOM (GSAP, Lenis)
 * and the WebGL scenes. Written by scroll handlers, read in useFrame.
 * Never stored in React state, so updates never cause re-renders.
 */
export const store = {
  intro: 0, // 0..1   materials fly in after the preloader
  stage: 0, // 0..1   progress through hero → explode → row
  benefit: 0, // 0..4 continuous step in the warehouse chapter
  ai: 0, // 0..4      continuous step in the AI chapter
  finale: 0, // 0..1  progress through the final CTA
  velocity: 0, // Lenis scroll velocity
  pointer: { x: 0, y: 0 }, // -1..1
};

export type Amount = { current: number };

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
/** progress of v inside [a, b], clamped to 0..1 */
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
/** triangle weight around k: 1 at k, 0 at k±1 */
export const tri = (v: number, k: number) => smooth(clamp(1 - Math.abs(v - k)));

/** deterministic pseudo-random so scenes look the same on every load */
export function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
