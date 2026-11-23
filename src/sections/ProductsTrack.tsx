import { useEffect, useRef, useState } from "react";
import { View } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CATALOG, type MaterialEntry } from "../three/catalog";
import ProductScene from "../three/scenes/ProductScene";

gsap.registerPlugin(ScrollTrigger);

function Panel({ entry, index, registerContent }: { entry: MaterialEntry; index: number; registerContent: (el: HTMLElement | null) => void }) {
  const panelRef = useRef<HTMLElement | null>(null);
  const bigRef = useRef<HTMLSpanElement>(null);
  const smallRef = useRef<HTMLSpanElement>(null);
  const first = entry.counter(0);
  return (
    <article
      ref={panelRef}
      className="product-panel relative h-full w-[100vw] md:w-[84vw] shrink-0 overflow-hidden"
      style={{ background: `radial-gradient(closest-side at 70% 55%, ${entry.accent}38, ${entry.accent}10 60%, transparent)` }}
      aria-label={entry.name}
    >
      <div className="h-full grid grid-rows-[48vh_1fr] md:grid-rows-1 md:grid-cols-[0.8fr_1.2fr]">
        <div
          ref={registerContent}
          className="order-2 md:order-1 flex flex-col justify-start md:justify-center px-6 md:pl-[6vw] md:pr-4 pb-16 md:pb-0 max-w-[560px]"
        >
          <div className="flex items-center gap-3 mb-3 md:mb-5">
            <span className="w-3 h-3 rounded-sm rotate-12" style={{ background: entry.accent }} />
            <span className="text-white/60 text-[13.5px] tabular-nums">
              {index + 1} / {CATALOG.length}
            </span>
          </div>
          <h3 className="font-display text-white font-bold tracking-tight leading-[0.95] text-[40px] md:text-[68px]">{entry.name}</h3>
          <p className="mt-3 md:mt-5 font-display text-white/90 text-[18px] md:text-[23px] leading-snug font-semibold">{entry.headline}</p>
          <p className="hidden sm:block mt-3 md:mt-4 text-white/65 text-[15.5px] md:text-[16.5px] leading-relaxed">{entry.body}</p>

          {/* live read-out of what the scene is doing, as the till would show it */}
          <div className="mt-5 md:mt-7 rounded-2xl border border-white/12 bg-white/[0.05] backdrop-blur px-4 py-3 md:px-5 md:py-4 max-w-[420px]">
            <div className="flex items-center justify-between gap-3 text-[12.5px] text-white/60">
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-lime" />
                Binokor hisobi
              </span>
              <span className="text-white/75 font-semibold">{entry.formula}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3 flex-wrap">
              <span ref={bigRef} className="font-display text-white font-bold text-[30px] md:text-[38px] tabular-nums leading-none">
                {first.big}
              </span>
              <span ref={smallRef} className="text-white/65 text-[14.5px] tabular-nums">
                {first.small}
              </span>
            </div>
          </div>

          <div className="mt-4 md:mt-6 flex flex-wrap gap-2">
            {entry.units.map((u) => (
              <span
                key={u}
                className="px-3.5 py-1.5 rounded-full text-[13.5px] font-semibold border text-white"
                style={{ borderColor: `${entry.accent}99`, background: `${entry.accent}26` }}
              >
                {u}
              </span>
            ))}
          </div>
        </div>
        <div className="relative order-1 md:order-2">
          <View className="absolute inset-0 top-16 md:top-0">
            <ProductScene entry={entry} track={panelRef} bigRef={bigRef} smallRef={smallRef} />
          </View>
        </div>
      </div>
    </article>
  );
}

/** Vertical scroll drives a horizontal walk through nine materials. */
export default function ProductsTrack() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const contents = useRef<(HTMLElement | null)[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const el = track.current!;
      const distance = () => el.scrollWidth - window.innerWidth;
      const tween = gsap.to(el, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: () => {
            if (bar.current) bar.current.style.transform = `scaleX(${tween.progress()})`;
            // the panel nearest the centre of the screen
            const panels = el.querySelectorAll<HTMLElement>(".product-panel");
            let best = 0;
            let bestD = Infinity;
            panels.forEach((p, i) => {
              const r = p.getBoundingClientRect();
              const dd = Math.abs(r.left + r.width / 2 - window.innerWidth / 2);
              if (dd < bestD) {
                bestD = dd;
                best = i;
              }
            });
            setCurrent((c) => (c === best ? c : best));
          },
        },
      });

      contents.current.forEach((c) => {
        if (!c) return;
        gsap.fromTo(
          c.children,
          { x: 90, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            stagger: 0.05,
            ease: "power2.out",
            scrollTrigger: { trigger: c, containerAnimation: tween, start: "left 95%", end: "left 50%", scrub: true },
          }
        );
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section ref={section} id="mahsulotlar" className="relative bg-navy h-screen overflow-hidden">
      <div ref={track} className="flex h-full w-max will-change-transform">
        {/* intro */}
        <div className="relative h-full w-[100vw] md:w-[56vw] shrink-0 flex items-center px-6 md:pl-[8vw] md:pr-[4vw]">
          <div className="relative max-w-[560px]">
            <p className="text-lime font-semibold text-[15px] mb-5">Do'koningiz katalogi</p>
            <h2 className="font-display text-white font-bold tracking-tight leading-[0.98] text-[42px] md:text-[68px]">
              To'qqizta material. To'qqiz xil hisob.
            </h2>
            <p className="mt-6 text-white/70 text-[17px] leading-relaxed max-w-[440px]">
              Qurilish do'konida har bir mahsulot o'z o'lchovida sotiladi. Quyida
              Binokor ularning har birini qanday hisoblashini ko'rasiz.
            </p>
            <div className="mt-10 flex items-center gap-4 text-white/60 text-[14px]">
              <span className="w-14 h-px bg-white/40" />
              Aylantirishda davom eting
            </div>
          </div>
        </div>

        {CATALOG.map((m, i) => (
          <Panel key={m.id} entry={m} index={i} registerContent={(el) => (contents.current[i] = el)} />
        ))}

        {/* outro */}
        <div className="relative h-full w-[100vw] md:w-[56vw] shrink-0 flex items-center px-6 md:px-[6vw]">
          <div className="max-w-[520px]">
            <h3 className="font-display text-white font-bold tracking-tight leading-[1] text-[38px] md:text-[60px]">
              Va yana yuzlab mahsulot
            </h3>
            <p className="mt-5 text-white/70 text-[17px] leading-relaxed">
              Mix, bolt, kabel, santexnika, asbob-uskunalar: assortimentingiz qanchalik katta bo'lmasin, hammasi bitta ro'yxatda.
            </p>
          </div>
        </div>
      </div>

      {/* progress */}
      <div className="absolute left-6 right-6 md:left-10 md:right-10 bottom-5 z-20 flex items-center gap-5 pointer-events-none">
        <span className="text-white text-[13.5px] font-semibold min-w-[120px]">{CATALOG[current].name}</span>
        <div className="flex-1 h-[2px] bg-white/15 rounded-full overflow-hidden">
          <div ref={bar} className="h-full bg-lime origin-left" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </section>
  );
}
