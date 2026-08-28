"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type LazyBackgroundProps = {
  src: string;
  className?: string;
  style?: CSSProperties;
  /** Load immediately (hero, above-the-fold). */
  priority?: boolean;
  children?: ReactNode;
};

/** Defers background-image until near the viewport — keeps initial page load fast. */
export default function LazyBackground({
  src,
  className = "",
  style,
  priority = false,
  children,
}: LazyBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(priority);

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
      { rootMargin: "280px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [priority, active]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        backgroundColor: active ? undefined : "var(--surface-container-low, #2c1810)",
        backgroundImage: active ? `url('${src}')` : undefined,
        backgroundSize: style?.backgroundSize ?? "cover",
        backgroundPosition: style?.backgroundPosition ?? "center",
      }}
    >
      {children}
    </div>
  );
}
