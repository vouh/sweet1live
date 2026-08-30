"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { staffSetPassword } from "@/lib/staffAuth";

import { passwordIssues } from "@/lib/passwordPolicy";
import { INPUT_LIMITS } from "@/lib/inputValidation";

export default function SetPasswordForm({ accessToken }: { accessToken?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const token = accessToken ?? params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  const issues = useMemo(() => passwordIssues(password), [password]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("This link is missing a token. Ask your admin to resend the invite.");
      return;
    }
    if (issues.length > 0) {
      setError("Choose a stronger password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      await staffSetPassword(token, password);
      setDone(true);
      window.setTimeout(() => router.replace("/admin/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-login min-h-screen flex items-center justify-center px-4 py-12 bg-[#e8e0d6]">
      <div className="admin-login__frame relative w-full max-w-[940px] md:min-h-[520px]">
        <section className="admin-login__form relative z-10 md:absolute md:right-0 md:top-[18px] md:bottom-[18px] md:w-[58%] rounded-[28px] md:rounded-l-none md:rounded-r-[28px] bg-white shadow-[0_28px_70px_-24px_rgba(44,24,16,0.35)] px-8 py-10 md:px-12 md:py-12 flex flex-col justify-center">
          <h2 className="font-headline-lg text-[32px] md:text-[36px] text-[#2c1810] mb-2">Set your password</h2>
          <p className="mb-8 text-sm text-[#2c1810]/55 leading-relaxed">
            Choose a strong password before you sign in to the staff portal.
          </p>

          {done ? (
            <p className="text-sm text-center text-[#2c1810]/70">Password saved. Redirecting to sign in…</p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-6" autoComplete="off">
              <label className="block">
                <span className="font-label-caps text-[11px] tracking-[0.22em] uppercase text-[#c45c3a]">New password</span>
                <div className="admin-login__password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    maxLength={INPUT_LIMITS.password}
                    autoComplete="new-password"
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
              <label className="block">
                <span className="font-label-caps text-[11px] tracking-[0.22em] uppercase text-[#c45c3a]">Confirm password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  maxLength={INPUT_LIMITS.password}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value.slice(0, INPUT_LIMITS.password))}
                  className="admin-login__input mt-2"
                />
              </label>
              {password && issues.length > 0 && (
                <ul className="text-xs text-[#2c1810]/55 list-disc pl-5 space-y-1">
                  {issues.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {error && <p className="text-sm text-[#c45c3a]">{error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="self-center rounded-full bg-[#c45c3a] text-white font-label-caps text-[12px] tracking-[0.22em] uppercase px-12 py-3.5 shadow-[0_14px_28px_-8px_rgba(196,92,58,0.7)] hover:opacity-95 disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save password"}
              </button>
            </form>
          )}
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
            Staff portal
          </p>
        </aside>
      </div>
    </div>
  );
}
