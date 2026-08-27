"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      className={`inline-flex items-center justify-center text-on-background/80 hover:text-primary transition-colors duration-400 ${className}`}
    >
      <span className="material-symbols-outlined text-[22px]">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
