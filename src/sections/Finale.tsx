import { useEffect, useRef } from "react";
import { View } from "@react-three/drei";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FinaleScene from "../three/scenes/FinaleScene";
import { store } from "../three/store";
import { EASE, RevealText } from "../lib/motion";
import DemoForm, { PHONE, PHONE_LABEL, TELEGRAM } from "./DemoForm";

gsap.registerPlugin(ScrollTrigger);

const CHANNELS = [
  {
    label: "Qo'ng'iroq qiling",
    value: PHONE_LABEL,
    href: `tel:${PHONE}`,
    icon: (
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    ),
  },
  {
    label: "Telegram",
    value: `@${TELEGRAM}`,
    href: `https://t.me/${TELEGRAM}`,
    icon: <path d="m3 11 17-7-3 17-6-4-3 3-1-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
  },
];

export default function Finale() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section.current,
        start: "top 85%",
        end: "top 15%",
        onUpdate: (self) => {
          store.finale = self.progress;
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section ref={section} id="aloqa" className="relative bg-navy overflow-hidden">
      <div className="relative mx-auto max-w-[1320px] px-5 md:px-10 pt-24 md:pt-32 pb-20">
        <div className="relative h-[34vh] md:h-[50vh]">
          <View className="absolute inset-0">
            <FinaleScene />
          </View>
        </div>

        <div className="relative z-10 text-center mt-4">
          <RevealText
            text="Do'koningizni bugundan tartibga soling"
            className="font-display text-white font-bold tracking-tight leading-[1.02] text-[38px] md:text-[76px] max-w-[1000px] mx-auto"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
            className="mt-5 text-white/75 text-[16.5px] md:text-[19px] max-w-[560px] mx-auto leading-relaxed"
          >
            Bepul demo ko'rsatamiz: tizim sizning do'koningizda qanday ishlashini o'z mahsulotlaringiz misolida ko'rasiz.
          </motion.p>
        </div>

        <div className="mt-12 md:mt-16">
          <DemoForm />
        </div>

        <div className="relative z-10 mt-10 grid sm:grid-cols-2 gap-4 max-w-[760px] mx-auto">
          {CHANNELS.map((c, i) => (
            <motion.a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener" : undefined}
              initial={{ opacity: 0, x: i === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
              className="group flex items-center gap-4 bg-white/[0.05] hover:bg-white/[0.09] border border-white/12 rounded-2xl px-5 py-4 transition-colors"
            >
              <span className="w-12 h-12 rounded-xl bg-cobalt/25 text-sky flex items-center justify-center shrink-0 group-hover:bg-cobalt group-hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  {c.icon}
                </svg>
              </span>
              <span className="flex flex-col">
                <span className="text-white/60 text-[13px]">{c.label}</span>
                <span className="text-white font-semibold text-[16.5px]">{c.value}</span>
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
