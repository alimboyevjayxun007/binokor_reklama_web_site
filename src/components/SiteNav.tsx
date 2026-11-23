import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { scrollToId } from "../lib/motion";

const LINKS = [
  { id: "mahsulotlar", label: "Mahsulotlar" },
  { id: "afzalliklar", label: "Afzalliklar" },
  { id: "ai-agent", label: "AI agent" },
  { id: "ishga-tushirish", label: "Ishga tushirish" },
];

export default function SiteNav({ ready }: { ready: boolean }) {
  const bar = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      // the section that covers the middle of the screen
      const mid = window.innerHeight * 0.45;
      let cur: string | null = null;
      for (const l of LINKS) {
        const el = document.getElementById(l.id);
        if (!el) continue;
        const r = (el.closest(".pin-spacer") ?? el).getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) cur = l.id;
      }
      setActive((a) => (a === cur ? a : cur));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollToId(id);
  };

  return (
    <motion.div
      initial={{ y: -90, opacity: 0 }}
      animate={ready ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
      className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
    >
      <header className="relative w-full max-w-[1120px] rounded-2xl bg-white/90 backdrop-blur-xl shadow-[0_12px_40px_-12px_rgba(6,11,26,0.35)] overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-5 py-3">
          <a href="#top" onClick={go("top")} className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 21V9L12 3L21 9V21H14V14H10V21H3Z" stroke="#5B8CFF" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="font-display font-bold text-[17px] text-navy tracking-tight">Binokor</span>
          </a>

          <nav className="hidden md:flex items-center gap-1" aria-label="Asosiy">
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={go(l.id)}
                aria-current={active === l.id ? "true" : undefined}
                className={`text-[14px] px-3.5 py-2 rounded-lg transition-colors font-medium ${
                  active === l.id ? "text-navy bg-navy/[0.07]" : "text-navy/70 hover:text-navy hover:bg-navy/5"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#demo"
              onClick={go("demo")}
              className="text-[14px] font-semibold px-4 py-2.5 rounded-xl bg-cobalt text-white hover:bg-cobaltdeep transition-colors"
            >
              Bog'lanish
            </a>
            <button
              type="button"
              aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="md:hidden w-10 h-10 rounded-xl bg-navy/5 flex flex-col items-center justify-center gap-1.5"
            >
              <span className={`w-4 h-[2px] bg-navy transition-transform ${open ? "translate-y-[4px] rotate-45" : ""}`} />
              <span className={`w-4 h-[2px] bg-navy transition-transform ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
            </button>
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="md:hidden overflow-hidden border-t border-navy/10"
              aria-label="Mobil"
            >
              <div className="flex flex-col p-3">
                {LINKS.map((l) => (
                  <a key={l.id} href={`#${l.id}`} onClick={go(l.id)} className="px-3 py-3 rounded-lg text-navy font-semibold text-[16px] hover:bg-navy/5">
                    {l.label}
                  </a>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
        <div className="absolute left-0 right-0 bottom-0 h-[2px]">
          <div ref={bar} className="h-full bg-cobalt origin-left" style={{ transform: "scaleX(0)" }} />
        </div>
      </header>
    </motion.div>
  );
}
