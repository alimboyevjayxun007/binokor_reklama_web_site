import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const WORDS = ["G'isht", "Sement", "Armatura", "Kafel", "Bo'yoq", "Binokor"];

export default function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [word, setWord] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setGone(true);
      onDone();
      return;
    }
    const obj = { v: 0 };
    const tl = gsap.timeline();
    tl.to(obj, {
      v: 100,
      duration: 2.1,
      ease: "power2.inOut",
      onUpdate: () => {
        const v = Math.round(obj.v);
        setCount(v);
        setWord(Math.min(WORDS.length - 1, Math.floor((v / 100) * WORDS.length)));
        if (bar.current) bar.current.style.transform = `scaleX(${obj.v / 100})`;
      },
    })
      .to(root.current, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "+=0.15")
      .add(() => onDone(), "-=0.55")
      .add(() => setGone(true));
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[100] bg-navy text-white flex flex-col justify-between p-6 md:p-10">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-lg bg-cobalt flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 21V9L12 3L21 9V21H14V14H10V21H3Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="font-display font-bold text-[18px]">Binokor</span>
      </div>

      <div className="font-display text-[13vw] md:text-[9vw] font-bold leading-none tracking-tight text-white/10 select-none" aria-hidden="true">
        {WORDS[word]}
      </div>

      <div>
        <div className="flex items-end justify-between mb-4">
          <span className="text-[14px] text-white/50 font-body">Qurilish savdosi uchun tizim yuklanmoqda</span>
          <span className="font-display text-[64px] md:text-[96px] font-bold leading-none tabular-nums">{count}</span>
        </div>
        <div className="h-[3px] bg-white/10 overflow-hidden rounded-full">
          <div ref={bar} className="h-full bg-cobalt origin-left" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </div>
  );
}
