"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStaffSession, staffLoginForTesting } from "@/lib/staffAuth";

/** Hardcoded testing credentials — shown as plain text (Chrome can't blank these). */
const DEMO_EMAIL = "staff@sweet1ne.com";
const DEMO_PASSWORD = "sweet1ne";

type View = "signin" | "forgot";

export default function AdminLoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("signin");
  const [resetEmail, setResetEmail] = useState(DEMO_EMAIL);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (getStaffSession()) {
      router.replace("/staff-dashboard");
    }
  }, [router]);

  function switchView(next: View) {
    setView(next);
    setError("");
    setInfo("");
    setPending(false);
    if (next === "forgot") {
      setResetEmail(DEMO_EMAIL);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      // Always use hardcoded testing logins — ignore Chrome autofill state
      staffLoginForTesting(DEMO_EMAIL, DEMO_PASSWORD);
      router.replace("/staff-dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      setPending(false);
    }
  }

  async function onForgot(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setPending(true);
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: (resetEmail.trim() || DEMO_EMAIL) }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error || "Could not send reset link.");
      }
      setInfo(
        data.message ||
          "An email with a reset link is on its way. Open it to choose a new password."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset link.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-login min-h-screen flex items-center justify-center px-4 py-12 bg-[#e8e0d6]">
      <div className="admin-login__frame relative w-full max-w-[940px] md:min-h-[520px]">
        <section className="admin-login__form relative z-10 md:absolute md:right-0 md:top-[18px] md:bottom-[18px] md:w-[58%] rounded-[28px] md:rounded-l-none md:rounded-r-[28px] bg-white shadow-[0_28px_70px_-24px_rgba(44,24,16,0.35)] px-8 py-10 md:px-12 md:py-12 flex flex-col justify-center">
          <h2 className="font-headline-lg text-[32px] md:text-[36px] text-[#2c1810] mb-2">
            {view === "forgot" ? "Reset password" : "Sign in"}
          </h2>
          {view === "forgot" ? (
            <p className="mb-8 text-sm text-[#2c1810]/55 leading-relaxed">
              Enter your email and we’ll send a reset link. Open it to choose a new password.
            </p>
          ) : (
            <div className="mb-8" />
          )}

          {view === "signin" ? (
            <form onSubmit={onSubmit} className="flex flex-col gap-9" autoComplete="off">
              {/* Plain text rows — not <input>, so Chrome cannot hide/blank them */}
              <div className="block">
                <span className="font-label-caps text-[11px] tracking-[0.22em] uppercase text-[#c45c3a]">
                  Email
                </span>
                <p
                  className="admin-login__visible-field mt-2 w-full rounded-lg border border-[#d4a574]/50 bg-[#f8f3ed] px-3 py-3 text-[16px] font-medium text-[#2c1810] select-text"
                  aria-label="Email"
                >
                  {DEMO_EMAIL}
                </p>
              </div>

              <div className="block">
                <span className="font-label-caps text-[11px] tracking-[0.22em] uppercase text-[#c45c3a]">
                  Password
                </span>
                <p
                  className="admin-login__visible-field mt-2 w-full rounded-lg border border-[#d4a574]/50 bg-[#f8f3ed] px-3 py-3 text-[16px] font-medium text-[#2c1810] select-text"
                  aria-label="Password"
                >
                  {DEMO_PASSWORD}
                </p>
              </div>

              {error && <p className="text-sm text-[#c45c3a] -mt-4">{error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="mt-1 self-center rounded-full bg-[#c45c3a] text-white font-label-caps text-[12px] tracking-[0.22em] uppercase px-12 py-3.5 shadow-[0_14px_28px_-8px_rgba(196,92,58,0.7)] hover:opacity-95 disabled:opacity-60 transition-opacity"
              >
                {pending ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={onForgot} className="flex flex-col gap-9" autoComplete="off">
              <label className="block">
                <span className="font-label-caps text-[11px] tracking-[0.22em] uppercase text-[#c45c3a]">
                  Email
                </span>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="admin-login__input mt-2 w-full rounded-lg border border-[#d4a574]/50 bg-[#f8f3ed] px-3 py-3 text-[16px] font-medium text-[#2c1810] focus:outline-none focus:border-[#c45c3a]"
                />
              </label>

              {error && <p className="text-sm text-[#c45c3a] -mt-4">{error}</p>}
              {info && <p className="text-sm text-[#2c1810]/70 -mt-4">{info}</p>}

              <button
                type="submit"
                disabled={pending}
                className="mt-1 self-center rounded-full bg-[#c45c3a] text-white font-label-caps text-[12px] tracking-[0.22em] uppercase px-12 py-3.5 shadow-[0_14px_28px_-8px_rgba(196,92,58,0.7)] hover:opacity-95 disabled:opacity-60 transition-opacity"
              >
                {pending ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-8 text-center">
            {view === "signin" ? (
              <button
                type="button"
                onClick={() => switchView("forgot")}
                className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[#2c1810]/40 hover:text-[#2c1810] transition-colors"
              >
                Forgot password?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchView("signin")}
                className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[#2c1810]/40 hover:text-[#2c1810] transition-colors"
              >
                Back to sign in
              </button>
            )}
          </p>
        </section>

        <aside className="admin-login__brand relative z-20 md:absolute md:left-0 md:top-0 md:bottom-0 md:w-[46%] mb-[-1.25rem] md:mb-0 rounded-[28px] bg-gradient-to-b from-[#3d281f] via-[#2c1810] to-[#1a100c] text-[#f5efe8] px-8 py-10 md:px-9 md:py-11 flex flex-col items-center justify-between shadow-[12px_0_40px_-18px_rgba(26,16,12,0.55)]">
          <div className="admin-login__logo flex-1 w-full flex flex-col items-center justify-center min-h-[180px] md:min-h-0">
            <Image
              src="/images/logo.png"
              alt="Sweet1ne"
              width={1536}
              height={1024}
              priority
              className="w-[78%] max-w-[280px] h-auto max-h-[48%] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            />
            <span className="font-label-caps text-[10px] md:text-[11px] font-semibold tracking-[0.55em] uppercase text-[#d4a574] -mt-1">
              Live
            </span>
          </div>

          <p className="shrink-0 font-label-caps text-[12px] md:text-[13px] tracking-[0.35em] uppercase text-[#d4a574] text-center pb-1">
            Staff login
          </p>
        </aside>
      </div>
    </div>
  );
}
