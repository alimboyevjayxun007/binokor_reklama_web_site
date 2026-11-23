import { useEffect, useRef } from "react";
import gsap from "gsap";
import { store } from "../three/store";

const ITEMS = ["G'isht", "Sement", "Armatura", "Gazoblok", "Kafel", "Bo'yoq", "Quvurlar", "Yog'och", "Profnastil"];
const SWATCH = ["#B5532F", "#A39E93", "#7A4A2E", "#D5D8DC", "#E9E9E6", "#F2B33D", "#D9642E", "#B8793F", "#1E4D8F"];

function Row({ outline, rowRef }: { outline?: boolean; rowRef: React.RefObject<HTMLDivElement | null> }) {
  const content = [...ITEMS, ...ITEMS];
  return (
    <div ref={rowRef} className="flex w-max will-change-transform">
      {content.map((name, i) => (
        <span key={i} className="flex items-center gap-6 md:gap-10 pr-6 md:pr-10">
          <span
            className={`font-display font-bold text-[56px] md:text-[112px] leading-none tracking-tight whitespace-nowrap ${
              outline ? "text-transparent" : "text-white"
            }`}
            style={outline ? { WebkitTextStroke: "1.5px rgba(255,255,255,0.55)" } : undefined}
          >
            {name}
          </span>
          <span
            className="w-5 h-5 md:w-8 md:h-8 rounded-md rotate-12 shrink-0"
            style={{ background: SWATCH[i % SWATCH.length] }}
            aria-hidden="true"
          />
        </span>
      ))}
    </div>
  );
}

/** Two rows of material names; speed and lean follow how fast you scroll. */
export default function Marquee() {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let xa = 0;
    let xb = 0;
    let skew = 0;
    const tick = (_t: number, dt: number) => {
      const v = store.velocity;
      const speed = 0.06 + Math.min(Math.abs(v) * 0.04, 1.6);
      const dir = v < 0 ? -1 : 1;
      xa -= speed * dt * dir;
      xb += speed * dt * dir;
      skew += (Math.max(-12, Math.min(12, v * 0.6)) - skew) * 0.12;
      if (a.current) {
        const w = a.current.scrollWidth / 2;
        if (xa <= -w) xa += w;
        if (xa > 0) xa -= w;
        a.current.style.transform = `translate3d(${xa}px,0,0) skewX(${-skew}deg)`;
      }
      if (b.current) {
        const w = b.current.scrollWidth / 2;
        if (xb >= 0) xb -= w;
        if (xb < -w) xb += w;
        b.current.style.transform = `translate3d(${xb}px,0,0) skewX(${-skew}deg)`;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <section aria-label="Mahsulotlar" className="relative bg-cobalt overflow-hidden py-10 md:py-14 -rotate-1 scale-[1.03] z-10">
      <Row rowRef={a} />
      <div className="h-4 md:h-6" />
      <Row rowRef={b} outline />
    </section>
  );
}
