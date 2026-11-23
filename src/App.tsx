import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Canvas, advance } from "@react-three/fiber";
import { View } from "@react-three/drei";
import * as THREE from "three";

import SiteNav from "./components/SiteNav";
import SiteFooter from "./components/SiteFooter";
import Preloader from "./components/Preloader";
import Marquee from "./components/Marquee";
import Stage from "./sections/Stage";
import ProductsTrack from "./sections/ProductsTrack";
import BenefitsChapter from "./sections/BenefitsChapter";
import AIChapter from "./sections/AIChapter";
import Onboarding from "./sections/Onboarding";
import Finale from "./sections/Finale";
import { store } from "./three/store";
import { lenisRef } from "./lib/motion";

gsap.registerPlugin(ScrollTrigger);

const IS_PHONE = typeof window !== "undefined" && (window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches);

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Lenis drives the scroll; one GSAP ticker drives Lenis, ScrollTrigger and WebGL
  // in the same frame so the 3D never lags behind the page.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: Lenis | null = null;
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
      lenis.on("scroll", (l: Lenis) => {
        store.velocity = l.velocity;
        ScrollTrigger.update();
      });
      lenis.stop();
      lenisRef.current = lenis;
    }
    const tick = (time: number) => {
      lenis?.raf(time * 1000);
      if (!lenis) store.velocity *= 0.9;
      advance(time);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onMove = (e: PointerEvent) => {
      store.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      store.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("load", refresh);
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, []);

  const onLoaded = useCallback(() => {
    setReady(true);
    window.scrollTo(0, 0);
    lenisRef.current?.start();
    gsap.to(store, { intro: 1, duration: 2.4, ease: "power3.out" });
    ScrollTrigger.refresh();
  }, []);

  return (
    <div ref={root} className="font-body bg-navy" style={{ overflowX: "clip" }}>
      <Preloader onDone={onLoaded} />
      <SiteNav ready={ready} />
      <main>
        <Stage ready={ready} />
        <Marquee />
        <ProductsTrack />
        <BenefitsChapter />
        <AIChapter />
        <Onboarding />
        <Finale />
      </main>
      <SiteFooter />

      <Canvas
        frameloop="never"
        eventSource={root as React.RefObject<HTMLElement>}
        dpr={IS_PHONE ? [1, 1.3] : [1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        shadows={{ type: THREE.PCFShadowMap }}
        onCreated={({ gl }) => {
          // phones: skip shadow maps, the soft contact blobs carry the grounding
          gl.shadowMap.enabled = !IS_PHONE;
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 0.95;
          gl.setClearColor(0x000000, 0);
        }}
        style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 5 }}
      >
        <View.Port />
      </Canvas>
    </div>
  );
}
