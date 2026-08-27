"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Vertical scroll drives the image rail left/right — slowly.
 * Pins the block (header + strip + footer) so every frame can be seen
 * before the page moves on; no orphan white gap below.
 */
export default function HorizontalScroll({
  children,
  header,
  footer,
  className = "",
  trackClassName = "",
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  trackClassName?: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const mobile = window.matchMedia("(max-width: 767px)").matches;

    const getTravel = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

    const ctx = gsap.context(() => {
      // Longer vertical distance = slower horizontal drift; last frames still reach the end.
      const scrollLength = () => {
        const travel = getTravel();
        if (mobile) {
          return Math.max(travel * 1.6, window.innerHeight * 1.1);
        }
        return Math.max(travel * 2.4, window.innerHeight * 2);
      };

      gsap.fromTo(
        track,
        { x: 0 },
        {
          x: () => -getTravel(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: mobile ? "top 70%" : "top top",
            end: () => `+=${scrollLength()}`,
            scrub: mobile ? 1.1 : 1.35,
            pin: !mobile,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        }
      );
    }, section);

    const refresh = () => ScrollTrigger.refresh();
    const t1 = window.setTimeout(refresh, 120);
    const t2 = window.setTimeout(refresh, 600);
    window.addEventListener("load", refresh);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, [children, header, footer]);

  return (
    <div ref={sectionRef} className={`relative ${className}`}>
      {header}
      <div ref={viewportRef} className="relative overflow-hidden">
        <div
          ref={trackRef}
          className={`flex flex-nowrap w-max gap-4 md:gap-5 will-change-transform ${trackClassName}`}
        >
          {children}
        </div>
      </div>
      {footer}
    </div>
  );
}
