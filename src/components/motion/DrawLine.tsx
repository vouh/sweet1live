"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Decorative line that draws as the user scrolls through a section.
 * Place as a sibling or absolute child; SVG path scales with the container.
 */
export default function DrawLine({
  className = "",
  orientation = "vertical",
}: {
  className?: string;
  orientation?: "vertical" | "horizontal";
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const path = pathRef.current;
    if (!wrap || !path) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      path.style.strokeDashoffset = "0";
      return;
    }

    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    const ctx = gsap.context(() => {
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top 80%",
          end: "bottom 20%",
          scrub: 0.6,
        },
      });
    }, wrap);

    return () => ctx.revert();
  }, [orientation]);

  const isVert = orientation === "vertical";

  return (
    <div
      ref={wrapRef}
      className={`pointer-events-none ${className}`}
      aria-hidden
    >
      <svg
        className="h-full w-full overflow-visible"
        viewBox={isVert ? "0 0 2 100" : "0 0 100 2"}
        preserveAspectRatio="none"
      >
        <path
          ref={pathRef}
          d={isVert ? "M1 0 V100" : "M0 1 H100"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
