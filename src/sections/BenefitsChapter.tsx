import { useEffect, useRef, useState } from "react";
import { View } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import WarehouseScene from "../three/scenes/WarehouseScene";
import { store } from "../three/store";
import { EASE, RevealText } from "../lib/motion";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    title: "Savdo soniyalarda yakunlanadi",
    body: "Kassir mahsulotni tanlaydi — narx, chegirma va chek o'zi chiqadi. Navbat qisqaradi, xatolar yo'qoladi.",
    gain: "Har bir mijozga kamroq vaqt",
  },
  {
    title: "Ombor har doim ko'z o'ngingizda",
    body: "Har bir javon, har bir qoldiq real vaqtda ko'rinadi. Tovar kelsa — qo'shiladi, sotilsa — ayriladi.",
    gain: "Tugab qolgan tovar uchun mijoz yo'qotilmaydi",
  },
  {
    title: "Hisobot o'zi tayyorlanadi",
    body: "Qaysi mahsulot ko'p sotilyapti, qaysi biri turib qolgan — bir qarashda bilasiz. Excel kerak emas.",
    gain: "Qarorlar taxmin bilan emas, raqam bilan",
  },
  {
    title: "Barcha filiallar bitta ekranda",
    body: "Bir nechta do'kon va omborni bitta joydan boshqarasiz — kompyuter, planshet yoki telefondan.",
    gain: "Qayerda bo'lsangiz ham nazorat qo'lingizda",
  },
  {
    title: "Ma'lumotlaringiz himoyalangan",
    body: "Har bir xodim faqat o'ziga ruxsat berilgan bo'limni ko'radi. Savdo tarixi ishonchli saqlanadi.",
    gain: "Tinch uyqu — hisob-kitob joyida",
  },
];

/** Sticky warehouse scene; each scroll step changes what happens inside it. */
export default function BenefitsChapter() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const v = Math.min(1, Math.max(0, (self.progress - 0.04) / 0.92)) * (STEPS.length - 1);
          store.benefit = v;
          const idx = Math.round(v);
          setActive((a) => (a === idx ? a : idx));
          if (rail.current) rail.current.style.transform = `scaleY(${self.progress})`;
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section ref={section} id="afzalliklar" className="relative bg-mist" style={{ height: `${STEPS.length * 90 + 60}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden z-[6]">
        <View className="absolute inset-x-0 top-16 h-[40vh] md:top-0 md:h-full">
          <WarehouseScene />
        </View>
        <div className="relative h-full mx-auto max-w-[1400px] grid grid-rows-[calc(40vh+4rem)_1fr] md:grid-rows-1 md:grid-cols-[1.1fr_1fr] gap-0 md:gap-10 px-5 md:px-10 pointer-events-none">
          <div aria-hidden="true" />

          <div className="relative z-10 flex flex-col justify-start md:justify-center pb-8 md:py-0">
            <RevealText
              text="Do'koningiz ichida nima o'zgaradi"
              className="hidden md:block font-display text-navy font-bold tracking-tight leading-[1.02] text-[44px] lg:text-[56px] mb-10"
            />
            <div className="flex gap-5 md:gap-7">
              <div className="relative w-[3px] rounded-full bg-navy/10 overflow-hidden shrink-0">
                <div ref={rail} className="absolute inset-0 bg-cobalt origin-top" style={{ transform: "scaleY(0)" }} />
              </div>
              <ol className="flex flex-col gap-1 md:gap-2">
                {STEPS.map((s, i) => {
                  const on = i === active;
                  return (
                    <li key={s.title}>
                      <h3
                        className={`font-display font-bold tracking-tight transition-all duration-500 ${
                          on ? "text-navy text-[22px] md:text-[30px]" : "text-navy/45 text-[15px] md:text-[19px]"
                        }`}
                      >
                        {s.title}
                      </h3>
                      <AnimatePresence initial={false}>
                        {on && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, x: 40 }}
                            animate={{ height: "auto", opacity: 1, x: 0 }}
                            exit={{ height: 0, opacity: 0, x: -40 }}
                            transition={{ duration: 0.55, ease: EASE }}
                            className="overflow-hidden"
                          >
                            <p className="pt-2 text-slate text-[15px] md:text-[17px] leading-relaxed max-w-[480px]">{s.body}</p>
                            <p className="mt-3 mb-3 inline-flex items-center gap-2 text-[14px] md:text-[15px] font-semibold text-cobalt">
                              <span className="w-2 h-2 rounded-full bg-lime ring-4 ring-lime/25" />
                              {s.gain}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
