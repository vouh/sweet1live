"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { responsiveSources } from "@/lib/images";

type LazyBackgroundProps = {
  src: string;
  className?: string;
  style?: CSSProperties;
  /** Load immediately (hero, above-the-fold). */
  priority?: boolean;
  children?: ReactNode;
};

/** Defers background-image until near the viewport + serves responsive WebP sizes. */
export default function LazyBackground({
  src,
  className = "",
  style,
  priority = false,
  children,
}: LazyBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(priority);
  const sources = responsiveSources(src);

  useEffect(() => {
    if (priority || active) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [priority, active]);

  return (
    <div
      ref={ref}
      className={`opt-bg ${active ? "opt-bg--on" : ""} ${className}`.trim()}
      style={{
        ...style,
        backgroundColor: active ? style?.backgroundColor : "var(--surface-container-low, #2c1810)",
        ["--opt-bg-sm" as string]: active ? `url('${sources.sm}')` : "none",
        ["--opt-bg-md" as string]: active ? `url('${sources.md}')` : "none",
        ["--opt-bg-lg" as string]: active ? `url('${sources.lg}')` : "none",
        backgroundSize: style?.backgroundSize ?? "cover",
        backgroundPosition: style?.backgroundPosition ?? "center",
      }}
    >
      {children}
    </div>
  );
}
