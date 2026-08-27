"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll-driven parallax. The wrapper clips; the inner layer is scaled up
 * slightly and translated against the scroll direction, so the image
 * drifts more slowly than the page.
 *
 * Uses rAF-throttled reads and only touches a CSS custom property, so the
 * browser can keep the transform on the compositor.
 */
export default function Parallax({
  children,
  /** 0 = pinned to page, 1 = very pronounced drift. */
  speed = 0.25,
  /** Overflow headroom so translated edges never expose a gap. */
  scale = 1.18,
  className = "",
  innerClassName = "",
}: {
  children: ReactNode;
  speed?: number;
  scale?: number;
  className?: string;
  innerClassName?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const layer = layerRef.current;
    if (!wrap || !layer) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let inView = true;

    const update = () => {
      frame = 0;
      if (!inView) return;
      const rect = wrap.getBoundingClientRect();
      // Distance of the element's centre from the viewport centre.
      const fromCentre = rect.top + rect.height / 2 - window.innerHeight / 2;
      layer.style.setProperty("--parallax-y", `${-fromCentre * speed}px`);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    // Skip work entirely while the section is off-screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) onScroll();
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(wrap);

    layer.style.setProperty("--parallax-scale", String(scale));
    update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [speed, scale]);

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`}>
      <div ref={layerRef} className={`parallax-layer h-full w-full ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}
