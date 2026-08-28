"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useAuthModal } from "@/components/AuthModalProvider";
import { loginAccount, registerAccount } from "@/lib/api";
import { IMG } from "@/lib/images";

const DOOR_IMAGE = IMG.auth;

export default function AuthModal() {
  const { view, open, close } = useAuthModal();
  const { setSession } = useAuth();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  if (!view) return null;

  async function onSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await loginAccount({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setPending(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setSession(result.access_token, result.user);
    close();
  }

  async function onSignUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setPending(false);
      setError("Passwords do not match.");
      return;
    }
    const result = await registerAccount({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password,
    });
    setPending(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setSession(result.access_token, result.user);
    close();
  }

  function onForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("If an account exists for that email, reset instructions are on the way.");
  }

  function onGoogle() {
    setInfo("Google sign-in will connect once OAuth credentials are configured.");
  }

  const title =
    view === "signin" ? "Sign in" : view === "signup" ? "Create account" : "Reset password";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal>
      <button
        type="button"
        className="absolute inset-0 bg-[#1a100c]/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={close}
      />

      {/* "The Members' Door" — a plate of the room on one side, the
          threshold on the other. Image panel is decorative, so it drops
          away entirely on small screens. */}
      <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 hairline-gold shadow-2xl overflow-hidden max-h-[92vh]">
        <div className="relative hidden md:block overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center ken-burns"
            style={{ backgroundImage: `url('${DOOR_IMAGE}')` }}
          />
          <div className="absolute inset-0 media-scrim-strong" />
          <div className="on-media relative z-10 h-full flex flex-col justify-end p-10">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.35em] block mb-4">
              Members
            </span>
            <p className="font-headline-md text-[26px] leading-tight uppercase tracking-[0.03em]">
              The room remembers
              <br />
              its regulars
            </p>
          </div>
        </div>

        <div className="relative bg-background text-on-background p-8 md:p-10 overflow-y-auto custom-scrollbar">
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 text-on-surface-variant hover:text-on-background transition-colors"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.3em] block mb-3">
            Sweet1ne Live
          </span>
          <h2 className="font-headline-md text-headline-md uppercase tracking-[0.03em] mb-2">
            {title}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8">
            {view === "forgot"
              ? "Enter your email and we’ll send a reset link."
              : "Members enjoy faster reservations and a more personal evening."}
          </p>

        {view === "signin" && (
          <form onSubmit={onSignIn} className="flex flex-col gap-5">
            <Field label="Email" name="email" type="email" required />
            <Field label="Password" name="password" type="password" required />
            <button
              type="button"
              onClick={() => {
                setError("");
                setInfo("");
                open("forgot");
              }}
              className="self-end font-label-caps text-[11px] tracking-widest uppercase text-on-surface-variant hover:text-primary"
            >
              Forgot password?
            </button>
            {error && <p className="text-error text-sm">{error}</p>}
            {info && <p className="text-on-surface-variant text-sm">{info}</p>}
            <button type="submit" disabled={pending} className="btn-ink font-label-caps text-label-caps uppercase px-6 py-4">
              {pending ? "Signing in…" : "Sign in"}
            </button>
            <GoogleButton onClick={onGoogle} />
            <p className="text-center font-body-md text-sm text-on-surface-variant">
              New here?{" "}
              <button
                type="button"
                className="underline underline-offset-4 hover:text-primary"
                onClick={() => {
                  setError("");
                  setInfo("");
                  open("signup");
                }}
              >
                Create account
              </button>
            </p>
          </form>
        )}

        {view === "signup" && (
          <form onSubmit={onSignUp} className="flex flex-col gap-5">
            <Field label="Full name" name="name" type="text" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Password" name="password" type="password" required minLength={8} />
            <Field label="Confirm password" name="confirm" type="password" required minLength={8} />
            {error && <p className="text-error text-sm">{error}</p>}
            {info && <p className="text-on-surface-variant text-sm">{info}</p>}
            <button type="submit" disabled={pending} className="btn-ink font-label-caps text-label-caps uppercase px-6 py-4">
              {pending ? "Creating…" : "Create account"}
            </button>
            <GoogleButton onClick={onGoogle} />
            <p className="text-center font-body-md text-sm text-on-surface-variant">
              Already a member?{" "}
              <button
                type="button"
                className="underline underline-offset-4 hover:text-primary"
                onClick={() => {
                  setError("");
                  setInfo("");
                  open("signin");
                }}
              >
                Sign in
              </button>
            </p>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={onForgot} className="flex flex-col gap-5">
            <Field label="Email" name="email" type="email" required />
            {error && <p className="text-error text-sm">{error}</p>}
            {info && <p className="text-on-surface-variant text-sm">{info}</p>}
            <button type="submit" className="btn-ink font-label-caps text-label-caps uppercase px-6 py-4">
              Send reset link
            </button>
            <button
              type="button"
              className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary"
              onClick={() => {
                setError("");
                setInfo("");
                open("signin");
              }}
            >
              Back to sign in
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  required,
  minLength,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor={`modal-${name}`}>
        {label}
      </label>
      <input
        id={`modal-${name}`}
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="w-full bg-transparent border-b border-outline-variant text-on-background py-3 focus:ring-0 focus:border-primary"
      />
    </div>
  );
}

function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border border-outline-variant font-label-caps text-label-caps uppercase tracking-widest px-6 py-3.5 hover:border-primary hover:text-primary transition-colors inline-flex items-center justify-center gap-3"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.9 26.8 37 24 37c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.1 7.1l.1.1 6.2 5.2C37.2 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.5z" />
      </svg>
      Continue with Google
    </button>
  );
}
