"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

/** Chocolate cover shrinks away on scroll — stays inside the image frame only. */
export default function ImageBrownSwipe({
  imageSrc,
  className = "",
  reverse = false,
}: {
  imageSrc: string;
  className?: string;
  /** Image sits on the left — wipe exits toward the left. */
  reverse?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const shade = shadeRef.current;
      if (!root || !shade) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const origin = reverse ? "100% 50%" : "0% 50%";

      if (reduce) {
        gsap.set(shade, { scaleX: 0, transformOrigin: origin });
        return;
      }

      gsap.set(shade, { scaleX: 1, transformOrigin: origin });

      gsap.to(shade, {
        scaleX: 0,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: root,
          start: "top 92%",
          end: "top 20%",
          scrub: 0.85,
        },
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: rootRef, dependencies: [imageSrc, reverse] }
  );

  return (
    <div ref={rootRef} className={`events-image-swipe ${className}`}>
      <div
        className="events-image-swipe__photo absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${imageSrc}')` }}
      />
      <div
        ref={shadeRef}
        className="events-image-swipe__shade absolute inset-0 z-[1] will-change-transform"
        aria-hidden="true"
      />
    </div>
  );
}
