import { useEffect, useRef, useState } from "react";
import { View } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AICoreScene from "../three/scenes/AICoreScene";
import { store } from "../three/store";
import { EASE, RevealText } from "../lib/motion";

gsap.registerPlugin(ScrollTrigger);

const MODULES = [
  {
    module: "Ombor",
    what: "Qoldiqni kuzatadi va qaysi tovar qachon tugashini oldindan aytadi.",
    ask: "Qaysi tovarlar tez orada tugaydi?",
    reply: "Sement M400 — taxminan 3 kunlik zaxira, armatura 12 mm — 5 kunlik. Ta'minotchiga buyurtma ro'yxatini tayyorlaymi?",
    result: "Tovar tugab, mijoz bo'sh qaytmaydi",
  },
  {
    module: "Kassa",
    what: "Kassir savol yozadi — narx, mavjudlik va chegirma darhol chiqadi.",
    ask: "Kafel 60×60 kulrang bormi? Narxi qancha?",
    reply: "Omborda 86 m² bor. Narxi m² uchun 125 000 so'm. 50 m² dan ko'p olsa, 3% chegirma qilish mumkin.",
    result: "Mijoz kutmaydi, savdo tezlashadi",
  },
  {
    module: "Hisobot",
    what: "Jadval ochmasdan, oddiy savolga oddiy javob bilan tahlil beradi.",
    ask: "Bu oy eng ko'p nima sotildi?",
    reply: "1. G'isht M-100   2. Sement M400   3. Armatura 12 mm. G'isht savdosi o'tgan oyga nisbatan oshgan.",
    result: "Hisobot kutib o'tirmaysiz",
  },
  {
    module: "Narx va chegirma",
    what: "Turib qolgan tovarni topadi va qachon, qanchaga chegirma qilishni maslahat beradi.",
    ask: "Omborda nima uzoq turib qoldi?",
    reply: "Yashil profnastil 40 kundan beri sotilmagan. 7% chegirma qo'yishni tavsiya qilaman — mavsum oxirigacha sotib ulgurish mumkin.",
    result: "Muzlab qolgan pul aylanishga qaytadi",
  },
  {
    module: "Mijozlar bilan aloqa",
    what: "Telegram orqali kelgan buyurtmani o'qiydi, omborda tekshiradi va kassaga kiritadi.",
    ask: "Salom, ertaga 2 tonna sement va 300 ta g'isht kerak.",
    reply: "Buyurtma qabul qilindi: ikkalasi ham omborda bor, kassaga kiritildi. Mijozga summa va yetkazish vaqti yuborildi.",
    result: "Buyurtmani qayta yozishga vaqt ketmaydi",
  },
];

export default function AIChapter() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const v = Math.min(1, Math.max(0, (self.progress - 0.06) / 0.88)) * (MODULES.length - 1);
          store.ai = v;
          const idx = Math.round(v);
          setActive((a) => (a === idx ? a : idx));
        },
      });
    });
    return () => ctx.revert();
  }, []);

  const m = MODULES[active];

  return (
    <section ref={section} id="ai-agent" className="relative bg-navy" style={{ height: `${MODULES.length * 90 + 60}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden z-[6]">
        <View className="absolute inset-x-0 top-16 h-[38vh] md:top-0 md:h-full">
          <AICoreScene />
        </View>
        <div className="relative h-full mx-auto max-w-[1400px] grid grid-rows-[calc(38vh+4rem)_1fr] md:grid-rows-1 md:grid-cols-[1fr_1.1fr] px-5 md:px-10">
          <div className="relative z-10 flex flex-col justify-end md:justify-center order-2 md:order-1 pb-8 md:pb-0">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <span className="inline-flex items-center gap-2 bg-lime/15 text-lime text-[13px] font-semibold px-3.5 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                Tez kunda — AI agent
              </span>
            </div>
            <RevealText
              text="Sun'iy intellekt Binokor'ning har bir bo'limida ishlaydi"
              className="hidden md:block font-display text-white font-bold tracking-tight leading-[1.02] text-[40px] lg:text-[52px] max-w-[600px]"
            />

            {/* module tabs */}
            <div className="mt-4 md:mt-8 flex flex-wrap gap-2">
              {MODULES.map((x, i) => (
                <span
                  key={x.module}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] md:text-[14px] font-semibold transition-all duration-500 ${
                    i === active ? "bg-cobalt text-white" : "bg-white/[0.07] text-white/60"
                  }`}
                >
                  {x.module}
                </span>
              ))}
            </div>

            <div className="mt-5 md:mt-7 min-h-[250px] md:min-h-[290px] max-w-[560px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <p className="text-white/70 text-[15.5px] md:text-[17px] leading-relaxed">{m.what}</p>
                  <div className="mt-5 flex flex-col gap-2.5">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.4 }}
                      className="self-end max-w-[85%] bg-[#1F2738] text-white rounded-2xl rounded-br-md px-4 py-3 text-[14.5px]"
                    >
                      {m.ask}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55, duration: 0.4 }}
                      className="self-start max-w-[92%] bg-cobalt text-white rounded-2xl rounded-bl-md px-4 py-3 text-[14.5px] leading-relaxed"
                    >
                      {m.reply}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9, duration: 0.4 }}
                      className="mt-1 inline-flex items-center gap-2 text-lime text-[14px] font-semibold"
                    >
                      <span className="w-2 h-2 rounded-full bg-lime" />
                      {m.result}
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="order-1 md:order-2" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
