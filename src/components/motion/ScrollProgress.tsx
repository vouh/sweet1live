"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Thin progress line along the left edge of the page, driven by scroll. */
export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.transform = "scaleY(1)";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.35,
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[70] h-full w-px bg-outline-variant/20"
      aria-hidden
    >
      <div
        ref={ref}
        className="h-full w-full origin-top bg-primary"
        style={{ transform: "scaleY(0)" }}
      />
    </div>
  );
}
