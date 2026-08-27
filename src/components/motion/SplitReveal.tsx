"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Splits text into lines (via word wrapping spans) and reveals each on scroll.
 * Pass a string; preserves readability when motion is reduced.
 */
export default function SplitReveal({
  text,
  as: Tag = "h2",
  className = "",
  accentWord,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  /** Optional word rendered in primary colour when revealed. */
  accentWord?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lines = el.querySelectorAll<HTMLElement>("[data-line]");

    if (reduce) {
      lines.forEach((line) => {
        line.style.opacity = "1";
        line.style.transform = "none";
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lines,
        { y: "110%", opacity: 0 },
        {
          y: "0%",
          opacity: 1,
          duration: 1.05,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [text]);

  const words = text.split(" ");

  return (
    <Tag ref={ref as never} className={className}>
      <span className="block overflow-hidden">
        <span data-line className="inline-block will-change-transform">
          {words.map((word, i) => {
            const isAccent =
              accentWord && word.replace(/[^\w]/g, "").toLowerCase() === accentWord.toLowerCase();
            return (
              <span key={`${word}-${i}`}>
                <span className={isAccent ? "text-primary" : undefined}>{word}</span>
                {i < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      </span>
    </Tag>
  );
}
