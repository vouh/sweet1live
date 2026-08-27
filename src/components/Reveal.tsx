"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type Variant = "up" | "left" | "right" | "scale" | "blur" | "clip";

const VARIANT_CLASS: Record<Variant, string> = {
  up: "reveal-up",
  left: "reveal-left",
  right: "reveal-right",
  scale: "reveal-scale",
  blur: "reveal-blur",
  clip: "reveal-clip",
};

/**
 * Fades/slides its children in the first time they scroll into view.
 * Stays visible afterwards — the observer disconnects on first hit so
 * content never re-animates or flickers on scroll-up.
 */
export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  /** Stagger in milliseconds. */
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No reduced-motion branch needed here: the `prefers-reduced-motion`
    // block in globals.css already pins .reveal to its resting state, so
    // the observer simply never has a visible effect for those users.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-visible={visible}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={`reveal ${VARIANT_CLASS[variant]} ${className}`}
    >
      {children}
    </Tag>
  );
}
