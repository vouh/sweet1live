"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!token) {
      setError("This reset link is missing or invalid.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    // Wire to API + token store when auth is connected.
    window.setTimeout(() => {
      setInfo("Password updated. You can sign in with your new password.");
      setPending(false);
    }, 400);
  }

  return (
    <section className="relative z-10 w-full max-w-[440px] rounded-[28px] bg-white shadow-[0_28px_70px_-24px_rgba(44,24,16,0.35)] px-8 py-10 md:px-10 md:py-12">
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/images/logo.png"
          alt="Sweet1ne"
          width={1536}
          height={1024}
          priority
          className="w-[160px] h-auto object-contain"
        />
        <span className="font-label-caps text-[10px] font-semibold tracking-[0.55em] uppercase text-[#c45c3a] -mt-1">
          Live
        </span>
      </div>

      <h2 className="font-headline-lg text-[28px] text-[#2c1810] mb-2">New password</h2>
      <p className="mb-8 text-sm text-[#2c1810]/55 leading-relaxed">
        Choose a new password for your staff account.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-8">
        <label className="block">
          <span className="font-label-caps text-[11px] tracking-[0.22em] uppercase text-[#c45c3a]">
            New password
          </span>
          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-0 border-b-2 border-[#d4a574]/70 px-0 py-2.5 pr-14 text-[#2c1810] focus:outline-none focus:border-[#c45c3a] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-1/2 -translate-y-1/2 font-label-caps text-[10px] tracking-[0.16em] uppercase text-[#2c1810]/40 hover:text-[#2c1810]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="font-label-caps text-[11px] tracking-[0.22em] uppercase text-[#c45c3a]">
            Confirm password
          </span>
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-2 w-full bg-transparent border-0 border-b-2 border-[#d4a574]/70 px-0 py-2.5 text-[#2c1810] focus:outline-none focus:border-[#c45c3a] transition-colors"
          />
        </label>

        {error && <p className="text-sm text-[#c45c3a] -mt-4">{error}</p>}
        {info && <p className="text-sm text-[#2c1810]/70 -mt-4">{info}</p>}

        <button
          type="submit"
          disabled={pending}
          className="self-center rounded-full bg-[#c45c3a] text-white font-label-caps text-[12px] tracking-[0.22em] uppercase px-12 py-3.5 shadow-[0_14px_28px_-8px_rgba(196,92,58,0.7)] hover:opacity-95 disabled:opacity-60 transition-opacity"
        >
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>

      <p className="mt-8 text-center">
        <Link
          href="/admin/login"
          className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[#2c1810]/40 hover:text-[#2c1810] transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </section>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#e8e0d6]">
      <Suspense
        fallback={
          <p className="font-label-caps text-[11px] tracking-[0.2em] uppercase text-[#2c1810]/40">
            Loading…
          </p>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
