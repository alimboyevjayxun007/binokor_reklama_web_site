import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, RevealText } from "../lib/motion";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    title: "Mahsulotlaringizni kiritamiz",
    body: "Assortiment, narxlar va qoldiqlaringiz Binokor'ga o'tkaziladi — qaytadan sanab chiqish shart emas.",
  },
  {
    title: "Xodimlarni o'rgatamiz",
    body: "Kassir va omborchi tizimni tez o'zlashtiradi — ekranlar sodda va tushunarli.",
  },
  {
    title: "Savdoni boshlaysiz",
    body: "Kassa, ombor va hisobot sizning nazoratingizda ishlaydi. Savol tug'ilsa — qo'llab-quvvatlash bir qo'ng'iroq narida.",
  },
];

export default function Onboarding() {
  const line = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        line.current,
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { trigger: wrap.current, start: "top 75%", end: "bottom 55%", scrub: 0.6 } }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section id="ishga-tushirish" className="relative bg-white overflow-hidden">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10 py-28 md:py-40">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 md:mb-24">
          <RevealText
            text="Uch qadamda ishga tushadi"
            className="font-display text-navy font-bold tracking-tight leading-[1] text-[44px] md:text-[72px] max-w-[700px]"
          />
          <motion.p
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="text-slate text-[17px] leading-relaxed max-w-[380px]"
          >
            Do'koningiz to'xtamaydi — o'rnatish ish vaqtingizga xalal bermasdan bajariladi.
          </motion.p>
        </div>

        <div ref={wrap} className="relative">
          <div className="hidden md:block absolute top-[34px] left-0 right-0 h-[2px] bg-navy/10">
            <div ref={line} className="h-full bg-cobalt origin-left" style={{ transform: "scaleX(0)" }} />
          </div>
          <div className="grid md:grid-cols-3 gap-12 md:gap-10">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: 90 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.9, delay: i * 0.15, ease: EASE }}
                className="relative"
              >
                <div className="w-[70px] h-[70px] rounded-2xl bg-navy text-white font-display font-bold text-[26px] flex items-center justify-center relative z-10 shadow-[0_18px_40px_-14px_rgba(6,11,26,0.5)]">
                  {i + 1}
                </div>
                <h3 className="font-display text-navy font-bold text-[24px] md:text-[28px] tracking-tight mt-8 mb-3">{s.title}</h3>
                <p className="text-slate text-[16px] leading-relaxed max-w-[340px]">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
