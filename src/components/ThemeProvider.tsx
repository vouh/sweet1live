"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { THEME_STORAGE_KEY, themeCookieValue, type Theme } from "@/lib/theme";

export type { Theme };

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

function persistTheme(theme: Theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.cookie = themeCookieValue(theme);
}

export function ThemeProvider({
  children,
  initialTheme = "dark",
}: {
  children: ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const next: Theme = stored === "light" ? "light" : stored === "dark" ? "dark" : initialTheme;
    setThemeState(next);
    applyTheme(next);
    persistTheme(next);
  }, [initialTheme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    persistTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
