"use client";

type ScrollDownCueProps = {
  targetId: string;
  label?: string;
  hint?: string;
};

/** Animated down arrows — click or tap scrolls to the target section. */
export default function ScrollDownCue({
  targetId,
  label = "Book below",
  hint = "Scroll to choose your date, time, and party size.",
}: ScrollDownCueProps) {
  const scrollToTarget = () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTarget}
      className="scroll-down-cue group mt-10 flex flex-col items-center gap-3 text-white/90 hover:text-white transition-colors"
      aria-label={`${label}. ${hint}`}
    >
      <span className="font-label-caps text-[11px] uppercase tracking-[0.32em]">{label}</span>
      <p className="font-body-md text-[14px] md:text-[15px] text-white/75 max-w-xs leading-relaxed px-4">
        {hint}
      </p>
      <span className="scroll-down-cue__arrows flex flex-col items-center gap-0.5" aria-hidden="true">
        <span className="material-symbols-outlined text-[28px] scroll-down-cue__chevron">
          keyboard_arrow_down
        </span>
        <span className="material-symbols-outlined text-[22px] scroll-down-cue__chevron scroll-down-cue__chevron--delay">
          keyboard_arrow_down
        </span>
      </span>
    </button>
  );
}
