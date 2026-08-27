"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type ArrowCarouselProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  /** Chocolate-styled arrow buttons (venue hire). */
  variant?: "default" | "chocolate";
};

/**
 * Horizontal card rail with prev / next arrow controls.
 */
export default function ArrowCarousel({
  title,
  subtitle,
  children,
  className = "",
  trackClassName = "",
  variant = "default",
}: ArrowCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(max > 4 && el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    const t = window.setTimeout(updateArrows, 200);
    return () => {
      window.clearTimeout(t);
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, children]);

  const scroll = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.82, 480);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const btnClass =
    variant === "chocolate" ? "arrow-carousel__btn arrow-carousel__btn--chocolate" : "arrow-carousel__btn";

  return (
    <section className={`arrow-carousel ${className}`}>
      {(title || subtitle) && (
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter mb-8 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            {title && (
              <h2 className="font-headline-lg text-[26px] md:text-[40px] uppercase tracking-[0.04em]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="font-body-md text-body-md text-on-surface-variant mt-3">{subtitle}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scroll(-1)}
              disabled={!canPrev}
              aria-label="Scroll left"
              className={btnClass}
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              disabled={!canNext}
              aria-label="Scroll right"
              className={btnClass}
            >
              <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      <div
        ref={trackRef}
        className={`arrow-carousel__track flex gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-1 ${trackClassName}`}
      >
        {children}
      </div>
    </section>
  );
}
