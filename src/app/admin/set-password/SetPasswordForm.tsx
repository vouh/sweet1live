"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { staffSetPassword } from "@/lib/staffAuth";

import { passwordIssues } from "@/lib/passwordPolicy";
import { INPUT_LIMITS } from "@/lib/inputValidation";

export default function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
      <div className="w-full max-w-md admin-panel p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <Image src="/images/logo.png" alt="Sweet1ne" width={200} height={120} className="h-12 w-auto mb-2" />
          <h1 className="font-headline-md text-[24px]">Set your password</h1>
          <p className="text-sm text-[var(--admin-muted)] text-center mt-2">
            Choose a strong password before you sign in to the staff portal.
          </p>
        </div>

        {done ? (
          <p className="text-sm text-center text-[var(--admin-muted)]">Password saved. Redirecting to sign in…</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="font-label-caps text-[11px] tracking-[0.22em] uppercase text-[#c45c3a]">New password</span>
              <input
                type="password"
                required
                maxLength={INPUT_LIMITS.password}
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, INPUT_LIMITS.password))}
                className="admin-login__input mt-2"
              />
            </label>
            <label className="block">
              <span className="font-label-caps text-[11px] tracking-[0.22em] uppercase text-[#c45c3a]">Confirm password</span>
              <input
                type="password"
                required
                maxLength={INPUT_LIMITS.password}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.slice(0, INPUT_LIMITS.password))}
                className="admin-login__input mt-2"
              />
            </label>
            {password && issues.length > 0 && (
              <ul className="text-xs text-[var(--admin-muted)] list-disc pl-5 space-y-1">
                {issues.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button type="submit" disabled={pending} className="admin-btn-primary w-full">
              {pending ? "Saving…" : "Save password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
