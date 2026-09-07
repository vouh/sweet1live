"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { PUBLIC_ACCOUNTS_ENABLED } from "@/lib/features";

export type AuthModalView = "signin" | "signup" | "forgot" | null;

type AuthModalContextValue = {
  view: AuthModalView;
  open: (view: Exclude<AuthModalView, null>) => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AuthModalView>(null);

  const open = useCallback((next: Exclude<AuthModalView, null>) => {
    if (PUBLIC_ACCOUNTS_ENABLED) setView(next);
  }, []);
  const close = useCallback(() => setView(null), []);

  useEffect(() => {
    if (!view) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [view, close]);

  const value = useMemo(() => ({ view, open, close }), [view, open, close]);

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
