"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Lenis scroll root — used by all ScrollTrigger instances. */
export const LENIS_SCROLL_ROOT =
  typeof document !== "undefined" ? document.documentElement : null;

function isAdminPath(pathname: string | null) {
  return Boolean(
    pathname?.startsWith("/staff-dashboard") || pathname?.startsWith("/admin")
  );
}

/**
 * Smooth scrolling (Lenis) + GSAP ScrollTrigger sync.
 * Disabled on staff/admin routes — those shells use their own scroll panels.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const adminRoute = isAdminPath(pathname);

  useEffect(() => {
    if (adminRoute) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        ScrollTrigger.scrollerProxy(document.documentElement, {});
      }
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const root = document.documentElement;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    ScrollTrigger.scrollerProxy(root, {
      scrollTop(value) {
        if (typeof value === "number") {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    const onResize = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    requestAnimationFrame(() => ScrollTrigger.refresh());
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 250);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(ticker);
      lenis.destroy();
      lenisRef.current = null;
      ScrollTrigger.scrollerProxy(root, {});
    };
  }, [adminRoute]);

  return <>{children}</>;
}
