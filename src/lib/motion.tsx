import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import type Lenis from "lenis";

export const lenisRef: { current: Lenis | null } = { current: null };
export const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Word-by-word mask reveal. With `ready` it plays when ready turns true,
 * otherwise when the text scrolls into view.
 */
export function RevealText({
  text,
  className = "",
  as = "h2",
  ready,
  delay = 0,
  stagger = 0.045,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  ready?: boolean;
  delay?: number;
  stagger?: number;
}) {
  const Tag = motion[as];
  const words = text.split(" ");
  const controlled = ready !== undefined;
  return (
    <Tag
      className={className}
      initial="hidden"
      {...(controlled ? { animate: ready ? "show" : "hidden" } : { whileInView: "show", viewport: { once: true, amount: 0.4 } })}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]" aria-hidden="true">
          <motion.span
            className="inline-block will-change-transform"
            variants={{
              hidden: { y: "110%", rotate: 4 },
              show: { y: "0%", rotate: 0, transition: { duration: 1, ease: EASE, delay: delay + i * stagger } },
            }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}

/** A link that leans toward the pointer. */
export function MagneticLink({
  href,
  children,
  className = "",
  strength = 0.35,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenisRef.current) lenisRef.current.scrollTo(el, { duration: 1.6 });
  else el.scrollIntoView({ behavior: "smooth" });
}
