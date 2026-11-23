import { useEffect, useRef } from "react";
import { View } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import HeroStage from "../three/scenes/HeroStage";
import { CATALOG } from "../three/catalog";
import { store } from "../three/store";
import { MagneticLink, RevealText } from "../lib/motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero chapter in one sticky screen: a delivered heap of materials, a
 * scanner pass that tags every item, then the items set out as a catalogue.
 * Text sits above the 3D layer (z-[6] on the sticky screen).
 */
export default function Stage({ ready }: { ready: boolean }) {
  const wrap = useRef<HTMLElement>(null);
  const heroText = useRef<HTMLDivElement>(null);
  const capScan = useRef<HTMLDivElement>(null);
  const capGrid = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const tags = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrap.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          store.stage = self.progress;
        },
      });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: wrap.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      tl.to(heroText.current, { x: -140, opacity: 0, duration: 0.1 }, 0.03)
        .to(hint.current, { opacity: 0, duration: 0.04 }, 0)
        .fromTo(capScan.current, { x: 120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.08 }, 0.13)
        .to(capScan.current, { x: -120, opacity: 0, duration: 0.07 }, 0.47)
        .fromTo(capGrid.current, { x: 120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.08 }, 0.55)
        .to(capGrid.current, { x: -160, opacity: 0, duration: 0.08 }, 0.9);
    });
    return () => ctx.revert();
  }, []);

  return (
    <section ref={wrap} id="top" className="relative bg-navy" style={{ height: "420vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden z-[6]">
        <View className="absolute inset-0">
          <HeroStage tags={tags} />
        </View>

        {/* scanner tags, positioned every frame from the 3D scene */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {CATALOG.map((m, i) => {
            const [name, qty] = m.tag.split(" · ");
            return (
              <div
                key={m.id}
                ref={(el) => (tags.current[i] = el)}
                className="absolute left-0 top-0 opacity-0 will-change-transform"
              >
                <div className="flex items-center gap-2 rounded-lg bg-white/95 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] pl-2 pr-2.5 py-1.5 whitespace-nowrap">
                  <svg width="18" height="14" viewBox="0 0 18 14" className="shrink-0">
                    {[0, 2, 3, 5, 7, 8, 10, 12, 13, 15, 17].map((x, k) => (
                      <rect key={k} x={x} y="0" width={k % 3 === 0 ? 1.4 : 0.8} height="14" fill="#0B1430" />
                    ))}
                  </svg>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[11.5px] md:text-[12.5px] font-bold text-navy">{name}</span>
                    <span className="hidden md:block text-[11px] text-slate">{qty}</span>
                  </span>
                  <span className="ml-1 w-4 h-4 rounded-full bg-cobalt text-white flex items-center justify-center">
                    <svg width="9" height="9" viewBox="0 0 12 12">
                      <path d="M2 6.5 5 9l5-6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* hero copy */}
        <div className="relative h-full mx-auto max-w-[1320px] px-6 md:px-10 flex items-start md:items-center pt-28 md:pt-0 pointer-events-none">
          <div ref={heroText} className="max-w-[600px] pointer-events-auto">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={ready ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 text-[13px] md:text-[13.5px] font-medium px-4 py-1.5 rounded-full mb-5 md:mb-6 backdrop-blur"
            >
              <span className="w-2 h-2 rounded-full bg-lime" />
              Qurilish materiallari do'konlari uchun POS tizimi
            </motion.span>
            <RevealText
              as="h1"
              ready={ready}
              delay={0.2}
              text="Qurilish do'koningizdagi har bir mahsulot nazoratda"
              className="font-display text-white font-bold tracking-tight leading-[1.02] text-[38px] sm:text-[56px] md:text-[72px]"
            />
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.75 }}
              className="mt-5 md:mt-6 text-[16px] md:text-[19px] text-white/75 leading-relaxed max-w-[480px]"
            >
              G'ishtdan bo'yoqqacha: kassa, ombor va hisobot bitta tizimda. Savdo
              tezlashadi, qoldiq aniq, foyda ko'z o'ngingizda.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.9 }}
              className="mt-7 md:mt-9 flex flex-wrap items-center gap-3 md:gap-4"
            >
              <MagneticLink
                href="#demo"
                className="inline-flex items-center gap-2 bg-cobalt text-white font-semibold text-[15px] md:text-[16px] px-6 md:px-8 py-3.5 md:py-4 rounded-2xl glow-cobalt"
              >
                Bepul demo so'rash
              </MagneticLink>
              <a
                href="#mahsulotlar"
                className="inline-flex items-center gap-2 text-white/90 font-medium text-[15px] md:text-[16px] px-6 md:px-7 py-3.5 md:py-4 rounded-2xl border border-white/25 hover:bg-white/10 transition-colors"
              >
                Mahsulotlarni ko'rish
              </a>
            </motion.div>
          </div>
        </div>

        {/* captions for the scan and the catalogue */}
        <div ref={capScan} className="absolute inset-x-0 top-[13%] md:top-[15%] text-center px-6 opacity-0 pointer-events-none">
          <p className="font-display text-white font-bold text-[26px] md:text-[48px] leading-tight tracking-tight">
            Binokor har bir mahsulotni ro'yxatga oladi
          </p>
          <p className="mt-2 md:mt-3 text-white/70 text-[14.5px] md:text-[17px]">Nomi, o'lchovi va qoldig'i bilan, bitta skanerda</p>
        </div>
        <div ref={capGrid} className="absolute inset-x-0 top-[13%] md:top-[15%] text-center px-6 opacity-0 pointer-events-none">
          <p className="font-display text-white font-bold text-[26px] md:text-[48px] leading-tight tracking-tight">
            Tartibsiz uyum o'rniga tartibli katalog
          </p>
          <p className="mt-2 md:mt-3 text-white/70 text-[14.5px] md:text-[17px]">Har biri o'z o'lchovida: dona, qop, metr, m², litr</p>
        </div>

        <div ref={hint} className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/65 text-[12.5px]">
          <span>Pastga aylantiring</span>
          <span className="w-[22px] h-[34px] rounded-full border border-white/35 flex justify-center pt-1.5">
            <motion.span
              className="w-1 h-2 rounded-full bg-white/80"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </div>
      </div>
    </section>
  );
}
