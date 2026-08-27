"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LENIS_SCROLL_ROOT } from "@/components/motion/SmoothScroll";

gsap.registerPlugin(ScrollTrigger);

/**
 * Footer scrubs up over the sticky BrandCloser.
 */
export default function ScrollFooterReveal({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const brandCloser = document.getElementById("brand-closer");
    if (!brandCloser) return;

    const scroller = LENIS_SCROLL_ROOT ?? undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: 100, immediateRender: false },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: brandCloser,
            scroller,
            start: "top 65%",
            end: "bottom top",
            scrub: 0.55,
            invalidateOnRefresh: true,
          },
        }
      );
    });

    const refresh = () => ScrollTrigger.refresh();
    refresh();
    const t = window.setTimeout(refresh, 300);

    return () => {
      window.clearTimeout(t);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={wrapRef} className="scroll-footer-reveal relative z-20">
      {children}
    </div>
  );
}
