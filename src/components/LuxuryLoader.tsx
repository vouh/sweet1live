"use client";

type LuxuryLoaderProps = {
  label?: string;
  /** fullscreen = site preloader; panel = admin card; minimal = shell boot */
  variant?: "fullscreen" | "panel" | "minimal";
  className?: string;
};

/** Gold wavy dots — no logo, no spinners. */
export default function LuxuryLoader({
  label,
  variant = "panel",
  className = "",
}: LuxuryLoaderProps) {
  const isMinimal = variant === "minimal";

  return (
    <div
      className={`luxury-loader luxury-loader--${variant} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label ?? "Loading"}
    >
      <div className="luxury-loader__inner">
        <div className="luxury-loader__dots" aria-hidden>
          <span className="luxury-loader__dot" />
          <span className="luxury-loader__dot" />
          <span className="luxury-loader__dot" />
        </div>
        {label && !isMinimal && (
          <p className="luxury-loader__label">{label}</p>
        )}
      </div>
    </div>
  );
}
