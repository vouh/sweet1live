"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firstAllowedPath } from "@/lib/staffPermissions";
import { getStaffSession, staffForgotPassword, staffLogin } from "@/lib/staffAuth";
import {
  INPUT_LIMITS,
  validateLoginEmail,
  validateLoginPassword,
} from "@/lib/inputValidation";

type View = "signin" | "forgot";

export default function AdminLoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const session = getStaffSession();
    if (session) {
      router.replace(session.is_super_admin ? "/staff-dashboard" : firstAllowedPath(session.permissions, "/portal", false));
    }
  }, [router]);

  function switchView(next: View) {
    setView(next);
    setError("");
    setInfo("");
    setPending(false);
    if (next === "forgot" && email.trim()) {
      setResetEmail(email.trim());
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const emailErr = validateLoginEmail(email);
    const passwordErr = validateLoginPassword(password);
    if (emailErr || passwordErr) {
      setError(emailErr ?? passwordErr ?? "Check your details and try again.");
      return;
    }
    setPending(true);
    try {
      const user = await staffLogin(email, password);
      router.replace(
        user.is_super_admin ? "/staff-dashboard" : firstAllowedPath(user.permissions, "/portal", false)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      setPending(false);
    }
  }

  async function onForgot(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    const emailErr = validateLoginEmail(resetEmail);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    setPending(true);
    try {
      const message = await staffForgotPassword(resetEmail);
      setInfo(message);
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
              Enter your staff email. You&apos;ll receive an email with a reset link.
            </p>
          ) : (
            <div className="mb-8" />
          )}

          {view === "signin" ? (
            <form onSubmit={onSubmit} className="flex flex-col gap-6" autoComplete="off">
              <label className="block">
                <span className="font-label-caps text-[11px] tracking-[0.22em] uppercase text-[#c45c3a]">Email</span>
                <input
                  type="email"
                  required
                  maxLength={INPUT_LIMITS.email}
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.slice(0, INPUT_LIMITS.email))}
                  className="admin-login__input mt-2"
                />
              </label>
              <label className="block">
                <span className="font-label-caps text-[11px] tracking-[0.22em] uppercase text-[#c45c3a]">Password</span>
                <div className="admin-login__password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    maxLength={INPUT_LIMITS.password}
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.slice(0, INPUT_LIMITS.password))}
                    className="admin-login__input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="admin-login__toggle font-label-caps"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              {error && <p className="text-sm text-[#c45c3a]">{error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="self-center rounded-full bg-[#c45c3a] text-white font-label-caps text-[12px] tracking-[0.22em] uppercase px-8 sm:px-12 py-3.5 shadow-[0_14px_28px_-8px_rgba(196,92,58,0.7)] hover:opacity-95 disabled:opacity-60"
              >
                {pending ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={onForgot} className="flex flex-col gap-6" autoComplete="off">
              <label className="block">
                <span className="font-label-caps text-[11px] tracking-[0.22em] uppercase text-[#c45c3a]">Email</span>
                <input
                  type="email"
                  required
                  maxLength={INPUT_LIMITS.email}
                  autoComplete="off"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value.slice(0, INPUT_LIMITS.email))}
                  className="admin-login__input mt-2"
                />
              </label>
              {error && <p className="text-sm text-[#c45c3a]">{error}</p>}
              {info && <p className="text-sm text-[#2c1810]/70">{info}</p>}
              <button
                type="submit"
                disabled={pending}
                className="self-center rounded-full bg-[#c45c3a] text-white font-label-caps text-[12px] tracking-[0.22em] uppercase px-8 sm:px-12 py-3.5 disabled:opacity-60"
              >
                {pending ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-8 text-center">
            {view === "signin" ? (
              <button type="button" onClick={() => switchView("forgot")} className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[#2c1810]/40 hover:text-[#2c1810]">
                Forgot password?
              </button>
            ) : (
              <button type="button" onClick={() => switchView("signin")} className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[#2c1810]/40 hover:text-[#2c1810]">
                Back to sign in
              </button>
            )}
          </p>
        </section>

        <aside className="admin-login__brand relative z-20 md:absolute md:left-0 md:top-0 md:bottom-0 md:w-[46%] mb-[-1.25rem] md:mb-0 rounded-[28px] bg-gradient-to-b from-[#3d281f] via-[#2c1810] to-[#1a100c] text-[#f5efe8] px-8 py-10 md:px-9 md:py-11 flex flex-col items-center justify-between shadow-[12px_0_40px_-18px_rgba(26,16,12,0.55)]">
          <div className="admin-login__logo flex-1 w-full flex flex-col items-center justify-center min-h-[180px] md:min-h-0">
            <Image src="/images/sweet1nelive_logo-transparent.png" alt="Sweet1ne Live" width={1774} height={887} priority className="w-[78%] max-w-[280px] h-auto max-h-[48%] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]" />
          </div>
          <p className="shrink-0 font-label-caps text-[12px] md:text-[13px] tracking-[0.35em] uppercase text-[#d4a574] text-center pb-1">Staff login</p>
        </aside>
      </div>
    </div>
  );
}
